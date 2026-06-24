import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verify() {
  const items = await prisma.intelligenceItem.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  console.log(`Found ${items.length} items in the database.`);
  
  for (const item of items) {
    console.log(`- [${item.sourceName}] ${item.title}`);
    console.log(`  Status: ${item.analysisStatus}`);
    console.log(`  Category: ${item.category}`);
    if (item.analysisStatus === 'COMPLETED') {
      console.log(`  Insight: ${item.keyInsight?.substring(0, 100)}...`);
    } else if (item.analysisStatus === 'FAILED') {
      console.log(`  Error: ${item.error}`);
    }
  }

  const pendingCount = await prisma.intelligenceItem.count({ where: { analysisStatus: 'PENDING' } });
  const completedCount = await prisma.intelligenceItem.count({ where: { analysisStatus: 'COMPLETED' } });
  const failedCount = await prisma.intelligenceItem.count({ where: { analysisStatus: 'FAILED' } });

  console.log(`\nStats: ${pendingCount} Pending, ${completedCount} Completed, ${failedCount} Failed.`);
}

verify().catch(console.error).finally(() => prisma.$disconnect());
