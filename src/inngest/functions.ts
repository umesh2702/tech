import { inngest } from "./client";
import { prisma } from "@/lib/prisma";
import { fetchRssFeed } from "@/lib/ingestion/rss";
import { analyzeContent } from "@/lib/ai/analyzer";
import { AnalysisStatus, Category } from "@prisma/client";
import { logger } from "@/lib/logger";

export const ingestSources = inngest.createFunction(
  { 
    id: "ingest-sources",
    triggers: [{ cron: "0 * * * *" }, { event: "app/ingest.trigger" }] 
  },
  async ({ step }) => {
    await logger.info("RSS", "Starting RSS sources ingestion run");

    // 1. Fetch all active sources
    const sources = await step.run("fetch-active-sources", async () => {
      return await prisma.source.findMany({
        where: { enabled: true, type: "RSS" }
      });
    });

    if (sources.length === 0) {
      await logger.info("RSS", "Ingestion completed: No active RSS sources found.");
      return { message: "No active RSS sources found." };
    }

    await logger.info("RSS", `Found ${sources.length} active RSS source(s): ${sources.map(s => s.name).join(", ")}`);

    // FIX: accumulate dispatched counts from step.run return values.
    // Do NOT mutate a closure variable — Inngest replays step.run callbacks
    // from its state store, meaning the callback body does not re-execute on
    // replay and any closure mutations are silently discarded.
    let totalDispatched = 0;

    // 2. Iterate over sources and process feeds
    for (const source of sources) {
      const result = await step.run(`process-source-${source.id}`, async () => {
        try {
          const articles = await fetchRssFeed(source.url);
          let newArticlesCount = 0;
          let skippedUrlDup = 0;
          let skippedTitleDup = 0;

          await logger.info("RSS", `Source "${source.name}": fetched ${articles.length} articles from ${source.url}`);

          // Log first 5 article titles/URLs for diagnosis
          const preview = articles.slice(0, 5).map((a, i) =>
            `  [${i + 1}] "${a.title.substring(0, 80)}" → ${a.link.substring(0, 100)}`
          ).join("\n");
          if (preview) {
            await logger.info("RSS", `Source "${source.name}" — first ${Math.min(5, articles.length)} articles:\n${preview}`);
          }
          
          const setting = await prisma.systemSetting.findUnique({
            where: { key: "gemini_batch_size" }
          });
          const geminiBatchSize = setting ? parseInt(setting.value, 10) : 10;
          
          for (const article of articles) {
            // ── URL dedup check ──
            const urlMatch = await prisma.intelligenceItem.findUnique({
              where: { sourceUrl: article.link },
              select: { id: true }
            });

            if (urlMatch) {
              skippedUrlDup++;
              await logger.info("RSS", `SKIP (url-dup)  | "${article.title.substring(0, 70)}" | ${article.link.substring(0, 100)}`);
              continue;
            }

            // ── Title dedup check (last 7 days) ──
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const titleMatch = await prisma.intelligenceItem.findFirst({
              where: { title: article.title, createdAt: { gte: sevenDaysAgo } },
              select: { id: true }
            });

            if (titleMatch) {
              skippedTitleDup++;
              await logger.info("RSS", `SKIP (title-dup) | "${article.title.substring(0, 70)}" | ${article.link.substring(0, 100)}`);
              continue;
            }

            // ── Batch cap ──
            if (newArticlesCount >= geminiBatchSize) {
              await logger.warn("RSS", `Batch limit of ${geminiBatchSize} reached for source "${source.name}". Remaining articles deferred to next run.`);
              break;
            }

            // ── New article — insert and dispatch ──
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
                sourceReliabilityScore: source.sourcePriority || 5,
              }
            });

            await inngest.send({
              name: "app/analyze.article",
              data: { itemId: newItem.id }
            });

            await logger.info("RSS", `DISPATCH         | "${article.title.substring(0, 70)}" | itemId: ${newItem.id}`);
            newArticlesCount++;
          }

          // Update last fetch time
          await prisma.source.update({
            where: { id: source.id },
            data: { lastFetchAt: new Date() }
          });

          await logger.info(
            "RSS",
            `Source "${source.name}" complete — dispatched: ${newArticlesCount}, skipped (url-dup): ${skippedUrlDup}, skipped (title-dup): ${skippedTitleDup}`
          );

          // Return dispatch count so the outer loop can accumulate correctly
          return { source: source.name, newArticles: newArticlesCount };

        } catch (err: any) {
          await logger.error("RSS", `Failed to ingest RSS feed for source: ${source.name} (${source.url})`, err);
          throw err; // Let Inngest retry this source step
        }
      });

      // Accumulate from step return value (safe across Inngest replays)
      totalDispatched += result?.newArticles ?? 0;
    }

    await logger.info("RSS", `Ingestion complete. Dispatched ${totalDispatched} articles for AI analysis.`);
    return { message: `Ingestion complete. Dispatched ${totalDispatched} articles for analysis.` };
  }
);


