"use client";

import { Globe, Brain, MessageCircle } from "lucide-react";

const steps = [
  {
    icon: Globe,
    number: "01",
    title: "We Monitor Everything",
    description:
      "Pulse AI continuously scans 50+ sources — TechCrunch, Hacker News, Product Hunt, OpenAI, GitHub Trending, Y Combinator, and more.",
    color: "text-pulse-violet",
    bgColor: "bg-pulse-violet/10",
  },
  {
    icon: Brain,
    number: "02",
    title: "AI Finds Opportunities",
    description:
      "Our AI analyzes every story and answers three questions: What happened? Why does it matter? What's the opportunity for you?",
    color: "text-pulse-indigo",
    bgColor: "bg-pulse-indigo/10",
  },
  {
    icon: MessageCircle,
    number: "03",
    title: "Delivered on WhatsApp",
    description:
      "Receive personalized intelligence digests on WhatsApp — ranked by Opportunity Score. No app to download. No feed to check.",
    color: "text-pulse-green",
    bgColor: "bg-pulse-green/10",
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 sm:py-32 relative" id="how-it-works">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-medium text-primary mb-3 uppercase tracking-wider">
            How It Works
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            From Noise to Opportunity in 3 Steps
          </h2>
          <p className="text-muted-foreground text-lg">
            We do the research. AI finds the signal. You get the edge.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <div key={step.number} className="relative group">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[60%] w-[calc(100%-20%)] h-px bg-border" />
              )}

              <div className="relative bg-card border rounded-2xl p-8 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                {/* Step number */}
                <span className="text-xs font-mono text-muted-foreground/50 absolute top-4 right-4">
                  {step.number}
                </span>

                {/* Icon */}
                <div className={`${step.bgColor} w-14 h-14 rounded-xl flex items-center justify-center mb-6`}>
                  <step.icon className={`h-7 w-7 ${step.color}`} />
                </div>

                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
