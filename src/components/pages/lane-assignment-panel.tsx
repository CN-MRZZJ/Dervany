"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import type { HeatEntry } from "@/lib/api/heats";

type Props = {
  heatLabel: string;
  entries: HeatEntry[];
  laneCount: number;
  onAddClick: (laneNumber: number) => void;
  onRemoveClick: (entry: HeatEntry) => void;
  onMoveClick: (entry: HeatEntry) => void;
};

export function LaneAssignmentPanel({
  heatLabel,
  entries,
  laneCount,
  onAddClick,
  onRemoveClick,
  onMoveClick,
}: Props) {
  const entryByLane = new Map<number, HeatEntry>();
  entries.forEach((e) => {
    if (e.lane != null) entryByLane.set(e.lane, e);
  });

  const occupiedCount = entryByLane.size;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-900">{heatLabel}</h3>
          <span className="text-xs text-slate-400">{occupiedCount}/{laneCount}道</span>
        </div>
      </div>

      {entries.length === 0 && (
        <div className="text-center py-8 text-sm text-slate-400 bg-slate-50 rounded-lg">
          该组暂无运动员，请从右侧添加
        </div>
      )}

      <div className="space-y-1">
        {Array.from({ length: laneCount }, (_, i) => i + 1).map((laneNumber) => {
          const entry = entryByLane.get(laneNumber);
          return (
            <div
              key={laneNumber}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 transition-colors ${
                entry
                  ? "bg-accent-bg border border-accent/20"
                  : "bg-white border border-slate-100 hover:border-slate-200"
              }`}
            >
              <span
                className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold shrink-0 ${
                  entry
                    ? "bg-accent text-white shadow-sm"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {laneNumber}
              </span>

              {entry ? (
                <>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-900">{entry.athlete_name}</div>
                    <div className="text-xs text-slate-500">{entry.athlete_no} · {entry.department_name}</div>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => onMoveClick(entry)}>调整</Button>
                    <Button variant="ghost" size="sm" className="text-rose-500 hover:text-rose-600 hover:bg-rose-50" onClick={() => onRemoveClick(entry)}>移除</Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex-1 text-sm text-slate-300">—</div>
                  <Button variant="ghost" size="sm" className="text-accent shrink-0" onClick={() => onAddClick(laneNumber)}>分配</Button>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
