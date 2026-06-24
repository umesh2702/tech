"use client";

import { Badge } from "@/components/ui/badge";
import { ExternalLink, Bookmark, TrendingUp } from "lucide-react";
import { WhatsAppPreview } from "@/components/whatsapp-preview";
import { mockIntelligence } from "@/data/mock-intelligence";

export function IntelligencePreview() {
  return (
    <section className="py-24 sm:py-32 relative bg-muted/30 border-y" id="intelligence-preview">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-medium text-primary mb-3 uppercase tracking-wider">
            Intelligence Preview
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            This Is What You Get
          </h2>
          <p className="text-muted-foreground text-lg">
            Not just headlines — structured intelligence delivered straight to your WhatsApp and Dashboard.
          </p>
        </div>

        {/* Previews Container */}
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
          {/* Web Preview card */}
          <div className="w-full">
            <h3 className="text-center font-semibold text-muted-foreground mb-6">Web Dashboard Experience</h3>
            <div className="bg-card border rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-500">
              {/* Card header */}
              <div className="p-6 pb-0">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-pulse-violet/10 text-pulse-violet border-0 font-medium text-xs">
                      AI
                    </Badge>
                    <span className="text-xs text-muted-foreground">2 hours ago</span>
                  </div>

                  {/* Opportunity Score */}
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="2" className="text-border" />
                        <circle
                          cx="18" cy="18" r="15" fill="none"
                          stroke="var(--score-exceptional)"
                          strokeWidth="2.5"
                          strokeDasharray={`${(9 / 10) * 94.2} 94.2`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                        9
                      </span>
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-bold mb-4 leading-tight">
                  OpenAI Launches Codex as a Standalone Cloud-Based Coding Agent
                </h3>
              </div>

              {/* Analysis sections (Hierarchy updated) */}
              <div className="px-6 space-y-4 pb-4">
                <div className="bg-pulse-green/5 border border-pulse-green/20 rounded-xl p-4">
                  <p className="text-xs font-semibold text-pulse-green uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Opportunity
                  </p>
                  <p className="text-sm font-medium text-foreground/90 leading-relaxed">
                    Build AI-agent tooling: monitoring dashboards for autonomous code agents, quality assurance layers, or governance frameworks for enterprises. The &lsquo;DevOps for AI agents&rsquo; category is wide open.
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Why It Matters
                  </p>
                  <p className="text-sm text-foreground/90 leading-relaxed">
                    This shifts AI from code-assistant to code-author. Early-stage startups can now operate with smaller engineering teams, and agencies can dramatically increase output.
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    What Happened
                  </p>
                  <p className="text-sm text-foreground/90 leading-relaxed bg-muted/30 p-3 rounded-lg border border-border/50">
                    OpenAI released Codex as a cloud-based autonomous software engineering agent. Unlike Copilot which assists inline, Codex operates independently — it can read codebases, write features, fix bugs, and submit PRs.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* WhatsApp Preview */}
          <div className="w-full">
            <h3 className="text-center font-semibold text-muted-foreground mb-6">WhatsApp Delivery Experience</h3>
            <WhatsAppPreview items={mockIntelligence.slice(0, 2)} />
          </div>
        </div>
      </div>
    </section>
  );
}
