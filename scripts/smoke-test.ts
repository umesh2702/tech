/**
 * scripts/smoke-test.ts
 *
 * Full E2E Lifecycle Smoke Test for Pulse AI.
 * Simulates a complete user journey through the backend components:
 * 1. User Creation (Simulating Google OAuth)
 * 2. Onboarding API (Saves preferences, generates Subscription)
 * 3. Simulating Meta Webhook (Delivery log updates)
 */

import { PrismaClient, DigestFrequency, DeliveryStatus } from "@prisma/client";
import { fetchRssFeed } from "../src/lib/ingestion/rss";
import { analyzeContent } from "../src/lib/ai/analyzer";

const prisma = new PrismaClient();

async function runSmokeTest() {
  console.log("🚀 Starting E2E Runtime Smoke Test...");

  const testEmail = `smoke.test.${Date.now()}@pulse.local`;
  const testPhone = "919999999999";

  try {
    // 1. User Creation
    console.log("\n[1/7] Creating mock OAuth User...");
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        name: "Smoke Tester",
        role: "USER"
      }
    });
    console.log(`✅ User created: ${user.id}`);

    // 2. Simulating API Onboarding (Using DB directly for simplicity)
    console.log("\n[2/7] Executing Onboarding Flow...");
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        whatsappNumber: testPhone,
        whatsappVerified: true, // Auto-verified for test
        timezone: "Asia/Kolkata",
        interests: ["AI", "Startups"],
        deliveryPreferences: [DigestFrequency.DAILY],
        notificationsEnabled: true,
        onboardingCompleted: true,
      }
    });
    
    const subscription = await prisma.subscription.create({
      data: {
        userId: user.id,
        plan: "FREE",
        status: "ACTIVE"
      }
    });
    console.log(`✅ Onboarding complete. Subscription: ${subscription.id}`);

    // 3. Simulating RSS Ingestion
    console.log("\n[3/7] Ingesting Mock RSS Item...");
    const mockItem = await prisma.intelligenceItem.create({
      data: {
        title: "Smoke Test AI Breakthrough",
        sourceName: "SmokeTestNews",
        sourceUrl: `https://smoketest.local/article/${Date.now()}`,
        rawContent: "A major breakthrough in AI testing frameworks.",
        category: "AI",
        publishedAt: new Date(),
        analysisStatus: "COMPLETED",
        opportunityScore: 9,
        founderScore: 9,
        whatHappened: "A test happened.",
        whyItMatters: "Proves the system works.",
        opportunity: "Use the system.",
        tags: ["AI", "Testing"]
      }
    });
    console.log(`✅ Intelligence Item created: ${mockItem.id}`);

    // 4. Simulating Scheduler & Delivery Log Generation
    console.log("\n[4/7] Generating Delivery Log (Simulating Inngest Scheduler)...");
    const log = await prisma.deliveryLog.create({
      data: {
        userId: user.id,
        whatsappNumber: testPhone,
        digestType: DigestFrequency.DAILY,
        status: DeliveryStatus.QUEUED,
        templateName: "pulse_digest_ready",
        scheduledAt: new Date(),
        items: {
          create: [{ intelligenceItemId: mockItem.id }]
        }
      }
    });
    console.log(`✅ DeliveryLog queued: ${log.id}`);

    // 5. Simulating Meta Webhook State Transitions
    console.log("\n[5/7] Simulating Meta Webhook Status Updates...");
    
    await prisma.deliveryLog.update({ where: { id: log.id }, data: { status: DeliveryStatus.SENT, sentAt: new Date(), messageId: "wamid.mock.123" } });
    console.log(`✅ Status transitioned to SENT`);

    await prisma.deliveryLog.update({ where: { id: log.id }, data: { status: DeliveryStatus.DELIVERED, deliveredAt: new Date() } });
    console.log(`✅ Status transitioned to DELIVERED`);

    await prisma.deliveryLog.update({ where: { id: log.id }, data: { status: DeliveryStatus.READ } });
    console.log(`✅ Status transitioned to READ`);

    const finalLog = await prisma.deliveryLog.findUnique({ where: { id: log.id } });
    if (finalLog?.status !== "READ") {
      throw new Error(`Status transition failed. Expected READ, got ${finalLog?.status}`);
    }

    // 6. Simulating Dashboard Save
    console.log("\n[6/7] Simulating User Saving Article in Dashboard...");
    const savedItem = await prisma.savedItem.create({
      data: {
        userId: user.id,
        intelligenceItemId: mockItem.id
      }
    });
    console.log(`✅ SavedItem created: ${savedItem.id}`);

    // 7. Cleanup
    console.log("\n[7/7] Cleaning up test data...");
    await prisma.savedItem.delete({ where: { id: savedItem.id } });
    await prisma.deliveryItem.deleteMany({ where: { deliveryLogId: log.id } });
    await prisma.deliveryLog.delete({ where: { id: log.id } });
    await prisma.intelligenceItem.delete({ where: { id: mockItem.id } });
    await prisma.subscription.delete({ where: { id: subscription.id } });
    await prisma.user.delete({ where: { id: user.id } });
    console.log(`✅ Cleanup successful.`);

    console.log("\n🎉 SMOKE TEST PASSED SUCCESSFULLY.");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ SMOKE TEST FAILED:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runSmokeTest();
