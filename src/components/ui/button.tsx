"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "warning";
type Size = "sm" | "md" | "icon";

export function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant;
    size?: Size;
  }
) {
  const { className, variant = "primary", size = "md", ...rest } = props;
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium",
        "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:ring-offset-1",
        "disabled:opacity-50 disabled:pointer-events-none",
        variant === "primary" &&
          "bg-accent text-white hover:bg-accent-light shadow-sm",
        variant === "secondary" &&
          "bg-slate-100 text-slate-900 hover:bg-slate-200",
        variant === "ghost" &&
          "bg-transparent text-slate-900 hover:bg-slate-100",
        variant === "danger" &&
          "bg-rose-600 text-white hover:bg-rose-500",
        variant === "warning" &&
          "bg-orange-500 text-white hover:bg-orange-400",
        size === "sm" && "h-8 px-3",
        size === "md" && "h-9 px-4",
        size === "icon" && "h-9 w-9 px-0",
        className
      )}
      {...rest}
    />
  );
}

