"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Globe, Clock, ArrowRight } from "lucide-react";

interface ProfileStepProps {
  name: string;
  setName: (value: string) => void;
  country: string;
  setCountry: (value: string) => void;
  timezone: string;
  setTimezone: (value: string) => void;
  onNext: () => void;
}

const COMMON_TIMEZONES = [
  { value: "Asia/Kolkata", label: "India Standard Time (IST) — Asia/Kolkata" },
  { value: "America/New_York", label: "Eastern Standard Time (EST) — America/New_York" },
  { value: "America/Los_Angeles", label: "Pacific Standard Time (PST) — America/Los_Angeles" },
  { value: "Europe/London", label: "Greenwich Mean Time (GMT) — Europe/London" },
  { value: "Asia/Singapore", label: "Singapore Time (SGT) — Asia/Singapore" },
  { value: "UTC", label: "Coordinated Universal Time — UTC" },
];

export function ProfileStep({
  name,
  setName,
  country,
  setCountry,
  timezone,
  setTimezone,
  onNext,
}: ProfileStepProps) {
  const isComplete = name.trim().length > 0 && country.trim().length > 0 && timezone.length > 0;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <User className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Create Your Profile</h2>
        <p className="text-muted-foreground">
          Let's get to know you so we can customize your intelligence digests.
        </p>
      </div>

      <div className="space-y-4 max-w-sm mx-auto">
        {/* Full Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-1.5">
            <User className="h-4 w-4 text-muted-foreground" />
            Full Name
          </label>
          <Input
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11"
            id="onboarding-name-input"
          />
        </div>

        {/* Country */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-1.5">
            <Globe className="h-4 w-4 text-muted-foreground" />
            Country
          </label>
          <Input
            placeholder="India, United States, UK"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="h-11"
            id="onboarding-country-input"
          />
        </div>

        {/* Timezone */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Your Timezone
          </label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full h-11 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            id="onboarding-timezone-select"
          >
            <option value="" disabled>Select your timezone</option>
            {COMMON_TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground mt-1">
            Required for delivery schedule timezone calculations.
          </p>
        </div>

        <Button
          onClick={onNext}
          disabled={!isComplete}
          className="w-full gradient-primary text-white border-0 mt-2"
          size="lg"
          id="profile-next-btn"
        >
          Continue <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
