import "dotenv/config";
import { PrismaClient, AnalysisStatus } from "@prisma/client";
import { analyzeContent } from "../src/lib/ai/analyzer";

const prisma = new PrismaClient();

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runBatch() {
  while (true) {
    let pendingItems = [];
    try {
      console.log("Fetching up to 50 PENDING articles...");
      pendingItems = await prisma.intelligenceItem.findMany({
        where: { analysisStatus: "PENDING" },
        take: 50,
        orderBy: { publishedAt: "desc" }
      });
    } catch (dbError: any) {
      console.error("Database query failed. Disconnecting and retrying in 10s...", dbError.message);
      try {
        await prisma.$disconnect();
      } catch (e) {}
      await delay(10000);
      continue;
    }

    if (pendingItems.length === 0) {
      console.log("No pending items found. Queue is empty!");
      break;
    }

    console.log(`Found ${pendingItems.length} items to process.\n`);

    for (let i = 0; i < pendingItems.length; i++) {
      const item = pendingItems[i];
      console.log(`[${i+1}/${pendingItems.length}] Processing: ${item.title}`);
      
      let success = false;
      let retries = 0;

      while (!success && retries < 3) {
        try {
          if (!item.rawContent) {
            console.log("Skipping: No raw content.");
            success = true;
            continue;
          }
          
          await prisma.intelligenceItem.update({
            where: { id: item.id },
            data: { analysisStatus: AnalysisStatus.PROCESSING }
          });

          const analysis = await analyzeContent(item.rawContent);
          
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
          
          console.log(`  -> Success. Opp Score: ${analysis.opportunityScore}, Founder Fit: ${analysis.founderFitScore}`);
          success = true;
          
          // Base delay to avoid hitting limits too fast
          await delay(5000); 

        } catch (error: any) {
          if (error.status === 429 || error.message?.includes("429") || error.message?.includes("Quota")) {
            console.log(`  -> Rate limit hit (429). Waiting 35 seconds...`);
            await delay(35000);
            retries++;
          } else if (error.message?.includes("Prisma") || error.message?.includes("connection") || error.message?.includes("pool")) {
            console.error(`  -> Database error during processing:`, error.message);
            console.log("Disconnecting Prisma and waiting 15 seconds...");
            try {
              await prisma.$disconnect();
            } catch (e) {}
            await delay(15000);
            retries++;
          } else {
            console.error(`  -> Failed:`, error.message);
            try {
              await prisma.intelligenceItem.update({
                where: { id: item.id },
                data: { analysisStatus: AnalysisStatus.FAILED }
              });
            } catch (updateErr) {}
            break; // break retry loop for non-429 non-db errors
          }
        }
      }
    }
    console.log(`\nBatch complete. Pausing before next batch...`);
    await delay(10000);
  }
}

runBatch()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
