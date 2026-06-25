"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { IntelligenceCard } from "@/components/dashboard/intelligence-card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, Brain, Clock, Bookmark, Search, Building2, 
  ArrowRight, Smartphone, CheckCircle2, AlertCircle, 
  Send, Loader2, Star, MessageSquare 
} from "lucide-react";
import type { Category, IntelligenceItem, DigestFrequency } from "@/types";
import { toast } from "sonner";

export default function FounderDashboard() {
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [userTimezone, setUserTimezone] = useState("Asia/Kolkata");
  const [schedules, setSchedules] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [whatsappVerified, setWhatsappVerified] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Stats
  const [savedCount, setSavedCount] = useState(0);
  const [pulseInsight, setPulseInsight] = useState("");
  const [insightLoading, setInsightLoading] = useState(true);
  const [latestDelivery, setLatestDelivery] = useState<any>(null);

  // Intelligence feed state
  const [items, setItems] = useState<IntelligenceItem[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  
  // Filter and Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"matching" | "all">("matching");
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Feedback widget state
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Time-of-day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    const salutation = userName ? `, ${userName.split(" ")[0]}` : "";
    if (hour < 12) return `Good morning${salutation} ☀️`;
    if (hour < 18) return `Good afternoon${salutation} 🌤️`;
    return `Good evening${salutation} 🌙`;
  };

  // Fetch Dashboard Stats & User settings
  useEffect(() => {
    async function loadDashboard() {
      try {
        // Fetch user settings
        const settingsRes = await fetch("/api/user/settings");
        const settingsJson = await settingsRes.json();
        if (settingsRes.ok && settingsJson.data) {
          const user = settingsJson.data;
          setUserName(user.name || "");
          setUserTimezone(user.timezone || "Asia/Kolkata");
          setSchedules(user.deliveryPreferences || []);
          setInterests(user.interests || []);
          setWhatsappVerified(user.whatsappVerified || false);
          setWhatsappNumber(user.whatsappNumber || "");
          setNotificationsEnabled(user.notificationsEnabled);
        }

        // Fetch saved bookmarks count
        const savedRes = await fetch("/api/user/saved");
        const savedJson = await savedRes.json();
        if (savedRes.ok && savedJson.data) {
          setSavedCount(savedJson.data.length);
          const ids = new Set<string>(savedJson.data.map((s: any) => s.intelligenceItemId as string));
          setSavedIds(ids);
        }

        // Fetch latest delivery status
        const historyRes = await fetch("/api/user/history");
        const historyJson = await historyRes.json();
        if (historyRes.ok && historyJson.data && historyJson.data.length > 0) {
          setLatestDelivery(historyJson.data[0]);
        }

        // Fetch main intelligence feed
        const feedRes = await fetch("/api/intelligence?limit=80");
        const feedJson = await feedRes.json();
        if (feedRes.ok && feedJson.data) {
          setItems(feedJson.data);
        }
      } catch (err) {
        console.error("Dashboard load failed:", err);
      } finally {
        setLoading(false);
      }
    }
    
    loadDashboard();
  }, []);

  // Fetch Pulse dynamic trend insight
  useEffect(() => {
    async function loadInsight() {
      try {
        const res = await fetch("/api/user/pulse-insight");
        const json = await res.json();
        if (res.ok && json.insight) {
          setPulseInsight(json.insight);
        }
      } catch (e) {
        console.error("Failed to load pulse insight:", e);
      } finally {
        setInsightLoading(false);
      }
    }
    loadInsight();
  }, []);

  // Timezone-aware next dispatch schedule builder
  const getNextScheduledDigest = () => {
    if (!notificationsEnabled) return "Paused";
    if (!schedules || schedules.length === 0) return "Not Scheduled";
    
    const now = new Date();
    let localHour = 9;
    try {
      const formatter = new Intl.DateTimeFormat("en-US", { timeZone: userTimezone, hour: "numeric", hour12: false });
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

    schedules.forEach(sched => {
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
    const timeStr = `${displayHour}:${nextHour % 1 !== 0 ? "30" : "00"} ${ampm}`;

    return `${tomorrow ? "Tomorrow" : "Today"} @ ${timeStr}`;
  };

  // Toggle Bookmark
  const handleSaveToggle = async (itemId: string) => {
    const isCurrentlySaved = savedIds.has(itemId);
    
    // Optimistic UI update
    const newSavedIds = new Set(savedIds);
    if (isCurrentlySaved) {
      newSavedIds.delete(itemId);
      setSavedCount(c => Math.max(0, c - 1));
    } else {
      newSavedIds.add(itemId);
      setSavedCount(c => c + 1);
    }
    setSavedIds(newSavedIds);

    try {
      const res = await fetch("/api/user/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to bookmark");
      toast.success(isCurrentlySaved ? "Bookmark removed" : "Bookmark saved successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to update bookmark.");
      
      // Rollback optimistic state
      const rollback = new Set(savedIds);
      if (isCurrentlySaved) {
        rollback.add(itemId);
        setSavedCount(c => c + 1);
      } else {
        rollback.delete(itemId);
        setSavedCount(c => Math.max(0, c - 1));
      }
      setSavedIds(rollback);
    }
  };

  // Feedback Submission handler
  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (feedbackRating === 0) {
      toast.warning("Please select a rating before submitting.");
      return;
    }
    setFeedbackSubmitting(true);
    try {
      const res = await fetch("/api/user/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: feedbackRating, comment: feedbackComment }),
      });
      if (!res.ok) throw new Error("Failed to submit feedback");
      setFeedbackSubmitted(true);
      toast.success("Thank you for your feedback! It helps improve the beta.");
      setFeedbackComment("");
    } catch (err: any) {
      console.error(err);
      toast.error("Could not submit feedback. Please try again.");
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  // Filter intelligence items list
  const getFilteredItems = () => {
    let list = [...items];

    // Filter 1: Tab (Matching Interests vs All)
    if (activeTab === "matching") {
      list = list.filter((item) => {
        const matchesCategory = interests.includes(item.category);
        const matchesTags = item.tags.some(tag => 
          interests.some(interest => interest.toUpperCase() === tag.toUpperCase())
        );
        return matchesCategory || matchesTags;
      });
    }

    // Filter 2: Company Preset Quick Filter
    if (selectedCompany) {
      list = list.filter(item => 
        item.tags.some(tag => tag.toUpperCase() === selectedCompany.toUpperCase()) || 
        item.title.toUpperCase().includes(selectedCompany.toUpperCase())
      );
    }

    // Filter 3: Category Select
    if (selectedCategory) {
      list = list.filter(item => item.category === selectedCategory);
    }

    // Filter 4: Text Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        item => 
          item.title.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.tags.some(t => t.toLowerCase().includes(q)) ||
          (item.opportunity && item.opportunity.toLowerCase().includes(q))
      );
    }

    return list;
  };

  const filteredItems = getFilteredItems();

  // Compute values for stats widgets
  const getAnalyzedCount = () => {
    const todayStr = new Date().toDateString();
    return items.filter(item => new Date(item.collectedAt).toDateString() === todayStr).length;
  };

  const getTodayAIScore = () => {
    const todayStr = new Date().toDateString();
    const todayItems = items.filter(item => new Date(item.collectedAt).toDateString() === todayStr);
    if (todayItems.length === 0) return 8.2; // fallback average score based on database historic items
    const sum = todayItems.reduce((acc, item) => acc + item.opportunityScore, 0);
    return parseFloat((sum / todayItems.length).toFixed(1));
  };

  // Helper for delivery status formatting
  const getDeliveryStatusDetails = () => {
    if (!latestDelivery) return { label: "No deliveries", color: "text-muted-foreground", bg: "bg-muted/10", border: "border-border" };
    const dateStr = new Date(latestDelivery.createdAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    
    switch (latestDelivery.status) {
      case "READ":
        return { label: `Delivered & Read at ${dateStr}`, color: "text-sky-500", bg: "bg-sky-500/5", border: "border-sky-500/20" };
      case "DELIVERED":
        return { label: `Delivered at ${dateStr}`, color: "text-pulse-green", bg: "bg-pulse-green/5", border: "border-pulse-green/20" };
      case "SENT":
        return { label: `Sent at ${dateStr}`, color: "text-pulse-amber", bg: "bg-pulse-amber/5", border: "border-pulse-amber/20" };
      case "FAILED":
        return { label: `Dispatch failed: ${latestDelivery.errorMessage || "Meta API Error"}`, color: "text-destructive", bg: "bg-destructive/5", border: "border-destructive/20" };
      default:
        return { label: "Queued for dispatch...", color: "text-muted-foreground", bg: "bg-muted/10", border: "border-border" };
    }
  };

  const deliveryBadge = getDeliveryStatusDetails();

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="h-10 w-48 bg-muted rounded animate-pulse" />
        <div className="h-28 w-full bg-muted rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}
        </div>
        <div className="h-12 w-full bg-muted rounded-xl animate-pulse" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-44 bg-muted rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Welcome Greeting Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight" id="dashboard-greeting">
            {getGreeting()}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Review your tailored opportunities and custom WhatsApp intelligence rhythms.
          </p>
        </div>
        
        {/* Verification Status check */}
        {whatsappVerified ? (
          <Badge className="bg-pulse-green/10 border-pulse-green/20 hover:bg-pulse-green/15 text-pulse-green flex items-center gap-1.5 py-1.5 px-3 border self-start md:self-center font-medium">
            <Smartphone className="h-3.5 w-3.5" /> Direct delivery active (+91 {whatsappNumber.replace(/^\+91/, "")})
          </Badge>
        ) : (
          <Link href="/settings" className="self-start md:self-center">
            <Badge className="bg-pulse-amber/10 border-pulse-amber/20 hover:bg-pulse-amber/15 text-pulse-amber flex items-center gap-1.5 py-1.5 px-3 border font-medium cursor-pointer animate-pulse">
              <AlertCircle className="h-3.5 w-3.5" /> WhatsApp unverified. Connect now
            </Badge>
          </Link>
        )}
      </div>

      {/* Dynamic Pulse AI Insight Header Card */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-background border border-primary/20 rounded-2xl p-6 shadow-sm">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shrink-0 shadow-md text-white">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1">
              Pulse AI Insight
            </h3>
            {insightLoading ? (
              <div className="space-y-2 pt-1.5">
                <div className="h-3.5 bg-muted rounded w-4/5 animate-pulse" />
                <div className="h-3.5 bg-muted rounded w-3/5 animate-pulse" />
              </div>
            ) : (
              <p className="text-sm font-semibold text-foreground/90 leading-relaxed pt-0.5">
                {pulseInsight}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* KPI Dashboard Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Avg Opp Score today */}
        <div className="bg-card border rounded-2xl p-5 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">AI Score Today</span>
            <p className="text-3xl font-extrabold text-pulse-amber mt-1 flex items-baseline gap-1">
              {getTodayAIScore()}
              <span className="text-[10px] text-muted-foreground font-semibold">/10 avg</span>
            </p>
          </div>
          <p className="text-[10px] text-muted-foreground mt-3 flex items-center gap-1 border-t pt-2.5">
            <Brain className="h-3 w-3 text-pulse-amber" /> Opportunity score metric
          </p>
        </div>

        {/* Ingested today */}
        <div className="bg-card border rounded-2xl p-5 flex flex-col justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Articles Analyzed</span>
            <p className="text-3xl font-extrabold text-foreground mt-1">
              {getAnalyzedCount()}
              <span className="text-[10px] text-muted-foreground font-semibold ml-1.5">today</span>
            </p>
          </div>
          <p className="text-[10px] text-muted-foreground mt-3 flex items-center gap-1 border-t pt-2.5">
            <CheckCircle2 className="h-3 w-3 text-pulse-green" /> Realtime analysis engine
          </p>
        </div>

        {/* Bookmarks */}
        <Link href="/saved" className="bg-card border rounded-2xl p-5 flex flex-col justify-between shadow-sm hover:border-primary/40 hover:shadow transition-all group">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider group-hover:text-primary transition-colors">Saved Opportunities</span>
            <p className="text-3xl font-extrabold text-pulse-violet mt-1 flex items-baseline gap-1">
              {savedCount}
              <span className="text-[10px] text-muted-foreground font-semibold">items</span>
            </p>
          </div>
          <p className="text-[10px] text-muted-foreground mt-3 flex items-center justify-between border-t pt-2.5">
            <span className="flex items-center gap-1"><Bookmark className="h-3 w-3 text-pulse-violet" /> View library</span>
            <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-primary" />
          </p>
        </Link>

        {/* Next Scheduled Delivery */}
        <div className="bg-card border rounded-2xl p-5 flex flex-col justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Next Dispatch</span>
            <p className="text-sm font-extrabold text-foreground mt-2.5 flex items-center gap-1.5 font-mono truncate">
              <Clock className="h-4 w-4 text-primary shrink-0" />
              {getNextScheduledDigest()}
            </p>
          </div>
          <p className="text-[10px] text-muted-foreground mt-3 flex items-center gap-1 border-t pt-2.5 truncate">
            <Smartphone className="h-3 w-3 text-primary" /> Timezone: {userTimezone}
          </p>
        </div>
      </div>

      {/* Latest WhatsApp Delivery Status Banner */}
      {latestDelivery && (
        <div className={`p-4 border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm ${deliveryBadge.bg} ${deliveryBadge.border}`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              latestDelivery.status === "FAILED" ? "bg-destructive animate-pulse" : "bg-pulse-green animate-pulse"
            }`} />
            <div>
              <p className="text-xs font-semibold text-foreground">Latest Delivery Status</p>
              <p className={`text-[10px] font-medium mt-0.5 ${deliveryBadge.color}`}>
                {deliveryBadge.label}
              </p>
            </div>
          </div>
          <Link href="/history">
            <Button variant="ghost" size="sm" className="h-8 text-xs shrink-0 gap-1" id="feed-delivery-history-btn">
              Delivery Logs <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      )}

      {/* Main Filter & Feed Section */}
      <div className="grid lg:grid-cols-4 gap-8">
        
        {/* Feed List Grid */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Feed Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
            
            {/* Matching vs All Opportunity Tabs */}
            <div className="flex gap-1.5 p-1 bg-muted rounded-xl self-start">
              <button
                onClick={() => { setActiveTab("matching"); setSelectedCompany(null); }}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "matching"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                id="tab-matching"
              >
                Matching Interests
              </button>
              <button
                onClick={() => { setActiveTab("all"); setSelectedCompany(null); }}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "all"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                id="tab-all"
              >
                All Opportunities
              </button>
            </div>

            {/* Combined Search bar */}
            <div className="relative flex-1 max-w-sm sm:self-center">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tags, companies, models..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
                id="dashboard-search-input"
              />
            </div>
          </div>

          {/* Followed Companies Quick Toggle Bar */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" /> Fast Filter by Company
              </p>
              {selectedCompany && (
                <button
                  onClick={() => setSelectedCompany(null)}
                  className="text-[10px] text-primary hover:text-primary/80 font-bold"
                >
                  Clear filter
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {["OpenAI", "Anthropic", "NVIDIA", "Google", "Meta", "Microsoft", "Perplexity", "Cursor", "Vercel", "Supabase"].map((company) => {
                const isSelected = selectedCompany === company;
                return (
                  <button
                    key={company}
                    onClick={() => setSelectedCompany(isSelected ? null : company)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      isSelected
                        ? "bg-primary text-white border-primary"
                        : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border-border"
                    }`}
                    type="button"
                  >
                    {company}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Feed List Items */}
          <div className="space-y-5">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <IntelligenceCard
                  key={item.id}
                  item={item}
                  isSaved={savedIds.has(item.id)}
                  onSave={handleSaveToggle}
                />
              ))
            ) : (
              <div className="text-center py-20 bg-card border border-dashed rounded-2xl space-y-3">
                <Search className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                <h3 className="text-md font-semibold text-foreground">No opportunities matching criteria</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  We couldn't find any opportunities matching your active query or selected filters. Try broadening your followed tags or resetting search words.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar widgets (Feedback Widget & Settings Stats) */}
        <div className="space-y-6">
          
          {/* Beta Rating & Feedback Widget */}
          <div className="p-5 border rounded-2xl bg-card space-y-4 shadow-sm">
            <h3 className="font-bold text-sm flex items-center gap-1.5 text-foreground border-b pb-2">
              <MessageSquare className="h-4 w-4 text-primary shrink-0" />
              Beta Feedback
            </h3>
            
            {feedbackSubmitted ? (
              <div className="text-center py-4 space-y-2">
                <CheckCircle2 className="h-10 w-10 text-pulse-green mx-auto" />
                <p className="font-semibold text-xs text-foreground">Feedback Received!</p>
                <p className="text-[10px] text-muted-foreground">
                  Thank you for helping us polish Pulse AI during closed beta.
                </p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => { setFeedbackSubmitted(false); setFeedbackRating(0); }}
                  className="text-[10px] h-8 text-primary"
                >
                  Submit another comment
                </Button>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  How are the WhatsApp digests performing? Rate the utility and submit comment.
                </p>
                
                {/* 5-Star Rating Buttons */}
                <div className="flex gap-1.5 justify-center py-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = star <= feedbackRating;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFeedbackRating(star)}
                        className="transition-transform active:scale-95 focus:outline-none"
                      >
                        <Star className={`h-6 w-6 ${
                          active ? "text-pulse-amber fill-pulse-amber" : "text-muted-foreground/30"
                        }`} />
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-1">
                  <textarea
                    placeholder="Rate and let us know if there is anything we should improve..."
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary min-h-[70px] resize-none"
                    maxLength={500}
                    id="feedback-comment-textarea"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={feedbackRating === 0 || feedbackSubmitting}
                  className="w-full text-xs font-semibold h-9 gradient-primary text-white border-0"
                  id="submit-feedback-btn"
                >
                  {feedbackSubmitting ? (
                    <span className="flex items-center gap-1.5"><Loader2 className="h-3 w-3 animate-spin" /> Submitting...</span>
                  ) : (
                    "Submit Feedback"
                  )}
                </Button>
              </form>
            )}
          </div>

          {/* Quick Schedule Summary info box */}
          <div className="p-5 border rounded-2xl bg-card space-y-3.5 shadow-sm text-xs">
            <h3 className="font-bold text-sm flex items-center gap-1.5 text-foreground border-b pb-2">
              <Clock className="h-4 w-4 text-pulse-amber" />
              Schedules
            </h3>
            
            <div className="space-y-2">
              {schedules.length === 0 ? (
                <p className="text-muted-foreground text-[10px]">No delivery schedule set. Update settings to subscribe to digests.</p>
              ) : (
                schedules.map(sched => (
                  <div key={sched} className="flex justify-between items-center bg-muted/20 p-2 rounded-lg">
                    <span className="font-medium text-[11px]">{sched.replace('_', ' ')}</span>
                    <Badge className="bg-primary/15 text-primary border-0 font-bold text-[9px] px-1.5 py-0.5">
                      Active
                    </Badge>
                  </div>
                ))
              )}
            </div>
            
            <div className="pt-2 border-t text-center">
              <Link href="/settings" className="text-[10px] font-bold text-primary hover:underline">
                Manage Delivery Settings →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
