"use client";

import { useState } from "react";
import { IntelligenceCard } from "@/components/dashboard/intelligence-card";
import { mockIntelligence } from "@/data/mock-intelligence";

export default function SavedPage() {
  // In Phase 1, we simulate saved items by just picking a few from mock data
  const [savedIds, setSavedIds] = useState<Set<string>>(
    new Set([mockIntelligence[0].id, mockIntelligence[3].id])
  );

  const savedItems = mockIntelligence.filter((item) => savedIds.has(item.id));

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
        <h1 className="text-3xl font-bold tracking-tight mb-2">Saved Opportunities</h1>
        <p className="text-muted-foreground">
          Your personal library of high-value intelligence.
        </p>
      </div>

      <div className="space-y-6">
        {savedItems.length > 0 ? (
          savedItems.map((item) => (
            <IntelligenceCard
              key={item.id}
              item={item}
              isSaved={true}
              onSave={toggleSave}
            />
          ))
        ) : (
          <div className="text-center py-20 bg-muted/30 rounded-2xl border border-dashed">
            <h3 className="text-lg font-semibold mb-2">No saved opportunities</h3>
            <p className="text-muted-foreground">
              Items you bookmark in your feed will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
