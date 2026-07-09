// ─────────────────────────────────────────────
// Pulse AI — WhatsApp Domain Senders
// High-level functions that combine formatter + sendTemplate
// These are the only functions imported by API routes and Inngest
// ─────────────────────────────────────────────

import { sendTemplate } from "./templates";
import {
  formatWelcome,
  formatDigest,
  formatSubscription,
} from "./formatter";
import { WHATSAPP_TEMPLATES } from "./constants";
import type {
  WelcomeTemplateData,
  DigestTemplateData,
  SubscriptionTemplateData,
} from "./types";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXTAUTH_URL ||
  "http://localhost:3000";

// ── Welcome ───────────────────────────────────

/**
 * Sends the `pulse_welcome` template.
 *
 * Trigger: User completes onboarding and has a verified WhatsApp number.
 *
 * @param userId  - Internal user ID (for logging)
 * @param phone   - WhatsApp phone number
 * @param userName - User's display name
 * @returns Meta message ID
 */
export async function sendWelcome(
  userId: string,
  phone: string,
  userName: string
): Promise<string> {
  const data: WelcomeTemplateData = { userName };
  const components = formatWelcome(data);
  return sendTemplate({
    userId,
    phone,
    template: WHATSAPP_TEMPLATES.WELCOME,
    components,
  });
}

// ── Digest Ready ──────────────────────────────

/**
 * Sends the `pulse_digest_ready` template.
 *
 * Trigger: Scheduler generates and queues a personalized digest.
 *
 * @param userId      - Internal user ID (for logging)
 * @param phone       - WhatsApp phone number
 * @param digestLabel - Human label: "Morning Digest", "Daily Digest", etc.
 * @param itemCount   - Number of articles in the digest
 * @param summary     - AI-generated executive summary (will be truncated to 150 chars)
 * @returns Meta message ID
 */
export async function sendDigest(
  userId: string,
  phone: string,
  digestLabel: string,
  itemCount: number,
  summary: string
): Promise<string> {
  const data: DigestTemplateData = {
    digestLabel,
    itemCount,
    summary,
    appUrl: APP_URL,
  };
  const components = formatDigest(data);
  return sendTemplate({
    userId,
    phone,
    template: WHATSAPP_TEMPLATES.DIGEST_READY,
    components,
  });
}

// ── Subscription Updated ──────────────────────

/**
 * Sends the `pulse_subscription_up` template.
 *
 * Trigger: Subscription is ACTIVATED, RESUMED, UPGRADED, or TRIAL STARTED.
 * Do NOT call for minor preference edits or frequency changes.
 *
 * @param userId   - Internal user ID (for logging)
 * @param phone    - WhatsApp phone number
 * @param planName - Plan name: "Pro", "Founder", "Free"
 * @param status   - One of: "activated" | "resumed" | "upgraded" | "trial_started"
 * @returns Meta message ID
 */
export async function sendSubscriptionUpdated(
  userId: string,
  phone: string,
  planName: string,
  status: SubscriptionTemplateData["status"]
): Promise<string> {
  const data: SubscriptionTemplateData = { planName, status };
  const components = formatSubscription(data);
  return sendTemplate({
    userId,
    phone,
    template: WHATSAPP_TEMPLATES.SUBSCRIPTION_UPDATED,
    components,
  });
}


