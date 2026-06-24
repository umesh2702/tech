// ─────────────────────────────────────────────
// Pulse AI — Mock Intelligence Data
// 15+ realistic items across all 4 V1 categories
// ─────────────────────────────────────────────

import type { IntelligenceItem } from "@/types";

export const mockIntelligence: IntelligenceItem[] = [
  {
    id: "intel-001",
    title: "OpenAI Launches Codex as a Standalone Cloud-Based Coding Agent",
    rawContent: null,
    sourceUrl: "https://techcrunch.com/2025/05/16/openai-launches-codex",
    sourceName: "TechCrunch",
    sourceId: null,
    category: "AI",
    tags: ["openai", "codex", "ai-agents", "coding"],
    imageUrl: null,
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    collectedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
    whatHappened:
      "OpenAI released Codex as a cloud-based autonomous software engineering agent. Unlike Copilot which assists inline, Codex operates independently — it can read codebases, write features, fix bugs, and submit PRs with minimal human oversight. Available to ChatGPT Pro, Team, and Enterprise users.",
    whyItMatters:
      "This shifts AI from code-assistant to code-author. If Codex can reliably ship production code, it fundamentally changes the economics of software development. Early-stage startups can now operate with smaller engineering teams, and agencies can dramatically increase output per developer.",
    opportunity:
      "Build AI-agent tooling: monitoring dashboards for autonomous code agents, quality assurance layers, or governance frameworks for enterprises adopting agent-driven development. The 'DevOps for AI agents' category is wide open.",
    opportunityScore: 9,
    confidenceScore: 0.92,
    analysisStatus: "COMPLETED",
    analyzedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    scores: [],
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "intel-002",
    title: "Anthropic Raises $3.5B Series D at $61.5B Valuation",
    rawContent: null,
    sourceUrl: "https://techcrunch.com/2025/03/anthropic-series-d",
    sourceName: "TechCrunch",
    sourceId: null,
    category: "FUNDING",
    tags: ["anthropic", "series-d", "ai", "venture-capital"],
    imageUrl: null,
    publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    collectedAt: new Date(Date.now() - 4.5 * 60 * 60 * 1000).toISOString(),
    whatHappened:
      "Anthropic closed a $3.5 billion Series D round led by Lightspeed Venture Partners, valuing the company at $61.5 billion. The round included participation from Spark Capital, a]16z, and Google. Funds will accelerate Claude model development and enterprise safety research.",
    whyItMatters:
      "Anthropic is now the second most valuable AI startup globally, validating the 'safety-first AI' thesis. This signals that enterprise buyers are increasingly choosing safety-focused vendors over pure capability plays — a shift that affects how every AI startup should position itself.",
    opportunity:
      "Build enterprise AI safety & compliance tools. Companies adopting Claude need audit trails, content filtering, and risk monitoring. Create a SaaS layer that sits between Claude API and enterprise applications for governance.",
    opportunityScore: 8,
    confidenceScore: 0.88,
    analysisStatus: "COMPLETED",
    analyzedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    scores: [],
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "intel-003",
    title: "Y Combinator W25 Batch: 67% of Startups Are AI-Native",
    rawContent: null,
    sourceUrl: "https://ycombinator.com/blog/w25-batch-stats",
    sourceName: "Y Combinator",
    sourceId: null,
    category: "STARTUPS",
    tags: ["yc", "batch", "ai-native", "startups"],
    imageUrl: null,
    publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    collectedAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
    whatHappened:
      "Y Combinator's Winter 2025 batch had a record 67% of startups building AI-native products. Key verticals: vertical AI agents (23%), developer tools (18%), and AI infrastructure (14%). Notably, 12 startups were solo founders using AI to build products previously requiring teams of 5+.",
    whyItMatters:
      "YC batches are leading indicators of where startup energy is flowing. The dominance of AI-native companies suggests that non-AI startups will increasingly struggle to raise funding. Solo founders using AI to replace teams signals a fundamental shift in company formation.",
    opportunity:
      "Target the 'AI-native solo founder' stack: tools for one-person companies leveraging AI — project management, customer support, billing, and compliance tools designed for the solo-AI-founder workflow.",
    opportunityScore: 8,
    confidenceScore: 0.85,
    analysisStatus: "COMPLETED",
    analyzedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    scores: [],
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "intel-004",
    title: "Vercel Ships Next.js 15.3 with Turbopack as Default Bundler",
    rawContent: null,
    sourceUrl: "https://nextjs.org/blog/next-15-3",
    sourceName: "Next.js Blog",
    sourceId: null,
    category: "DEVELOPER_TOOLS",
    tags: ["nextjs", "vercel", "turbopack", "web-development"],
    imageUrl: null,
    publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    collectedAt: new Date(Date.now() - 11 * 60 * 60 * 1000).toISOString(),
    whatHappened:
      "Vercel released Next.js 15.3 making Turbopack the default bundler for both development and production builds. Build times are 4-8x faster than Webpack. The release also introduces native support for React Server Components streaming and improved ISR caching.",
    whyItMatters:
      "Turbopack becoming the default signals the end of the Webpack era for Next.js projects. Faster builds directly translate to faster shipping cycles. Teams previously blocked by 10-minute builds can now iterate in seconds.",
    opportunity:
      "Create migration tooling for Webpack-to-Turbopack transitions in enterprise Next.js codebases. Large companies with custom Webpack configs will need automated migration paths.",
    opportunityScore: 6,
    confidenceScore: 0.82,
    analysisStatus: "COMPLETED",
    analyzedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    scores: [],
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "intel-005",
    title: "Google DeepMind Unveils Gemini 2.5 Pro with Native Tool Use",
    rawContent: null,
    sourceUrl: "https://deepmind.google/blog/gemini-2-5-pro",
    sourceName: "Google DeepMind",
    sourceId: null,
    category: "AI",
    tags: ["google", "deepmind", "gemini", "tool-use"],
    imageUrl: null,
    publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    collectedAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(),
    whatHappened:
      "Google DeepMind launched Gemini 2.5 Pro with native multi-tool orchestration — the model can autonomously chain together search, code execution, image generation, and API calls without explicit prompting. Available via Vertex AI and Google AI Studio.",
    whyItMatters:
      "Native tool use eliminates the need for complex agent frameworks like LangChain for many use cases. Developers can build sophisticated AI agents with a single API call instead of orchestrating multiple tools manually. This commoditizes the 'agent framework' layer.",
    opportunity:
      "Build vertical AI agents using Gemini's native tool use for specific industries — legal document analysis, real estate research, or financial compliance. The framework layer is now free; the value is in domain-specific workflow automation.",
    opportunityScore: 9,
    confidenceScore: 0.90,
    analysisStatus: "COMPLETED",
    analyzedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    scores: [],
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "intel-006",
    title: "Zerodha-Backed Smallcase Raises $50M Series C for Wealth Tech Expansion",
    rawContent: null,
    sourceUrl: "https://inc42.com/buzz/smallcase-series-c",
    sourceName: "Inc42",
    sourceId: null,
    category: "FUNDING",
    tags: ["smallcase", "fintech", "india", "series-c"],
    imageUrl: null,
    publishedAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    collectedAt: new Date(Date.now() - 17 * 60 * 60 * 1000).toISOString(),
    whatHappened:
      "Smallcase, the thematic investing platform backed by Zerodha, raised $50M in Series C led by Faering Capital and Premji Invest. The platform now has 7M+ users and 300+ registered investment advisors creating portfolio products.",
    whyItMatters:
      "Smallcase proved that embedded investing infrastructure can scale in India. The RIA (Registered Investment Advisor) marketplace model is creating a new distribution channel for financial products, bypassing traditional mutual fund distributors.",
    opportunity:
      "Build AI-powered investment research tools for RIAs on the Smallcase platform. With 300+ advisors creating products, there's demand for automated portfolio analysis, risk assessment, and market intelligence specifically formatted for smallcase creation.",
    opportunityScore: 7,
    confidenceScore: 0.80,
    analysisStatus: "COMPLETED",
    analyzedAt: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(),
    scores: [],
    createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "intel-007",
    title: "Supabase Launches Supabase Cron: Serverless Scheduled Jobs",
    rawContent: null,
    sourceUrl: "https://supabase.com/blog/supabase-cron",
    sourceName: "Supabase",
    sourceId: null,
    category: "DEVELOPER_TOOLS",
    tags: ["supabase", "cron", "serverless", "backend"],
    imageUrl: null,
    publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    collectedAt: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
    whatHappened:
      "Supabase released a native cron job scheduler built directly into the platform. Developers can schedule database functions, Edge Functions, and HTTP webhooks using standard cron syntax — eliminating the need for external scheduling services.",
    whyItMatters:
      "This fills one of the biggest gaps in serverless architectures. Previously, developers needed external services like Inngest, Trigger.dev, or custom solutions for scheduled tasks. Supabase bundling this means the 'serverless backend' is becoming truly complete.",
    opportunity:
      "If you're building a SaaS on Supabase, migrate from paid scheduling services to this free built-in option. For tool builders: create monitoring and observability layers for Supabase Cron jobs — error tracking, retry management, and execution analytics.",
    opportunityScore: 5,
    confidenceScore: 0.78,
    analysisStatus: "COMPLETED",
    analyzedAt: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
    scores: [],
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "intel-008",
    title: "Meta Releases Llama 4 Scout and Maverick Models",
    rawContent: null,
    sourceUrl: "https://ai.meta.com/blog/llama-4-scout-maverick",
    sourceName: "Meta AI",
    sourceId: null,
    category: "AI",
    tags: ["meta", "llama", "open-source", "llm"],
    imageUrl: null,
    publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    collectedAt: new Date(Date.now() - 5.5 * 60 * 60 * 1000).toISOString(),
    whatHappened:
      "Meta released Llama 4 Scout (17B active params, 109B total with MoE) and Llama 4 Maverick (17B active, 400B total). Scout fits in a single H100 GPU while matching GPT-4o on benchmarks. Maverick achieves state-of-the-art on coding and reasoning tasks. Both are open-weight under Llama Community License.",
    whyItMatters:
      "Open-weight models matching proprietary frontier models means startups can now self-host GPT-4o-level capabilities. This dramatically changes unit economics for AI startups — no more per-token API costs for inference. The value chain shifts from model providers to application builders.",
    opportunity:
      "Build managed hosting platforms for Llama 4 models targeting mid-market companies. Offer fine-tuning, deployment, and monitoring as a service. Companies want GPT-4o quality without sending data to OpenAI — Llama 4 makes this viable.",
    opportunityScore: 10,
    confidenceScore: 0.95,
    analysisStatus: "COMPLETED",
    analyzedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    scores: [],
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "intel-009",
    title: "Product Hunt: AI-Powered Legal Contract Review Tool Raises $8M Seed",
    rawContent: null,
    sourceUrl: "https://producthunt.com/posts/legalai-review",
    sourceName: "Product Hunt",
    sourceId: null,
    category: "STARTUPS",
    tags: ["legaltech", "ai", "seed-funding", "product-hunt"],
    imageUrl: null,
    publishedAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    collectedAt: new Date(Date.now() - 35 * 60 * 60 * 1000).toISOString(),
    whatHappened:
      "LegalAI, a startup automating contract review for SMBs, launched on Product Hunt and simultaneously announced an $8M seed round led by Sequoia Scout. The tool reviews NDAs, service agreements, and employment contracts in under 60 seconds with AI-generated risk summaries.",
    whyItMatters:
      "Legal tech for SMBs has been notoriously hard to crack due to trust barriers. LegalAI's approach of 'risk summary' rather than 'legal advice' cleverly sidesteps regulatory issues while delivering clear value. This could unlock the massive SMB legal services market.",
    opportunity:
      "Apply the same 'AI risk summary' pattern to other professional services: accounting document review, insurance policy analysis, or compliance audits. The model of 'AI-assisted professional review' works wherever expert review creates bottlenecks.",
    opportunityScore: 7,
    confidenceScore: 0.75,
    analysisStatus: "COMPLETED",
    analyzedAt: new Date(Date.now() - 34 * 60 * 60 * 1000).toISOString(),
    scores: [],
    createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 34 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "intel-010",
    title: "Cursor IDE Hits $100M ARR in 18 Months, Fastest Developer Tool Growth",
    rawContent: null,
    sourceUrl: "https://theverge.com/2025/cursor-100m-arr",
    sourceName: "The Verge",
    sourceId: null,
    category: "DEVELOPER_TOOLS",
    tags: ["cursor", "ide", "ai-coding", "developer-tools"],
    imageUrl: null,
    publishedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    collectedAt: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(),
    whatHappened:
      "Anysphere's Cursor IDE reached $100M annual recurring revenue in just 18 months — the fastest growth in developer tool history. The AI-powered code editor now has over 1M paying subscribers. Key growth driver: the Tab completion feature that predicts multi-line code changes.",
    whyItMatters:
      "Cursor's growth proves developers will pay premium prices ($20/mo) for AI-augmented workflows. This validates the entire 'AI-enhanced professional tools' category and suggests similar opportunities exist in design, writing, data analysis, and other knowledge work.",
    opportunity:
      "Build 'Cursor for X' — AI-augmented professional tools for specific domains. The highest-value targets are professions where context-aware AI can predict next actions: financial analysts, data scientists, DevOps engineers, and technical writers.",
    opportunityScore: 8,
    confidenceScore: 0.88,
    analysisStatus: "COMPLETED",
    analyzedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    scores: [],
    createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "intel-011",
    title: "India's AI Startup Funding Hits Record $2.8B in Q1 2025",
    rawContent: null,
    sourceUrl: "https://inc42.com/datalab/india-ai-funding-q1-2025",
    sourceName: "Inc42",
    sourceId: null,
    category: "FUNDING",
    tags: ["india", "ai", "funding", "quarterly-report"],
    imageUrl: null,
    publishedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    collectedAt: new Date(Date.now() - 47 * 60 * 60 * 1000).toISOString(),
    whatHappened:
      "Indian AI startups raised a record $2.8 billion across 156 deals in Q1 2025, a 3.2x increase from Q1 2024. Top sectors: enterprise AI (42%), AI infrastructure (28%), and vertical AI applications (19%). Bangalore led with 58% of deals, followed by Delhi NCR at 22%.",
    whyItMatters:
      "India is emerging as the third-largest AI startup ecosystem after the US and China. The concentration in enterprise AI suggests Indian startups are targeting the $50B+ enterprise software market with AI-native solutions rather than competing on foundational model development.",
    opportunity:
      "Build India-focused AI startup intelligence tools: investor matching platforms, co-founder discovery networks, or India-specific AI benchmarking services. The ecosystem is large enough to support dedicated infrastructure but underserved compared to Silicon Valley.",
    opportunityScore: 7,
    confidenceScore: 0.83,
    analysisStatus: "COMPLETED",
    analyzedAt: new Date(Date.now() - 46 * 60 * 60 * 1000).toISOString(),
    scores: [],
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 46 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "intel-012",
    title: "Mistral AI Launches 'Le Chat Enterprise' with On-Premise Deployment",
    rawContent: null,
    sourceUrl: "https://mistral.ai/news/le-chat-enterprise",
    sourceName: "Mistral AI",
    sourceId: null,
    category: "AI",
    tags: ["mistral", "enterprise", "on-premise", "europe"],
    imageUrl: null,
    publishedAt: new Date(Date.now() - 15 * 60 * 60 * 1000).toISOString(),
    collectedAt: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
    whatHappened:
      "Mistral AI launched Le Chat Enterprise, an on-premise AI assistant designed for European companies with strict data sovereignty requirements. The product includes Mistral Large 2, fine-tuning capabilities, and full GDPR compliance tools — all running within the customer's own infrastructure.",
    whyItMatters:
      "Data sovereignty is becoming the defining competitive axis in enterprise AI. European companies can't use US-hosted AI due to GDPR and Schrems II. Mistral is capturing this massive market that OpenAI and Anthropic structurally cannot serve with cloud-only offerings.",
    opportunity:
      "Build GDPR-compliant AI middleware for the European enterprise market. Create data anonymization layers, consent management for AI training, and audit tools that let European companies use AI while maintaining regulatory compliance.",
    opportunityScore: 6,
    confidenceScore: 0.79,
    analysisStatus: "COMPLETED",
    analyzedAt: new Date(Date.now() - 13 * 60 * 60 * 1000).toISOString(),
    scores: [],
    createdAt: new Date(Date.now() - 15 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 13 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "intel-013",
    title: "GitHub Launches Copilot Workspace: AI-Driven Issue-to-PR Pipeline",
    rawContent: null,
    sourceUrl: "https://github.blog/copilot-workspace-ga",
    sourceName: "GitHub",
    sourceId: null,
    category: "DEVELOPER_TOOLS",
    tags: ["github", "copilot", "workspace", "ai-coding"],
    imageUrl: null,
    publishedAt: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
    collectedAt: new Date(Date.now() - 29 * 60 * 60 * 1000).toISOString(),
    whatHappened:
      "GitHub Copilot Workspace is now generally available. Given a GitHub Issue, Workspace generates a plan, implements code changes across multiple files, writes tests, and opens a Pull Request — all with human review at each step. Integrated directly into the GitHub flow.",
    whyItMatters:
      "This turns GitHub Issues into executable specifications. Product managers can write requirements and get working code without writing technical specs. The boundary between 'product' and 'engineering' roles blurs further, potentially reshaping team structures at every software company.",
    opportunity:
      "Build specialized 'issue template' libraries optimized for Copilot Workspace. Create frameworks that help product teams write issues that generate better AI code. Also: build QA automation that validates Workspace-generated PRs before human review.",
    opportunityScore: 7,
    confidenceScore: 0.84,
    analysisStatus: "COMPLETED",
    analyzedAt: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString(),
    scores: [],
    createdAt: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "intel-014",
    title: "Razorpay Acquires AI-First Fintech Startup for $45M to Build 'CFO Copilot'",
    rawContent: null,
    sourceUrl: "https://yourstory.com/2025/razorpay-acquires-ai-fintech",
    sourceName: "YourStory",
    sourceId: null,
    category: "STARTUPS",
    tags: ["razorpay", "acquisition", "fintech", "india"],
    imageUrl: null,
    publishedAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
    collectedAt: new Date(Date.now() - 19 * 60 * 60 * 1000).toISOString(),
    whatHappened:
      "Razorpay acquired an AI-first fintech startup for $45M to accelerate its 'CFO Copilot' product — an AI assistant for SMB financial operations. The product automates invoice processing, cash flow forecasting, and tax compliance using transaction data from Razorpay's payment infrastructure.",
    whyItMatters:
      "Razorpay is evolving from payments to financial intelligence, leveraging its massive transaction dataset. This signals that payment companies will increasingly use AI to move up the value chain from infrastructure to intelligence — a pattern that could reshape Indian fintech.",
    opportunity:
      "Build vertical AI copilots for specific business functions using payment/transaction data. The 'CFO Copilot' pattern can be replicated for marketing (spend analysis), operations (vendor management), and HR (payroll optimization).",
    opportunityScore: 8,
    confidenceScore: 0.81,
    analysisStatus: "COMPLETED",
    analyzedAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    scores: [],
    createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "intel-015",
    title: "Hacker News: Open-Source AI Agent Framework 'CrewAI' Hits 50K GitHub Stars",
    rawContent: null,
    sourceUrl: "https://news.ycombinator.com/item?id=crewai-50k",
    sourceName: "Hacker News",
    sourceId: null,
    category: "AI",
    tags: ["crewai", "open-source", "ai-agents", "framework"],
    imageUrl: null,
    publishedAt: new Date(Date.now() - 40 * 60 * 60 * 1000).toISOString(),
    collectedAt: new Date(Date.now() - 39 * 60 * 60 * 1000).toISOString(),
    whatHappened:
      "CrewAI, the open-source multi-agent orchestration framework, crossed 50K GitHub stars. The framework lets developers define AI 'crews' with specialized roles (researcher, writer, analyst) that collaborate on complex tasks. New features include native tool integration and memory persistence.",
    whyItMatters:
      "Multi-agent systems are moving from research to production. 50K stars indicates massive developer adoption, suggesting agent-based architectures will become the default pattern for complex AI applications — similar to how microservices became the default for web backends.",
    opportunity:
      "Build production infrastructure for multi-agent systems: monitoring (which agent did what), cost tracking (per-agent API costs), debugging tools (agent conversation replay), and marketplace for pre-built agent 'crews' for common business tasks.",
    opportunityScore: 7,
    confidenceScore: 0.82,
    analysisStatus: "COMPLETED",
    analyzedAt: new Date(Date.now() - 38 * 60 * 60 * 1000).toISOString(),
    scores: [],
    createdAt: new Date(Date.now() - 40 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 38 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "intel-016",
    title: "Stripe Launches AI-Powered Revenue Recognition for SaaS Companies",
    rawContent: null,
    sourceUrl: "https://stripe.com/blog/ai-revenue-recognition",
    sourceName: "Stripe",
    sourceId: null,
    category: "STARTUPS",
    tags: ["stripe", "saas", "revenue-recognition", "fintech"],
    imageUrl: null,
    publishedAt: new Date(Date.now() - 55 * 60 * 60 * 1000).toISOString(),
    collectedAt: new Date(Date.now() - 54 * 60 * 60 * 1000).toISOString(),
    whatHappened:
      "Stripe launched Revenue Recognition AI, automating ASC 606 compliance for SaaS companies. The tool analyzes billing data, identifies performance obligations, and generates audit-ready schedules. Integrated directly into Stripe Billing and available to Stripe Atlas companies at no extra cost.",
    whyItMatters:
      "Revenue recognition is one of the biggest pain points for growing SaaS companies — it typically requires expensive accounting firms or dedicated finance hires. Stripe offering this free to Atlas companies makes it dramatically easier (and cheaper) to be a properly-compliant SaaS startup.",
    opportunity:
      "Build complementary financial tools for Stripe Atlas companies: cap table management, 409A valuations, and board reporting — all integrated with Stripe's data. The Atlas ecosystem is a concentrated, high-intent audience of funded SaaS founders.",
    opportunityScore: 6,
    confidenceScore: 0.77,
    analysisStatus: "COMPLETED",
    analyzedAt: new Date(Date.now() - 53 * 60 * 60 * 1000).toISOString(),
    scores: [],
    createdAt: new Date(Date.now() - 55 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 53 * 60 * 60 * 1000).toISOString(),
  },
];

// ── Helper: Get items by category ──
export function getItemsByCategory(category: string) {
  if (category === "ALL") return mockIntelligence;
  return mockIntelligence.filter((item) => item.category === category);
}

// ── Helper: Get items sorted by opportunity score ──
export function getItemsByScore(minScore = 0) {
  return mockIntelligence
    .filter((item) => item.opportunityScore >= minScore)
    .sort((a, b) => b.opportunityScore - a.opportunityScore);
}

// ── Helper: Get top opportunities ──
export function getTopOpportunities(count = 5) {
  return getItemsByScore().slice(0, count);
}
