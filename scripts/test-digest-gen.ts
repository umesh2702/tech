import { generateDigest } from "../src/lib/whatsapp/digest";
import { prisma } from "../src/lib/prisma";

const PHONE = "+918121693113";

async function main() {
  console.log("=== RUNNING DIRECT DIGEST GENERATION TEST ===");

  // Find user
  const user = await prisma.user.findFirst({
    where: { whatsappNumber: PHONE }
  });

  if (!user) {
    console.error(`User not found for phone: ${PHONE}`);
    return;
  }

  console.log(`User Settings:`, JSON.stringify(user, null, 2));

  // Generate DAILY (Top 5) digest
  console.log("\n--- Generating Daily Digest (Top 5) ---");
  const digestDaily = await generateDigest(user.id, "DAILY");
  if (digestDaily) {
    console.log("SUCCESSFULLY GENERATED DAILY DIGEST");
    console.log("Item IDs included:", digestDaily.itemIds);
    console.log("\n[DIGEST CONTENT START]");
    console.log(digestDaily.text);
    console.log("[DIGEST CONTENT END]\n");
  } else {
    console.log("No digest generated (possibly all items already delivered or no matching interests).");
  }

  // Generate THREE_HOURLY (Top 3) digest
  console.log("\n--- Generating Three-Hourly Digest (Top 3) ---");
  const digestThreeHourly = await generateDigest(user.id, "THREE_HOURLY");
  if (digestThreeHourly) {
    console.log("SUCCESSFULLY GENERATED THREE-HOURLY DIGEST");
    console.log("Item IDs included:", digestThreeHourly.itemIds);
    console.log("\n[DIGEST CONTENT START]");
    console.log(digestThreeHourly.text);
    console.log("[DIGEST CONTENT END]\n");
  } else {
    console.log("No digest generated (possibly all items already delivered or no matching interests).");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
