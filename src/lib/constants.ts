// ─────────────────────────────────────────────
// Pulse AI — Constants
// ─────────────────────────────────────────────

import type { CategoryInfo, PlanDetails, Category, DigestFrequency } from "@/types";

// ── Categories (V1 scope) ──

export const CATEGORIES: CategoryInfo[] = [
  {
    id: "AI",
    label: "Artificial Intelligence",
    description: "LLMs, AI agents, foundation models, and breakthroughs",
    icon: "Brain",
    color: "hsl(262, 83%, 58%)", // Violet
  },
  {
    id: "STARTUPS",
    label: "Startups",
    description: "Launches, pivots, acquisitions, and builder stories",
    icon: "Rocket",
    color: "hsl(142, 71%, 45%)", // Green
  },
  {
    id: "FUNDING",
    label: "Funding",
    description: "Seed rounds, Series A-D, IPOs, and investor moves",
    icon: "TrendingUp",
    color: "hsl(38, 92%, 50%)", // Amber
  },
  {
    id: "DEVELOPER_TOOLS",
    label: "Developer Tools",
    description: "Frameworks, APIs, SDKs, and dev infrastructure",
    icon: "Code",
    color: "hsl(199, 89%, 48%)", // Blue
  },
  {
    id: "CYBERSECURITY",
    label: "Cybersecurity",
    description: "Threat intelligence, data protection, and enterprise security",
    icon: "Shield",
    color: "hsl(0, 72%, 51%)", // Red
  },
  {
    id: "BIG_TECH",
    label: "Big Tech",
    description: "NVIDIA, Microsoft, Google, Apple, Meta, and Amazon updates",
    icon: "Building2",
    color: "hsl(280, 67%, 44%)", // Purple
  },
  {
    id: "RESEARCH",
    label: "Research",
    description: "Academic papers, model benchmarks, and open-source models",
    icon: "GraduationCap",
    color: "hsl(174, 75%, 39%)", // Teal
  },
  {
    id: "PRODUCT_LAUNCHES",
    label: "Product Launches",
    description: "New AI tools, developer software, and SaaS platforms",
    icon: "Package",
    color: "hsl(316, 70%, 50%)", // Pink
  },
];

export const CATEGORY_MAP: Record<Category, CategoryInfo> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c])
) as Record<Category, CategoryInfo>;

// ── Subscription Plans ──

export const PLANS: PlanDetails[] = [
  {
    id: "FREE",
    name: "Free",
    price: 0,
    currency: "₹",
    interval: "forever",
    description: "Get started with daily intelligence",
    features: [
      "Dashboard access",
      "Personalized interests",
      "1 digest per day",
      "Last 7 days history",
      "Basic summaries",
    ],
    highlighted: false,
    cta: "Get Started",
  },
  {
    id: "PRO",
    name: "Pro",
    price: 299,
    currency: "₹",
    interval: "month",
    description: "For professionals who need real-time intelligence",
    features: [
      "Every 3-hour digest",
      "WhatsApp delivery",
      "Unlimited history",
      "Opportunity analysis",
      "Impact scoring",
      "Saved items",
    ],
    highlighted: true,
    cta: "Start Pro",
  },
  {
    id: "FOUNDER",
    name: "Founder",
    price: 999,
    currency: "₹",
    interval: "month",
    description: "For founders who need every edge",
    features: [
      "Instant alerts",
      "Funding notifications",
      "Startup launch alerts",
      "Competitor tracking",
      "Founder insights",
      "Advanced opportunity analysis",
    ],
    highlighted: false,
    cta: "Start Founder",
  },
];

export const PLAN_MAP: Record<string, PlanDetails> = Object.fromEntries(
  PLANS.map((p) => [p.id, p])
);

// ── Digest Frequencies ──

export const DIGEST_FREQUENCIES: {
  id: DigestFrequency;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    id: "DAILY",
    label: "Daily Digest",
    description: "One curated digest every morning at 9 AM",
    icon: "Sun",
  },
  {
    id: "MORNING",
    label: "Morning Digest",
    description: "One curated digest every morning at 8 AM",
    icon: "SunDim",
  },
  {
    id: "EVENING",
    label: "Evening Digest",
    description: "One curated digest every evening at 8 PM",
    icon: "Moon",
  },
  {
    id: "THREE_HOURLY",
    label: "Every 3 Hours",
    description: "Stay updated throughout the day",
    icon: "Clock",
  },
  {
    id: "INSTANT",
    label: "Instant Alerts",
    description: "Get notified when high-opportunity items drop",
    icon: "Zap",
  },
];

// ── Opportunity Score Config ──

export const SCORE_CONFIG = {
  colors: {
    exceptional: { min: 9, label: "Exceptional", color: "hsl(142, 71%, 45%)", emoji: "🔥" },
    high: { min: 7, label: "High", color: "hsl(38, 92%, 50%)", emoji: "⚡" },
    moderate: { min: 5, label: "Moderate", color: "hsl(199, 89%, 48%)", emoji: "📊" },
    low: { min: 3, label: "Low", color: "hsl(215, 14%, 50%)", emoji: "📎" },
    minimal: { min: 1, label: "Minimal", color: "hsl(215, 14%, 34%)", emoji: "—" },
  },
  getConfig(score: number) {
    if (score >= 9) return this.colors.exceptional;
    if (score >= 7) return this.colors.high;
    if (score >= 5) return this.colors.moderate;
    if (score >= 3) return this.colors.low;
    return this.colors.minimal;
  },
};

// ── App Config ──

export const APP_CONFIG = {
  name: "Pulse AI",
  tagline: "AI-powered founder intelligence delivered on WhatsApp",
  description:
    "Stop reading news. Start getting intelligence. Pulse AI monitors AI, startups, and funding — then delivers actionable opportunities to your WhatsApp.",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
};
