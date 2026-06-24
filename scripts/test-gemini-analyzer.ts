import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { analyzeContent } from "../src/lib/ai/analyzer";

const prisma = new PrismaClient();

async function runTest() {
  console.log("Fetching 10 PENDING articles...");
  
  const pendingItems = await prisma.intelligenceItem.findMany({
    where: { analysisStatus: "PENDING" },
    take: 10,
    orderBy: { publishedAt: "desc" }
  });

  if (pendingItems.length === 0) {
    console.log("No pending items found.");
    return;
  }

  console.log(`Found ${pendingItems.length} items. Starting Gemini analysis...\n`);

  for (let i = 0; i < pendingItems.length; i++) {
    const item = pendingItems[i];
    console.log(`========================================================`);
    console.log(`[${i+1}/${pendingItems.length}] Source: ${item.sourceName} | Title: ${item.title}`);
    console.log(`URL: ${item.sourceUrl}`);
    console.log(`--------------------------------------------------------`);
    
    try {
      if (!item.rawContent) {
        console.log("Skipping: No raw content.");
        continue;
      }
      
      console.time("Analysis Time");
      const analysis = await analyzeContent(item.rawContent);
      console.timeEnd("Analysis Time");
      
      console.log(JSON.stringify(analysis, null, 2));
      console.log(`\n`);
      
      // Delay 4 seconds to respect Gemini 15 RPM free tier limit
      await new Promise(resolve => setTimeout(resolve, 4000));
    } catch (error) {
      console.error("Error analyzing article:", error);
    }
  }

  console.log(`========================================================`);
  console.log("Test complete. These changes were NOT saved to the database.");
}

runTest()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
