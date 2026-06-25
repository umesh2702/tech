"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ShieldAlert, Loader2, Users, Smartphone, Send, 
  CheckCircle2, AlertTriangle, Cpu, DollarSign, 
  BarChart3, RefreshCw, Layers, Compass, TrendingUp, Clock, Eye,
  Database, Calendar, Rss, Brain, Activity, MessageSquare,
  Download, Play, Pause, Search, User, ChevronRight, CornerDownRight,
  Settings, Terminal
} from "lucide-react";
import { toast } from "sonner";

interface MetricData {
  totalUsers: number;
  verifiedWhatsApp: number;
  newUsers: number;
  returningUsers: number;
  deliveriesToday: number;
  failedDeliveries: number;
  successRate: number;
  readRate: number;
  topCategories: { category: string; count: number }[];
  topInterests: { interest: string; count: number }[];
  geminiUsage: number;
  costEstimate: number;
  dau: number;
  avgOpportunityScore: number;
  avgDeliveryLatency: number;
  avgReadLatency: number;
  topCompanies: { company: string; count: number }[];
  mostOpenedArticles: { title: string; category: string; score: number; saves: number }[];
  schedulerPaused: boolean;
  lastBackupAt: string | null;
  health: {
    overall: number;
    database: { score: number; latencyMs: number };
    scheduler: { score: number; lastHeartbeat: string | null; minutesSinceLast: number | null };
    rss: { score: number; hoursSinceLastFetch: number };
    gemini: { score: number; errors24h: number };
    queue: { score: number; failed24h: number };
    whatsapp: { score: number; successRate20: number };
  };
  queues: {
    articles: { pending: number; processing: number; completed: number; failed: number };
    deliveries: { queued: number; sending: number; sent: number; failed: number };
  };
}

interface SystemLog {
  id: string;
  component: string;
  level: string;
  message: string;
  details: string | null;
  createdAt: string;
}

interface FailedQueueData {
  articles: {
    id: string;
    title: string;
    sourceName: string;
    category: string;
    opportunityScore: number;
    retryCount: number;
    errorMessage: string | null;
    updatedAt: string;
  }[];
  deliveries: {
    id: string;
    digestType: string;
    whatsappNumber: string;
    retryCount: number;
    errorMessage: string | null;
    createdAt: string;
    user: { name: string; email: string };
  }[];
}

interface SimulatorUser {
  id: string;
  name: string | null;
  email: string;
  timezone: string;
  localTime: string;
  whatsappNumber: string | null;
  whatsappVerified: boolean;
  notificationsEnabled: boolean;
  onboardingCompleted: boolean;
  schedules: {
    frequency: string;
    lastDeliveryAt: string | null;
    lastStatus: string | null;
    nextWindowLocal: string;
    nextWindowUTC: string;
    isDueNow: boolean;
  }[];
}

interface TimelineArticle {
  id: string;
  title: string;
  sourceName: string;
  sourceUrl: string;
  category: string;
  analysisStatus: string;
  opportunityScore: number;
  publishedAt: string;
  collectedAt: string;
  retryCount: number;
  analyzedAt: string | null;
}

interface TimelineDetailArticle extends TimelineArticle {
  founderScore: number;
  whatHappened: string | null;
  whyItMatters: string | null;
  opportunity: string | null;
  errorMessage: string | null;
  deliveries: {
    id: string;
    deliveryLog: {
      id: string;
      status: string;
      whatsappNumber: string;
      scheduledAt: string;
      sentAt: string | null;
      deliveredAt: string | null;
      retryCount: number;
      errorMessage: string | null;
      user: {
        name: string | null;
        email: string;
        whatsappNumber: string | null;
        timezone: string;
      };
    };
  }[];
}

