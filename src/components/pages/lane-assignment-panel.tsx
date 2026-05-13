"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, Th, Td } from "@/components/ui/table";
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
  const noLane: HeatEntry[] = [];
  entries.forEach((e) => {
    if (e.lane != null) entryByLane.set(e.lane, e);
    else noLane.push(e);
  });

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-900">
            {heatLabel}
          </h3>
          <span className="text-xs text-slate-400">{entries.length}人</span>
        </div>

        {entries.length === 0 && (
          <div className="text-center py-8 text-sm text-slate-400 bg-slate-50 rounded-lg">
            该组暂无运动员，请从右侧添加
          </div>
        )}

        {entries.length > 0 && (
          <Table>
            <thead>
              <tr>
                <Th>道次</Th>
                <Th>运动员</Th>
                <Th>单位</Th>
                <Th>操作</Th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: laneCount }, (_, i) => i + 1).map((laneNumber) => {
                const entry = entryByLane.get(laneNumber);
                return (
                  <tr key={laneNumber} className={entry ? "" : "text-slate-300"}>
                    <Td className="text-xs w-12">
                      <span className={`inline-flex items-center justify-center w-7 h-6 rounded-full text-xs font-bold ${entry ? "bg-accent text-white" : "bg-slate-100 text-slate-400"}`}>
                        {laneNumber}
                      </span>
                    </Td>
                    <Td className="text-sm">
                      {entry ? (
                        <>
                          {entry.athlete_name}
                          <span className="text-xs text-slate-400 ml-1">{entry.athlete_no}</span>
                        </>
                      ) : (
                        "—"
                      )}
                    </Td>
                    <Td className="text-xs text-slate-500">{entry?.department_name ?? "—"}</Td>
                    <Td>
                      {entry ? (
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => onMoveClick(entry)}>调整</Button>
                          <Button variant="ghost" size="sm" className="text-rose-500 hover:text-rose-600 hover:bg-rose-50" onClick={() => onRemoveClick(entry)}>移除</Button>
                        </div>
                      ) : (
                        <Button variant="ghost" size="sm" className="text-accent" onClick={() => onAddClick(laneNumber)}>分配</Button>
                      )}
                    </Td>
                  </tr>
                );
              })}
              {noLane.map((e) => (
                <tr key={e.id} className="text-slate-400">
                  <Td className="text-xs">—</Td>
                  <Td className="text-sm">{e.athlete_name}<span className="text-xs text-slate-400 ml-1">{e.athlete_no}</span></Td>
                  <Td className="text-xs">{e.department_name}</Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => onMoveClick(e)}>调整</Button>
                      <Button variant="ghost" size="sm" className="text-rose-500 hover:text-rose-600 hover:bg-rose-50" onClick={() => onRemoveClick(e)}>移除</Button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
