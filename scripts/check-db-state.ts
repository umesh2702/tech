import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== DATABASE STATE ===");
  const total = await prisma.intelligenceItem.count();
  const completed = await prisma.intelligenceItem.count({ where: { analysisStatus: "COMPLETED" } });
  const pending = await prisma.intelligenceItem.count({ where: { analysisStatus: "PENDING" } });
  const processing = await prisma.intelligenceItem.count({ where: { analysisStatus: "PROCESSING" } });
  const failed = await prisma.intelligenceItem.count({ where: { analysisStatus: "FAILED" } });

  console.log(`Total items:      ${total}`);
  console.log(`Completed items:  ${completed}`);
  console.log(`Pending items:    ${pending}`);
  console.log(`Processing items: ${processing}`);
  console.log(`Failed items:     ${failed}`);

  if (completed > 0) {
    console.log("\n=== TOP 5 COMPLETED ITEMS BY OPPORTUNITY SCORE ===");
    const items = await prisma.intelligenceItem.findMany({
      where: { analysisStatus: "COMPLETED" },
      orderBy: { opportunityScore: "desc" },
      take: 5
    });
    for (const item of items) {
      console.log(`- [Opp: ${item.opportunityScore}, Founder: ${item.founderScore}] ${item.title} (${item.category})`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
