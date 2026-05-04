"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function Checkbox(
  props: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }
) {
  const { className, label, ...rest } = props;
  return (
    <label className="inline-flex items-center gap-2 text-sm text-slate-800">
      <input
        type="checkbox"
        className={cn(
          "h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400",
          className
        )}
        {...rest}
      />
      {label ? <span>{label}</span> : null}
    </label>
  );
}

