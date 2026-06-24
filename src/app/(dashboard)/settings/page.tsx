"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PLANS, DIGEST_FREQUENCIES } from "@/lib/constants";
import { CheckCircle2, Zap, Clock, ShieldAlert } from "lucide-react";
import type { Plan, DigestFrequency } from "@/types";
import { WhatsAppPreview } from "@/components/whatsapp-preview";
import { mockIntelligence } from "@/data/mock-intelligence";

export default function SettingsPage() {
  const [currentPlan, setCurrentPlan] = useState<Plan>("PRO");
  const [frequency, setFrequency] = useState<DigestFrequency>("THREE_HOURLY");
  const [isSaved, setIsSaved] = useState(false);

  const activePlanDetails = PLANS.find((p) => p.id === currentPlan);

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your subscription plan and delivery preferences.
        </p>
      </div>

      {/* Subscription Section */}
      <div className="bg-card border rounded-2xl overflow-hidden">
        <div className="p-6 md:p-8 border-b">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold">Subscription Plan</h2>
              <p className="text-sm text-muted-foreground mt-1">
                You are currently on the {activePlanDetails?.name} plan.
              </p>
            </div>
            <Badge className="bg-pulse-green/10 text-pulse-green border-0 font-medium px-3">
              Active
            </Badge>
          </div>

          <div className="bg-muted/50 rounded-xl p-5 flex items-center justify-between mb-6">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">{activePlanDetails?.currency}{activePlanDetails?.price}</span>
                {activePlanDetails?.price! > 0 && <span className="text-muted-foreground text-sm">/{activePlanDetails?.interval}</span>}
              </div>
              <p className="text-sm font-medium mt-1">Next billing date: July 15, 2026</p>
            </div>
            <Button variant="outline">Manage Billing</Button>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {PLANS.map((plan) => {
              const isCurrent = currentPlan === plan.id;
              return (
                <div
                  key={plan.id}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    isCurrent
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
                >
                  <h3 className="font-semibold mb-1">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {plan.currency}{plan.price}
                    {plan.price > 0 && `/${plan.interval}`}
                  </p>
                  
                  {isCurrent ? (
                    <div className="flex items-center justify-center w-full py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium">
                      Current Plan
                    </div>
                  ) : (
                    <Button 
                      className="w-full" 
                      variant={plan.price > activePlanDetails?.price! ? "default" : "outline"}
                      onClick={() => setCurrentPlan(plan.id)}
                    >
                      {plan.price > activePlanDetails?.price! ? "Upgrade" : "Downgrade"}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Delivery Preferences Section & WhatsApp Preview */}
      <div className="grid md:grid-cols-5 gap-8">
        <div className="bg-card border rounded-2xl p-6 md:p-8 md:col-span-3">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-10 h-10 rounded-full bg-pulse-amber/10 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5 text-pulse-amber" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Delivery Schedule</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Control how often we send intelligence to your WhatsApp.
              </p>
            </div>
          </div>

          <div className="space-y-3 max-w-md">
            {DIGEST_FREQUENCIES.map((freq) => {
              const isSelected = frequency === freq.id;
              return (
                <button
                  key={freq.id}
                  onClick={() => setFrequency(freq.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "hover:border-primary/30"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    isSelected ? "border-primary" : "border-muted-foreground/30"
                  }`}>
                    {isSelected && <div className="w-2.5 h-2.5 rounded-full gradient-primary" />}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{freq.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{freq.description}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Instant Alert Threshold (Only for Pro/Founder) */}
          {currentPlan !== "FREE" && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4 text-pulse-amber" />
                Instant Alert Threshold
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Send an instant WhatsApp message whenever an item scores above:
              </p>
              <div className="flex gap-2">
                {[7, 8, 9, 10].map((score) => (
                  <button
                    key={score}
                    className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${
                      score === 8 
                        ? "bg-foreground text-background border-foreground" 
                        : "bg-background text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {score}+
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Currently set to 8 (High Opportunity or above)</p>
            </div>
          )}
        </div>

        {/* WhatsApp Preview Side */}
        <div className="md:col-span-2 space-y-4">
          <div className="text-center">
            <h3 className="font-semibold text-lg mb-1">Live Preview</h3>
            <p className="text-sm text-muted-foreground mb-4">This is what you'll receive.</p>
          </div>
          <div className="scale-90 origin-top">
            <WhatsAppPreview items={mockIntelligence.slice(0, 2)} />
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-6 md:p-8">
        <h2 className="text-lg font-semibold text-destructive flex items-center gap-2 mb-2">
          <ShieldAlert className="h-5 w-5" /> Danger Zone
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <Button variant="destructive">Delete Account</Button>
      </div>

      {/* Save Actions */}
      <div className="flex items-center gap-4 pt-4 border-t">
        <Button onClick={handleSave} className="gradient-primary text-white border-0 px-8">
          Save Settings
        </Button>
        {isSaved && (
          <span className="text-sm text-pulse-green flex items-center gap-1.5 animate-fade-in">
            <CheckCircle2 className="h-4 w-4" /> Settings saved
          </span>
        )}
      </div>
    </div>
  );
}
