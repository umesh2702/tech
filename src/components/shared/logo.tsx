"use client";

import { Brain } from "lucide-react";
import Link from "next/link";

export function Logo({ size = "default" }: { size?: "small" | "default" | "large" }) {
  const sizeClasses = {
    small: "h-6 w-6",
    default: "h-8 w-8",
    large: "h-10 w-10",
  };

  const textClasses = {
    small: "text-lg",
    default: "text-xl",
    large: "text-2xl",
  };

  return (
    <Link href="/" className="flex items-center gap-2.5 group" id="logo">
      <div className={`relative ${sizeClasses[size]} rounded-xl gradient-primary flex items-center justify-center shadow-lg group-hover:glow-primary transition-shadow duration-300`}>
        <Brain className="h-[60%] w-[60%] text-white" strokeWidth={2.5} />
        <div className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <span className={`${textClasses[size]} font-bold tracking-tight`}>
        <span className="text-gradient">Pulse</span>
        <span className="text-foreground"> AI</span>
      </span>
    </Link>
  );
}
