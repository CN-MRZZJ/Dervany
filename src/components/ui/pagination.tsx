"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

function pageRange(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "...")[] = [1];

  if (current > 3) pages.push("...");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push("...");

  pages.push(total);
  return pages;
}

export function Pagination({
  page,
  pageSize,
  total,
  onChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onChange: (nextPage: number) => void;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const pages = pageRange(page, pageCount);
  const [jump, setJump] = React.useState("");

  function handleJump() {
    const n = Number(jump);
    if (!jump || !Number.isInteger(n)) return;
    onChange(Math.max(1, Math.min(n, pageCount)));
    setJump("");
  }

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <span className="text-xs tabular-nums text-slate-500">
        {total.toLocaleString()} 条，第 {page}/{pageCount} 页
      </span>
      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="sm"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`e${i}`} className="inline-flex h-8 w-8 items-center justify-center text-xs text-slate-400">
              &hellip;
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium tabular-nums transition-colors",
                p === page
                  ? "bg-accent text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              {p}
            </button>
          )
        )}
        <Button
          variant="ghost"
          size="sm"
          disabled={page >= pageCount}
          onClick={() => onChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <span className="ml-1.5 text-xs text-slate-400">跳至</span>
        <input
          type="text"
          inputMode="numeric"
          value={jump}
          onChange={(e) => setJump(e.target.value.replace(/\D/g, ""))}
          onKeyDown={(e) => { if (e.key === "Enter") handleJump(); }}
          onBlur={handleJump}
          placeholder={`${pageCount}`}
          className="h-7 w-10 rounded border border-slate-200 bg-white text-center text-xs tabular-nums text-slate-700 placeholder:text-slate-300 focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20"
        />
      </div>
    </div>
  );
}
