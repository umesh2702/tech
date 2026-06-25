"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, MessageSquare, AlertCircle, CheckCircle2, Eye, Calendar, Clock, RefreshCw, Star } from "lucide-react";
import { toast } from "sonner";

interface IntelligenceItemBrief {
  id: string;
  title: string;
  category: string;
  opportunityScore: number;
  founderScore: number | null;
}

interface DeliveryItem {
  intelligenceItem: IntelligenceItemBrief;
}

interface DeliveryLog {
  id: string;
  whatsappNumber: string;
  digestType: string;
  status: string;
  messageId: string | null;
  errorMessage: string | null;
  retryCount: number;
  scheduledAt: string;
  sentAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  items: DeliveryItem[];
}

export default function HistoryPage() {
  const [logs, setLogs] = useState<DeliveryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLog, setSelectedLog] = useState<DeliveryLog | null>(null);

  // Feedback widget state inside preview
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  useEffect(() => {
    // Reset feedback state when a different log is selected
    setFeedbackRating(0);
    setFeedbackComment("");
    setFeedbackSubmitted(false);
  }, [selectedLog]);

  const handleFeedbackSubmit = async () => {
    if (!selectedLog) return;
    if (feedbackRating === 0) {
      toast.warning("Please select a rating.");
      return;
    }
    setFeedbackSubmitting(true);
    try {
      const fullComment = `[Digest ID: ${selectedLog.id}, Type: ${selectedLog.digestType}] ${feedbackComment}`.trim();
      const res = await fetch("/api/user/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: feedbackRating, comment: fullComment }),
      });
      if (!res.ok) throw new Error("Failed to submit feedback");
      setFeedbackSubmitted(true);
      toast.success("Thank you for your rating!");
    } catch (err: any) {
      console.error(err);
      toast.error("Could not submit rating. Please try again.");
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const fetchHistory = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch("/api/user/history");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load history");
      setLogs(json.data || []);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load delivery history");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "READ":
        return "bg-sky-500/10 text-sky-500 border-sky-500/20";
      case "DELIVERED":
        return "bg-pulse-green/10 text-pulse-green border-pulse-green/20";
      case "SENT":
        return "bg-pulse-amber/10 text-pulse-amber border-pulse-amber/20";
      case "FAILED":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getFrequencyLabel = (freq: string) => {
    switch (freq) {
      case "DAILY":
        return "Daily Digest";
      case "MORNING":
        return "Morning Digest";
      case "EVENING":
        return "Evening Digest";
      case "THREE_HOURLY":
        return "3-Hourly Digest";
      case "INSTANT":
        return "Instant Alert";
      default:
        return freq;
    }
  };

  // Reconstruct WhatsApp digest formatting for the UI preview
  const getReconstructedText = (log: DeliveryLog) => {
    const dateStr = new Date(log.createdAt).toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const timeStr = new Date(log.createdAt).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });

    const header = `🧠 *Pulse AI*\n\n_Top Opportunities — ${getFrequencyLabel(log.digestType)}_\n_${dateStr} @ ${timeStr}_\n\n`;
    
    if (log.items.length === 0) {
      return `${header}No new items met your criteria for this delivery window.`;
    }

    const itemsText = log.items
      .map((itemObj, idx) => {
        const item = itemObj.intelligenceItem;
        return `${idx + 1}. *${item.title}*

⭐ *Opportunity Score:* ${item.opportunityScore}/10
🚀 *Founder Fit:* ${item.founderScore || 0}/10
🗂️ *Category:* ${item.category.replace("_", " ")}

_Dashboard Link:_
http://localhost:3000/dashboard/item/${item.id}`;
      })
      .join("\n\n---\n\n");

    return `${header}${itemsText}`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Delivery History</h1>
          <p className="text-sm text-muted-foreground">
            View history of technology intelligence digests sent to your WhatsApp.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchHistory(true)}
          disabled={loading || refreshing}
          className="h-9 gap-1.5"
          id="refresh-history-btn"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-muted-foreground text-xs">Loading logs...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-2xl bg-card">
          <MessageSquare className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="text-md font-semibold text-foreground">No deliveries recorded</h3>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1 leading-relaxed">
            When digests are triggered according to your delivery schedule, they will appear here.
          </p>
        </div>
      ) : (
        /* History Logs Table */
        <div className="border rounded-2xl bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Scheduled Date</TableHead>
                <TableHead>Digest Type</TableHead>
                <TableHead>WhatsApp Number</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Items</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium text-xs">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span>
                        {new Date(log.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <span className="text-muted-foreground/60">•</span>
                      <Clock className="h-3.5 w-3.5 text-muted-foreground/75 shrink-0" />
                      <span>
                        {new Date(log.createdAt).toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px] font-semibold">
                      {getFrequencyLabel(log.digestType)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">
                    {log.whatsappNumber}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] font-bold ${getStatusColor(log.status)}`}>
                      {log.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="font-bold text-xs bg-muted/50">
                      {log.items.length}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedLog(log)}
                      className="h-8 gap-1 text-xs"
                      id={`view-log-${log.id}`}
                    >
                      <Eye className="h-3.5 w-3.5" /> View Digest
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* WhatsApp Message Preview Dialog */}
      <Dialog open={selectedLog !== null} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="sm:max-w-lg p-0 bg-[#efeae2] border-0 rounded-3xl overflow-hidden shadow-2xl">
          {/* Header styled like a WhatsApp profile bar */}
          <div className="bg-[#075e54] text-white px-5 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-700/60 text-white flex items-center justify-center font-bold text-sm shrink-0 border border-emerald-500/20 shadow-inner">
              PA
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-sm font-semibold text-white leading-tight">Pulse AI Assistant</DialogTitle>
              <p className="text-[10px] text-emerald-200/80 leading-none mt-0.5">Delivery channel verified</p>
            </div>
          </div>

          <div className="p-4 max-h-[60vh] overflow-y-auto space-y-4">
            {selectedLog && (
              <div className="space-y-4">
                {/* Meta Delivery Info Box */}
                <div className="bg-card rounded-xl p-3 border text-[11px] space-y-1.5 shadow-sm text-foreground">
                  <div className="flex justify-between border-b pb-1.5 font-medium">
                    <span className="text-muted-foreground">Delivery Metadata</span>
                    <span className="text-primary font-semibold">{selectedLog.id}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-y-1">
                    <div><span className="text-muted-foreground">Status:</span> {selectedLog.status}</div>
                    <div><span className="text-muted-foreground">Digest:</span> {getFrequencyLabel(selectedLog.digestType)}</div>
                    <div><span className="text-muted-foreground">Recipient:</span> {selectedLog.whatsappNumber}</div>
                    <div><span className="text-muted-foreground">Retries:</span> {selectedLog.retryCount}</div>
                    {selectedLog.messageId && (
                      <div className="col-span-2 truncate"><span className="text-muted-foreground">Meta ID (wamid):</span> <code className="bg-muted px-1 py-0.5 rounded text-[10px] font-mono">{selectedLog.messageId}</code></div>
                    )}
                    {selectedLog.errorMessage && (
                      <div className="col-span-2 text-destructive font-semibold"><span className="text-muted-foreground">Error:</span> {selectedLog.errorMessage}</div>
                    )}
                  </div>
                </div>

                {/* WhatsApp Chat Bubble */}
                <div className="relative max-w-[85%] bg-white dark:bg-emerald-950/20 text-neutral-800 rounded-2xl rounded-tl-none p-3.5 shadow-md border-l-4 border-[#128c7e]">
                  {/* Speech tail */}
                  <div className="absolute top-0 -left-2 w-0 h-0 border-t-[8px] border-t-white border-l-[8px] border-l-transparent" />

                  {/* Message body */}
                  <pre className="text-xs whitespace-pre-wrap font-sans leading-relaxed text-black dark:text-neutral-200 select-all">
                    {getReconstructedText(selectedLog)}
                  </pre>
                  
                  {/* Timestamp and double check icon */}
                  <div className="flex items-center justify-end gap-1 mt-2 text-[9px] text-neutral-400">
                    <span>
                      {new Date(selectedLog.createdAt).toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false
                      })}
                    </span>
                    {selectedLog.status === "READ" ? (
                      <span className="text-[#34b7f1] font-bold">✓✓</span>
                    ) : selectedLog.status === "DELIVERED" ? (
                      <span className="text-neutral-400 font-bold">✓✓</span>
                    ) : selectedLog.status === "SENT" ? (
                      <span className="text-neutral-400">✓</span>
                    ) : selectedLog.status === "FAILED" ? (
                      <span className="text-destructive font-bold">!</span>
                    ) : null}
                  </div>
                </div>

                {/* Specific Digest Feedback Rating Widget */}
                {selectedLog.status !== "FAILED" && selectedLog.items.length > 0 && (
                  <div className="bg-white dark:bg-zinc-900 border rounded-2xl p-4 shadow-sm space-y-3">
                    <h4 className="font-bold text-xs flex items-center gap-1.5 text-foreground">
                      <Star className="h-3.5 w-3.5 text-pulse-amber fill-pulse-amber" />
                      Rate this Digest
                    </h4>
                    {feedbackSubmitted ? (
                      <div className="text-center py-2 space-y-1">
                        <CheckCircle2 className="h-6 w-6 text-pulse-green mx-auto" />
                        <p className="font-semibold text-[11px] text-foreground">Feedback Received!</p>
                        <p className="text-[9px] text-muted-foreground">Thank you for rating this delivery.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex gap-1 justify-center">
                          {[1, 2, 3, 4, 5].map((star) => {
                            const active = star <= feedbackRating;
                            return (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setFeedbackRating(star)}
                                className="transition-transform active:scale-95 focus:outline-none"
                              >
                                <Star className={`h-5 w-5 ${
                                  active ? "text-pulse-amber fill-pulse-amber" : "text-muted-foreground/30"
                                }`} />
                              </button>
                            );
                          })}
                        </div>
                        <div className="flex gap-2">
                          <input
                            placeholder="Add rating comment (optional)..."
                            value={feedbackComment}
                            onChange={(e) => setFeedbackComment(e.target.value)}
                            className="flex-1 text-[11px] px-2.5 py-1.5 rounded-lg border bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary h-8"
                          />
                          <Button
                            onClick={handleFeedbackSubmit}
                            disabled={feedbackRating === 0 || feedbackSubmitting}
                            className="text-[10px] font-semibold h-8 gradient-primary text-white border-0 px-3"
                          >
                            {feedbackSubmitting ? "..." : "Send"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Modal Footer bar */}
          <div className="bg-[#efeae2] px-4 py-3 border-t flex justify-end">
            <Button onClick={() => setSelectedLog(null)} className="bg-[#075e54] text-white hover:bg-[#075e54]/95 text-xs font-semibold px-4 rounded-xl border-0 h-9">
              Close Preview
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
