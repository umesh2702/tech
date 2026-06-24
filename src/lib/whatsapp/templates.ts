// ─────────────────────────────────────────────
// Pulse AI — WhatsApp Message Templates
// ─────────────────────────────────────────────

import type { IntelligenceItem } from "@/types";
import { SCORE_CONFIG } from "@/lib/constants";

/**
 * Format a single intelligence item for WhatsApp delivery
 */
export function formatIntelligenceItem(item: IntelligenceItem): string {
  const scoreConfig = SCORE_CONFIG.getConfig(item.opportunityScore);

  return [
    `${scoreConfig.emoji} *Opportunity Score: ${item.opportunityScore}/10*`,
    "",
    `*${item.title}*`,
    "",
    `📌 *What Happened*`,
    item.whatHappened || "Analysis pending...",
    "",
    `💡 *Why It Matters*`,
    item.whyItMatters || "Analysis pending...",
    "",
    `🚀 *Opportunity*`,
    item.opportunity || "Analysis pending...",
    "",
    `🔗 Read more: ${item.sourceUrl}`,
  ].join("\n");
}

/**
 * Format a full digest message with multiple items
 */
export function formatDigest(
  items: IntelligenceItem[],
  digestType: string
): string {
  const header = [
    `🧠 *Pulse AI — Your Intelligence Digest*`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    "",
  ].join("\n");

  const body = items
    .sort((a, b) => b.opportunityScore - a.opportunityScore)
    .slice(0, 5) // Max 5 items per digest
    .map((item, index) => {
      const divider =
        index < Math.min(items.length, 5) - 1
          ? "\n━━━━━━━━━━━━━━━━━━━━━━\n"
          : "";
      return formatIntelligenceItem(item) + divider;
    })
    .join("\n");

  const footer = [
    "",
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `_${digestType} digest • Powered by Pulse AI_`,
    `_Reply STOP to unsubscribe_`,
  ].join("\n");

  return header + body + footer;
}

/**
 * Format a high-opportunity instant alert
 */
export function formatInstantAlert(item: IntelligenceItem): string {
  return [
    `⚡ *Pulse AI — Instant Alert*`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    "",
    formatIntelligenceItem(item),
    "",
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `_High-opportunity alert • Score ≥ 8_`,
  ].join("\n");
}
