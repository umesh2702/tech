import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const logId = "cmqrve41n00at11t3aqviphy4";
  console.log(`Checking DeliveryLog for ID: ${logId}`);
  
  const log = await prisma.deliveryLog.findUnique({
    where: { id: logId }
  });

  if (!log) {
    console.log(`No log found with ID: ${logId}`);
    return;
  }

  console.log(`Log details:`, JSON.stringify(log, null, 2));

  console.log("\nChecking last 5 logs in the table:");
  const latestLogs = await prisma.deliveryLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 5
  });
  console.log(JSON.stringify(latestLogs, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
