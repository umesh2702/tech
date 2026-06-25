import { PrismaClient, DigestFrequency } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding demo users...");

  // Clean up existing demo users
  await prisma.user.deleteMany({
    where: {
      email: {
        in: ["user-a@example.com", "user-b@example.com"],
      },
    },
  });

  // Seed User A
  const userA = await prisma.user.create({
    data: {
      name: "User A (IST/AI Focus)",
      email: "user-a@example.com",
      whatsappNumber: "+919876543210",
      whatsappVerified: true,
      timezone: "Asia/Kolkata",
      country: "India",
      interests: ["AI", "OpenAI"],
      deliveryPreferences: [DigestFrequency.MORNING, DigestFrequency.DAILY],
      notificationsEnabled: true,
      onboardingCompleted: true,
    },
  });
  console.log("Seeded User A:", userA);

  // Seed User B
  const userB = await prisma.user.create({
    data: {
      name: "User B (EST/DevTools Focus)",
      email: "user-b@example.com",
      whatsappNumber: "+919876543211",
      whatsappVerified: true,
      timezone: "America/New_York",
      country: "United States",
      interests: ["DEVELOPER_TOOLS", "NVIDIA"],
      deliveryPreferences: [DigestFrequency.THREE_HOURLY, DigestFrequency.EVENING],
      notificationsEnabled: true,
      onboardingCompleted: true,
    },
  });
  console.log("Seeded User B:", userB);

  console.log("Demo users seeded successfully.");
}

main()
  .catch((e) => {
    console.error("Error seeding users:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
