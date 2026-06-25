import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== WHATSAPP DELIVERY ANALYTICS ===");

  // 1. Queue, Sent, Delivered, Read, Failed Counts
  const totalLogs = await prisma.deliveryLog.count();
  const queuedCount = await prisma.deliveryLog.count({ where: { status: "QUEUED" } });
  const sendingCount = await prisma.deliveryLog.count({ where: { status: "SENDING" } });
  const sentCount = await prisma.deliveryLog.count({ where: { status: "SENT" } });
  const deliveredCount = await prisma.deliveryLog.count({ where: { status: "DELIVERED" } });
  const readCount = await prisma.deliveryLog.count({ where: { status: "READ" } });
  const failedCount = await prisma.deliveryLog.count({ where: { status: "FAILED" } });

  // 2. Compute Delivery Success Rate
  // Success rate is defined as messages successfully dispatched/delivered/read out of all attempts (excluding currently queued/sending)
  const completedAttempts = sentCount + deliveredCount + readCount + failedCount;
  const successfulAttempts = sentCount + deliveredCount + readCount;
  const successRate = completedAttempts > 0 
    ? ((successfulAttempts / completedAttempts) * 100).toFixed(2)
    : "0.00";

  console.log(`Total Attempts:       ${totalLogs}`);
  console.log(`Messages Queued:      ${queuedCount}`);
  console.log(`Messages Sending:     ${sendingCount}`);
  console.log(`Messages Sent (Meta): ${sentCount}`);
  console.log(`Messages Delivered:   ${deliveredCount}`);
  console.log(`Messages Read:        ${readCount}`);
  console.log(`Failed Deliveries:    ${failedCount}`);
  console.log(`Delivery Success Rate: ${successRate}%`);

  console.log("\n=== MOST DELIVERED CATEGORIES ===");
  // Query all DeliveryItems with their associated IntelligenceItems
  const deliveredItems = await prisma.deliveryItem.findMany({
    include: {
      intelligenceItem: true
    }
  });

  const categoryCounts: Record<string, number> = {};
  for (const item of deliveredItems) {
    const cat = item.intelligenceItem.category;
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  }

  const sortedCategories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);
  if (sortedCategories.length === 0) {
    console.log("No category delivery data available yet.");
  } else {
    for (const [category, count] of sortedCategories) {
      console.log(`- ${category}: ${count} deliveries`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