export default function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"analytics" | "health" | "queues" | "logs" | "simulator" | "timeline" | "operations">("analytics");
  
  const [metrics, setMetrics] = useState<MetricData | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Logs state
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotalPages, setLogsTotalPages] = useState(1);
  const [logFilterLevel, setLogFilterLevel] = useState("ALL");
  const [logFilterComponent, setLogFilterComponent] = useState("ALL");

  // Queues DLQ state
  const [failedQueues, setFailedQueues] = useState<FailedQueueData | null>(null);
  const [queuesLoading, setQueuesLoading] = useState(false);
  const [reprocessingId, setReprocessingId] = useState<string | null>(null);

  // Simulator state
  const [simulatorUsers, setSimulatorUsers] = useState<SimulatorUser[]>([]);
  const [simulatorLoading, setSimulatorLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SimulatorUser | null>(null);

  // Timeline state
  const [timelineQuery, setTimelineQuery] = useState("");
  const [timelineArticles, setTimelineArticles] = useState<TimelineArticle[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<TimelineDetailArticle | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Operations actions loading
  const [opsLoading, setOpsLoading] = useState(false);

  // Authenticate user check role
  useEffect(() => {
    async function checkRole() {
      try {
        const res = await fetch("/api/user/settings");
        const json = await res.json();
        if (res.ok && json.data && json.data.role === "ADMIN") {
          setIsAdmin(true);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setAuthLoading(false);
      }
    }
    checkRole();
  }, []);

  const fetchMetrics = async (silent = false) => {
    if (!silent) setMetricsLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch("/api/admin/metrics");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load metrics");
      setMetrics(json.data);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load admin stats");
    } finally {
      setMetricsLoading(false);
      setRefreshing(false);
    }
  };

  // Load metrics once admin auth passes
  useEffect(() => {
    if (isAdmin) {
      fetchMetrics();
    }
  }, [isAdmin]);

  // Tab change handlers
  useEffect(() => {
    if (!isAdmin) return;
    if (activeTab === "logs") {
      fetchLogs(1);
    } else if (activeTab === "queues") {
      fetchFailedQueues();
    } else if (activeTab === "simulator") {
      fetchSimulatorUsers();
    } else if (activeTab === "timeline") {
      fetchTimelineArticles();
    }
  }, [activeTab, logFilterLevel, logFilterComponent]);

  // Logs fetching
  const fetchLogs = async (page = 1) => {
    setLogsLoading(true);
    try {
      const res = await fetch(`/api/admin/logs?page=${page}&limit=30&level=${logFilterLevel}&component=${logFilterComponent}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to fetch logs");
      setLogs(json.data.logs);
      setLogsPage(json.data.pagination.page);
      setLogsTotalPages(json.data.pagination.totalPages);
    } catch (err: any) {
      toast.error(err.message || "Could not read logs");
    } finally {
      setLogsLoading(false);
    }
  };

  // Queues fetching
  const fetchFailedQueues = async () => {
    setQueuesLoading(true);
    try {
      const res = await fetch("/api/admin/queues");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load queues");
      setFailedQueues(json.data);
    } catch (err: any) {
      toast.error(err.message || "Could not load queues");
    } finally {
      setQueuesLoading(false);
    }
  };

  // Simulator fetching
  const fetchSimulatorUsers = async () => {
    setSimulatorLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load simulator users");
      setSimulatorUsers(json.data);
      if (json.data.length > 0 && !selectedUser) {
        setSelectedUser(json.data[0]);
      } else if (selectedUser) {
        // Refresh selected user reference
        const updatedUser = json.data.find((u: SimulatorUser) => u.id === selectedUser.id);
        if (updatedUser) setSelectedUser(updatedUser);
      }
    } catch (err: any) {
      toast.error(err.message || "Could not load scheduler simulator");
    } finally {
      setSimulatorLoading(false);
    }
  };

  // Timeline list fetching
  const fetchTimelineArticles = async (query = "") => {
    setTimelineLoading(true);
    try {
      const url = query ? `/api/admin/timeline?query=${encodeURIComponent(query)}` : "/api/admin/timeline";
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load timeline articles");
      setTimelineArticles(json.data);
    } catch (err: any) {
      toast.error(err.message || "Could not query timeline");
    } finally {
      setTimelineLoading(false);
    }
  };

  // Timeline detail fetching
  const fetchTimelineDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/timeline?id=${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load article detail");
      setSelectedArticle(json.data);
    } catch (err: any) {
      toast.error(err.message || "Could not load article detail");
    } finally {
      setDetailLoading(false);
    }
  };

  // Trigger Operations handler
  const handleOperation = async (action: string, extraData: any = {}) => {
    setOpsLoading(true);
    try {
      const res = await fetch("/api/admin/operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extraData })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Operation failed");
      toast.success(json.message || "Operation executed successfully");
      
      // Refresh context
      await fetchMetrics(true);
      if (activeTab === "queues") fetchFailedQueues();
      if (activeTab === "simulator") fetchSimulatorUsers();
    } catch (err: any) {
      toast.error(err.message || "Operation failed");
    } finally {
      setOpsLoading(false);
    }
  };

  // Retry failed queue items
  const handleRetryJob = async (type: "article" | "delivery", id: string) => {
    setReprocessingId(id);
    try {
      const res = await fetch("/api/admin/operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "retryJob", type, id })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to re-enqueue job");
      toast.success(json.message || "Job enqueued successfully!");
      fetchFailedQueues();
      fetchMetrics(true);
      if (selectedArticle && selectedArticle.id === id) {
        fetchTimelineDetail(id);
      }
    } catch (err: any) {
      toast.error(err.message || "Retry failed");
    } finally {
      setReprocessingId(null);
    }
  };

  // Manual Backup download
  const handleBackupDownload = async () => {
    setOpsLoading(true);
    try {
      const res = await fetch("/api/admin/operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "triggerBackup" })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Backup failed");
      
      // Generate client-side JSON download
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(json.data.data, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `pulse-ai-db-export-${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      
      toast.success("Manual JSON export completed and downloaded successfully!");
      fetchMetrics(true);
    } catch (err: any) {
      toast.error(err.message || "Could not run backup");
    } finally {
      setOpsLoading(false);
    }
  };

  // Return level color for console logging UI
  const getLogLevelClass = (level: string) => {
    switch (level) {
      case "ERROR": return "bg-destructive/15 text-destructive border-destructive/20";
      case "WARN": return "bg-pulse-amber/15 text-pulse-amber border-pulse-amber/20";
      case "ALERT_SENT": return "bg-pulse-violet/15 text-pulse-violet border-pulse-violet/20";
      default: return "bg-muted text-muted-foreground border-muted/50";
    }
  };

  // Render Platform Health gauge color
  const getHealthColor = (score: number) => {
    if (score >= 90) return "text-pulse-green";
    if (score >= 70) return "text-pulse-amber";
    return "text-destructive";
  };

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-muted-foreground text-xs">Authenticating credentials...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="flex flex-col items-center justify-center text-center p-8 bg-card border rounded-2xl max-w-md w-full space-y-4 shadow-sm">
          <div className="w-14 h-14 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center shadow-inner">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold">Access Denied</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            This internal admin portal is restricted to authorized operations personnel. If you need access, contact developer tools.
          </p>
          <Button onClick={() => window.location.href = "/feed"} className="gradient-primary text-white border-0 px-6 h-10 w-full rounded-xl">
            Return to Feed
          </Button>
        </div>
      </div>
    );
  }

  if (metricsLoading || !metrics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-muted-foreground text-xs">Compiling platform diagnostics...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-5 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-1 flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary" /> Pulse AI Command Center
          </h1>
          <p className="text-sm text-muted-foreground">
            Operational dashboard. Monitor system health scores, reprocess failed alerts, simulate user deliveries, and export backups.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {metrics.schedulerPaused && (
            <Badge className="bg-destructive/10 text-destructive border-destructive/20 font-bold flex items-center gap-1 py-1.5 px-3">
              <Pause className="h-3 w-3" /> SCHEDULER PAUSED GLOBALLY
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchMetrics(true)}
            disabled={refreshing}
            className="h-9 gap-1.5 rounded-xl border border-muted/80"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh Stats"}
          </Button>
        </div>
      </div>

      {/* Tabs list navigation */}
      <div className="flex flex-wrap gap-2 border-b pb-3">
        {[
          { id: "analytics", label: "Product Analytics", icon: BarChart3 },
          { id: "health", label: "System Health Score", icon: Activity },
          { id: "queues", label: "Queue Monitor (DLQ)", icon: Layers },
          { id: "logs", label: "System Logs", icon: Terminal },
          { id: "simulator", label: "Scheduler Simulator", icon: Calendar },
          { id: "timeline", label: "Job Timeline", icon: Clock },
          { id: "operations", label: "Operations Panel", icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              onClick={() => setActiveTab(tab.id as any)}
              className={`h-9 px-4 rounded-xl text-xs font-semibold ${
                activeTab === tab.id 
                  ? "gradient-primary text-white border-0" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <Icon className="h-3.5 w-3.5 mr-1.5" />
              {tab.label}
              {tab.id === "queues" && (metrics.queues.articles.failed + metrics.queues.deliveries.failed) > 0 && (
                <span className="ml-1.5 bg-destructive text-white rounded-full px-1.5 py-0.5 text-[9px] font-bold">
                  {metrics.queues.articles.failed + metrics.queues.deliveries.failed}
                </span>
              )}
            </Button>
          );
        })}
      </div>

      {/* ──────────────────────────────────────────────────────── */}
      {/* TAB 1: PRODUCT ANALYTICS */}
      {/* ──────────────────────────────────────────────────────── */}
      {activeTab === "analytics" && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Top Level Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Users */}
            <div className="bg-card border rounded-2xl p-5 relative overflow-hidden shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Users</span>
                  <p className="text-3xl font-black text-foreground mt-1">{metrics.totalUsers}</p>
                </div>
                <Users className="h-5 w-5 text-primary opacity-80" />
              </div>
              <div className="text-[9px] text-muted-foreground mt-3 flex items-center gap-1 border-t pt-2.5">
                <Badge variant="outline" className="text-[8px] bg-pulse-green/10 text-pulse-green border-0 font-bold px-1 py-0.5">
                  +{metrics.newUsers} 7d
                </Badge>
                <span>New signups this week</span>
              </div>
            </div>

            {/* Verified Phone Numbers */}
            <div className="bg-card border rounded-2xl p-5 relative overflow-hidden shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Verified WhatsApp</span>
                  <p className="text-3xl font-black text-pulse-green mt-1">{metrics.verifiedWhatsApp}</p>
                </div>
                <Smartphone className="h-5 w-5 text-pulse-green opacity-80" />
              </div>
              <div className="text-[9px] text-muted-foreground mt-3 flex items-center gap-1 border-t pt-2.5">
                <span>
                  {metrics.totalUsers > 0 ? Math.round((metrics.verifiedWhatsApp / metrics.totalUsers) * 100) : 0}% verification rate
                </span>
              </div>
            </div>

            {/* Deliveries Today */}
            <div className="bg-card border rounded-2xl p-5 relative overflow-hidden shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Deliveries Today</span>
                  <p className="text-3xl font-black text-foreground mt-1">{metrics.deliveriesToday}</p>
                </div>
                <Send className="h-5 w-5 text-primary opacity-80" />
              </div>
              <div className="text-[9px] text-muted-foreground mt-3 flex items-center gap-1 border-t pt-2.5 text-destructive font-semibold">
                {metrics.failedDeliveries > 0 ? (
                  <span className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> {metrics.failedDeliveries} failed dispatches</span>
                ) : (
                  <span className="text-pulse-green">✓ All dispatches successful</span>
                )}
              </div>
            </div>

            {/* API Cost Estimates */}
            <div className="bg-card border rounded-2xl p-5 relative overflow-hidden shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Est. Gemini Costs</span>
                  <p className="text-3xl font-black text-pulse-amber mt-1">${metrics.costEstimate}</p>
                </div>
                <DollarSign className="h-5 w-5 text-pulse-amber opacity-80" />
              </div>
              <div className="text-[9px] text-muted-foreground mt-3 flex items-center gap-1 border-t pt-2.5">
                <Cpu className="h-3 w-3 text-pulse-amber" />
                <span>{metrics.geminiUsage} calls processed</span>
              </div>
            </div>
          </div>

          {/* Latency & Engagement Stats Banner */}
          <div className="bg-card border rounded-2xl p-5 grid grid-cols-2 md:grid-cols-4 gap-6 shadow-sm">
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Daily Active Users</span>
              <p className="text-2xl font-extrabold text-foreground mt-1">{metrics.dau}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Avg opportunity score</span>
              <p className="text-2xl font-extrabold text-pulse-amber mt-1">{metrics.avgOpportunityScore}/10</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Delivery Latency</span>
              <p className="text-2xl font-extrabold text-foreground mt-1 flex items-baseline gap-1">
                {metrics.avgDeliveryLatency}
                <span className="text-[10px] text-muted-foreground font-semibold">seconds</span>
              </p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Read Latency</span>
              <p className="text-2xl font-extrabold text-foreground mt-1 flex items-baseline gap-1">
                {metrics.avgReadLatency}
                <span className="text-[10px] text-muted-foreground font-semibold">seconds</span>
              </p>
            </div>
          </div>

          {/* Detailed Analytics Grid */}
          <div className="grid md:grid-cols-2 gap-8">
            
            {/* Left Side: Product analytics & followed tags */}
            <div className="space-y-6">
              
              {/* Most Followed Companies Presets */}
              <div className="p-6 border rounded-2xl bg-card space-y-4 shadow-sm">
                <h2 className="text-md font-bold flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4.5 w-4.5 text-pulse-green" /> Most Followed Companies
                </h2>
                <div className="space-y-2.5">
                  {metrics.topCompanies.length > 0 ? (
                    metrics.topCompanies.map((c, i) => (
                      <div key={c.company} className="flex items-center justify-between p-2.5 bg-muted/20 border rounded-lg text-xs">
                        <span className="font-semibold flex items-center gap-2">
                          <span className="text-muted-foreground">#{i+1}</span> {c.company}
                        </span>
                        <Badge className="bg-primary/10 text-primary border-0 font-bold">{c.count} followers</Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">No companies followed yet.</p>
                  )}
                </div>
              </div>

              {/* Interests and Keywords cloud */}
              <div className="p-6 border rounded-2xl bg-card space-y-4 shadow-sm">
                <h2 className="text-md font-bold flex items-center gap-2 mb-2">
                  <Layers className="h-4.5 w-4.5 text-primary" /> Top User Interest Keywords
                </h2>
                <div className="flex flex-wrap gap-2 pt-1.5">
                  {metrics.topInterests.length > 0 ? (
                    metrics.topInterests.map((interest) => (
                      <span
                        key={interest.interest}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/5 text-primary border border-primary/15"
                      >
                        {interest.interest}
                        <Badge className="bg-primary/20 text-primary font-bold border-0 text-[10px] h-4.5 min-w-4 px-1 rounded-full flex items-center justify-center">
                          {interest.count}
                        </Badge>
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">No interest preferences seeded.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Side: Popular opportunities & Delivery stats */}
            <div className="space-y-6">
              
              {/* Most Saved Opportunities */}
              <div className="p-6 border rounded-2xl bg-card space-y-4 shadow-sm">
                <h2 className="text-md font-bold flex items-center gap-2 mb-2">
                  <Eye className="h-4.5 w-4.5 text-pulse-violet" /> Most Bookmarked Opportunities
                </h2>
                <div className="space-y-3">
                  {metrics.mostOpenedArticles.length > 0 ? (
                    metrics.mostOpenedArticles.map((article, i) => (
                      <div key={i} className="p-3 bg-muted/20 border rounded-xl space-y-1.5 text-xs">
                        <div className="flex justify-between items-start gap-2">
                          <p className="font-bold text-foreground leading-tight line-clamp-1">{article.title}</p>
                          <Badge className="bg-pulse-violet/10 text-pulse-violet border-0 shrink-0 font-bold">
                            {article.saves} bookmarks
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span>Category: {article.category}</span>
                          <span>•</span>
                          <span>Score: {article.score}/10</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">No bookmarked opportunities in database.</p>
                  )}
                </div>
              </div>

              {/* Delivery Rates detail block */}
              <div className="p-6 border rounded-2xl bg-card space-y-4 shadow-sm">
                <h2 className="text-md font-bold flex items-center gap-2 mb-2">
                  <Compass className="h-4.5 w-4.5 text-pulse-amber" /> Dispatch Delivery Health
                </h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border bg-muted/20 rounded-xl space-y-1.5 text-center">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Success Rate</span>
                    <p className="text-2xl font-black text-pulse-green">{metrics.successRate}%</p>
                    <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                      <div className="bg-pulse-green h-full rounded-full" style={{ width: `${metrics.successRate}%` }} />
                    </div>
                  </div>
                  <div className="p-4 border bg-muted/20 rounded-xl space-y-1.5 text-center">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Read Rate</span>
                    <p className="text-2xl font-black text-sky-500">{metrics.readRate}%</p>
                    <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                      <div className="bg-sky-500 h-full rounded-full" style={{ width: `${metrics.readRate}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* TAB 2: SYSTEM HEALTH SCORE */}
      {/* ──────────────────────────────────────────────────────── */}
      {activeTab === "health" && (
        <div className="space-y-8 animate-in fade-in duration-200">
          
          {/* Health Score Overview Panel */}
          <div className="p-6 border rounded-3xl bg-card flex flex-col md:flex-row items-center gap-8 shadow-sm">
            <div className="flex-shrink-0 flex flex-col items-center justify-center p-8 bg-muted/20 border rounded-2xl w-48 h-48 relative overflow-hidden">
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground mb-1">Overall Health</span>
              <p className={`text-6xl font-black ${getHealthColor(metrics.health.overall)}`}>
                {metrics.health.overall}%
              </p>
              <div className="mt-3 flex gap-0.5 items-center">
                <div className={`w-2.5 h-2.5 rounded-full ${metrics.health.overall >= 80 ? "bg-pulse-green" : "bg-pulse-amber"} animate-pulse`} />
                <span className="text-[9px] font-bold text-muted-foreground uppercase">
                  {metrics.health.overall >= 90 ? "Excellent" : metrics.health.overall >= 70 ? "Degraded" : "Critical"}
                </span>
              </div>
            </div>
            
            <div className="space-y-3 flex-1">
              <h2 className="text-xl font-bold">Platform Status Matrix</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Platform health is dynamically computed from active constituent parameters. The scoring system reflects API latencies, sync delay, queue processing backlogs, and Gemini + Meta Cloud API failure counts. Alert systems debounce warning notifications to prevent alert fatigue.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/35 px-3 py-1.5 rounded-xl border border-muted/50">
                  <Database className="h-4 w-4 text-primary" />
                  <span>DB Latency: <strong className="text-foreground">{metrics.health.database.latencyMs}ms</strong></span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/35 px-3 py-1.5 rounded-xl border border-muted/50">
                  <MessageSquare className="h-4 w-4 text-pulse-green" />
                  <span>WhatsApp Deliveries: <strong className="text-foreground">{metrics.health.whatsapp.successRate20}% Success</strong></span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/35 px-3 py-1.5 rounded-xl border border-muted/50">
                  <Terminal className="h-4 w-4 text-pulse-violet" />
                  <span>Scheduler Heartbeat: <strong className="text-foreground">{metrics.health.scheduler.minutesSinceLast ? `${Math.round(metrics.health.scheduler.minutesSinceLast)}m ago` : "None"}</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Component score breakdown grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* 1. Database Health */}
            <div className="bg-card border rounded-2xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                    <Database className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">PostgreSQL Database</h3>
                    <p className="text-[10px] text-muted-foreground">Supabase cloud persistence</p>
                  </div>
                </div>
                <Badge className={`font-black text-xs border-0 px-2 py-0.5 ${
                  metrics.health.database.score >= 90 ? "bg-pulse-green/10 text-pulse-green" : "bg-pulse-amber/10 text-pulse-amber"
                }`}>
                  {metrics.health.database.score}/100
                </Badge>
              </div>
              <div className="space-y-1 pt-2 border-t text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ping Latency:</span>
                  <span className="font-semibold text-foreground">{metrics.health.database.latencyMs} ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Capacity threshold:</span>
                  <span className="text-pulse-green font-semibold">Healthy (&lt; 200ms)</span>
                </div>
              </div>
            </div>

            {/* 2. Scheduler Health */}
            <div className="bg-card border rounded-2xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="p-2.5 bg-pulse-violet/10 text-pulse-violet rounded-xl">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Scheduler Cron</h3>
                    <p className="text-[10px] text-muted-foreground">Inngest background cron trigger</p>
                  </div>
                </div>
                <Badge className={`font-black text-xs border-0 px-2 py-0.5 ${
                  metrics.health.scheduler.score >= 90 ? "bg-pulse-green/10 text-pulse-green" : "bg-pulse-amber/10 text-pulse-amber"
                }`}>
                  {metrics.health.scheduler.score}/100
                </Badge>
              </div>
              <div className="space-y-1 pt-2 border-t text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Heartbeat:</span>
                  <span className="font-semibold text-foreground">
                    {metrics.health.scheduler.lastHeartbeat 
                      ? new Date(metrics.health.scheduler.lastHeartbeat).toLocaleTimeString() 
                      : "Never"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Heartbeat interval:</span>
                  <span className="font-semibold text-foreground">
                    {metrics.health.scheduler.minutesSinceLast 
                      ? `${Math.round(metrics.health.scheduler.minutesSinceLast)} min ago` 
                      : "Out of bounds"}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. RSS Ingestion Health */}
            <div className="bg-card border rounded-2xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="p-2.5 bg-pulse-green/10 text-pulse-green rounded-xl">
                    <Rss className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">RSS Feed Ingestor</h3>
                    <p className="text-[10px] text-muted-foreground">Feed reading & change detection</p>
                  </div>
                </div>
                <Badge className={`font-black text-xs border-0 px-2 py-0.5 ${
                  metrics.health.rss.score >= 90 ? "bg-pulse-green/10 text-pulse-green" : "bg-pulse-amber/10 text-pulse-amber"
                }`}>
                  {metrics.health.rss.score}/100
                </Badge>
              </div>
              <div className="space-y-1 pt-2 border-t text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Feed Sync Age:</span>
                  <span className="font-semibold text-foreground">
                    {metrics.health.rss.hoursSinceLastFetch > 0 
                      ? `${metrics.health.rss.hoursSinceLastFetch.toFixed(1)} hours ago` 
                      : "No active fetches"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Enabled sources:</span>
                  <span className="font-semibold text-foreground">
                    {metrics.totalUsers ? "Active & Synced" : "No Sources"}
                  </span>
                </div>
              </div>
            </div>

            {/* 4. Gemini AI Analyzer Health */}
            <div className="bg-card border rounded-2xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="p-2.5 bg-pulse-amber/10 text-pulse-amber rounded-xl">
                    <Brain className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Gemini Opportunity Engine</h3>
                    <p className="text-[10px] text-muted-foreground">AI model API analysis & score</p>
                  </div>
                </div>
                <Badge className={`font-black text-xs border-0 px-2 py-0.5 ${
                  metrics.health.gemini.score >= 90 ? "bg-pulse-green/10 text-pulse-green" : "bg-pulse-amber/10 text-pulse-amber"
                }`}>
                  {metrics.health.gemini.score}/100
                </Badge>
              </div>
              <div className="space-y-1 pt-2 border-t text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">API Errors (24h):</span>
                  <span className={`font-semibold ${metrics.health.gemini.errors24h > 0 ? "text-destructive" : "text-pulse-green"}`}>
                    {metrics.health.gemini.errors24h} failures
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Concurrency limit:</span>
                  <span className="font-semibold text-foreground">5 active workers</span>
                </div>
              </div>
            </div>

            {/* 5. Inngest Queue & DLQ Health */}
            <div className="bg-card border rounded-2xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="p-2.5 bg-indigo-500/10 text-indigo-500 rounded-xl">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Task Queue (Inngest)</h3>
                    <p className="text-[10px] text-muted-foreground">Background workers & retries</p>
                  </div>
                </div>
                <Badge className={`font-black text-xs border-0 px-2 py-0.5 ${
                  metrics.health.queue.score >= 90 ? "bg-pulse-green/10 text-pulse-green" : "bg-pulse-amber/10 text-pulse-amber"
                }`}>
                  {metrics.health.queue.score}/100
                </Badge>
              </div>
              <div className="space-y-1 pt-2 border-t text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Failed Jobs (24h):</span>
                  <span className={`font-semibold ${metrics.health.queue.failed24h > 0 ? "text-destructive" : "text-pulse-green"}`}>
                    {metrics.health.queue.failed24h} jobs in DLQ
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Active Processing:</span>
                  <span className="font-semibold text-foreground">
                    {metrics.queues.articles.processing} articles, {metrics.queues.deliveries.sending} sending
                  </span>
                </div>
              </div>
            </div>

            {/* 6. WhatsApp Cloud API Health */}
            <div className="bg-card border rounded-2xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">WhatsApp Cloud API</h3>
                    <p className="text-[10px] text-muted-foreground">Meta Graph message dispatch</p>
                  </div>
                </div>
                <Badge className={`font-black text-xs border-0 px-2 py-0.5 ${
                  metrics.health.whatsapp.score >= 90 ? "bg-pulse-green/10 text-pulse-green" : "bg-pulse-amber/10 text-pulse-amber"
                }`}>
                  {metrics.health.whatsapp.score}/100
                </Badge>
              </div>
              <div className="space-y-1 pt-2 border-t text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Success Rate (Last 20):</span>
                  <span className="font-semibold text-foreground">{metrics.health.whatsapp.successRate20}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Throttling control:</span>
                  <span className="font-semibold text-foreground">Sequential (concurrency: 1)</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* TAB 3: QUEUE MONITOR (DLQ) */}
      {/* ──────────────────────────────────────────────────────── */}
      {activeTab === "queues" && (
        <div className="space-y-8 animate-in fade-in duration-200">
          
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" /> Dead Letter Queue (DLQ)
              </h2>
              <p className="text-xs text-muted-foreground">
                Observe and manually reprocess failed background tasks. Inngest automatically executes 3 retries with backoff. Items remaining here are in final failure states.
              </p>
            </div>
            <Button
              variant="outline"
              size="xs"
              onClick={fetchFailedQueues}
              disabled={queuesLoading}
              className="text-[11px] rounded-lg h-8"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${queuesLoading ? "animate-spin" : ""}`} />
              Refresh DLQ
            </Button>
          </div>

          {queuesLoading && !failedQueues ? (
            <div className="flex flex-col items-center justify-center p-12 border bg-card rounded-2xl gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-muted-foreground text-xs">Loading queue items...</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-8">
              
              {/* Failed Article Analysis */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    <Brain className="h-4 w-4 text-pulse-amber" /> Failed Article Analyses
                    <Badge variant="outline" className="text-[10px] bg-amber-500/5 text-pulse-amber font-bold border-pulse-amber/20 px-1.5 py-0.5">
                      {failedQueues?.articles.length || 0} failed
                    </Badge>
                  </h3>
                </div>

                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                  {failedQueues?.articles && failedQueues.articles.length > 0 ? (
                    failedQueues.articles.map((art) => (
                      <div key={art.id} className="p-4 bg-card border rounded-2xl space-y-3 shadow-sm text-xs border-destructive/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 left-0 h-1 bg-destructive/10" />
                        <div>
                          <div className="flex justify-between items-start gap-2 mb-1">
                            <span className="font-bold text-foreground line-clamp-1 leading-tight">{art.title}</span>
                            <Badge className="bg-destructive/10 text-destructive border-0 shrink-0 font-bold text-[9px] px-1.5 py-0.25">
                              Retried {art.retryCount}x
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                            <span>Source: {art.sourceName}</span>
                            <span>•</span>
                            <span>{new Date(art.updatedAt).toLocaleTimeString()}</span>
                          </div>
                        </div>

                        {art.errorMessage && (
                          <div className="p-2.5 bg-destructive/5 rounded-xl border border-destructive/10 text-[10px] font-mono text-destructive break-words max-h-20 overflow-y-auto">
                            {art.errorMessage}
                          </div>
                        )}

                        <div className="flex justify-between items-center gap-2 pt-1">
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => {
                              setActiveTab("timeline");
                              setTimelineQuery(art.title);
                              fetchTimelineArticles(art.title);
                            }}
                            className="h-8 text-[10px] rounded-lg"
                          >
                            Inspect Lifecycle
                          </Button>
                          <Button
                            onClick={() => handleRetryJob("article", art.id)}
                            disabled={reprocessingId === art.id}
                            className="gradient-primary text-white border-0 h-8 text-[10px] rounded-lg px-3"
                          >
                            {reprocessingId === art.id ? (
                              <><Loader2 className="h-3 w-3 animate-spin mr-1" /> Enqueueing...</>
                            ) : (
                              "Reprocess Analysis"
                            )}
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center p-12 bg-muted/10 border rounded-2xl text-xs text-muted-foreground">
                      No failed article analyses in DLQ.
                    </div>
                  )}
                </div>
              </div>

              {/* Failed WhatsApp Deliveries */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-emerald-500" /> Failed WhatsApp Deliveries
                    <Badge variant="outline" className="text-[10px] bg-emerald-500/5 text-emerald-500 font-bold border-emerald-500/20 px-1.5 py-0.5">
                      {failedQueues?.deliveries.length || 0} failed
                    </Badge>
                  </h3>
                </div>

                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                  {failedQueues?.deliveries && failedQueues.deliveries.length > 0 ? (
                    failedQueues.deliveries.map((del) => (
                      <div key={del.id} className="p-4 bg-card border rounded-2xl space-y-3 shadow-sm text-xs border-destructive/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 left-0 h-1 bg-destructive/10" />
                        <div>
                          <div className="flex justify-between items-start gap-2 mb-1">
                            <span className="font-bold text-foreground">To: {del.user.name}</span>
                            <Badge className="bg-destructive/10 text-destructive border-0 shrink-0 font-bold text-[9px] px-1.5 py-0.25">
                              Retried {del.retryCount}x
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                            <span>Phone: {del.whatsappNumber}</span>
                            <span>•</span>
                            <span>Type: {del.digestType}</span>
                            <span>•</span>
                            <span>{new Date(del.createdAt).toLocaleTimeString()}</span>
                          </div>
                        </div>

                        {del.errorMessage && (
                          <div className="p-2.5 bg-destructive/5 rounded-xl border border-destructive/10 text-[10px] font-mono text-destructive break-words max-h-20 overflow-y-auto">
                            {del.errorMessage}
                          </div>
                        )}

                        <div className="flex justify-end pt-1">
                          <Button
                            onClick={() => handleRetryJob("delivery", del.id)}
                            disabled={reprocessingId === del.id}
                            className="gradient-primary text-white border-0 h-8 text-[10px] rounded-lg px-3"
                          >
                            {reprocessingId === del.id ? (
                              <><Loader2 className="h-3 w-3 animate-spin mr-1" /> Retrying...</>
                            ) : (
                              "Retry Delivery Dispatch"
                            )}
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center p-12 bg-muted/10 border rounded-2xl text-xs text-muted-foreground">
                      No failed WhatsApp dispatches in DLQ.
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* TAB 4: SYSTEM LOGS TERMINAL */}
      {/* ──────────────────────────────────────────────────────── */}
      {activeTab === "logs" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Terminal className="h-5 w-5 text-pulse-violet" /> System Logs Console
              </h2>
              <p className="text-xs text-muted-foreground">
                Stdout capture of running background processes. Automatically writes error logs to the PostgreSQL event record.
              </p>
            </div>
            
            {/* Filters panel */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={logFilterComponent}
                onChange={(e) => { setLogFilterComponent(e.target.value); setLogsPage(1); }}
                className="bg-card border border-muted/80 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none"
              >
                <option value="ALL">All Components</option>
                <option value="RSS">RSS Ingestor</option>
                <option value="GEMINI">Gemini AI Engine</option>
                <option value="WHATSAPP">WhatsApp API</option>
                <option value="SCHEDULER">Scheduler Cron</option>
                <option value="DATABASE">Postgres DB</option>
                <option value="BACKUP">Backup Snapshot</option>
              </select>

              <select
                value={logFilterLevel}
                onChange={(e) => { setLogFilterLevel(e.target.value); setLogsPage(1); }}
                className="bg-card border border-muted/80 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none"
              >
                <option value="ALL">All Severity levels</option>
                <option value="INFO">INFO</option>
                <option value="WARN">WARN</option>
                <option value="ERROR">ERROR</option>
                <option value="ALERT_SENT">ALERT SENT</option>
              </select>

              <Button
                variant="outline"
                onClick={() => fetchLogs(logsPage)}
                disabled={logsLoading}
                className="h-8.5 rounded-xl text-xs"
              >
                <RefreshCw className={`h-3 w-3 mr-1.5 ${logsLoading ? "animate-spin" : ""}`} />
                Refresh Logs
              </Button>
            </div>
          </div>

          {/* Console Output box */}
          <div className="border bg-slate-950 text-slate-100 rounded-3xl overflow-hidden font-mono text-xs shadow-inner flex flex-col h-[50vh]">
            <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">pulse-ai-runtime.log</span>
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              </div>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto space-y-2 select-text scrollbar-thin">
              {logsLoading && logs.length === 0 ? (
                <div className="flex justify-center items-center h-full gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                  <span className="text-slate-400">Streaming logs...</span>
                </div>
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <div key={log.id} className="border-b border-slate-900/60 pb-1.5 last:border-b-0 space-y-1">
                    <div className="flex flex-wrap items-baseline gap-2 text-[10px] md:text-xs">
                      <span className="text-slate-500">[{new Date(log.createdAt).toISOString()}]</span>
                      <Badge variant="outline" className={`text-[9px] px-1 py-0 border shrink-0 font-bold ${getLogLevelClass(log.level)}`}>
                        {log.level}
                      </Badge>
                      <span className="text-sky-400 font-bold">{log.component}</span>
                      <span className="text-slate-200 select-text leading-tight">{log.message}</span>
                    </div>
                    {log.details && (
                      <pre className="pl-4 text-[10px] text-slate-400 leading-relaxed overflow-x-auto whitespace-pre-wrap select-text bg-slate-900/40 p-2 rounded-lg border border-slate-900">
                        {log.details}
                      </pre>
                    )}
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500">
                  No log entries matched selected filters.
                </div>
              )}
            </div>
          </div>

          {/* Pagination controls */}
          {logsTotalPages > 1 && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                Page {logsPage} of {logsTotalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={logsPage === 1 || logsLoading}
                  onClick={() => fetchLogs(logsPage - 1)}
                  className="rounded-xl"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={logsPage === logsTotalPages || logsLoading}
                  onClick={() => fetchLogs(logsPage + 1)}
                  className="rounded-xl"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* TAB 5: SCHEDULER SIMULATOR */}
      {/* ──────────────────────────────────────────────────────── */}
      {activeTab === "simulator" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-pulse-violet" /> Scheduler Simulator
            </h2>
            <p className="text-xs text-muted-foreground">
              Inspect user timezones, configured active schedules, and calculate upcoming delivery windows in both UTC and user local times.
            </p>
          </div>

          {simulatorLoading && simulatorUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 border bg-card rounded-2xl gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-muted-foreground text-xs">Simulating schedules...</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              
              {/* Left Side: Users selector */}
              <div className="border rounded-2xl bg-card p-4 space-y-3 shadow-sm max-h-[60vh] overflow-y-auto">
                <h3 className="text-xs font-extrabold uppercase text-muted-foreground tracking-wider mb-2">Select User for Simulation</h3>
                {simulatorUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className={`w-full text-left p-3.5 border rounded-xl flex flex-col gap-1 transition-all text-xs ${
                      selectedUser?.id === user.id 
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-muted hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="font-bold text-foreground leading-none flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-muted-foreground" /> {user.name || "Anonymous Beta"}
                      </span>
                      {user.whatsappVerified ? (
                        <Badge className="bg-pulse-green/10 text-pulse-green border-0 text-[8px] font-bold px-1 py-0">Verified</Badge>
                      ) : (
                        <Badge className="bg-muted text-muted-foreground border-0 text-[8px] font-bold px-1 py-0">Unverified</Badge>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground">{user.email}</span>
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-2 border-t pt-1.5 w-full">
                      <span>TZ: {user.timezone}</span>
                      <span className="font-semibold text-foreground">{user.localTime}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Right Side: Selected user scheduling simulation */}
              <div className="md:col-span-2 space-y-6">
                {selectedUser ? (
                  <div className="border bg-card rounded-2xl p-6 space-y-6 shadow-sm">
                    {/* User Metadata */}
                    <div className="border-b pb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                          {selectedUser.name || "Anonymous User"}
                        </h3>
                        <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <Badge className="bg-muted border text-foreground rounded-lg py-1 px-2.5 text-xs font-semibold">
                          Timezone: {selectedUser.timezone}
                        </Badge>
                        <Badge className="bg-muted border text-foreground rounded-lg py-1 px-2.5 text-xs font-semibold">
                          Local Time: {selectedUser.localTime}
                        </Badge>
                      </div>
                    </div>

                    {/* Preferences indicator */}
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="bg-muted/15 border p-3.5 rounded-xl space-y-1">
                        <span className="text-muted-foreground font-semibold text-[10px] uppercase tracking-wider">Notifications Toggle</span>
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${selectedUser.notificationsEnabled ? "bg-pulse-green" : "bg-destructive"} animate-pulse`} />
                          <span className="font-bold text-foreground">
                            {selectedUser.notificationsEnabled ? "ENABLED" : "DISABLED"}
                          </span>
                        </div>
                      </div>

                      <div className="bg-muted/15 border p-3.5 rounded-xl space-y-1">
                        <span className="text-muted-foreground font-semibold text-[10px] uppercase tracking-wider">Onboarding State</span>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className={`h-4.5 w-4.5 ${selectedUser.onboardingCompleted ? "text-pulse-green" : "text-muted-foreground"}`} />
                          <span className="font-bold text-foreground">
                            {selectedUser.onboardingCompleted ? "COMPLETED" : "PENDING"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Schedule simulator breakdown */}
                    <div className="space-y-4">
                      <h4 className="font-bold text-sm">Configured Schedule Simulators</h4>
                      
                      {selectedUser.schedules && selectedUser.schedules.length > 0 ? (
                        <div className="space-y-3.5">
                          {selectedUser.schedules.map((schedule) => (
                            <div key={schedule.frequency} className="p-4 border bg-card rounded-2xl shadow-sm text-xs relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="space-y-1.5 flex-1">
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-primary/10 text-primary border-0 font-bold px-2 py-0.5">
                                    {schedule.frequency}
                                  </Badge>
                                  {schedule.isDueNow ? (
                                    <Badge className="bg-pulse-amber/10 text-pulse-amber border-pulse-amber/20 border font-extrabold px-1.5 py-0">
                                      DUE FOR DISPATCH
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-muted text-muted-foreground border-0 font-bold px-1.5 py-0">
                                      PENDING WAIT
                                    </Badge>
                                  )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] pt-1">
                                  <div>
                                    <span className="text-muted-foreground">Next target (Local): </span>
                                    <strong className="text-foreground">{schedule.nextWindowLocal}</strong>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Next target (UTC): </span>
                                    <strong className="text-foreground">{new Date(schedule.nextWindowUTC).toLocaleString()}</strong>
                                  </div>
                                </div>
                              </div>

                              <div className="border-l md:pl-4 text-[11px] text-muted-foreground space-y-1 flex-shrink-0 md:w-48">
                                <div>
                                  Last Delivery At:<br />
                                  <strong className="text-foreground text-[10px]">
                                    {schedule.lastDeliveryAt ? new Date(schedule.lastDeliveryAt).toLocaleString() : "None"}
                                  </strong>
                                </div>
                                <div>
                                  Last Dispatch Status:{" "}
                                  <strong className={`${
                                    schedule.lastStatus === "SENT" || schedule.lastStatus === "READ" || schedule.lastStatus === "DELIVERED"
                                      ? "text-pulse-green"
                                      : schedule.lastStatus === "FAILED"
                                        ? "text-destructive"
                                        : "text-muted-foreground"
                                  }`}>
                                    {schedule.lastStatus || "No history"}
                                  </strong>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground bg-muted/10 p-6 rounded-2xl text-center">
                          This user has not configured any schedules.
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-full border border-dashed rounded-2xl flex items-center justify-center p-12 text-center text-xs text-muted-foreground">
                    Select a user to inspect calculations.
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* TAB 6: JOB TIMELINE VIEW */}
      {/* ──────────────────────────────────────────────────────── */}
      {activeTab === "timeline" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Clock className="h-5 w-5 text-pulse-violet" /> Job Lifecycle Timeline
            </h2>
            <p className="text-xs text-muted-foreground">
              Trace any article from its RSS feed sync, Gemini analysis attempt loops, opp scoring algorithms, down to individual subscriber WhatsApp message dispatches.
            </p>
          </div>

          {/* Search bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search articles by title keywords or source..."
                value={timelineQuery}
                onChange={(e) => setTimelineQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchTimelineArticles(timelineQuery)}
                className="bg-card border rounded-2xl pl-10 pr-4 py-2.5 w-full text-xs font-semibold focus:outline-none"
              />
            </div>
            <Button
              onClick={() => fetchTimelineArticles(timelineQuery)}
              disabled={timelineLoading}
              className="gradient-primary text-white border-0 rounded-2xl text-xs h-10 px-5"
            >
              {timelineLoading ? "Searching..." : "Search"}
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            
            {/* Search list matching articles */}
            <div className="border bg-card rounded-2xl p-4 space-y-3 shadow-sm max-h-[60vh] overflow-y-auto">
              <h3 className="text-xs font-extrabold uppercase text-muted-foreground tracking-wider mb-2">Search Results</h3>
              {timelineLoading && timelineArticles.length === 0 ? (
                <div className="flex items-center justify-center p-6 text-xs text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Loading results...
                </div>
              ) : timelineArticles.length > 0 ? (
                timelineArticles.map((art) => (
                  <button
                    key={art.id}
                    onClick={() => fetchTimelineDetail(art.id)}
                    className={`w-full text-left p-3 border rounded-xl flex flex-col gap-1 transition-all text-xs ${
                      selectedArticle?.id === art.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-muted hover:bg-muted/30"
                    }`}
                  >
                    <span className="font-bold text-foreground leading-tight line-clamp-2">{art.title}</span>
                    <div className="flex justify-between items-center mt-2 text-[10px] text-muted-foreground w-full">
                      <span>Source: {art.sourceName}</span>
                      <Badge className={`border-0 font-bold text-[8px] py-0 px-1 ${
                        art.analysisStatus === "COMPLETED" 
                          ? "bg-pulse-green/10 text-pulse-green" 
                          : art.analysisStatus === "FAILED"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-primary/10 text-primary"
                      }`}>
                        {art.analysisStatus}
                      </Badge>
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-xs text-muted-foreground text-center p-6">No articles found matching criteria.</p>
              )}
            </div>

            {/* Stepper Timeline container */}
            <div className="md:col-span-2">
              {detailLoading ? (
                <div className="border bg-card rounded-2xl p-12 text-center flex flex-col justify-center items-center gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <p className="text-xs text-muted-foreground">Loading lifecycle details...</p>
                </div>
              ) : selectedArticle ? (
                <div className="border bg-card rounded-2xl p-6 space-y-6 shadow-sm">
                  
                  {/* Article Title */}
                  <div className="border-b pb-4">
                    <span className="text-[9px] font-extrabold uppercase text-primary tracking-widest">{selectedArticle.category}</span>
                    <h3 className="text-md font-bold leading-tight mt-1">{selectedArticle.title}</h3>
                    <div className="flex items-center gap-2 mt-2 text-[11px] text-muted-foreground">
                      <span>Source: <strong>{selectedArticle.sourceName}</strong></span>
                      <span>•</span>
                      <a href={selectedArticle.sourceUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-0.5">
                        Open URL <CornerDownRight className="h-3 w-3" />
                      </a>
                    </div>
                  </div>

                  {/* Vertical Timeline Stepper */}
                  <div className="space-y-6 relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-muted">
                    
                    {/* Stage 1: RSS Ingestion */}
                    <div className="relative">
                      <div className="absolute -left-6 bg-pulse-green text-white rounded-full p-0.5 w-4.5 h-4.5 flex items-center justify-center shadow">
                        <Rss className="h-2.5 w-2.5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-xs">Stage 1: RSS Feed Ingestion</h4>
                        <p className="text-[11px] text-muted-foreground">
                          Parsed from source `{selectedArticle.sourceName}` feed url.
                        </p>
                        <div className="text-[10px] text-muted-foreground flex gap-3">
                          <span>Published: {new Date(selectedArticle.publishedAt).toLocaleString()}</span>
                          <span>Synced: {new Date(selectedArticle.collectedAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Stage 2: AI Gemini Analysis */}
                    <div className="relative">
                      <div className={`absolute -left-6 rounded-full p-0.5 w-4.5 h-4.5 flex items-center justify-center shadow text-white ${
                        selectedArticle.analysisStatus === "COMPLETED"
                          ? "bg-pulse-green"
                          : selectedArticle.analysisStatus === "FAILED"
                            ? "bg-destructive"
                            : "bg-primary"
                      }`}>
                        <Brain className="h-2.5 w-2.5" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-xs">Stage 2: Gemini Opportunity Analysis</h4>
                          <Badge variant="outline" className={`text-[8px] font-bold ${
                            selectedArticle.analysisStatus === "COMPLETED" 
                              ? "bg-pulse-green/10 text-pulse-green border-pulse-green/20"
                              : selectedArticle.analysisStatus === "FAILED"
                                ? "bg-destructive/10 text-destructive border-destructive/20"
                                : "bg-primary/10 text-primary border-primary/20"
                          }`}>
                            {selectedArticle.analysisStatus}
                          </Badge>
                        </div>
                        
                        <div className="text-[10px] text-muted-foreground">
                          Attempt loops: <strong className="text-foreground">{selectedArticle.retryCount}x</strong>
                          {selectedArticle.analyzedAt && (
                            <span className="ml-3">Analyzed at: {new Date(selectedArticle.analyzedAt).toLocaleString()}</span>
                          )}
                        </div>

                        {selectedArticle.errorMessage && (
                          <div className="p-2.5 bg-destructive/5 rounded-xl border border-destructive/10 text-[10px] font-mono text-destructive break-words">
                            Error: {selectedArticle.errorMessage}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stage 3: Opportunity Scoring */}
                    <div className="relative">
                      <div className={`absolute -left-6 rounded-full p-0.5 w-4.5 h-4.5 flex items-center justify-center shadow text-white ${
                        selectedArticle.analysisStatus === "COMPLETED" ? "bg-pulse-green" : "bg-muted text-muted-foreground"
                      }`}>
                        <BarChart3 className="h-2.5 w-2.5" />
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-bold text-xs">Stage 3: Opportunity Relevance Scoring</h4>
                        
                        {selectedArticle.analysisStatus === "COMPLETED" ? (
                          <div className="space-y-3">
                            <div className="flex gap-4">
                              <div className="bg-muted/15 border rounded-xl p-2.5 text-center flex-1">
                                <span className="text-[8px] font-extrabold text-muted-foreground uppercase">Opportunity Score</span>
                                <p className="text-lg font-black text-pulse-amber">{selectedArticle.opportunityScore}/10</p>
                              </div>
                              <div className="bg-muted/15 border rounded-xl p-2.5 text-center flex-1">
                                <span className="text-[8px] font-extrabold text-muted-foreground uppercase">Founder Score</span>
                                <p className="text-lg font-black text-primary">{selectedArticle.founderScore}/10</p>
                              </div>
                            </div>

                            <div className="space-y-2 border-t pt-2 text-[11px] text-muted-foreground leading-normal">
                              <div>
                                <strong className="text-foreground text-[10px] uppercase">What Happened:</strong>
                                <p className="mt-0.5">{selectedArticle.whatHappened}</p>
                              </div>
                              <div>
                                <strong className="text-foreground text-[10px] uppercase">Why it matters:</strong>
                                <p className="mt-0.5">{selectedArticle.whyItMatters}</p>
                              </div>
                              {selectedArticle.opportunity && (
                                <div>
                                  <strong className="text-foreground text-[10px] uppercase">Founder Opportunity:</strong>
                                  <p className="mt-0.5">{selectedArticle.opportunity}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <p className="text-[10px] text-muted-foreground italic">Pending successful opportunity analysis completion.</p>
                        )}
                      </div>
                    </div>

                    {/* Stage 4: User Delivery Queue */}
                    <div className="relative">
                      <div className={`absolute -left-6 rounded-full p-0.5 w-4.5 h-4.5 flex items-center justify-center shadow text-white ${
                        selectedArticle.deliveries && selectedArticle.deliveries.length > 0 ? "bg-pulse-green" : "bg-muted text-muted-foreground"
                      }`}>
                        <MessageSquare className="h-2.5 w-2.5" />
                      </div>
                      <div className="space-y-3">
                        <h4 className="font-bold text-xs">Stage 4: WhatsApp Subscriber Digests</h4>
                        
                        {selectedArticle.deliveries && selectedArticle.deliveries.length > 0 ? (
                          <div className="space-y-2">
                            {selectedArticle.deliveries.map((del) => {
                              const d = del.deliveryLog;
                              return (
                                <div key={d.id} className="p-3 bg-muted/10 border rounded-xl text-xs space-y-1.5">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <span className="font-bold text-foreground">{d.user.name || "Beta User"}</span>
                                      <span className="text-[10px] text-muted-foreground ml-2">({d.whatsappNumber})</span>
                                    </div>
                                    <Badge className={`border-0 font-bold text-[9px] ${
                                      d.status === "SENT" || d.status === "READ" || d.status === "DELIVERED"
                                        ? "bg-pulse-green/10 text-pulse-green"
                                        : d.status === "FAILED"
                                          ? "bg-destructive/10 text-destructive"
                                          : "bg-primary/10 text-primary"
                                    }`}>
                                      {d.status}
                                    </Badge>
                                  </div>
                                  
                                  <div className="text-[10px] text-muted-foreground flex flex-wrap gap-x-3">
                                    <span>Scheduled: {new Date(d.scheduledAt).toLocaleTimeString()}</span>
                                    {d.sentAt && <span>Sent: {new Date(d.sentAt).toLocaleTimeString()}</span>}
                                  </div>

                                  {d.errorMessage && (
                                    <div className="text-[9px] text-destructive bg-destructive/5 p-2 rounded border border-destructive/10">
                                      Error: {d.errorMessage}
                                    </div>
                                  )}

                                  {d.status === "FAILED" && (
                                    <Button
                                      onClick={() => handleRetryJob("delivery", d.id)}
                                      disabled={reprocessingId === d.id}
                                      size="xs"
                                      variant="outline"
                                      className="h-7 text-[9px] rounded-lg mt-1"
                                    >
                                      {reprocessingId === d.id ? "Retrying..." : "Retry WhatsApp Dispatch"}
                                    </Button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-[10px] text-muted-foreground italic">
                            This article hasn't been included in any subscriber digests yet. It will be evaluated when upcoming delivery schedules trigger.
                          </p>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              ) : (
                <div className="h-full border border-dashed rounded-2xl flex items-center justify-center p-12 text-center text-xs text-muted-foreground">
                  Select an article from search to inspect processing lifecycle.
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* TAB 7: OPERATIONS PANEL */}
      {/* ──────────────────────────────────────────────────────── */}
      {activeTab === "operations" && (
        <div className="space-y-8 animate-in fade-in duration-200">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" /> Operations Controls
            </h2>
            <p className="text-xs text-muted-foreground">
              Trigger manual actions, configure global parameters, and download manual data snapshots.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            
            {/* Left Box: Trigger Jobs */}
            <div className="border bg-card rounded-2xl p-6 space-y-6 shadow-sm">
              <h3 className="text-sm font-bold border-b pb-3 flex items-center gap-1.5 text-primary">
                <Play className="h-4.5 w-4.5" /> Manual Trigger Actions
              </h3>
              
              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-foreground">Trigger RSS & Scheduler evaluation</span>
                  <p className="text-[11px] text-muted-foreground leading-normal">
                    Manually syncs all enabled RSS feeds and scans user delivery rules for due messages. Dispatches events immediately.
                  </p>
                  <Button
                    onClick={() => handleOperation("triggerScheduler")}
                    disabled={opsLoading}
                    className="gradient-primary text-white border-0 mt-2 h-9 text-xs rounded-xl self-start px-4"
                  >
                    {opsLoading ? (
                      <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Launching...</>
                    ) : (
                      "Trigger Ingestion & Delivery Check"
                    )}
                  </Button>
                </div>

                <div className="flex flex-col gap-1 border-t pt-4">
                  <span className="text-xs font-bold text-foreground">Manual Database JSON Export</span>
                  <p className="text-[11px] text-muted-foreground leading-normal">
                    Generates a full snapshot containing Users, IntelligenceItems, DeliveryLogs, Feedbacks, and SystemLogs. Downloads to browser as a JSON file and records metadata in SystemSettings.
                  </p>
                  
                  <div className="flex items-center justify-between mt-2 gap-3">
                    <Button
                      onClick={handleBackupDownload}
                      disabled={opsLoading}
                      variant="outline"
                      className="border border-muted/80 h-9 text-xs rounded-xl px-4 flex items-center gap-1.5"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Export Database JSON
                    </Button>
                    
                    {metrics.lastBackupAt && (
                      <span className="text-[10px] text-muted-foreground">
                        Last export: <strong>{new Date(metrics.lastBackupAt).toLocaleString()}</strong>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Box: Pause State controls */}
            <div className="border bg-card rounded-2xl p-6 space-y-6 shadow-sm">
              <h3 className="text-sm font-bold border-b pb-3 flex items-center gap-1.5 text-primary">
                <Pause className="h-4.5 w-4.5" /> Global System Toggles
              </h3>

              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-foreground flex items-center gap-2">
                    Pause Scheduled Deliveries
                    {metrics.schedulerPaused ? (
                      <Badge className="bg-destructive/10 text-destructive border-0 font-bold text-[8px] py-0 px-1">PAUSED</Badge>
                    ) : (
                      <Badge className="bg-pulse-green/10 text-pulse-green border-0 font-bold text-[8px] py-0 px-1">ACTIVE</Badge>
                    )}
                  </span>
                  <p className="text-[11px] text-muted-foreground leading-normal">
                    Stops the scheduler cron from dispatching delivery digest tasks. Instant alerts will still send automatically if high relevance items sync.
                  </p>
                  
                  <div className="pt-2">
                    {metrics.schedulerPaused ? (
                      <Button
                        onClick={() => handleOperation("pauseResumeScheduler", { pause: false })}
                        disabled={opsLoading}
                        className="bg-pulse-green hover:bg-pulse-green/90 text-white border-0 h-9 text-xs rounded-xl px-4 flex items-center gap-1.5"
                      >
                        <Play className="h-3.5 w-3.5" />
                        Resume Global Scheduler
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleOperation("pauseResumeScheduler", { pause: true })}
                        disabled={opsLoading}
                        variant="destructive"
                        className="h-9 text-xs rounded-xl px-4 flex items-center gap-1.5"
                      >
                        <Pause className="h-3.5 w-3.5" />
                        Pause Global Scheduler
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1 border-t pt-4 text-xs space-y-2">
                  <span className="font-bold text-foreground">API Rate Limiting Settings (Environment)</span>
                  <p className="text-[10px] text-muted-foreground leading-normal">
                    These limits are controlled via system environment variables. Customize `.env` to modify:
                  </p>
                  
                  <div className="bg-muted/15 border p-3 rounded-xl space-y-1 font-mono text-[10px] text-muted-foreground leading-relaxed">
                    <div>GEMINI_CONCURRENCY = 5</div>
                    <div>GEMINI_RATELIMIT_LIMIT = 15/1m</div>
                    <div>WHATSAPP_RATELIMIT_LIMIT = 30/1m</div>
                    <div>WHATSAPP_CONCURRENCY = 1 (Sequential)</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
