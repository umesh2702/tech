import { inngest } from "./client";
import { prisma } from "@/lib/prisma";
import { fetchRssFeed } from "@/lib/ingestion/rss";
import { isDuplicate } from "@/lib/ingestion/dedup";
import { analyzeContent } from "@/lib/ai/analyzer";
import { AnalysisStatus, Category } from "@prisma/client";

export const ingestSources = inngest.createFunction(
  { 
    id: "ingest-sources",
    triggers: [{ cron: "0 * * * *" }, { event: "app/ingest.trigger" }] 
  },
  async ({ step }) => {
    // 1. Fetch all active sources
    const sources = await step.run("fetch-active-sources", async () => {
      return await prisma.source.findMany({
        where: { enabled: true, type: "RSS" }
      });
    });

    if (sources.length === 0) return { message: "No active RSS sources found." };

    let totalDispatched = 0;

    // 2. Iterate over sources and process feeds
    for (const source of sources) {
      await step.run(`process-source-${source.id}`, async () => {
        const articles = await fetchRssFeed(source.url);
        
        let newArticlesCount = 0;
        
        for (const article of articles) {
          const duplicate = await isDuplicate(article.link, article.title);
          
          if (!duplicate) {
            // Save raw item as PENDING
            const newItem = await prisma.intelligenceItem.create({
              data: {
                title: article.title,
                sourceUrl: article.link,
                sourceName: source.name,
                sourceId: source.id,
                category: source.category,
                rawContent: article.content,
                publishedAt: article.publishedAt,
                analysisStatus: AnalysisStatus.PENDING,
                // Inherit source priority (fallback to 5)
                sourceReliabilityScore: source.sourcePriority || 5,
              }
            });

            // Dispatch analysis job
            await inngest.send({
              name: "app/analyze.article",
              data: {
                itemId: newItem.id
              }
            });
            
            newArticlesCount++;
            totalDispatched++;
          }
        }
        
        // Update last fetch time
        await prisma.source.update({
          where: { id: source.id },
          data: { lastFetchAt: new Date() }
        });
        
        return { source: source.name, newArticles: newArticlesCount };
      });
    }

    return { message: `Ingestion complete. Dispatched ${totalDispatched} articles for analysis.` };
  }
);

export const analyzeArticle = inngest.createFunction(
  { 
    id: "analyze-article", 
    concurrency: 5,
    triggers: [{ event: "app/analyze.article" }] 
  },
  async ({ event, step }) => {
    const { itemId } = event.data;

    const item = await step.run("fetch-item", async () => {
      return await prisma.intelligenceItem.findUnique({
        where: { id: itemId }
      });
    });

    if (!item || !item.rawContent) {
      return { message: "Item not found or missing raw content." };
    }

    // Call OpenAI for analysis
    const analysis = await step.run("run-ai-analysis", async () => {
      // Force gpt-4o-mini for phase 3 bulk ingestion
      process.env.OPENAI_MODEL = "gpt-4o-mini";
      return await analyzeContent(item.rawContent as string);
    });

    // Update the database with the analysis
    await step.run("save-analysis", async () => {
      await prisma.intelligenceItem.update({
        where: { id: item.id },
        data: {
          whatHappened: analysis.whatHappened,
          whyItMatters: analysis.whyItMatters,
          opportunity: analysis.founderOpportunity,
          opportunityScore: analysis.opportunityScore,
          founderScore: analysis.founderFitScore,
          confidenceScore: 0,
          analysisStatus: AnalysisStatus.COMPLETED,
          analyzedAt: new Date()
        }
      });
    });

    if (analysis.opportunityScore >= 9) {
      await step.run("trigger-instant-alert", async () => {
        await inngest.send({
          name: "whatsapp/send_instant",
          data: {
            itemId: item.id
          }
        });
      });
    }

    return { message: `Analyzed item ${item.id}`, score: analysis.opportunityScore };
  }
);
