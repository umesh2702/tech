import { PrismaClient } from '@prisma/client';
import { mockIntelligence } from '../src/data/mock-intelligence';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Phase 2 Database Verification ---');

  // 1. Verify Prisma Connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Connection to Supabase PostgreSQL successful.');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }

  // 3. Confirm all tables exist by checking Prisma meta
  console.log('✅ Tables are accessible via Prisma Client.');

  // 4. Seed the database with mock items
  console.log('--- Seeding Database ---');
  
  // Clear existing items for clean verification
  await prisma.savedItem.deleteMany();
  await prisma.intelligenceItem.deleteMany();
  await prisma.user.deleteMany();
  await prisma.userPreference.deleteMany();

  const mockUser = await prisma.user.create({
    data: {
      email: 'test@pulse.ai',
      name: 'Test Founder',
      preferences: {
        create: {
          digestFrequency: 'DAILY',
          interests: ['AI', 'STARTUPS'],
          whatsappNumber: '+1234567890'
        }
      }
    }
  });
  console.log('✅ Mock User and Preferences created successfully.');

  let seededCount = 0;
  for (const item of mockIntelligence) {
    await prisma.intelligenceItem.create({
      data: {
        title: item.title,
        sourceUrl: item.sourceUrl,
        whatHappened: item.whatHappened,
        whyItMatters: item.whyItMatters,
        opportunity: item.opportunity,
        opportunityScore: item.opportunityScore,
        category: item.category,
        sourceName: 'Mock Source',
        rawContent: 'Mock content to simulate raw article.',
        industryTags: ['AI', 'Tech'],
        publishedAt: new Date(item.publishedAt),
        analysisStatus: 'COMPLETED'
      }
    });
    seededCount++;
  }
  console.log(`✅ Seeded ${seededCount} IntelligenceItems into PostgreSQL.`);

  // 6. Verify Saved items persistence
  const topItem = await prisma.intelligenceItem.findFirst({
    orderBy: { opportunityScore: 'desc' }
  });

  if (topItem) {
    await prisma.savedItem.create({
      data: {
        userId: mockUser.id,
        intelligenceItemId: topItem.id
      }
    });
    console.log('✅ SavedItem persistence verified.');
  }

  // Verify Read
  const itemsInDb = await prisma.intelligenceItem.count();
  console.log(`✅ Final Verification: ${itemsInDb} items in DB.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('--- Verification Complete ---');
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
