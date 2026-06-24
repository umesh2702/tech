// ─────────────────────────────────────────────
// Pulse AI — Core TypeScript Types
// ─────────────────────────────────────────────

// ── Enums (mirroring Prisma schema) ──

export type Category = "AI" | "STARTUPS" | "FUNDING" | "DEVELOPER_TOOLS";

export type DigestFrequency = "DAILY" | "THREE_HOURLY" | "INSTANT";

export type Plan = "FREE" | "PRO" | "FOUNDER";

export type SubscriptionStatus = "ACTIVE" | "PAST_DUE" | "CANCELLED" | "PAUSED";

export type AnalysisStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export type SourceType = "RSS" | "API" | "SCRAPER";

export type DeliveryStatus =
  | "QUEUED"
  | "SENDING"
  | "SENT"
  | "DELIVERED"
  | "READ"
  | "FAILED";

export type UserRole = "USER" | "ADMIN";

export type ScoreType = "OPPORTUNITY" | "FOUNDER_RELEVANCE";

// ── Core Entities ──

export interface IntelligenceItem {
  id: string;
  title: string;
  rawContent: string | null;
  sourceUrl: string;
  sourceName: string;
  sourceId: string | null;
  category: Category;
  tags: string[];
  imageUrl: string | null;
  publishedAt: string;
  collectedAt: string;

  // Opportunity Analysis (first-class)
  whatHappened: string | null;
  whyItMatters: string | null;
  opportunity: string | null;
  opportunityScore: number; // 1-10, THE key metric
  confidenceScore: number; // 0.0-1.0
  analysisStatus: AnalysisStatus;
  analyzedAt: string | null;

  // Extensible scores
  scores: Score[];

  // Relations
  savedByCurrentUser?: boolean;

  createdAt: string;
  updatedAt: string;
}

export interface Score {
  id: string;
  intelligenceItemId: string;
  type: ScoreType;
  value: number; // 1-10
  confidence: number; // 0.0-1.0
  metadata: Record<string, unknown> | null;
  generatedBy: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  preferences?: UserPreference;
  subscription?: Subscription;
}

export interface UserPreference {
  id: string;
  userId: string;
  whatsappNumber: string | null;
  whatsappVerified: boolean;
  interests: Category[];
  digestFrequency: DigestFrequency;
  timezone: string;
}

export interface Subscription {
  id: string;
  userId: string;
  plan: Plan;
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
}

export interface SavedItem {
  id: string;
  userId: string;
  intelligenceItemId: string;
  intelligenceItem: IntelligenceItem;
  createdAt: string;
}

export interface Source {
  id: string;
  name: string;
  url: string;
  type: SourceType;
  category: Category;
  enabled: boolean;
  lastFetchAt: string | null;
}

export interface DeliveryLog {
  id: string;
  userId: string;
  whatsappNumber: string;
  digestType: DigestFrequency;
  status: DeliveryStatus;
  messageId: string | null;
  errorMessage: string | null;
  retryCount: number;
  scheduledAt: string;
  sentAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  itemCount?: number;
}

export interface AdminPrompt {
  id: string;
  name: string;
  prompt: string;
  model: string;
  temperature: number;
  isActive: boolean;
  version: number;
}

// ── UI Types ──

export interface FeedFilters {
  category: Category | "ALL";
  minScore: number;
  sortBy: "score" | "date";
}

export interface OnboardingState {
  step: number;
  whatsappNumber: string;
  otpSent: boolean;
  otpVerified: boolean;
  interests: Category[];
  digestFrequency: DigestFrequency;
  selectedPlan: Plan;
}

export interface PlanDetails {
  id: Plan;
  name: string;
  price: number;
  currency: string;
  interval: string;
  description: string;
  features: string[];
  highlighted: boolean;
  cta: string;
}

export interface CategoryInfo {
  id: Category;
  label: string;
  description: string;
  icon: string;
  color: string;
}
