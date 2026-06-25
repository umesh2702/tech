import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== CHECKING HIGH-SCORING ITEMS (Opp >= 9, Founder >= 8) ===");
  const items = await prisma.intelligenceItem.findMany({
    where: {
      analysisStatus: "COMPLETED",
      opportunityScore: { gte: 9 },
      founderScore: { gte: 8 }
    }
  });

  console.log(`Found ${items.length} items.`);
  for (const item of items) {
    console.log(`- [ID: ${item.id}] [Opp: ${item.opportunityScore}, Founder: ${item.founderScore}] ${item.title}`);
  }

  if (items.length === 0) {
    console.log("No items found. Let's look for any completed item and update its scores so we can test the instant route.");
    const anyItem = await prisma.intelligenceItem.findFirst({
      where: { analysisStatus: "COMPLETED" }
    });

    if (anyItem) {
      const updated = await prisma.intelligenceItem.update({
        where: { id: anyItem.id },
        data: {
          opportunityScore: 9,
          founderScore: 8,
          publishedAt: new Date() // Set to now to satisfy the 2-hour freshness if needed (though bypassed in test endpoint)
        }
      });
      console.log(`Updated item ID: ${updated.id} to Opp: 9, Founder: 8, publishedAt: now`);
    } else {
      console.log("No completed items found at all!");
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
