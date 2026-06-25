import { prisma } from "../src/lib/prisma";
import { generateDigest } from "../src/lib/whatsapp/digest";

const PHONE = "+918121693113";

async function main() {
  console.log("=== VERIFYING PERSONALIZATION AND EXTENSIBLE INTEREST FILTER ===");

  // Fetch user first
  const user = await prisma.user.findFirst({
    where: { whatsappNumber: PHONE }
  });

  if (!user) {
    console.error(`User not found for ${PHONE}`);
    return;
  }

  // Clear delivery logs to start clean
  await prisma.deliveryItem.deleteMany();
  await prisma.deliveryLog.deleteMany();

  // Test 1: Category Filtering (Only "CYBERSECURITY")
  console.log("\n--- TEST 1: Category interest filter (interests = ['CYBERSECURITY']) ---");
  await prisma.user.update({
    where: { id: user.id },
    data: { interests: ["CYBERSECURITY"] }
  });

  const digestCyber = await generateDigest(user.id, "DAILY");
  if (digestCyber) {
    console.log(`Generated digest with ${digestCyber.itemIds.length} items.`);
    
    // Check categories of returned items
    const items = await prisma.intelligenceItem.findMany({
      where: { id: { in: digestCyber.itemIds } }
    });
    console.log("Categories of returned items (should all be CYBERSECURITY or have matching tags):");
    items.forEach(item => {
      console.log(`- [${item.category}] ${item.title} (Tags: ${item.tags.join(", ")})`);
    });
  } else {
    console.log("No items matched CYBERSECURITY.");
  }

  // Test 2: Extensible Tag Filtering (Only "DEVELOPER_TOOLS" as interest, matched via tags)
  console.log("\n--- TEST 2: Category matching via tags (interests = ['DEVELOPER_TOOLS']) ---");
  
  // Find a completed item with category != "DEVELOPER_TOOLS", and add "developer_tools" to its tags
  const nonDevToolItem = await prisma.intelligenceItem.findFirst({
    where: { 
      analysisStatus: "COMPLETED",
      category: { not: "DEVELOPER_TOOLS" }
    }
  });

  if (nonDevToolItem) {
    await prisma.intelligenceItem.update({
      where: { id: nonDevToolItem.id },
      data: { tags: ["developer_tools"] }
    });
    console.log(`Updated Item: "${nonDevToolItem.title}" (Category: ${nonDevToolItem.category}) to have tag "developer_tools"`);
  }

  // Update user preferences to only look for "DEVELOPER_TOOLS"
  await prisma.user.update({
    where: { id: user.id },
    data: { interests: ["DEVELOPER_TOOLS"] }
  });

  const digestDevTools = await generateDigest(user.id, "DAILY");
  if (digestDevTools) {
    console.log(`\n✅ SUCCESS! Generated digest containing tag-matched items. Count: ${digestDevTools.itemIds.length}`);
    const items = await prisma.intelligenceItem.findMany({
      where: { id: { in: digestDevTools.itemIds } }
    });
    items.forEach(item => {
      console.log(`- [${item.category}] ${item.title} (Tags: ${item.tags.join(", ")})`);
    });
  } else {
    console.log("\n❌ FAILED: No items matched the DEVELOPER_TOOLS tag.");
  }

  // Reset user preferences back to all categories
  console.log("\nResetting user preferences...");
  await prisma.user.update({
    where: { id: user.id },
    data: {
      interests: ["AI", "STARTUPS", "DEVELOPER_TOOLS", "CYBERSECURITY", "BIG_TECH", "RESEARCH", "PRODUCT_LAUNCHES", "FUNDING"],
    }
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
