import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding Real RSS Sources ---');

  const sources = [
    {
      name: 'TechCrunch',
      url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
      type: 'RSS',
      category: 'AI',
      sourcePriority: 9,
    },
    {
      name: 'Y Combinator Blog',
      url: 'https://blog.ycombinator.com/feed/',
      type: 'RSS',
      category: 'STARTUPS',
      sourcePriority: 9,
    },
    {
      name: 'OpenAI Blog',
      url: 'https://openai.com/blog/rss.xml',
      type: 'RSS',
      category: 'AI',
      sourcePriority: 10,
    }
  ];

  for (const s of sources) {
    await prisma.source.upsert({
      where: { name: s.name },
      update: {
        url: s.url,
        type: 'RSS',
        category: s.category as any,
        sourcePriority: s.sourcePriority,
      },
      create: {
        name: s.name,
        url: s.url,
        type: 'RSS',
        category: s.category as any,
        sourcePriority: s.sourcePriority,
      }
    });
  }

  console.log(`✅ Seeded ${sources.length} sources.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('--- Setup Complete ---');
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