export const analyzeArticle = inngest.createFunction(
  { 
    id: "analyze-article", 
    concurrency: parseInt(process.env.GEMINI_CONCURRENCY || "5", 10),
    rateLimit: {
      limit: parseInt(process.env.GEMINI_RATELIMIT_LIMIT || "15", 10),
      period: (process.env.GEMINI_RATELIMIT_PERIOD || "1m") as any,
    },
    triggers: [{ event: "app/analyze.article" }] 
  },
  async ({ event, step, attempt }) => {
    const { itemId } = event.data;
    const MAX_RETRIES = parseInt(process.env.GEMINI_MAX_RETRIES || "3", 10);
    const currentAttempt = attempt ?? 0;

    await logger.info("GEMINI", `Starting AI analysis job for article ID: ${itemId} (Attempt ${currentAttempt + 1}/${MAX_RETRIES + 1})`);

    // Update status to PROCESSING
    await step.run("mark-processing", async () => {
      await prisma.intelligenceItem.update({
        where: { id: itemId },
        data: { analysisStatus: AnalysisStatus.PROCESSING }
      });
    });

    const item = await step.run("fetch-item", async () => {
      return await prisma.intelligenceItem.findUnique({
        where: { id: itemId }
      });
    });

    if (!item || !item.rawContent) {
      await logger.warn("GEMINI", `Article ID: ${itemId} not found or missing raw content`);
      await step.run("mark-failed-missing", async () => {
        await prisma.intelligenceItem.update({
          where: { id: itemId },
          data: { analysisStatus: AnalysisStatus.FAILED, errorMessage: "Article not found or missing raw content" }
        });
      });
      return { message: "Item not found or missing raw content." };
    }

    try {
      // Call Gemini for analysis
      const analysis = await step.run("run-ai-analysis", async () => {
        // Force model model name config
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

      await logger.info("GEMINI", `Completed analysis for article ID: ${item.id}. Score: ${analysis.opportunityScore}`);

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

    } catch (error: any) {
      // Log retry and save temporary failure details
      await step.run("log-failure-attempt", async () => {
        await prisma.intelligenceItem.update({
          where: { id: item.id },
          data: {
            retryCount: currentAttempt + 1,
            errorMessage: error.message,
            analysisStatus: currentAttempt >= MAX_RETRIES ? AnalysisStatus.FAILED : AnalysisStatus.PROCESSING
          }
        });
      });

      if (currentAttempt >= MAX_RETRIES) {
        await logger.error("GEMINI", `AI analysis permanently failed for article ID: ${item.id} after ${currentAttempt + 1} attempts. Transferred to Dead Letter Queue (DLQ).`, error);
        return { message: `Analysis failed permanently after ${currentAttempt + 1} attempts`, error: error.message };
      } else {
        await logger.warn("GEMINI", `AI analysis attempt ${currentAttempt + 1} failed for article ID: ${item.id}. Scheduling backoff retry...`, error);
        throw error; // Rethrow to trigger Inngest retry
      }
    }
  }
);
