// ─────────────────────────────────────────────
// Pulse AI — WhatsApp Constants
// Single source of truth for all WA config
// ─────────────────────────────────────────────

import { WhatsAppConfigError } from "./types";

// ── Template Names (must match Meta-approved template names exactly) ──

export const WHATSAPP_TEMPLATES = {
  WELCOME: "pulse_welcome",
  DIGEST_READY: "pulse_digest_ready",
  SUBSCRIPTION_UPDATED: "pulse_subscription_up",
} as const;

export type WhatsAppTemplateName =
  (typeof WHATSAPP_TEMPLATES)[keyof typeof WHATSAPP_TEMPLATES];

// Type-safe set of all known template names for validation
export const KNOWN_TEMPLATE_NAMES = new Set<string>(
  Object.values(WHATSAPP_TEMPLATES)
);

// ── Environment Variable Accessors ───────────

/**
 * Validates and returns the WhatsApp Phone Number ID.
 * Throws a descriptive error on startup if missing.
 */
export function getPhoneNumberId(): string {
  const id = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!id) {
    throw new WhatsAppConfigError(
      "[WhatsApp] WHATSAPP_PHONE_NUMBER_ID is not configured. " +
        "Set this environment variable to your Meta Phone Number ID."
    );
  }
  return id;
}

/**
 * Validates and returns the WhatsApp Access Token.
 * Throws a descriptive error on startup if missing.
 */
export function getAccessToken(): string {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!token) {
    throw new WhatsAppConfigError(
      "[WhatsApp] WHATSAPP_ACCESS_TOKEN is not configured. " +
        "Set this environment variable to your Meta permanent access token."
    );
  }
  return token;
}

export const API_VERSION = process.env.WHATSAPP_API_VERSION ?? "v21.0";

// ── Retry Configuration ──────────────────────

/** Maximum number of retry attempts (not counting the first attempt) */
export const MAX_RETRIES = 3;

/** Retry delays in milliseconds: 30s, 2min, 5min */
export const RETRY_DELAYS_MS = [30_000, 120_000, 300_000] as const;

/** HTTP status codes that should trigger a retry */
export const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

/** HTTP status codes that should never be retried */
export const NON_RETRYABLE_STATUS_CODES = new Set([400, 401, 403, 404]);

// ── Request Configuration ────────────────────

/** HTTP timeout for Meta API requests (ms) */
export const REQUEST_TIMEOUT_MS = 10_000;

/** Default language code for all templates */
export const DEFAULT_LANGUAGE_CODE = "en_US";

// ── Meta Graph API Base URL ──────────────────

export function getMetaBaseUrl(): string {
  return `https://graph.facebook.com/${API_VERSION}/${getPhoneNumberId()}`;
}
