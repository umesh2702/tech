"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Zap, Brain, TrendingUp } from "lucide-react";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16" id="hero">
      {/* Background effects */}
      <div className="absolute inset-0 gradient-hero" />
      <div className="absolute inset-0 bg-dots opacity-50" />

      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-pulse-violet/10 blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-pulse-indigo/8 blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      <div className="absolute top-1/3 right-1/3 w-64 h-64 rounded-full bg-pulse-green/6 blur-3xl animate-float" style={{ animationDelay: "4s" }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="animate-fade-in mb-8">
            <Badge variant="secondary" className="px-4 py-1.5 text-sm font-medium gap-2 border border-border/50">
              <Zap className="h-3.5 w-3.5 text-pulse-amber" />
              AI-Powered Intelligence Platform
            </Badge>
          </div>

          {/* Headline */}
          <h1 className="animate-fade-in text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6" style={{ animationDelay: "100ms" }}>
            Stop Reading News.
            <br />
            <span className="text-gradient">Start Getting Intelligence.</span>
          </h1>

          {/* Subheadline */}
          <p className="animate-fade-in text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed" style={{ animationDelay: "200ms" }}>
            Pulse AI monitors AI, startups, and funding across the internet — then delivers{" "}
            <span className="text-foreground font-medium">actionable opportunities</span>{" "}
            directly to your WhatsApp.
          </p>

          {/* CTA buttons */}
          <div className="animate-fade-in flex flex-col sm:flex-row items-center justify-center gap-4 mb-16" style={{ animationDelay: "300ms" }}>
            <Link href="/login">
              <Button size="lg" className="gradient-primary text-white border-0 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] text-base px-8 h-12">
                Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button variant="outline" size="lg" className="text-base px-8 h-12">
                See How It Works
              </Button>
            </a>
          </div>

          {/* Stats */}
          <div className="animate-fade-in grid grid-cols-3 gap-8 max-w-lg mx-auto" style={{ animationDelay: "400ms" }}>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Brain className="h-4 w-4 text-pulse-violet" />
                <span className="text-2xl font-bold">50+</span>
              </div>
              <span className="text-xs text-muted-foreground">Sources Monitored</span>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <TrendingUp className="h-4 w-4 text-pulse-green" />
                <span className="text-2xl font-bold">24/7</span>
              </div>
              <span className="text-xs text-muted-foreground">Real-time Analysis</span>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Zap className="h-4 w-4 text-pulse-amber" />
                <span className="text-2xl font-bold">10s</span>
              </div>
              <span className="text-xs text-muted-foreground">To Your WhatsApp</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
