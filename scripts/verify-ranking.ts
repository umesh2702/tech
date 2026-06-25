import { prisma } from "../src/lib/prisma";
import { calculateWeightedScore, RANKING_WEIGHTS } from "../src/lib/whatsapp/digest";

async function main() {
  console.log("=== VERIFYING WEIGHTED RANKING MATH ===");
  console.log("Ranking Weights configured:", RANKING_WEIGHTS);

  const items = await prisma.intelligenceItem.findMany({
    where: { analysisStatus: "COMPLETED" },
    take: 10,
    orderBy: { publishedAt: "desc" }
  });

  if (items.length === 0) {
    console.log("No completed items in DB.");
    return;
  }

  for (const item of items) {
    const { weightedScore, freshnessScore } = calculateWeightedScore(item);
    const ageInHours = (Date.now() - new Date(item.publishedAt).getTime()) / (1000 * 60 * 60);

    console.log(`\nTitle: ${item.title}`);
    console.log(`  Published At: ${item.publishedAt.toISOString()} (Age: ${ageInHours.toFixed(2)} hours)`);
    console.log(`  Scores:`);
    console.log(`    - Opportunity (Weight 0.40): ${item.opportunityScore} => Contribution: ${(item.opportunityScore * RANKING_WEIGHTS.opportunity).toFixed(2)}`);
    console.log(`    - Founder Fit (Weight 0.30): ${item.founderScore || 0} => Contribution: ${((item.founderScore || 0) * RANKING_WEIGHTS.founder).toFixed(2)}`);
    console.log(`    - Source (Weight 0.20):      ${item.sourceReliabilityScore || 5} => Contribution: ${((item.sourceReliabilityScore || 5) * RANKING_WEIGHTS.source).toFixed(2)}`);
    console.log(`    - Freshness (Weight 0.10):   ${freshnessScore.toFixed(2)} => Contribution: ${(freshnessScore * RANKING_WEIGHTS.freshness).toFixed(2)}`);
    console.log(`  ============================================`);
    console.log(`  Calculated Weighted Score:  ${weightedScore}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
