import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function analyze() {
  console.log("Analyzing Database Metrics...\n");

  const completed = await prisma.intelligenceItem.count({ where: { analysisStatus: "COMPLETED" } });
  const failed = await prisma.intelligenceItem.count({ where: { analysisStatus: "FAILED" } });
  
  console.log(`1. COMPLETED items: ${completed}`);
  console.log(`2. FAILED items: ${failed}\n`);

  // Score distributions
  const items = await prisma.intelligenceItem.findMany({ where: { analysisStatus: "COMPLETED" } });
  
  const oppDist: Record<number, number> = {};
  const fitDist: Record<number, number> = {};
  
  items.forEach(i => {
    oppDist[i.opportunityScore] = (oppDist[i.opportunityScore] || 0) + 1;
    if (i.founderScore) {
      fitDist[i.founderScore] = (fitDist[i.founderScore] || 0) + 1;
    }
  });

  console.log(`3. Opportunity Score Distribution:`);
  Object.keys(oppDist).sort((a,b) => Number(b) - Number(a)).forEach(k => console.log(`   Score ${k}: ${oppDist[Number(k)]} items`));
  
  console.log(`\n4. Founder Fit Score Distribution:`);
  Object.keys(fitDist).sort((a,b) => Number(b) - Number(a)).forEach(k => console.log(`   Score ${k}: ${fitDist[Number(k)]} items`));

  console.log(`\n5. Top 20 Highest-Ranked Opportunities:`);
  const top20 = await prisma.intelligenceItem.findMany({
    where: { analysisStatus: "COMPLETED" },
    orderBy: [{ opportunityScore: "desc" }, { founderScore: "desc" }, { publishedAt: "desc" }],
    take: 20
  });
  top20.forEach((item, idx) => {
    console.log(`   [${idx+1}] Opp: ${item.opportunityScore} | Fit: ${item.founderScore} | ${item.title}`);
  });

  console.log(`\n6. Examples of Low-Scoring Items (Score < 5):`);
  const lowItems = await prisma.intelligenceItem.findMany({
    where: { analysisStatus: "COMPLETED", opportunityScore: { lt: 5 } },
    take: 3
  });
  if (lowItems.length === 0) {
    console.log(`   No items found with score < 5.`);
  } else {
    lowItems.forEach(item => {
      console.log(`   Opp: ${item.opportunityScore} | Fit: ${item.founderScore} | ${item.title}`);
      console.log(`   Reason: ${item.opportunity}`);
    });
  }

  // Deduplication check
  const totalItems = await prisma.intelligenceItem.count();
  const distinctUrls = await prisma.intelligenceItem.groupBy({
    by: ['sourceUrl'],
    _count: true,
  });
  console.log(`\n7. Deduplication Check: ${totalItems} total items, ${distinctUrls.length} distinct source URLs.`);

}

analyze()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
