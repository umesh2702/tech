import { prisma } from "@/lib/prisma";
import { IntelligenceItem, DigestFrequency } from "@prisma/client";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";

// Configurable Ranking Weights
export const RANKING_WEIGHTS = {
  opportunity: 0.40,
  founder: 0.30,
  source: 0.20,
  freshness: 0.10,
};

// Interface for ranked item output
export interface RankedIntelligenceItem extends IntelligenceItem {
  weightedScore: number;
  freshnessScore: number;
}

/**
 * Calculates a weighted score for an intelligence item.
 * Scale: 0 to 10
 */
export function calculateWeightedScore(item: IntelligenceItem): { weightedScore: number; freshnessScore: number } {
  const oppScore = item.opportunityScore;
  const founderScore = item.founderScore || 0;
  const sourceScore = item.sourceReliabilityScore || 5;

  // Freshness score: decays linearly over a 48-hour window from now (0 to 10 scale)
  const ageInHours = (Date.now() - new Date(item.publishedAt).getTime()) / (1000 * 60 * 60);
  const freshnessScore = Math.max(0, 10 * (1 - ageInHours / 48));

  const weightedScore =
    (oppScore * RANKING_WEIGHTS.opportunity) +
    (founderScore * RANKING_WEIGHTS.founder) +
    (sourceScore * RANKING_WEIGHTS.source) +
    (freshnessScore * RANKING_WEIGHTS.freshness);

  return {
    weightedScore: parseFloat(weightedScore.toFixed(2)),
    freshnessScore: parseFloat(freshnessScore.toFixed(2)),
  };
}

/**
 * Generates an executive summary (2-4 sentences) using Gemini
 * describing the overall trends of the top opportunities.
 */
export async function generateAIGeneratedSummary(items: IntelligenceItem[]): Promise<string> {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    console.warn("[Digest Summary] GEMINI_API_KEY is not configured. Using fallback summary.");
    return getFallbackSummary(items);
  }

  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const articlesText = items
      .map((item, idx) => `${idx + 1}. [${item.category}] ${item.title}: ${item.whatHappened || ""}`)
      .join("\n");

    const prompt = `
You are an elite business analyst for founders.
Write a short executive summary (exactly 2 to 4 sentences) highlighting the overall trends and news from the following top tech articles today.
Focus on identifying high-level industry patterns, shifts, or builder opportunities.
Do NOT list or repeat the articles one by one. Summarize the overall narrative.
Keep it concise, direct, authoritative, and under 100 words. Do not use markdown bolding in the summary itself.

ARTICLES:
${articlesText}
`.trim();

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    return text || getFallbackSummary(items);
  } catch (error) {
    console.error("[Digest Summary] Failed to generate AI summary, falling back:", error);
    return getFallbackSummary(items);
  }
}

function getFallbackSummary(items: IntelligenceItem[]): string {
  if (items.length === 0) return "";
  const categories = Array.from(new Set(items.map(i => i.category.replace("_", " "))));
  return `Today's top tech intelligence highlights opportunities across ${categories.join(" and ")}. Market changes continue to accelerate developer tool adoption and infra tooling investments. Founders should focus on specialized integrations and workflow automation to capture immediate business demand.`;
}

/**
 * Formats a single item for the WhatsApp digest payload.
 */
export function formatDigestItem(item: RankedIntelligenceItem, index: number): string {
  // Truncate description fields to prevent exceeding Meta's 4096 character limit
  const maxWhyItMatters = 160;
  const maxOpportunity = 220;

  const whyItMattersText = item.whyItMatters && item.whyItMatters.length > maxWhyItMatters
    ? item.whyItMatters.substring(0, maxWhyItMatters - 3) + "..."
    : item.whyItMatters || "N/A";

  const opportunityText = item.opportunity && item.opportunity.length > maxOpportunity
    ? item.opportunity.substring(0, maxOpportunity - 3) + "..."
    : item.opportunity || "N/A";

  return `
${index}. *${item.title}*

⭐ *Opportunity:* ${item.opportunityScore}/10
🚀 *Founder Fit:* ${item.founderScore || 0}/10

*Why it matters:*
_${whyItMattersText}_

*Founder opportunity:*
${opportunityText}

_Why you received this:_
• Matches your interests
• High Opportunity Score

_Dashboard:_
${APP_URL}/dashboard/item/${item.id}
`.trim();
}

/**
 * Main service to fetch, rank, personalize, summarize, and format the WhatsApp digest.
 */
