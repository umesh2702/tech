import { prisma } from "../src/lib/prisma";
import { generateDigest } from "../src/lib/whatsapp/digest";

const PHONE = "+918121693113";

async function main() {
  console.log("=== VERIFYING DEDUPLICATION LOGIC ===");

  // 1. Clear logs first
  await prisma.deliveryItem.deleteMany();
  await prisma.deliveryLog.deleteMany();
  console.log("Cleared all delivery logs for a clean test.");

  // 2. Fetch User
  const user = await prisma.user.findFirst({
    where: { whatsappNumber: PHONE }
  });

  if (!user) {
    console.error(`User not found for ${PHONE}`);
    return;
  }

  const userId = user.id;

  // 3. Generate first digest (Top 5)
  console.log("\nGenerating first digest...");
  const digest1 = await generateDigest(userId, "DAILY");

  if (!digest1 || digest1.itemIds.length === 0) {
    console.log("No items available to generate first digest.");
    return;
  }

  console.log("First Digest Items:", digest1.itemIds);

  // 4. Record these items in the database under DeliveryLog and DeliveryItem (simulate sent status)
  console.log("\nLogging first digest items as delivered in DB...");
  const log = await prisma.deliveryLog.create({
    data: {
      userId: userId,
      whatsappNumber: PHONE,
      digestType: "DAILY",
      status: "SENT",
      scheduledAt: new Date(),
      items: {
        create: digest1.itemIds.map(id => ({ intelligenceItemId: id }))
      }
    }
  });
  console.log(`Created DeliveryLog ID: ${log.id} with ${digest1.itemIds.length} DeliveryItems.`);

  // 5. Generate second digest
  console.log("\nGenerating second digest...");
  const digest2 = await generateDigest(userId, "DAILY");

  if (!digest2 || digest2.itemIds.length === 0) {
    console.log("No items available for second digest (Deduplication successfully skipped all available items).");
    console.log("✅ Deduplication test passed (all items skipped)!");
    return;
  }

  console.log("Second Digest Items:", digest2.itemIds);

  // Verify that there is zero overlap between digest1 and digest2 items
  const overlap = digest1.itemIds.filter(id => digest2.itemIds.includes(id));
  console.log("Overlap between first and second digests (should be empty):", overlap);

  if (overlap.length === 0) {
    console.log("✅ SUCCESS! There is no overlap. Deduplication works perfectly.");
  } else {
    console.error("❌ FAILURE! Duplicate items were delivered.");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
