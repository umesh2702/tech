"use client";

import { CATEGORIES } from "@/lib/constants";
import type { Category } from "@/types";

interface FeedFiltersProps {
  activeCategory: Category | "ALL";
  onChangeCategory: (category: Category | "ALL") => void;
  minScore: number;
  onChangeMinScore: (score: number) => void;
  totalItems: number;
}

export function FeedFilters({
  activeCategory,
  onChangeCategory,
  minScore,
  onChangeMinScore,
  totalItems,
}: FeedFiltersProps) {
  return (
    <div className="space-y-6">
      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onChangeCategory("ALL")}
          className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
            activeCategory === "ALL"
              ? "bg-primary text-primary-foreground shadow-md"
              : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
          }`}
        >
          All Intel
        </button>
        {CATEGORIES.map((category) => {
          const isActive = activeCategory === category.id;
          return (
            <button
              key={category.id}
              onClick={() => onChangeCategory(category.id)}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                isActive
                  ? "shadow-md text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}
              style={isActive ? { backgroundColor: category.color } : {}}
            >
              {category.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 py-2 border-y">
        <span className="text-sm text-muted-foreground font-medium">
          Showing {totalItems} items
        </span>

        {/* Score Filter */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Min Score:</span>
          <div className="flex bg-muted rounded-lg p-1">
            {[0, 5, 7, 9].map((score) => (
              <button
                key={score}
                onClick={() => onChangeMinScore(score)}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                  minScore === score
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {score === 0 ? "Any" : `${score}+`}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
