"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Sun, Clock, Zap } from "lucide-react";
import { DIGEST_FREQUENCIES } from "@/lib/constants";
import type { DigestFrequency } from "@/types";

const iconMap: Record<string, React.ElementType> = { Sun, Clock, Zap };

interface FrequencyStepProps {
  frequency: DigestFrequency;
  setFrequency: (value: DigestFrequency) => void;
  onNext: () => void;
  onBack: () => void;
}

export function FrequencyStep({
  frequency,
  setFrequency,
  onNext,
  onBack,
}: FrequencyStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Choose Your Rhythm</h2>
        <p className="text-muted-foreground">
          How often should we deliver intelligence to your WhatsApp?
        </p>
      </div>

      <div className="space-y-3 max-w-md mx-auto">
        {DIGEST_FREQUENCIES.map((freq) => {
          const Icon = iconMap[freq.icon] || Clock;
          const isSelected = frequency === freq.id;

          return (
            <button
              key={freq.id}
              onClick={() => setFrequency(freq.id)}
              className={`w-full flex items-center gap-4 p-5 rounded-xl border-2 text-left transition-all duration-200 ${
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30"
              }`}
              id={`frequency-${freq.id.toLowerCase()}`}
            >
              <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${
                isSelected ? "bg-primary/10" : "bg-muted"
              }`}>
                <Icon className={`h-5 w-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">{freq.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {freq.description}
                </p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                isSelected ? "border-primary" : "border-muted-foreground/30"
              }`}>
                {isSelected && (
                  <div className="w-2.5 h-2.5 rounded-full gradient-primary" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex gap-3 max-w-md mx-auto">
        <Button variant="outline" onClick={onBack} size="lg" className="px-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button
          onClick={onNext}
          className="flex-1 gradient-primary text-white border-0"
          size="lg"
          id="frequency-next-btn"
        >
          Continue <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
