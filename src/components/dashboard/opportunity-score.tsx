"use client";

import { SCORE_CONFIG } from "@/lib/constants";

interface OpportunityScoreProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function OpportunityScore({
  score,
  size = "md",
  showLabel = false,
}: OpportunityScoreProps) {
  const config = SCORE_CONFIG.getConfig(score);
  const sizeConfig = {
    sm: { svgSize: 32, radius: 12, strokeWidth: 2, fontSize: "text-xs", labelSize: "text-[10px]" },
    md: { svgSize: 44, radius: 16, strokeWidth: 2.5, fontSize: "text-sm", labelSize: "text-xs" },
    lg: { svgSize: 56, radius: 20, strokeWidth: 3, fontSize: "text-base", labelSize: "text-xs" },
  };

  const { svgSize, radius, strokeWidth, fontSize, labelSize } = sizeConfig[size];
  const circumference = 2 * Math.PI * radius;
  const dashArray = `${(score / 10) * circumference} ${circumference}`;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: svgSize, height: svgSize }}>
        <svg
          className="-rotate-90"
          width={svgSize}
          height={svgSize}
          viewBox={`0 0 ${svgSize} ${svgSize}`}
        >
          {/* Background track */}
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-border"
          />
          {/* Score arc */}
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            fill="none"
            stroke={config.color}
            strokeWidth={strokeWidth + 0.5}
            strokeDasharray={dashArray}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
            style={{
              filter: score >= 8 ? `drop-shadow(0 0 4px ${config.color})` : undefined,
            }}
          />
        </svg>
        <span
          className={`absolute inset-0 flex items-center justify-center font-bold ${fontSize}`}
        >
          {score}
        </span>
      </div>
      {showLabel && (
        <span className={`${labelSize} text-muted-foreground font-medium`}>
          {config.emoji} {config.label}
        </span>
      )}
    </div>
  );
}
