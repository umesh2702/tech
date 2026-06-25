"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Sun, Clock, Zap, Moon, AlertCircle } from "lucide-react";
import { DIGEST_FREQUENCIES } from "@/lib/constants";
import type { DigestFrequency } from "@/types";

const iconMap: Record<string, React.ElementType> = { Sun, Clock, Zap, Moon };

interface FrequencyStepProps {
  frequencies: DigestFrequency[];
  setFrequencies: (value: DigestFrequency[]) => void;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (value: boolean) => void;
  onNext: () => void;
  onBack: () => void;
}

export function FrequencyStep({
  frequencies,
  setFrequencies,
  notificationsEnabled,
  setNotificationsEnabled,
  onNext,
  onBack,
}: FrequencyStepProps) {
  const toggleFrequency = (id: DigestFrequency) => {
    if (frequencies.includes(id)) {
      setFrequencies(frequencies.filter((f) => f !== id));
    } else {
      setFrequencies([...frequencies, id]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Choose Your Rhythm</h2>
        <p className="text-muted-foreground">
          How often should we deliver intelligence to your WhatsApp? Select all that apply.
        </p>
      </div>

      <div className="space-y-4 max-w-md mx-auto">
        {/* Frequency List */}
        <div className="space-y-2.5">
          {DIGEST_FREQUENCIES.map((freq) => {
            const Icon = iconMap[freq.icon] || Clock;
            const isSelected = frequencies.includes(freq.id);

            return (
              <button
                key={freq.id}
                onClick={() => toggleFrequency(freq.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-200 ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/30"
                }`}
                id={`frequency-${freq.id.toLowerCase()}`}
                type="button"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  isSelected ? "bg-primary/10" : "bg-muted"
                }`}>
                  <Icon className={`h-5 w-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-xs">{freq.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {freq.description}
                  </p>
                </div>
                <div className={`w-5 h-5 rounded flex items-center justify-center border shrink-0 ${
                  isSelected ? "border-primary bg-primary text-white" : "border-muted-foreground/30"
                }`}>
                  {isSelected && (
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Warning if none selected */}
        {frequencies.length === 0 && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-xs">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Please select at least one delivery frequency.</span>
          </div>
        )}

        {/* Notifications Toggle Panel */}
        <div className="p-4 border rounded-xl bg-card space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">Enable WhatsApp Delivery</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Toggle delivery of selected digests and alerts to your phone.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
                className="sr-only peer"
                id="notifications-toggle"
              />
              <div className="w-11 h-6 bg-muted rounded-full peer peer-focus:ring-0 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-card after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      </div>

      <div className="flex gap-3 max-w-md mx-auto">
        <Button variant="outline" onClick={onBack} size="lg" className="px-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button
          onClick={onNext}
          disabled={frequencies.length === 0}
          className="flex-1 gradient-primary text-white border-0 font-medium"
          size="lg"
          id="frequency-next-btn"
        >
          Continue <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

