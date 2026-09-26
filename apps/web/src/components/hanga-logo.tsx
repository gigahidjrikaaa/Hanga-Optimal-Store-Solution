/**
 * HangaLogo — Brand identity logo component for Hanga.
 *
 * Design:
 * - Color tokens: brand/600 (#0E9F6E), brand/800 (#046C4E), brand/100 (#DEF7EC).
 * - Symbolism: Warung shop canopy + upward inventory optimization sparkline + geometric 'H'.
 * - Variants: "full" (mark + wordmark + subtitle), "compact" (mark + wordmark), "icon" (mark only).
 */

import React from "react";

export interface HangaLogoProps {
  variant?: "full" | "compact" | "icon";
  size?: "sm" | "md" | "lg" | "xl";
  inverted?: boolean;
  className?: string;
  showTagline?: boolean;
}

const SIZES = {
  sm: { icon: 28, text: "text-lg", sub: "text-[9px]" },
  md: { icon: 36, text: "text-xl", sub: "text-[10px]" },
  lg: { icon: 48, text: "text-2xl", sub: "text-xs" },
  xl: { icon: 64, text: "text-4xl", sub: "text-sm" },
};

export function HangaLogo({
  variant = "compact",
  size = "md",
  inverted = false,
  className = "",
  showTagline = true,
}: HangaLogoProps) {
  const s = SIZES[size];
  const iconPx = s.icon;

  const textColor = inverted ? "text-white" : "text-ink-900";
  const subColor = inverted ? "text-brand-100" : "text-brand-600";

  return (
    <div
      className={`inline-flex items-center gap-2.5 select-none ${className}`}
      role="img"
      aria-label="Hanga — Optimal Store Solution"
    >
      {/* Vector Icon Mark */}
      <svg
        width={iconPx}
        height={iconPx}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform active:scale-95"
      >
        {/* Rounded squircle background */}
        <rect
          width="64"
          height="64"
          rx="18"
          fill={inverted ? "rgba(255,255,255,0.15)" : "#0E9F6E"}
        />

        {/* Warung Awning / Canopy (White) */}
        <path
          d="M12 21 C12 17.5, 15 14, 20 14 L44 14 C49 14, 52 17.5, 52 21 L50 26 C48 28.5, 43 28.5, 41 26 C39 28.5, 34 28.5, 32 26 C30 28.5, 25 28.5, 23 26 L21 21"
          fill="#FFFFFF"
        />

        {/* Left Column (Pillar) */}
        <path
          d="M18 26 L18 46 C18 47.5, 19 48.5, 20.5 48.5 L24 48.5 C25 48.5, 26 47.5, 26 46.5 L26 36 L21 36 L21 26 Z"
          fill="#DEF7EC"
        />

        {/* Right Column (Pillar) */}
        <path
          d="M43 26 L43 46.5 C43 47.5, 44 48.5, 45 48.5 L48.5 48.5 C50 48.5, 51 47.5, 51 46 L51 26 Z"
          fill="#DEF7EC"
        />

        {/* Center Shelf Crossbeam (completes 'H') */}
        <rect
          x="24"
          y="33"
          width="16"
          height="4.5"
          rx="2.25"
          fill="#DEF7EC"
          opacity="0.95"
        />

        {/* Optimization Upward Arrow */}
        <path
          d="M14 43 L23 31 L31 38 L47 19"
          stroke="#FFFFFF"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M39 19 L47 19 L47 27"
          stroke="#FFFFFF"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Typography Lockup */}
      {variant !== "icon" && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-extrabold tracking-tight font-sans ${s.text} ${textColor}`}
            >
              Hanga
            </span>
            {variant === "full" && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-brand-100 text-brand-800 tracking-wide uppercase">
                AI
              </span>
            )}
          </div>
          {(variant === "full" || showTagline) && (
            <span
              className={`font-semibold tracking-wider uppercase font-sans ${s.sub} ${subColor}`}
            >
              Optimal Store Solution
            </span>
          )}
        </div>
      )}
    </div>
  );
}
