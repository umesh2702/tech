import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== LATEST DELIVERY LOGS ===");
  const logs = await prisma.deliveryLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  if (logs.length === 0) {
    console.log("No delivery logs found.");
    return;
  }

  for (const log of logs) {
    console.log(`ID: ${log.id}`);
    console.log(`  Recipient: ${log.whatsappNumber}`);
    console.log(`  Digest Type: ${log.digestType}`);
    console.log(`  Status: ${log.status}`);
    console.log(`  Message ID: ${log.messageId}`);
    console.log(`  Error: ${log.errorMessage}`);
    console.log(`  Created At: ${log.createdAt}`);
    console.log(`  Sent At: ${log.sentAt}`);
    console.log(`  Delivered At: ${log.deliveredAt}`);
    console.log("-----------------------------------------");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
