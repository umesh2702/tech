"use client";

import { Target, Zap, Shield, Clock, Bookmark, BarChart3, Brain, Layers } from "lucide-react";

const features = [
  {
    icon: Target,
    title: "Opportunity Analysis",
    description: "Every story analyzed for business opportunities. Know what to build, invest in, or prepare for.",
    color: "text-pulse-green",
    bgColor: "bg-pulse-green/10",
  },
  {
    icon: BarChart3,
    title: "Opportunity Scoring",
    description: "Each item scored 1-10 on business opportunity potential. Focus only on what matters most.",
    color: "text-pulse-amber",
    bgColor: "bg-pulse-amber/10",
  },
  {
    icon: Zap,
    title: "Instant WhatsApp Alerts",
    description: "High-scoring opportunities delivered instantly to your WhatsApp. Never miss a critical signal.",
    color: "text-pulse-violet",
    bgColor: "bg-pulse-violet/10",
  },
  {
    icon: Brain,
    title: "AI-Powered Analysis",
    description: "Every story answered: What happened? Why it matters? What's the opportunity? All by AI.",
    color: "text-pulse-indigo",
    bgColor: "bg-pulse-indigo/10",
  },
  {
    icon: Layers,
    title: "Noise Elimination",
    description: "Semantic deduplication ensures you see each story once. No repeated headlines, ever.",
    color: "text-pulse-blue",
    bgColor: "bg-pulse-blue/10",
  },
  {
    icon: Clock,
    title: "Flexible Digests",
    description: "Choose your rhythm: daily morning digest, every 3 hours, or instant alerts for high-value drops.",
    color: "text-pulse-green",
    bgColor: "bg-pulse-green/10",
  },
  {
    icon: Bookmark,
    title: "Save & Reference",
    description: "Bookmark intelligence items for later. Build your personal library of opportunities.",
    color: "text-pulse-amber",
    bgColor: "bg-pulse-amber/10",
  },
  {
    icon: Shield,
    title: "Founder-Grade Intel",
    description: "Built for founders, not journalists. Every insight framed through a business opportunity lens.",
    color: "text-pulse-violet",
    bgColor: "bg-pulse-violet/10",
  },
];

export function Features() {
  return (
    <section className="py-24 sm:py-32 bg-muted/30 relative" id="features">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-medium text-primary mb-3 uppercase tracking-wider">
            Features
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Intelligence, Not Information
          </h2>
          <p className="text-muted-foreground text-lg">
            Every feature is designed to surface opportunities, not just headlines.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-card border rounded-xl p-6 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 group"
            >
              <div className={`${feature.bgColor} w-11 h-11 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className={`h-5 w-5 ${feature.color}`} />
              </div>
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
