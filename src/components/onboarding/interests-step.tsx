"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Brain, Rocket, TrendingUp, Code } from "lucide-react";
import { CATEGORIES } from "@/lib/constants";
import type { Category } from "@/types";

const iconMap: Record<string, React.ElementType> = {
  Brain,
  Rocket,
  TrendingUp,
  Code,
};

interface InterestsStepProps {
  interests: Category[];
  setInterests: (value: Category[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export function InterestsStep({
  interests,
  setInterests,
  onNext,
  onBack,
}: InterestsStepProps) {
  const toggleInterest = (id: Category) => {
    setInterests(
      interests.includes(id)
        ? interests.filter((i) => i !== id)
        : [...interests, id]
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Choose Your Interests</h2>
        <p className="text-muted-foreground">
          We&apos;ll personalize your intelligence feed based on what matters to you.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
        {CATEGORIES.map((category) => {
          const Icon = iconMap[category.icon] || Brain;
          const isSelected = interests.includes(category.id);

          return (
            <button
              key={category.id}
              onClick={() => toggleInterest(category.id)}
              className={`relative p-5 rounded-xl border-2 text-left transition-all duration-200 hover:shadow-md ${
                isSelected
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-primary/30"
              }`}
              id={`interest-${category.id.toLowerCase()}`}
            >
              {isSelected && (
                <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full gradient-primary flex items-center justify-center">
                  <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              )}
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                style={{ backgroundColor: `${category.color}15` }}
              >
                <Icon
                  className="h-5 w-5"
                  style={{ color: category.color }}
                />
              </div>
              <p className="font-semibold text-sm">{category.label}</p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {category.description}
              </p>
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
          disabled={interests.length === 0}
          className="flex-1 gradient-primary text-white border-0"
          size="lg"
          id="interests-next-btn"
        >
          Continue <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
