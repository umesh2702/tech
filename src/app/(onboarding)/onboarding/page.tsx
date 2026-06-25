"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/shared/logo";
import { ProfileStep } from "@/components/onboarding/profile-step";
import { WhatsAppStep } from "@/components/onboarding/whatsapp-step";
import { InterestsStep } from "@/components/onboarding/interests-step";
import { FrequencyStep } from "@/components/onboarding/frequency-step";
import type { DigestFrequency } from "@/types";
import { toast } from "sonner";

const TOTAL_STEPS = 4;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappVerified, setWhatsappVerified] = useState(false);
  const [interests, setInterests] = useState<string[]>([]);
  const [frequencies, setFrequencies] = useState<DigestFrequency[]>(["DAILY"]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = async () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      setIsSubmitting(true);
      try {
        const formattedPhone = whatsappNumber
          ? (whatsappNumber.startsWith("+") ? whatsappNumber : `+91${whatsappNumber}`)
          : null;

        const res = await fetch("/api/onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            whatsappNumber: whatsappVerified ? formattedPhone : null,
            country,
            timezone,
            interests,
            deliveryPreferences: frequencies,
            notificationsEnabled,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to complete onboarding");
        }

        toast.success("Welcome! Onboarding completed successfully.");
        
        // Use window.location or router.push, but force refresh/navigation to dashboard
        router.push("/feed");
        router.refresh();
      } catch (err: any) {
        console.error(err);
        toast.error(err.message || "Failed to save onboarding settings");
      } finally {
        setIsSubmitting(false);
      }
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
          <ProfileStep
            name={name}
            setName={setName}
            country={country}
            setCountry={setCountry}
            timezone={timezone}
            setTimezone={setTimezone}
            onNext={handleNext}
          />
        )}
        {step === 2 && (
          <WhatsAppStep
            whatsappNumber={whatsappNumber}
            setWhatsappNumber={setWhatsappNumber}
            whatsappVerified={whatsappVerified}
            setWhatsappVerified={setWhatsappVerified}
            onNext={handleNext}
          />
        )}
        {step === 3 && (
          <InterestsStep
            interests={interests}
            setInterests={setInterests}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {step === 4 && (
          <FrequencyStep
            frequencies={frequencies}
            setFrequencies={setFrequencies}
            notificationsEnabled={notificationsEnabled}
            setNotificationsEnabled={setNotificationsEnabled}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
      </div>
    </div>
  );
}

