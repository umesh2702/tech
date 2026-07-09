// ─────────────────────────────────────────────
// Pulse AI — WhatsApp Template Registry
// Single place to register all approved templates.
// Adding a future template = one registry entry only.
// ─────────────────────────────────────────────

import {
  formatWelcome,
  formatDigest,
  formatSubscription,
} from "./formatter";

import { WHATSAPP_TEMPLATES, type WhatsAppTemplateName } from "./constants";

import type {
  TemplateComponent,
  WelcomeTemplateData,
  DigestTemplateData,
  SubscriptionTemplateData,
  PreferencesTemplateData,
} from "./types";

// ── Registry Types ────────────────────────────

type AnyTemplateData =
  | WelcomeTemplateData
  | DigestTemplateData
  | SubscriptionTemplateData
  | PreferencesTemplateData;

export interface TemplateRegistryEntry {
  /** The formatter function for this template */
  formatter: (data: AnyTemplateData) => TemplateComponent[];
  /** Human-readable description for logging and admin tools */
  description: string;
  /** Default language code for this template */
  language: string;
}

// ── Registry ─────────────────────────────────

/**
 * Central registry of all Meta-approved WhatsApp templates.
 *
 * To add a new template:
 * 1. Add the template name to WHATSAPP_TEMPLATES in constants.ts
 * 2. Create a data interface in types.ts
 * 3. Create a formatter function in formatter.ts
 * 4. Add one entry here
 *
 * No other files need modification.
 */
export const TEMPLATE_REGISTRY: Record<
  WhatsAppTemplateName,
  TemplateRegistryEntry
> = {
  [WHATSAPP_TEMPLATES.WELCOME]: {
    formatter: (data) => formatWelcome(data as WelcomeTemplateData),
    description: "Welcome message sent after onboarding completion",
    language: "en_US",
  },

  [WHATSAPP_TEMPLATES.DIGEST_READY]: {
    formatter: (data) => formatDigest(data as DigestTemplateData),
    description: "Personalized intelligence digest",
    language: "en_US",
  },

  [WHATSAPP_TEMPLATES.SUBSCRIPTION_UPDATED]: {
    formatter: (data) => formatSubscription(data as SubscriptionTemplateData),
    description:
      "Sent when subscription is activated, resumed, upgraded, or trial started",
    language: "en_US",
  },
};

/**
 * Looks up a registry entry by template name.
 * Throws if the template name is not recognised.
 */
export function getRegistryEntry(
  templateName: string
): TemplateRegistryEntry {
  const entry = TEMPLATE_REGISTRY[templateName as WhatsAppTemplateName];
  if (!entry) {
    throw new Error(
      `[WhatsApp] Unknown template: "${templateName}". ` +
        `Registered templates: ${Object.keys(TEMPLATE_REGISTRY).join(", ")}`
    );
  }
  return entry;
}
