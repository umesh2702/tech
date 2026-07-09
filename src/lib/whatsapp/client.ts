// ─────────────────────────────────────────────
// Pulse AI — WhatsApp HTTP Client
// Singleton fetch-based Meta API client
// Single Responsibility: HTTP only, no business logic
// ─────────────────────────────────────────────

import {
  getAccessToken,
  getMetaBaseUrl,
  REQUEST_TIMEOUT_MS,
  RETRYABLE_STATUS_CODES,
  NON_RETRYABLE_STATUS_CODES,
} from "./constants";

import type {
  TemplateRequest,
  TemplateResponse,
  MetaApiSuccessResponse,
  MetaApiErrorResponse,
} from "./types";

import { WhatsAppApiError } from "./types";

// ── Singleton HTTP Client State ───────────────

let _baseUrl: string | null = null;
let _token: string | null = null;

/**
 * Initialises the singleton client config on first use.
 * Throws WhatsAppConfigError if env vars are missing.
 */
function getClientConfig(): { baseUrl: string; token: string } {
  if (!_baseUrl || !_token) {
    _baseUrl = getMetaBaseUrl();
    _token = getAccessToken();
  }
  return { baseUrl: _baseUrl, token: _token };
}

/**
 * Builds the standard authorization headers required by Meta Graph API.
 */
function buildHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json; charset=utf-8",
  };
}

/**
 * Sends a WhatsApp template message via the Meta Cloud API.
 *
 * This is the ONLY function that makes HTTP calls in the WhatsApp service.
 * All business logic, formatting, and logging must happen in calling layers.
 *
 * @param request - Template request payload
 * @returns Parsed TemplateResponse with messageId
 * @throws WhatsAppApiError for Meta API failures
 * @throws WhatsAppConfigError for missing configuration
 */
export async function sendTemplateRequest(
  request: TemplateRequest
): Promise<TemplateResponse> {
  const { baseUrl, token } = getClientConfig();

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: request.to,
    type: "template",
    template: {
      name: request.templateName,
      language: {
        code: request.languageCode,
      },
      components: request.components,
    },
  };

  // 10-second timeout via AbortController
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let rawData: MetaApiSuccessResponse | MetaApiErrorResponse;
  let httpStatus: number;

  try {
    const response = await fetch(`${baseUrl}/messages`, {
      method: "POST",
      headers: buildHeaders(token),
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    httpStatus = response.status;
    rawData = (await response.json()) as
      | MetaApiSuccessResponse
      | MetaApiErrorResponse;

    if (!response.ok) {
      const errorData = rawData as MetaApiErrorResponse;
      const metaMessage =
        errorData?.error?.message ?? "Unknown Meta API error";
      const metaCode = errorData?.error?.code;
      const isRetryable = RETRYABLE_STATUS_CODES.has(httpStatus);

      throw new WhatsAppApiError(
        `[WhatsApp] Meta API returned ${httpStatus}: ${metaMessage}`,
        httpStatus,
        rawData,
        isRetryable,
        metaCode
      );
    }
  } catch (err) {
    clearTimeout(timeoutId);

    if (err instanceof WhatsAppApiError) throw err;

    // Network/timeout errors are retryable
    if (err instanceof Error && err.name === "AbortError") {
      throw new WhatsAppApiError(
        `[WhatsApp] Request timed out after ${REQUEST_TIMEOUT_MS}ms`,
        0,
        null,
        true
      );
    }

    throw new WhatsAppApiError(
      `[WhatsApp] Network error: ${err instanceof Error ? err.message : String(err)}`,
      0,
      null,
      true
    );
  } finally {
    clearTimeout(timeoutId);
  }

  const successData = rawData as MetaApiSuccessResponse;
  const messageId = successData.messages?.[0]?.id ?? "";

  return {
    messageId,
    status: "sent",
    rawResponse: rawData,
  };
}

/**
 * Determines if a given HTTP status code is retryable according to the strategy.
 */
export function isRetryableStatus(statusCode: number): boolean {
  if (RETRYABLE_STATUS_CODES.has(statusCode)) return true;
  if (NON_RETRYABLE_STATUS_CODES.has(statusCode)) return false;
  // Unknown status codes: do not retry by default
  return false;
}
