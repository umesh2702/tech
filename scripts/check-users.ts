import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== USERS ===");
  const users = await prisma.user.findMany({
    include: { preferences: true }
  });

  for (const user of users) {
    console.log(`User: ${user.name} (${user.email})`);
    console.log(`Preferences:`, user.preferences);
  }

  console.log("\n=== OTP CODES ===");
  const otps = await prisma.otpCode.findMany({
    orderBy: { createdAt: "desc" },
    take: 10
  });
  console.log(otps);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
