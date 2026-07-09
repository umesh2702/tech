// ─────────────────────────────────────────────
// Pulse AI — WhatsApp Template Formatters
// Converts domain data → Meta TemplateComponent[]
// Single Responsibility: Formatting only. No HTTP calls.
// ─────────────────────────────────────────────

import type {
  TemplateComponent,
  WelcomeTemplateData,
  DigestTemplateData,
  SubscriptionTemplateData,
} from "./types";

// ── Helper ────────────────────────────────────

/**
 * Builds a body component with a list of text parameters.
 * Meta template {{1}}, {{2}}, {{3}}... map to parameters[0], [1], [2]...
 */
function bodyComponent(params: string[]): TemplateComponent {
  return {
    type: "body",
    parameters: params.map((text) => ({ type: "text", text })),
  };
}

/**
 * Truncates a string to a max length, appending "..." if truncated.
 */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}

// ── Formatters ────────────────────────────────

/**
 * Formats parameters for the `pulse_welcome` template.
 *
 * Template body variables:
 *   {{1}} — user's first name
 *
 * @param data - WelcomeTemplateData
 * @returns TemplateComponent[] ready for the Meta API
 */
export function formatWelcome(data: WelcomeTemplateData): TemplateComponent[] {
  const firstName = data.userName.split(" ")[0] || "there";
  return [bodyComponent([firstName])];
}

/**
 * Formats parameters for the `pulse_digest_ready` template.
 *
 * Template body variables:
 *   {{1}} — digest label (e.g. "Morning Digest")
 *   {{2}} — item count (e.g. "5")
 *   {{3}} — short executive summary (max 150 chars)
 *   {{4}} — dashboard URL
 *
 * @param data - DigestTemplateData
 * @returns TemplateComponent[] ready for the Meta API
 */
export function formatDigest(data: DigestTemplateData): TemplateComponent[] {
  return [
    bodyComponent([
      data.digestLabel,
      String(data.itemCount),
      truncate(data.summary, 150),
      data.appUrl,
    ]),
  ];
}

/**
 * Formats parameters for the `pulse_subscription_up` template.
 *
 * Template body variables:
 *   {{1}} — plan name (e.g. "Pro")
 *   {{2}} — status label (e.g. "activated")
 *
 * @param data - SubscriptionTemplateData
 * @returns TemplateComponent[] ready for the Meta API
 */
export function formatSubscription(
  data: SubscriptionTemplateData
): TemplateComponent[] {
  const statusLabels: Record<SubscriptionTemplateData["status"], string> = {
    activated: "activated",
    resumed: "resumed",
    upgraded: "upgraded",
    trial_started: "trial started",
  };
  return [bodyComponent([data.planName, statusLabels[data.status]])];
}
