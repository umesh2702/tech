import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function createSession() {
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log("No user found.");
    return;
  }
  const sessionToken = "test-session-token-12345";
  
  await prisma.session.upsert({
    where: { sessionToken },
    update: { userId: user.id, expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) },
    create: {
      sessionToken,
      userId: user.id,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
    }
  });

  console.log(`Created session for ${user.email} with token: ${sessionToken}`);
}

createSession().catch(console.error).finally(() => prisma.$disconnect());
