import { PrismaClient, DigestFrequency, Category, DeliveryStatus } from "@prisma/client";

const prisma = new PrismaClient();

// Mirror local hour timezone logic from inngest/whatsapp.ts
function getLocalHourForTesting(timezone: string, mockDate: Date): number {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      hour12: false,
    });
    return parseInt(formatter.format(mockDate), 10);
  } catch (e) {
    return mockDate.getHours();
  }
}

// Mirror schedule eligibility check from inngest/whatsapp.ts
function checkIsDue({
  freq,
  localHour,
  hoursSinceLast,
}: {
  freq: DigestFrequency;
  localHour: number;
  hoursSinceLast: number;
}): boolean {
  if (freq === DigestFrequency.THREE_HOURLY && hoursSinceLast >= 2.5) {
    return true;
  } else if (freq === DigestFrequency.MORNING && localHour === 8 && hoursSinceLast >= 20) {
    return true;
  } else if (freq === DigestFrequency.EVENING && localHour === 20 && hoursSinceLast >= 20) {
    return true;
  } else if (
    (freq === DigestFrequency.DAILY || freq === DigestFrequency.INSTANT) &&
    localHour === 9 &&
    hoursSinceLast >= 20
  ) {
    return true;
  }
  return false;
}

async function main() {
  console.log("====================================================");
  console.log("   PHASE 5 VERIFICATION: MULTI-USER & SCHEDULING   ");
  console.log("====================================================\n");

  // 1. Fetch our seeded test users
  const userA = await prisma.user.findFirst({ where: { email: "user-a@example.com" } });
  const userB = await prisma.user.findFirst({ where: { email: "user-b@example.com" } });

  if (!userA || !userB) {
    console.error("❌ Test users not found in the database. Please run seed-demo-users first.");
    process.exit(1);
  }

  console.log(`Loaded test users:`);
  console.log(`- User A: ${userA.name} | Interests: ${userA.interests.join(", ")} | Timezone: ${userA.timezone}`);
  console.log(`- User B: ${userB.name} | Interests: ${userB.interests.join(", ")} | Timezone: ${userB.timezone}\n`);

  // 2. Insert mock completed intelligence items for testing personalization
  console.log("Inserting mock intelligence items...");
  
  // Clean up any existing verification items first to start fresh
  await prisma.intelligenceItem.deleteMany({
    where: {
      sourceUrl: {
        in: [
          "https://test.com/gemini-2-5",
          "https://test.com/openai-agents",
          "https://test.com/nvidia-blackwell",
          "https://test.com/rust-devtools",
          "https://test.com/cybersecurity-funding",
        ],
      },
    },
  });

  const now = new Date();
  
  const itemGemini = await prisma.intelligenceItem.create({
    data: {
      title: "Google releases Gemini 2.5 Pro",
      sourceUrl: "https://test.com/gemini-2-5",
      sourceName: "TechNews",
      category: Category.AI,
      tags: ["AI", "Gemini", "Google"],
      opportunityScore: 9,
      founderScore: 8,
      analysisStatus: "COMPLETED",
      publishedAt: new Date(now.getTime() - 1000 * 60 * 60), // 1h ago
    },
  });

  const itemOpenAI = await prisma.intelligenceItem.create({
    data: {
      title: "OpenAI launches Agentic Assistant",
      sourceUrl: "https://test.com/openai-agents",
      sourceName: "TechNews",
      category: Category.AI,
      tags: ["AI", "OpenAI", "Agents"],
      opportunityScore: 10,
      founderScore: 9,
      analysisStatus: "COMPLETED",
      publishedAt: new Date(now.getTime() - 1000 * 60 * 60 * 2), // 2h ago
    },
  });

  const itemNVIDIA = await prisma.intelligenceItem.create({
    data: {
      title: "NVIDIA ships Blackwell Ultra chips",
      sourceUrl: "https://test.com/nvidia-blackwell",
      sourceName: "HardwareBeat",
      category: Category.DEVELOPER_TOOLS,
      tags: ["DevTools", "NVIDIA", "Chips"],
      opportunityScore: 9,
      founderScore: 8,
      analysisStatus: "COMPLETED",
      publishedAt: new Date(now.getTime() - 1000 * 60 * 60 * 3), // 3h ago
    },
  });

  const itemRust = await prisma.intelligenceItem.create({
    data: {
      title: "Rust Framework Axum gets v1.0",
      sourceUrl: "https://test.com/rust-devtools",
      sourceName: "DevWeekly",
      category: Category.DEVELOPER_TOOLS,
      tags: ["DevTools", "Rust", "Axum"],
      opportunityScore: 7,
      founderScore: 7,
      analysisStatus: "COMPLETED",
      publishedAt: new Date(now.getTime() - 1000 * 60 * 60 * 4), // 4h ago
    },
  });

  const itemCyber = await prisma.intelligenceItem.create({
    data: {
      title: "Cybersecurity firm secures Series A",
      sourceUrl: "https://test.com/cybersecurity-funding",
      sourceName: "VCWire",
      category: Category.CYBERSECURITY,
      tags: ["Funding", "Cybersecurity"],
      opportunityScore: 8,
      founderScore: 6,
      analysisStatus: "COMPLETED",
      publishedAt: new Date(now.getTime() - 1000 * 60 * 60 * 5), // 5h ago
    },
  });

  const mockItems = [itemGemini, itemOpenAI, itemNVIDIA, itemRust, itemCyber];
  console.log(`Inserted ${mockItems.length} mock completed items.\n`);

  // Helper function to simulate personalization filtering
  const getPersonalizedItems = (user: typeof userA, items: typeof mockItems) => {
    const interests = user.interests || [];
    return items.filter((item) => {
      const matchesCategory = interests.includes(item.category);
      const matchesTags = item.tags.some(tag => 
        interests.some(interest => interest.toUpperCase() === tag.toUpperCase())
      );
      return matchesCategory || matchesTags;
    });
  };

  // ----------------------------------------------------
  // TEST 1: MULTI-USER PERSONALIZATION
  // ----------------------------------------------------
  console.log("--- TEST 1: Personalization Filter Checks ---");
  
  const personalizedA = getPersonalizedItems(userA, mockItems);
  console.log(`User A (Interests: ${userA.interests.join(", ")}) matched items:`);
  personalizedA.forEach(i => console.log(`  - [${i.category}] ${i.title} (Tags: ${i.tags.join(",")})`));
  
  const matchesAOnly = personalizedA.every(i => i.category === Category.AI || i.tags.includes("OpenAI"));
  const skippedBInA = !personalizedA.some(i => i.id === itemNVIDIA.id || i.id === itemRust.id || i.id === itemCyber.id);
  
  if (matchesAOnly && skippedBInA) {
    console.log("✅ User A personalization test PASSED.");
  } else {
    console.log("❌ User A personalization test FAILED.");
  }

  const personalizedB = getPersonalizedItems(userB, mockItems);
  console.log(`\nUser B (Interests: ${userB.interests.join(", ")}) matched items:`);
  personalizedB.forEach(i => console.log(`  - [${i.category}] ${i.title} (Tags: ${i.tags.join(",")})`));

  const matchesBOnly = personalizedB.every(i => i.category === Category.DEVELOPER_TOOLS || i.tags.includes("NVIDIA"));
  const skippedAInB = !personalizedB.some(i => i.id === itemGemini.id || i.id === itemOpenAI.id || i.id === itemCyber.id);

  if (matchesBOnly && skippedAInB) {
    console.log("✅ User B personalization test PASSED.");
  } else {
    console.log("❌ User B personalization test FAILED.");
  }
  console.log("");

  // ----------------------------------------------------
  // TEST 2: INDEPENDENT DEDUPLICATION
  // ----------------------------------------------------
  console.log("--- TEST 2: Deduplication Check ---");
  
  // Clear any delivery logs for test users first
  await prisma.deliveryItem.deleteMany({
    where: {
      deliveryLog: {
        userId: { in: [userA.id, userB.id] },
      },
    },
  });
  await prisma.deliveryLog.deleteMany({
    where: {
      userId: { in: [userA.id, userB.id] },
    },
  });

  // Create simulated DeliveryLog representing itemGemini sent to User A
  console.log(`Simulating Gemini 2.5 delivered to User A...`);
  const logA = await prisma.deliveryLog.create({
    data: {
      userId: userA.id,
      whatsappNumber: userA.whatsappNumber!,
      digestType: DigestFrequency.DAILY,
      status: DeliveryStatus.SENT,
      scheduledAt: new Date(),
      items: {
        create: [{ intelligenceItemId: itemGemini.id }],
      },
    },
  });

  // Query remaining undelivered items for User A
  const undeliveredA = await prisma.intelligenceItem.findMany({
    where: {
      analysisStatus: "COMPLETED",
      id: { in: mockItems.map(i => i.id) },
      NOT: {
        deliveries: {
          some: {
            deliveryLog: {
              userId: userA.id,
            },
          },
        },
      },
    },
  });
  const filteredA = getPersonalizedItems(userA, undeliveredA);
  
  console.log(`User A remaining undelivered & matching items (Gemini should be missing):`);
  filteredA.forEach(i => console.log(`  - [${i.category}] ${i.title}`));
  
  const geminiDeduplicated = !filteredA.some(i => i.id === itemGemini.id);
  const openAISucceeds = filteredA.some(i => i.id === itemOpenAI.id);

  if (geminiDeduplicated && openAISucceeds) {
    console.log("✅ User A deduplication test PASSED.");
  } else {
    console.log("❌ User A deduplication test FAILED.");
  }

  // Check User B undelivered items - User A's delivery log should have NO effect on User B
  const undeliveredB = await prisma.intelligenceItem.findMany({
    where: {
      analysisStatus: "COMPLETED",
      id: { in: mockItems.map(i => i.id) },
      NOT: {
        deliveries: {
          some: {
            deliveryLog: {
              userId: userB.id,
            },
          },
        },
      },
    },
  });
  const filteredB = getPersonalizedItems(userB, undeliveredB);
  
  console.log(`User B remaining matching items (should still include NVIDIA & Rust):`);
  filteredB.forEach(i => console.log(`  - [${i.category}] ${i.title}`));

  const userBUnimpacted = filteredB.some(i => i.id === itemNVIDIA.id) && filteredB.some(i => i.id === itemRust.id);

  if (userBUnimpacted) {
    console.log("✅ User B delivery isolation test PASSED.");
  } else {
    console.log("❌ User B delivery isolation test FAILED.");
  }
  console.log("");

  // ----------------------------------------------------
  // TEST 3: MULTI-SCHEDULE & TIMEZONE SCHEDULING
  // ----------------------------------------------------
  console.log("--- TEST 3: Timezone Scheduling Rules ---");

  // Setup mock dates for timezone evaluation
  // Say it's 2026-06-25 09:00:00 UTC
  // 09:00 AM UTC = 14:30 in India Standard Time (+5:30)
  // 09:00 AM UTC = 05:00 AM in America/New_York (EST, -4h/5h daylight saving depending on date)
  const mockDate = new Date("2026-06-25T03:30:00Z"); // 03:30 AM UTC = 09:00 AM in IST (Asia/Kolkata)

  const localHourA = getLocalHourForTesting(userA.timezone, mockDate);
  const localHourB = getLocalHourForTesting(userB.timezone, mockDate);
  console.log(`Simulated UTC Time: ${mockDate.toISOString()}`);
  console.log(`- User A (${userA.timezone}) Local Hour: ${localHourA} (Expected: 9)`);
  console.log(`- User B (${userB.timezone}) Local Hour: ${localHourB} (Expected: 23 or 22 depending on DST)`);

  // Test schedule checking for User A (DAILY schedule at 9 AM, 24h since last delivery)
  const isAEligibleDaily = checkIsDue({
    freq: DigestFrequency.DAILY,
    localHour: localHourA,
    hoursSinceLast: 24,
  });
  console.log(`- User A DAILY digest due at local hour ${localHourA} (24h elapsed): ${isAEligibleDaily} (Expected: true)`);

  const isAEligibleMorning = checkIsDue({
    freq: DigestFrequency.MORNING,
    localHour: localHourA,
    hoursSinceLast: 24,
  });
  console.log(`- User A MORNING digest due at local hour ${localHourA} (Expected morning at 8 AM): ${isAEligibleMorning} (Expected: false)`);

  // Test schedule checking for User B (THREE_HOURLY schedule, 3h since last delivery)
  const isBEligibleThreeHourly = checkIsDue({
    freq: DigestFrequency.THREE_HOURLY,
    localHour: localHourB,
    hoursSinceLast: 3.0,
  });
  console.log(`- User B THREE_HOURLY digest due at local hour ${localHourB} (3.0h elapsed): ${isBEligibleThreeHourly} (Expected: true)`);

  const isBEligibleThreeHourlyTooEarly = checkIsDue({
    freq: DigestFrequency.THREE_HOURLY,
    localHour: localHourB,
    hoursSinceLast: 1.5,
  });
  console.log(`- User B THREE_HOURLY digest due at local hour ${localHourB} (1.5h elapsed): ${isBEligibleThreeHourlyTooEarly} (Expected: false)`);

  if (isAEligibleDaily && !isAEligibleMorning && isBEligibleThreeHourly && !isBEligibleThreeHourlyTooEarly) {
    console.log("✅ Timezone schedule calculations test PASSED.");
  } else {
    console.log("❌ Timezone schedule calculations test FAILED.");
  }
  console.log("");

  // ----------------------------------------------------
  // CLEAN UP
  // ----------------------------------------------------
  console.log("Cleaning up verification logs and items...");
  await prisma.deliveryItem.deleteMany({
    where: {
      deliveryLog: {
        userId: { in: [userA.id, userB.id] },
      },
    },
  });
  await prisma.deliveryLog.deleteMany({
    where: {
      userId: { in: [userA.id, userB.id] },
    },
  });
  await prisma.intelligenceItem.deleteMany({
    where: {
      id: { in: mockItems.map(i => i.id) },
    },
  });
  console.log("Cleanup completed.");
  console.log("\n====================================================");
  console.log("           PHASE 5 VERIFICATION COMPLETE            ");
  console.log("====================================================");
}

main()
  .catch((e) => {
    console.error("Error in verification:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
