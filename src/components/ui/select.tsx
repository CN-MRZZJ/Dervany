"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function Select(
  props: React.SelectHTMLAttributes<HTMLSelectElement> & { error?: boolean }
) {
  const { className, error, children, ...rest } = props;
  return (
    <select
      className={cn(
        "h-9 w-full rounded-md border bg-white px-3 text-sm text-slate-900",
        "border-slate-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:border-accent",
        error && "border-rose-400 focus-visible:ring-rose-300/60 focus-visible:border-rose-400",
        className
      )}
      {...rest}
    >
      {children}
    </select>
  );
}

