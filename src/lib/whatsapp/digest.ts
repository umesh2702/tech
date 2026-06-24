import { prisma } from "@/lib/prisma";
import { IntelligenceItem } from "@prisma/client";

const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

export function formatDigestItem(item: IntelligenceItem): string {
  return `
*${item.title}*
⭐ Score: ${item.opportunityScore}/10

*Why It Matters:*
_${item.whyItMatters}_

*Founder Opportunity:*
${item.opportunity}

🔗 Read more: ${APP_URL}/dashboard?itemId=${item.id}
  `.trim();
}

export async function generateDigest(userId: string, limit: number = 3): Promise<{ text: string; itemIds: string[] } | null> {
  const prefs = await prisma.userPreference.findUnique({
    where: { userId },
  });

  if (!prefs || !prefs.whatsappVerified || !prefs.whatsappNumber) {
    return null;
  }

  // Find items that are COMPLETED and haven't been delivered to this user yet
  const items = await prisma.intelligenceItem.findMany({
    where: {
      analysisStatus: "COMPLETED",
      opportunityScore: { gte: 7 }, // Only send reasonably good ones in digest
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
    orderBy: [
      { opportunityScore: "desc" },
      { founderScore: "desc" },
      { publishedAt: "desc" }
    ],
    take: limit,
  });

  if (items.length === 0) {
    return null; // Nothing new to send
  }

  const header = `🤖 *Pulse AI Digest*\n_Top founder opportunities in the last period._\n\n`;
  const formattedItems = items.map(formatDigestItem).join("\n\n---\n\n");
  const text = `${header}${formattedItems}`;

  return {
    text,
    itemIds: items.map(i => i.id),
  };
}
