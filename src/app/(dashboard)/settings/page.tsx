"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PLANS, DIGEST_FREQUENCIES, CATEGORIES } from "@/lib/constants";
import { CheckCircle2, Zap, Clock, ShieldAlert, AlertCircle, Plus, X, Globe, User, MessageCircle, Moon, Sun, Loader2 } from "lucide-react";
import type { DigestFrequency } from "@/types";
import { WhatsAppPreview } from "@/components/whatsapp-preview";
import { mockIntelligence } from "@/data/mock-intelligence";
import { toast } from "sonner";

const COMMON_TIMEZONES = [
  { value: "Asia/Kolkata", label: "India Standard Time (IST) — Asia/Kolkata" },
  { value: "America/New_York", label: "Eastern Standard Time (EST) — America/New_York" },
  { value: "America/Los_Angeles", label: "Pacific Standard Time (PST) — America/Los_Angeles" },
  { value: "Europe/London", label: "Greenwich Mean Time (GMT) — Europe/London" },
  { value: "Asia/Singapore", label: "Singapore Time (SGT) — Asia/Singapore" },
  { value: "UTC", label: "Coordinated Universal Time — UTC" },
];

const COMPANY_PRESETS = [
  { id: "OpenAI", label: "OpenAI", color: "hsl(160, 80%, 40%)", description: "GPT-4o, ChatGPT, developer API, and research" },
  { id: "Anthropic", label: "Anthropic", color: "hsl(25, 85%, 45%)", description: "Claude models, constitutional AI, and agentic tools" },
  { id: "NVIDIA", label: "NVIDIA", color: "hsl(84, 75%, 35%)", description: "Blackwell GPUs, CUDA, compute scale, and AI hardware" },
  { id: "Microsoft", label: "Microsoft", color: "hsl(205, 80%, 45%)", description: "Copilot, Azure AI Infrastructure, and OpenAI partnership" },
  { id: "Google", label: "Google", color: "hsl(5, 75%, 50%)", description: "Gemini, DeepMind, AI search, and open research" },
  { id: "Meta", label: "Meta", color: "hsl(214, 85%, 45%)", description: "Llama open-weights models, PyTorch, and AI research" },
];

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // User details state
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [email, setEmail] = useState("");

  // WhatsApp verification state
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappVerified, setWhatsappVerified] = useState(false);
  const [originalWhatsappNumber, setOriginalWhatsappNumber] = useState("");
  const [testSent, setTestSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Preferences state
  const [interests, setInterests] = useState<string[]>([]);
  const [frequencies, setFrequencies] = useState<DigestFrequency[]>(["DAILY"]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Custom interest input state
  const [customInput, setCustomInput] = useState("");

  // Fetch settings on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/user/settings");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load settings");

        const data = json.data;
        setName(data.name || "");
        setEmail(data.email || "");
        setCountry(data.country || "");
        setTimezone(data.timezone || "Asia/Kolkata");
        setWhatsappNumber(data.whatsappNumber || "");
        setOriginalWhatsappNumber(data.whatsappNumber || "");
        setWhatsappVerified(data.whatsappVerified || false);
        setInterests(data.interests || []);
        setFrequencies(data.deliveryPreferences || ["DAILY"]);
        setNotificationsEnabled(data.notificationsEnabled);
      } catch (err: any) {
        console.error(err);
        toast.error("Failed to load your profile settings.");
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  // Background save helper
  const saveSettings = async (updatedFields: any) => {
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFields),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update settings");
      
      setSaveStatus("saved");
      setTimeout(() => {
        setSaveStatus((prev) => (prev === "saved" ? "idle" : prev));
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setSaveStatus("error");
      toast.error(err.message || "Failed to save settings");
    }
  };

  const [isTestingDigest, setIsTestingDigest] = useState(false);
  const [isTestingAlert, setIsTestingAlert] = useState(false);

  const handleTestDigest = async () => {
    setIsTestingDigest(true);
    try {
      const res = await fetch("/api/user/settings/test-digest", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to trigger test digest");
      toast.success("Test digest successfully sent via WhatsApp!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to trigger test digest.");
    } finally {
      setIsTestingDigest(false);
    }
  };

  const handleTestAlert = async () => {
    setIsTestingAlert(true);
    try {
      const res = await fetch("/api/user/settings/test-alert", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to trigger test alert");
      toast.success("Test alert successfully sent via WhatsApp!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to trigger test alert.");
    } finally {
      setIsTestingAlert(false);
    }
  };

  // Immediate save handlers for checkboxes, dropdowns, switches
  const handleTimezoneChange = (tz: string) => {
    setTimezone(tz);
    saveSettings({ timezone: tz });
  };

  const handleNotificationsToggle = (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    saveSettings({ notificationsEnabled: enabled });
  };

  const handleFrequencyToggle = (freqId: DigestFrequency) => {
    let updated: DigestFrequency[];
    if (frequencies.includes(freqId)) {
      updated = frequencies.filter((f) => f !== freqId);
    } else {
      updated = [...frequencies, freqId];
    }
    if (updated.length === 0) {
      toast.warning("You must select at least one delivery frequency.");
      return;
    }
    setFrequencies(updated);
    saveSettings({ deliveryPreferences: updated });
  };

  const handleInterestToggle = (interestId: string) => {
    const updated = interests.includes(interestId)
      ? interests.filter((i) => i !== interestId)
      : [...interests, interestId];
    setInterests(updated);
    saveSettings({ interests: updated });
  };

  const handleAddCustomInterest = () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    if (!interests.includes(trimmed)) {
      const updated = [...interests, trimmed];
      setInterests(updated);
      saveSettings({ interests: updated });
    }
    setCustomInput("");
  };

  const handleRemoveCustomInterest = (id: string) => {
    const updated = interests.filter((i) => i !== id);
    setInterests(updated);
    saveSettings({ interests: updated });
  };

  // Blur handlers for text inputs to trigger saves
  const handleNameBlur = () => {
    saveSettings({ name });
  };

  const handleCountryBlur = () => {
    saveSettings({ country });
  };

  // WhatsApp verification workflow
  const handleSendTestMessage = async () => {
    if (whatsappNumber.length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }
    setIsSending(true);
    try {
      const formattedPhone = whatsappNumber.startsWith("+") 
        ? whatsappNumber 
        : `+91${whatsappNumber}`;

      const res = await fetch("/api/whatsapp/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: formattedPhone }),
      });

      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.error || "Failed to send welcome message");
      }

      setTestSent(true);
      toast.success("Welcome welcome message sent via WhatsApp!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to send verification message.");
    } finally {
      setIsSending(false);
    }
  };

  const handleConfirmReceipt = async () => {
    setIsVerifying(true);
    try {
      const formattedPhone = whatsappNumber.startsWith("+") 
        ? whatsappNumber 
        : `+91${whatsappNumber}`;

      const res = await fetch("/api/whatsapp/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: formattedPhone, code: "CONFIRM" }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");

      setWhatsappVerified(true);
      setOriginalWhatsappNumber(formattedPhone);
      setTestSent(false);
      toast.success("WhatsApp number verified and saved!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Verification failed");
    } finally {
      setIsVerifying(false);
    }
  };

  // Check if phone number input matches original saved verified number
  const isPhoneUnverified = 
    whatsappNumber !== originalWhatsappNumber || !whatsappVerified;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-muted-foreground text-sm font-medium">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Settings Header with Autosave Status */}
      <div className="flex items-center justify-between border-b pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your personal profile, interests, and WhatsApp notifications.
          </p>
        </div>
        
        {/* Autosave Status Badge */}
        <div className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full border bg-muted/30 text-xs font-semibold">
          {saveStatus === "idle" && (
            <span className="text-muted-foreground flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" /> Checked
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="text-pulse-green flex items-center gap-1.5 animate-pulse">
              <CheckCircle2 className="h-3.5 w-3.5" /> All changes saved
            </span>
          )}
          {saveStatus === "saving" && (
            <span className="text-pulse-amber flex items-center gap-1.5 animate-pulse">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
            </span>
          )}
          {saveStatus === "error" && (
            <span className="text-destructive flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" /> Save failed
            </span>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-5 gap-8">
        {/* Settings Forms */}
        <div className="md:col-span-3 space-y-6">
          
          {/* Profile Card */}
          <div className="p-6 border rounded-2xl bg-card space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-2">
              <User className="h-5 w-5 text-primary" /> Profile Details
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Full Name</label>
                  <Input
                    placeholder="Enter name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={handleNameBlur}
                    id="settings-name-input"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Country</label>
                  <Input
                    placeholder="Enter country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    onBlur={handleCountryBlur}
                    id="settings-country-input"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Email Address</label>
                <Input
                  disabled
                  value={email}
                  className="bg-muted text-muted-foreground cursor-not-allowed"
                />
                <p className="text-[10px] text-muted-foreground">Email cannot be changed (Google Auth-linked).</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Your Timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => handleTimezoneChange(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  id="settings-timezone-select"
                >
                  {COMMON_TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* WhatsApp Channel Card */}
          <div className="p-6 border rounded-2xl bg-card space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-2">
              <MessageCircle className="h-5 w-5 text-pulse-green" /> WhatsApp Delivery
            </h2>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">WhatsApp Number</label>
                <div className="flex gap-2">
                  <div className="flex items-center px-3 bg-muted border rounded-lg text-sm font-medium shrink-0">
                    +91
                  </div>
                  <Input
                    placeholder="9876543210"
                    value={whatsappNumber.replace(/^\+91/, "")}
                    onChange={(e) => {
                      const num = e.target.value.replace(/\D/g, "");
                      setWhatsappNumber(num);
                      if (num !== originalWhatsappNumber.replace(/^\+91/, "")) {
                        setWhatsappVerified(false);
                      }
                    }}
                    maxLength={10}
                    id="settings-whatsapp-input"
                  />
                  {whatsappVerified && !isPhoneUnverified && (
                    <Badge className="bg-pulse-green/10 text-pulse-green border-pulse-green/20 hover:bg-pulse-green/15 shrink-0 self-center h-8 flex items-center font-medium">
                      Verified
                    </Badge>
                  )}
                </div>
              </div>

              {/* Lightweight Verify Portal if phone is unverified */}
              {isPhoneUnverified && whatsappNumber.length === 10 && (
                <div className="p-4 border border-pulse-amber/20 rounded-xl bg-pulse-amber/5 space-y-3">
                  <div className="flex gap-2 text-xs">
                    <AlertCircle className="h-4.5 w-4.5 text-pulse-amber shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-foreground">Verify WhatsApp Channel</p>
                      <p className="text-muted-foreground text-[10px] leading-relaxed mt-0.5">
                        Your WhatsApp number is unverified. Send a welcome message to confirm your number.
                      </p>
                    </div>
                  </div>
                  
                  {!testSent ? (
                    <Button
                      onClick={handleSendTestMessage}
                      disabled={isSending}
                      className="w-full gradient-primary text-white border-0 h-9 text-xs"
                      id="settings-send-welcome-btn"
                    >
                      {isSending ? "Sending Welcome message..." : "Send Verification Welcome Message"}
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-[10px] text-muted-foreground font-medium">
                        Welcome message sent! Confirm receipt below once received.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleConfirmReceipt}
                          disabled={isVerifying}
                          className="flex-1 gradient-primary text-white border-0 h-9 text-xs"
                          id="settings-confirm-receipt-btn"
                        >
                          {isVerifying ? "Confirming..." : "Yes, I received it"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setTestSent(false)}
                          disabled={isVerifying}
                          className="h-9 text-xs"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Notifications Toggle */}
              <div className="flex items-center justify-between pt-3 border-t">
                <div>
                  <p className="font-semibold text-sm">Enable Delivery Channel</p>
                  <p className="text-[10px] text-muted-foreground">
                    Send digests and alerts to this WhatsApp number.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationsEnabled}
                    onChange={(e) => handleNotificationsToggle(e.target.checked)}
                    className="sr-only peer"
                    id="settings-notifications-toggle"
                  />
                  <div className="w-11 h-6 bg-muted rounded-full peer peer-focus:ring-0 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-card after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Interests & Company Preferences Card */}
          <div className="p-6 border rounded-2xl bg-card space-y-6">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2 mb-1">
                <Globe className="h-5 w-5 text-pulse-amber" /> Interests & Keywords
              </h2>
              <p className="text-xs text-muted-foreground">
                We use these filters to curate your intelligence items.
              </p>
            </div>

            {/* Core Categories */}
            <div className="space-y-2">
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Core Categories</h3>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((cat) => {
                  const isSelected = interests.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleInterestToggle(cat.id)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/20"
                      }`}
                      type="button"
                    >
                      <div
                        className="w-5 h-5 rounded flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                      >
                        <CheckCircle2 className={`h-3 w-3 ${isSelected ? "opacity-100" : "opacity-20"}`} />
                      </div>
                      <span className="truncate">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Company Presets */}
            <div className="space-y-2">
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Company Presets</h3>
              <div className="grid grid-cols-2 gap-2">
                {COMPANY_PRESETS.map((company) => {
                  const isSelected = interests.includes(company.id);
                  return (
                    <button
                      key={company.id}
                      onClick={() => handleInterestToggle(company.id)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/20"
                      }`}
                      type="button"
                    >
                      <div
                        className="w-5 h-5 rounded flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${company.color}15`, color: company.color }}
                      >
                        <CheckCircle2 className={`h-3 w-3 ${isSelected ? "opacity-100" : "opacity-20"}`} />
                      </div>
                      <span className="truncate">{company.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Keywords */}
            <div className="space-y-3 p-4 border rounded-xl bg-card">
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Custom Keywords</h3>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. DevOps, Web3, LangChain"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCustomInterest();
                    }
                  }}
                  id="settings-custom-interest-input"
                />
                <Button
                  onClick={handleAddCustomInterest}
                  disabled={!customInput.trim()}
                  variant="secondary"
                  className="shrink-0 flex items-center gap-1.5 h-10"
                  type="button"
                >
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>

              {/* Badges display */}
              {interests.filter(i => !CATEGORIES.some(c => c.id === i) && !COMPANY_PRESETS.some(cp => cp.id === i)).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t">
                  {interests.filter(i => !CATEGORIES.some(c => c.id === i) && !COMPANY_PRESETS.some(cp => cp.id === i)).map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/25"
                    >
                      {item}
                      <button
                        onClick={() => handleRemoveCustomInterest(item)}
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

          {/* Delivery Schedule Rhythms */}
          <div className="p-6 border rounded-2xl bg-card space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Clock className="h-5 w-5 text-pulse-amber" /> Delivery Schedule
                </h2>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Select one or more schedules. We run cron digests relative to your timezone.
                </p>
              </div>
            </div>

            {/* Next Dispatch & Upcoming Windows */}
            <div className="grid sm:grid-cols-2 gap-4 bg-muted/20 p-4 rounded-xl border text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Next Scheduled Delivery</span>
                <p className="font-bold text-foreground mt-0.5 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  {(() => {
                    if (!notificationsEnabled) return "Paused";
                    if (!frequencies || frequencies.length === 0) return "Not Scheduled";
                    
                    const now = new Date();
                    let localHour = 9;
                    try {
                      const formatter = new Intl.DateTimeFormat("en-US", { timeZone: timezone, hour: "numeric", hour12: false });
                      localHour = parseInt(formatter.format(now), 10);
                    } catch (e) {}

                    const hourTargets: Record<string, number> = {
                      MORNING: 8,
                      DAILY: 9,
                      EVENING: 20,
                      THREE_HOURLY: (Math.floor(localHour / 3) + 1) * 3 % 24
                    };

                    let nextFreq = "DAILY";
                    let minDiff = 25;
                    let nextHour = 9;

                    frequencies.forEach(sched => {
                      const target = hourTargets[sched];
                      if (target !== undefined) {
                        let diff = target - localHour;
                        if (diff <= 0) diff += 24;
                        if (diff < minDiff) {
                          minDiff = diff;
                          nextFreq = sched;
                          nextHour = target;
                        }
                      }
                    });

                    const tomorrow = minDiff > (24 - localHour) || nextHour < localHour;
                    const ampm = nextHour >= 12 ? "PM" : "AM";
                    const displayHour = nextHour % 12 === 0 ? 12 : nextHour % 12;
                    const timeStr = `${displayHour}:00 ${ampm}`;

                    return `${tomorrow ? "Tomorrow" : "Today"} @ ${timeStr} (${nextFreq})`;
                  })()}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active Windows</span>
                <ul className="list-disc list-inside space-y-0.5 mt-0.5 text-[10px] text-foreground font-semibold">
                  {(() => {
                    if (!notificationsEnabled) return [<li key="paused" className="list-none text-muted-foreground">Delivery is Paused</li>];
                    const list = [];
                    if (frequencies.includes("MORNING")) list.push(<li key="morning">08:00 AM (Morning Digest)</li>);
                    if (frequencies.includes("DAILY")) list.push(<li key="daily">09:00 AM (Daily Digest)</li>);
                    if (frequencies.includes("THREE_HOURLY")) list.push(<li key="three">Every 3 Hours</li>);
                    if (frequencies.includes("EVENING")) list.push(<li key="evening">08:00 PM (Evening Digest)</li>);
                    if (frequencies.includes("INSTANT")) list.push(<li key="instant">Instant Alerts (high score)</li>);
                    if (list.length === 0) return [<li key="none" className="list-none text-muted-foreground">None selected</li>];
                    return list;
                  })()}
                </ul>
              </div>
            </div>

            {/* Checkbox selector buttons */}
            <div className="space-y-2">
              {DIGEST_FREQUENCIES.map((freq) => {
                const isSelected = frequencies.includes(freq.id);
                return (
                  <button
                    key={freq.id}
                    onClick={() => handleFrequencyToggle(freq.id)}
                    className={`w-full flex items-center justify-between p-3 border rounded-xl transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-primary/25"
                    }`}
                    type="button"
                  >
                    <div className="text-left">
                      <p className="font-semibold text-xs">{freq.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{freq.description}</p>
                    </div>
                    <div className={`w-4.5 h-4.5 rounded flex items-center justify-center border shrink-0 ${
                      isSelected ? "border-primary bg-primary text-white" : "border-muted-foreground/30"
                    }`}>
                      {isSelected && (
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Test Trigger buttons inside settings */}
            {whatsappVerified && (
              <div className="pt-4 border-t space-y-3">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">🧪 Production Channel Testing</span>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={handleTestDigest}
                    disabled={isTestingDigest || isTestingAlert}
                    variant="outline"
                    className="h-9 text-xs"
                    id="settings-test-digest-btn"
                  >
                    {isTestingDigest ? (
                      <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Sending...</span>
                    ) : (
                      "Send Test Digest"
                    )}
                  </Button>
                  <Button
                    onClick={handleTestAlert}
                    disabled={isTestingDigest || isTestingAlert}
                    variant="outline"
                    className="h-9 text-xs"
                    id="settings-test-alert-btn"
                  >
                    {isTestingAlert ? (
                      <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Sending...</span>
                    ) : (
                      "Send Test Alert"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Danger Zone */}
          <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-6 space-y-3">
            <h2 className="text-md font-bold text-destructive flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" /> Danger Zone
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Permanently delete your account, preferences, and delivery log history. This action is irreversible.
            </p>
            <Button variant="destructive" className="h-9 text-xs">Delete Account</Button>
          </div>

        </div>

        {/* Live Preview Column */}
        <div className="md:col-span-2 space-y-4">
          <div className="text-center md:text-left">
            <h3 className="font-semibold text-lg mb-1 flex items-center justify-center md:justify-start gap-1.5">
              <Zap className="h-4.5 w-4.5 text-pulse-amber" /> Live Preview
            </h3>
            <p className="text-xs text-muted-foreground">What you will receive on WhatsApp.</p>
          </div>
          <div className="scale-95 origin-top md:origin-top-left border rounded-3xl overflow-hidden shadow-xl">
            <WhatsAppPreview items={mockIntelligence.slice(0, 3)} />
          </div>
        </div>
      </div>
    </div>
  );
}
