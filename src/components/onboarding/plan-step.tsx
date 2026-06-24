"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, Sparkles } from "lucide-react";
import { PLANS } from "@/lib/constants";
import type { Plan } from "@/types";

interface PlanStepProps {
  selectedPlan: Plan;
  setSelectedPlan: (value: Plan) => void;
  onNext: () => void;
  onBack: () => void;
}

export function PlanStep({
  selectedPlan,
  setSelectedPlan,
  onNext,
  onBack,
}: PlanStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Choose Your Plan</h2>
        <p className="text-muted-foreground">
          Start free. Upgrade anytime for deeper intelligence.
        </p>
      </div>

      <div className="grid gap-4 max-w-lg mx-auto">
        {PLANS.map((plan) => {
          const isSelected = selectedPlan === plan.id;

          return (
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`relative w-full p-5 rounded-xl border-2 text-left transition-all duration-200 ${
                isSelected
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-primary/30"
              }`}
              id={`plan-${plan.id.toLowerCase()}`}
            >
              {plan.highlighted && (
                <Badge className="absolute -top-2.5 right-4 gradient-primary text-white border-0 text-xs px-3">
                  <Sparkles className="h-3 w-3 mr-1" /> Popular
                </Badge>
              )}

              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {plan.description}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold">
                    {plan.currency}{plan.price}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-xs text-muted-foreground">
                      /{plan.interval}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {plan.features.slice(0, 3).map((feature) => (
                  <span
                    key={feature}
                    className="flex items-center gap-1 text-xs text-muted-foreground"
                  >
                    <Check className="h-3 w-3 text-pulse-green" />
                    {feature}
                  </span>
                ))}
                {plan.features.length > 3 && (
                  <span className="text-xs text-muted-foreground">
                    +{plan.features.length - 3} more
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex gap-3 max-w-lg mx-auto">
        <Button variant="outline" onClick={onBack} size="lg" className="px-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button
          onClick={onNext}
          className="flex-1 gradient-primary text-white border-0"
          size="lg"
          id="plan-next-btn"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Launch My Dashboard
        </Button>
      </div>
    </div>
  );
}
