// ─────────────────────────────────────────────
// Pulse AI — WhatsApp Service Types
// Strict interfaces — zero `any` types allowed
// ─────────────────────────────────────────────

// ── Meta API Primitives ──────────────────────

export interface TemplateVariable {
  type: "text";
  text: string;
}

export interface TemplateButton {
  type: "reply" | "url";
  reply?: {
    id: string;
    title: string;
  };
  url?: string;
}

export interface TemplateComponent {
  type: "header" | "body" | "footer" | "button";
  parameters?: TemplateVariable[];
  buttons?: TemplateButton[];
  sub_type?: "quick_reply" | "url";
  index?: number;
}

// ── Request / Response ───────────────────────

export interface TemplateRequest {
  to: string;
  templateName: string;
  languageCode: string;
  components: TemplateComponent[];
}

export interface TemplateResponse {
  messageId: string;
  status: "sent" | "failed";
  rawResponse: unknown;
}

// ── Meta API Raw Response Shape ──────────────

export interface MetaApiMessage {
  id: string;
}

export interface MetaApiContact {
  input: string;
  wa_id: string;
}

export interface MetaApiSuccessResponse {
  messaging_product: "whatsapp";
  contacts: MetaApiContact[];
  messages: MetaApiMessage[];
}

export interface MetaApiError {
  message: string;
  type: string;
  code: number;
  error_data?: {
    messaging_product: string;
    details: string;
  };
  fbtrace_id?: string;
}

export interface MetaApiErrorResponse {
  error: MetaApiError;
}

// ── Typed Error Classes ──────────────────────

export class WhatsAppValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WhatsAppValidationError";
  }
}

export class WhatsAppApiError extends Error {
  public readonly statusCode: number;
  public readonly metaErrorCode: number | undefined;
  public readonly rawResponse: unknown;
  public readonly isRetryable: boolean;

  constructor(
    message: string,
    statusCode: number,
    rawResponse: unknown,
    isRetryable: boolean,
    metaErrorCode?: number
  ) {
    super(message);
    this.name = "WhatsAppApiError";
    this.statusCode = statusCode;
    this.metaErrorCode = metaErrorCode;
    this.rawResponse = rawResponse;
    this.isRetryable = isRetryable;
  }
}

export class WhatsAppConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WhatsAppConfigError";
  }
}

// ── Domain Data Interfaces ───────────────────

export interface WelcomeTemplateData {
  userName: string;
}

export interface DigestTemplateData {
  digestLabel: string;   // "Morning Digest", "Daily Digest", etc.
  itemCount: number;     // number of articles
  summary: string;       // AI-generated executive summary (truncated to ~150 chars)
  appUrl: string;        // link to dashboard
}

export interface SubscriptionTemplateData {
  planName: string;      // "Pro", "Founder", "Free"
  status: "activated" | "resumed" | "upgraded" | "trial_started";
}

export interface PreferencesTemplateData {
  topicsFormatted: string; // "AI, Startups, Funding"
}

// ── Delivery Log Extension ───────────────────

export interface DeliveryLogEntry {
  userId: string;
  phone: string;
  templateName: string;
  metaMessageId: string | null;
  status: "QUEUED" | "SENDING" | "SENT" | "FAILED";
  errorCode?: number;
  errorMessage?: string;
  rawResponse?: unknown;
  retryCount: number;
  createdAt: Date;
}
