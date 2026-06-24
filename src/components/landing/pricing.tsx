"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight } from "lucide-react";
import { PLANS } from "@/lib/constants";

export function Pricing() {
  return (
    <section className="py-24 sm:py-32 bg-muted/30 relative" id="pricing">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-medium text-primary mb-3 uppercase tracking-wider">
            Pricing
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Start Free. Scale When Ready.
          </h2>
          <p className="text-muted-foreground text-lg">
            Get daily intelligence free. Upgrade for real-time WhatsApp delivery and advanced opportunity analysis.
          </p>
        </div>

        {/* Plans grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-card rounded-2xl border p-8 flex flex-col transition-all duration-300 hover:-translate-y-1 ${
                plan.highlighted
                  ? "border-primary shadow-xl ring-1 ring-primary/20"
                  : "hover:shadow-lg"
              }`}
            >
              {plan.highlighted && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 gradient-primary text-white border-0 px-4">
                  Most Popular
                </Badge>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {plan.description}
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">
                    {plan.currency}{plan.price}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-muted-foreground text-sm">
                      /{plan.interval}
                    </span>
                  )}
                </div>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm">
                    <Check className="h-4 w-4 text-pulse-green mt-0.5 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link href="/login">
                <Button
                  className={`w-full ${
                    plan.highlighted
                      ? "gradient-primary text-white border-0 shadow-md"
                      : ""
                  }`}
                  variant={plan.highlighted ? "default" : "outline"}
                  size="lg"
                >
                  {plan.cta} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
