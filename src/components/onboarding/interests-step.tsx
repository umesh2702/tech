"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, ArrowLeft, Brain, Rocket, TrendingUp, Code, Shield, Building2, GraduationCap, Package, Plus, X } from "lucide-react";
import { CATEGORIES } from "@/lib/constants";

const iconMap: Record<string, React.ElementType> = {
  Brain,
  Rocket,
  TrendingUp,
  Code,
  Shield,
  Building2,
  GraduationCap,
  Package,
};

const COMPANY_PRESETS = [
  { id: "OpenAI", label: "OpenAI", color: "hsl(160, 80%, 40%)", description: "GPT-4o, ChatGPT, developer API, and research" },
  { id: "Anthropic", label: "Anthropic", color: "hsl(25, 85%, 45%)", description: "Claude models, constitutional AI, and agentic tools" },
  { id: "NVIDIA", label: "NVIDIA", color: "hsl(84, 75%, 35%)", description: "Blackwell GPUs, CUDA, compute scale, and AI hardware" },
  { id: "Microsoft", label: "Microsoft", color: "hsl(205, 80%, 45%)", description: "Copilot, Azure AI Infrastructure, and OpenAI partnership" },
  { id: "Google", label: "Google", color: "hsl(5, 75%, 50%)", description: "Gemini, DeepMind, AI search, and open research" },
  { id: "Meta", label: "Meta", color: "hsl(214, 85%, 45%)", description: "Llama open-weights models, PyTorch, and AI research" },
];

interface InterestsStepProps {
  interests: string[];
  setInterests: (value: string[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export function InterestsStep({
  interests,
  setInterests,
  onNext,
  onBack,
}: InterestsStepProps) {
  const [customInput, setCustomInput] = useState("");

  const toggleInterest = (id: string) => {
    setInterests(
      interests.includes(id)
        ? interests.filter((i) => i !== id)
        : [...interests, id]
    );
  };

  const handleAddCustom = () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    if (!interests.includes(trimmed)) {
      setInterests([...interests, trimmed]);
    }
    setCustomInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddCustom();
    }
  };

  const removeCustomInterest = (id: string) => {
    setInterests(interests.filter((i) => i !== id));
  };

  // Separate predefined IDs to show custom tags separately
  const predefinedIds = [
    ...CATEGORIES.map((c) => c.id),
    ...COMPANY_PRESETS.map((c) => c.id),
  ];
  const customInterests = interests.filter((i) => !predefinedIds.includes(i));

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Choose Your Interests</h2>
        <p className="text-muted-foreground">
          Select core categories, top companies, or add custom topics to customize your intelligence feed.
        </p>
      </div>

      <div className="space-y-6 max-w-2xl mx-auto">
        {/* Core Categories */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Core Categories</h3>
          <div className="grid grid-cols-2 gap-3">
            {CATEGORIES.map((category) => {
              const Icon = iconMap[category.icon] || Brain;
              const isSelected = interests.includes(category.id);

              return (
                <button
                  key={category.id}
                  onClick={() => toggleInterest(category.id)}
                  className={`relative p-4 rounded-xl border text-left transition-all duration-200 hover:shadow-sm ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/30"
                  }`}
                  id={`interest-${category.id.toLowerCase()}`}
                  type="button"
                >
                  {isSelected && (
                    <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full gradient-primary flex items-center justify-center">
                      <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
                    style={{ backgroundColor: `${category.color}15` }}
                  >
                    <Icon
                      className="h-4.5 w-4.5"
                      style={{ color: category.color }}
                    />
                  </div>
                  <p className="font-semibold text-xs">{category.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                    {category.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Company Preferences */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Company & Engine Focus</h3>
          <div className="grid grid-cols-2 gap-3">
            {COMPANY_PRESETS.map((company) => {
              const isSelected = interests.includes(company.id);

              return (
                <button
                  key={company.id}
                  onClick={() => toggleInterest(company.id)}
                  className={`relative p-4 rounded-xl border text-left transition-all duration-200 hover:shadow-sm ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/30"
                  }`}
                  id={`company-${company.id.toLowerCase()}`}
                  type="button"
                >
                  {isSelected && (
                    <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full gradient-primary flex items-center justify-center">
                      <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
                    style={{ backgroundColor: `${company.color}15` }}
                  >
                    <Building2
                      className="h-4.5 w-4.5"
                      style={{ color: company.color }}
                    />
                  </div>
                  <p className="font-semibold text-xs">{company.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                    {company.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Interest Keywords */}
        <div className="space-y-3 p-4 border rounded-xl bg-card">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Add Custom Keywords</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Enter specific niche technologies, companies, or custom tags you want tracked (e.g. OpenAI, LangChain, Vercel).
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. LangChain, Groq, Pinecode"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-10"
              id="custom-interest-input"
            />
            <Button
              onClick={handleAddCustom}
              disabled={!customInput.trim()}
              variant="secondary"
              className="shrink-0 h-10 px-3 flex items-center gap-1"
              id="add-custom-interest-btn"
              type="button"
            >
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>

          {customInterests.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t">
              {customInterests.map((interest) => (
                <span
                  key={interest}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20"
                >
                  {interest}
                  <button
                    onClick={() => removeCustomInterest(interest)}
                    className="hover:text-destructive shrink-0 transition-colors"
                    type="button"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 max-w-2xl mx-auto">
        <Button variant="outline" onClick={onBack} size="lg" className="px-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button
          onClick={onNext}
          disabled={interests.length === 0}
          className="flex-1 gradient-primary text-white border-0 font-medium"
          size="lg"
          id="interests-next-btn"
        >
          Continue <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

