import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== USERS ===");
  const users = await prisma.user.findMany();

  for (const user of users) {
    console.log(`User: ${user.name} (${user.email})`);
    console.log(`  WhatsApp: ${user.whatsappNumber} (Verified: ${user.whatsappVerified})`);
    console.log(`  Timezone: ${user.timezone} | Country: ${user.country}`);
    console.log(`  Interests: ${user.interests.join(", ")}`);
    console.log(`  Schedules: ${user.deliveryPreferences.join(", ")}`);
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
