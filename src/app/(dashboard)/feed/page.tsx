"use client";

import { useState, useEffect } from "react";
import { IntelligenceCard } from "@/components/dashboard/intelligence-card";
import { FeedFilters } from "@/components/dashboard/feed-filters";
import type { Category, IntelligenceItem } from "@/types";

export default function FeedPage() {
  const [activeCategory, setActiveCategory] = useState<Category | "ALL">("ALL");
  const [minScore, setMinScore] = useState(0);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  
  const [items, setItems] = useState<IntelligenceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch intelligence items from the real database API
  useEffect(() => {
    async function fetchFeed() {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (activeCategory !== "ALL") params.append("category", activeCategory);
        if (minScore > 0) params.append("minScore", minScore.toString());
        
        const res = await fetch(`/api/intelligence?${params.toString()}`);
        if (!res.ok) throw new Error("Database not connected yet.");
        
        const json = await res.json();
        setItems(json.data || []);
      } catch (err: any) {
        console.error("Feed fetch error:", err);
        setError("Waiting for PostgreSQL connection. Please configure DATABASE_URL.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchFeed();
  }, [activeCategory, minScore]);

  const toggleSave = (id: string) => {
    const newSaved = new Set(savedIds);
    if (newSaved.has(id)) {
      newSaved.delete(id);
    } else {
      newSaved.add(id);
    }
    setSavedIds(newSaved);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Intelligence Feed</h1>
        <p className="text-muted-foreground">
          Your personalized stream of opportunities, ranked by impact.
        </p>
      </div>

      {/* KPI Dashboard Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-card border rounded-xl p-4">
          <p className="text-xs text-muted-foreground font-medium mb-1">Opportunities Today</p>
          <p className="text-2xl font-bold text-foreground">
            {items.filter(i => new Date(i.publishedAt).toDateString() === new Date().toDateString()).length}
          </p>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <p className="text-xs text-muted-foreground font-medium mb-1">High Opportunity</p>
          <p className="text-2xl font-bold text-pulse-amber">
            {items.filter(i => i.opportunityScore >= 7).length}
          </p>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <p className="text-xs text-muted-foreground font-medium mb-1">Saved Items</p>
          <p className="text-2xl font-bold text-pulse-violet">
            {savedIds.size}
          </p>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <p className="text-xs text-muted-foreground font-medium mb-1">Active Categories</p>
          <p className="text-2xl font-bold text-pulse-green">
            {new Set(items.map(i => i.category)).size}
          </p>
        </div>
      </div>

      <FeedFilters
        activeCategory={activeCategory}
        onChangeCategory={setActiveCategory}
        minScore={minScore}
        onChangeMinScore={setMinScore}
        totalItems={items.length}
      />

      <div className="space-y-6">
        {isLoading ? (
          <div className="text-center py-20 bg-muted/30 rounded-2xl border border-dashed">
            <h3 className="text-lg font-semibold mb-2">Loading Intelligence...</h3>
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-muted/30 rounded-2xl border border-dashed text-destructive">
            <h3 className="text-lg font-semibold mb-2">Database Error</h3>
            <p>{error}</p>
          </div>
        ) : items.length > 0 ? (
          items.map((item) => (
            <IntelligenceCard
              key={item.id}
              item={item}
              isSaved={savedIds.has(item.id)}
              onSave={toggleSave}
            />
          ))
        ) : (
          <div className="text-center py-20 bg-muted/30 rounded-2xl border border-dashed">
            <h3 className="text-lg font-semibold mb-2">No opportunities found</h3>
            <p className="text-muted-foreground">
              Try adjusting your filters to see more results.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
