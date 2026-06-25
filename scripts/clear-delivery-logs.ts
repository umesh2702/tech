import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== CLEARING DELIVERY LOGS AND ITEMS ===");
  const deletedItems = await prisma.deliveryItem.deleteMany();
  const deletedLogs = await prisma.deliveryLog.deleteMany();
  console.log(`Cleared ${deletedItems.count} DeliveryItems.`);
  console.log(`Cleared ${deletedLogs.count} DeliveryLogs.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