export async function generateDigest(
  userId: string,
  frequency: DigestFrequency
): Promise<{ text: string; itemIds: string[] } | null> {
  // 1. Fetch user
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.whatsappNumber) {
    console.log(`[Digest Generator] User ${userId} has no profile or WhatsApp number configured.`);
    return null;
  }

  // Determine limit based on frequency
  let limit = 5;
  if (frequency === "THREE_HOURLY") {
    limit = 3;
  }

  // 2. Fetch COMPLETED items that have NOT been delivered to this user yet
  const rawItems = await prisma.intelligenceItem.findMany({
    where: {
      analysisStatus: "COMPLETED",
      // Exclude items already delivered
      NOT: {
        deliveries: {
          some: {
            deliveryLog: {
              userId: userId,
            },
          },
        },
      },
    },
  });

  if (rawItems.length === 0) {
    console.log(`[Digest Generator] No new articles found for user ${userId}.`);
    return null;
  }

  // 3. Extensible Personalization Filtering: Matches user interest categories or tags
  const interests = user.interests || [];
  const filteredItems = rawItems.filter((item) => {
    const matchesCategory = interests.includes(item.category);
    // Extensible section: check if item tags contain any interest keywords (e.g. for companies)
    const matchesTags = item.tags.some(tag => 
      interests.some(interest => interest.toUpperCase() === tag.toUpperCase())
    );
    return matchesCategory || matchesTags;
  });

  if (filteredItems.length === 0) {
    console.log(`[Digest Generator] No articles matching interests (${interests.join(", ")}) for user ${userId}.`);
    return null;
  }

  // 4. Calculate weighted scores and rank items
  const rankedItems: RankedIntelligenceItem[] = filteredItems.map((item) => {
    const { weightedScore, freshnessScore } = calculateWeightedScore(item);
    return {
      ...item,
      weightedScore,
      freshnessScore,
    };
  });

  // Sort descending by weighted score
  rankedItems.sort((a, b) => b.weightedScore - a.weightedScore);

  // Take the top items matching our limit
  const topItems = rankedItems.slice(0, limit);

  // 5. Generate AI Executive Summary
  console.log(`[Digest Generator] Generating AI summary for ${topItems.length} top items...`);
  const executiveSummary = await generateAIGeneratedSummary(topItems);

  // 6. Format the complete WhatsApp message
  const header = `🧠 *Pulse AI*\n\n_Today's Top Opportunities_\n\n${executiveSummary}\n\n`;
  const itemsFormatted = topItems.map((item, idx) => formatDigestItem(item, idx + 1)).join("\n\n---\n\n");
  
  const text = `${header}${itemsFormatted}`;

  return {
    text,
    itemIds: topItems.map(item => item.id),
  };
}

/**
 * Reads pre-locked items from a DeliveryLog and formats the message text.
 * Handles both Instant Alerts and Multi-article digests.
 */
export async function formatDeliveryMessage(deliveryLogId: string): Promise<string> {
  const log = await prisma.deliveryLog.findUnique({
    where: { id: deliveryLogId },
    include: {
      items: {
        include: {
          intelligenceItem: true,
        },
      },
    },
  });

  if (!log || log.items.length === 0) {
    throw new Error("No items associated with this delivery log");
  }

  const items = log.items.map((i) => i.intelligenceItem);

  if (log.digestType === DigestFrequency.INSTANT) {
    const item = items[0];
    const { weightedScore, freshnessScore } = calculateWeightedScore(item);
    const rankedItem = { ...item, weightedScore, freshnessScore };

    const header = `🚨 *Pulse AI Instant Alert* (Score: ${item.opportunityScore}/10)\n\n`;
    const body = `
*${item.title}*

⭐ *Opportunity:* ${item.opportunityScore}/10
🚀 *Founder Fit:* ${item.founderScore || 0}/10

*Why it matters:*
_${item.whyItMatters || "N/A"}_

*Founder opportunity:*
${item.opportunity || "N/A"}

_Why you received this:_
• Matches your interests
• High Opportunity Score

_Dashboard:_
${APP_URL}/dashboard/item/${item.id}
`.trim();

    return header + body;
  } else {
    const rankedItems: RankedIntelligenceItem[] = items.map((item) => {
      const { weightedScore, freshnessScore } = calculateWeightedScore(item);
      return { ...item, weightedScore, freshnessScore };
    });

    rankedItems.sort((a, b) => b.weightedScore - a.weightedScore);

    const executiveSummary = await generateAIGeneratedSummary(rankedItems);
    
    let label = "Today's Top Opportunities";
    if (log.digestType === "MORNING") label = "Morning Digest";
    if (log.digestType === "EVENING") label = "Evening Digest";
    if (log.digestType === "THREE_HOURLY") label = "3-Hourly Digest";

    const header = `🧠 *Pulse AI*\n\n_${label}_\n\n${executiveSummary}\n\n`;
    const itemsFormatted = rankedItems.map((item, idx) => formatDigestItem(item, idx + 1)).join("\n\n---\n\n");

    return `${header}${itemsFormatted}`;
  }
}
