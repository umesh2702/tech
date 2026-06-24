"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/shared/logo";
import { WhatsAppStep } from "@/components/onboarding/whatsapp-step";
import { InterestsStep } from "@/components/onboarding/interests-step";
import { FrequencyStep } from "@/components/onboarding/frequency-step";
import { PlanStep } from "@/components/onboarding/plan-step";
import type { Category, DigestFrequency, Plan } from "@/types";

const TOTAL_STEPS = 4;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [interests, setInterests] = useState<Category[]>([]);
  const [frequency, setFrequency] = useState<DigestFrequency>("DAILY");
  const [selectedPlan, setSelectedPlan] = useState<Plan>("FREE");

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      // Onboarding complete — navigate to feed
      router.push("/feed");
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="space-y-8">
      {/* Logo */}
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <Logo />
        </div>
        <p className="text-sm text-muted-foreground">
          Step {step} of {TOTAL_STEPS}
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full gradient-primary rounded-full transition-all duration-500 ease-out"
          style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
        />
      </div>

      {/* Steps */}
      <div className="animate-fade-in" key={step}>
        {step === 1 && (
          <WhatsAppStep
            whatsappNumber={whatsappNumber}
            setWhatsappNumber={setWhatsappNumber}
            onNext={handleNext}
          />
        )}
        {step === 2 && (
          <InterestsStep
            interests={interests}
            setInterests={setInterests}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {step === 3 && (
          <FrequencyStep
            frequency={frequency}
            setFrequency={setFrequency}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {step === 4 && (
          <PlanStep
            selectedPlan={selectedPlan}
            setSelectedPlan={setSelectedPlan}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
      </div>
    </div>
  );
}
