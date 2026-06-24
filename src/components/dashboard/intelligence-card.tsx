"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { OpportunityScore } from "@/components/dashboard/opportunity-score";
import { CATEGORY_MAP } from "@/lib/constants";
import type { IntelligenceItem } from "@/types";
import { ExternalLink, Bookmark, Share2, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";

interface IntelligenceCardProps {
  item: IntelligenceItem;
  onSave?: (id: string) => void;
  isSaved?: boolean;
}

export function IntelligenceCard({ item, onSave, isSaved = false }: IntelligenceCardProps) {
  const [expanded, setExpanded] = useState(false);
  const categoryInfo = CATEGORY_MAP[item.category];

  // Parse dates safely
  const publishedTime = new Date(item.publishedAt);
  const timeAgo = formatDistanceToNow(publishedTime, { addSuffix: true });

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onSave) onSave(item.id);
  };

  return (
    <div className="bg-card border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
      {/* Header */}
      <div className="p-6 pb-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <Badge 
              variant="secondary" 
              className="border-0 font-medium text-xs px-2.5 py-1"
              style={{ backgroundColor: `${categoryInfo.color}15`, color: categoryInfo.color }}
            >
              {categoryInfo.label}
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <span>{item.sourceName}</span>
              <span>•</span>
              <span>{timeAgo}</span>
            </span>
          </div>

          <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
            <OpportunityScore score={item.opportunityScore} size="md" />
          </div>
        </div>

        <h3 className="text-xl font-bold leading-tight group-hover:text-primary transition-colors">
          {item.title}
        </h3>
      </div>

      {/* Analysis Content (Always visible parts + expandable parts) */}
      <div className="px-6 space-y-5">
        {/* Opportunity snippet - highly visible and moved to top of hierarchy */}
        <div className="bg-pulse-green/5 border border-pulse-green/20 rounded-xl p-4">
          <p className="text-xs font-semibold text-pulse-green uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4" />
            The Opportunity
          </p>
          <p className="text-sm font-medium text-foreground/90 leading-relaxed">
            {item.opportunity || "Analysis pending..."}
          </p>
        </div>

        {/* Expandable details: Why it Matters & What Happened */}
        {expanded && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300 pb-2">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Why It Matters
              </p>
              <p className="text-sm text-foreground/80 leading-relaxed">
                {item.whyItMatters || "Analysis pending..."}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                What Happened
              </p>
              <p className="text-sm text-foreground/80 leading-relaxed bg-muted/30 p-3 rounded-lg border border-border/50">
                {item.whatHappened || "Analysis pending..."}
              </p>
            </div>

            {item.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {item.tags.map(tag => (
                  <span key={tag} className="text-[10px] text-muted-foreground bg-muted px-2 py-1 rounded-md">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 px-6 mt-4 border-t bg-muted/20 flex items-center justify-between">
        <button 
          onClick={() => setExpanded(!expanded)}
          className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          {expanded ? (
            <><ChevronUp className="h-4 w-4" /> Show Less</>
          ) : (
            <><ChevronDown className="h-4 w-4" /> Read Analysis</>
          )}
        </button>

        <div className="flex items-center gap-4">
          <button 
            onClick={handleSave}
            className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
              isSaved ? "text-pulse-amber" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Bookmark className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
            {isSaved ? "Saved" : "Save"}
          </button>
          <button className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
            <Share2 className="h-4 w-4" />
            Share
          </button>
          <Link 
            href={item.sourceUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Source
          </Link>
        </div>
      </div>
    </div>
  );
}
