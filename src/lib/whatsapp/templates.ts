// ─────────────────────────────────────────────
// Pulse AI — WhatsApp Generic Template Sender
// Single responsibility: validate, call Meta, log, return messageId
// No business logic. No domain data transformations.
// ─────────────────────────────────────────────

import { sendTemplateRequest } from "./client";
import { DEFAULT_LANGUAGE_CODE, KNOWN_TEMPLATE_NAMES } from "./constants";
import { WhatsAppValidationError, WhatsAppApiError } from "./types";
import type { TemplateComponent } from "./types";
import type { WhatsAppTemplateName } from "./constants";

// ── Phone Validation ──────────────────────────

/**
 * E.164 phone number regex (digits only after normalisation).
 * Accepts: +918121693113, 918121693113, +12025551234
 * Rejects: abc, 123, "", "0"
 */
const E164_REGEX = /^[1-9]\d{6,14}$/;

/**
 * Normalises a phone number to digits-only (strips +, spaces, dashes).
 * Meta requires digits-only in the `to` field.
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

/**
 * Validates a phone number after normalisation.
 * @throws WhatsAppValidationError if the number is invalid.
 */
export function validatePhone(phone: string): string {
  const normalized = normalizePhone(phone);
  if (!E164_REGEX.test(normalized)) {
    throw new WhatsAppValidationError(
      `[WhatsApp] Invalid phone number: "${phone}". ` +
        `Expected E.164 format with country code (e.g. 918121693113 or +918121693113).`
    );
  }
  return normalized;
}

// ── Structured Log ────────────────────────────

function logSend(
  template: string,
  phone: string,
  messageId: string | null,
  status: "SENT" | "FAILED",
  latencyMs: number,
  errorMessage?: string
): void {
  const parts: string[] = [
    `[WhatsApp]`,
    `Template: ${template}`,
    `Phone: +${phone}`,
    messageId ? `Meta Message ID: ${messageId}` : "",
    `Status: ${status}`,
    `Latency: ${latencyMs}ms`,
    errorMessage ? `Error: ${errorMessage}` : "",
  ].filter(Boolean);

  if (status === "SENT") {
    console.log(parts.join(" | "));
  } else {
    console.error(parts.join(" | "));
  }
}

// ── Options ───────────────────────────────────

export interface SendTemplateOptions {
  /** Internal user ID for logging/DB association */
  userId: string;
  /** Destination phone number (E.164 or digits-only) */
  phone: string;
  /** Meta-approved template name */
  template: WhatsAppTemplateName;
  /** Pre-built component array from formatter */
  components: TemplateComponent[];
  /** BCP-47 language code (default: en_US) */
  language?: string;
}

// ── Generic Sender ────────────────────────────

/**
 * Generic WhatsApp template sender.
 *
 * Responsibilities:
 * 1. Validate phone number (E.164)
 * 2. Validate template name is registered
 * 3. Call Meta API via sendTemplateRequest()
 * 4. Emit structured log
 * 5. Return Meta message ID
 * 6. Throw typed errors — never silently fail
 *
 * @returns Meta message ID (wamid.xxx)
 * @throws WhatsAppValidationError for invalid inputs
 * @throws WhatsAppApiError for Meta API failures
 * @throws WhatsAppConfigError for missing env vars
 */
export async function sendTemplate(
  opts: SendTemplateOptions
): Promise<string> {
  const { userId, template, components, language = DEFAULT_LANGUAGE_CODE } =
    opts;

  // 1. Validate phone
  const normalizedPhone = validatePhone(opts.phone);

  // 2. Validate template name
  if (!KNOWN_TEMPLATE_NAMES.has(template)) {
    throw new WhatsAppValidationError(
      `[WhatsApp] Unknown template name: "${template}". ` +
        `Registered templates: ${Array.from(KNOWN_TEMPLATE_NAMES).join(", ")}`
    );
  }

  // 3. Validate components not empty
  if (!components || components.length === 0) {
    throw new WhatsAppValidationError(
      `[WhatsApp] Template "${template}" was called with empty components. ` +
        `Ensure the formatter returns at least one component.`
    );
  }

  const startTime = Date.now();
  let messageId: string | null = null;

  try {
    const response = await sendTemplateRequest({
      to: normalizedPhone,
      templateName: template,
      languageCode: language,
      components,
    });

    messageId = response.messageId;
    const latencyMs = Date.now() - startTime;

    logSend(template, normalizedPhone, messageId, "SENT", latencyMs);

    return messageId;
  } catch (err) {
    const latencyMs = Date.now() - startTime;
    const errorMessage =
      err instanceof Error ? err.message : "Unknown error";

    logSend(template, normalizedPhone, null, "FAILED", latencyMs, errorMessage);

    // Re-throw typed errors as-is
    if (
      err instanceof WhatsAppApiError ||
      err instanceof WhatsAppValidationError
    ) {
      throw err;
    }

    // Wrap unknown errors
    throw new WhatsAppApiError(
      `[WhatsApp] Unexpected error sending template "${template}" to +${normalizedPhone}: ${errorMessage}`,
      0,
      null,
      true
    );
  }
}
