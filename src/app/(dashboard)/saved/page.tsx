"use client";

import { useState, useEffect } from "react";
import { IntelligenceCard } from "@/components/dashboard/intelligence-card";
import { Loader2, Bookmark, Search } from "lucide-react";
import type { IntelligenceItem } from "@/types";
import { toast } from "sonner";

export default function SavedPage() {
  const [items, setItems] = useState<IntelligenceItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSaved = async () => {
    try {
      const res = await fetch("/api/user/saved");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load saved items");
      
      // saved items contain intelligenceItem
      const savedItems = (json.data || []).map((s: any) => s.intelligenceItem);
      setItems(savedItems);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to load saved opportunities.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSaved();
  }, []);

  const handleUnsave = async (itemId: string) => {
    // Optimistically filter item out of list
    const originalItems = [...items];
    setItems(items.filter((item) => item.id !== itemId));

    try {
      const res = await fetch("/api/user/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to remove bookmark");
      toast.success("Bookmark removed successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to remove bookmark");
      setItems(originalItems); // Rollback
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-muted-foreground text-xs">Loading saved opportunities...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-2">
          <Bookmark className="h-7 w-7 text-pulse-violet fill-pulse-violet/10" />
          Saved Opportunities
        </h1>
        <p className="text-muted-foreground">
          Your personal library of bookmarked high-value technology intelligence.
        </p>
      </div>

      <div className="space-y-6">
        {items.length > 0 ? (
          items.map((item) => (
            <IntelligenceCard
              key={item.id}
              item={item}
              isSaved={true}
              onSave={handleUnsave}
            />
          ))
        ) : (
          <div className="text-center py-20 bg-card border border-dashed rounded-2xl space-y-3">
            <Bookmark className="h-10 w-10 text-muted-foreground/30 mx-auto" />
            <h3 className="text-md font-semibold text-foreground">No saved opportunities</h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
              Items you bookmark in your main feed dashboard will be preserved here for offline reference.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
