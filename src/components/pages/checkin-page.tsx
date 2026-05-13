"use client";

import React from "react";
import { Section } from "@/components/ui/section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Download } from "lucide-react";
import { queryEvents, queryHeats, exportCheckinXlsx, type RoundHeats } from "@/lib/api";
import { useGroupLabels } from "@/lib/use-group-labels";

function glabel(g: string) { return g === "male" ? "男" : g === "female" ? "女" : "混合"; }

export function CheckinPage() {
  const [events, setEvents] = React.useState<{ id: number; name: string; is_individual: number; gender: string; group: string }[]>([]);
  const { label } = useGroupLabels();

  const [checkinEvent, setCheckinEvent] = React.useState("");
  const [checkinRound, setCheckinRound] = React.useState("");
  const [checkinHeat, setCheckinHeat] = React.useState("");
  const [checkinRounds, setCheckinRounds] = React.useState<RoundHeats[]>([]);

  const activeHeats = React.useMemo(() => {
    if (!checkinRound) return [];
    const r = checkinRounds.find((r) => String(r.round_number) === checkinRound);
    return r?.heats ?? [];
  }, [checkinRounds, checkinRound]);

  React.useEffect(() => {
    queryEvents().then((d) => setEvents(d.items)).catch(() => {});
  }, []);

  React.useEffect(() => {
    if (!checkinEvent) { setCheckinRounds([]); setCheckinRound(""); setCheckinHeat(""); return; }
    queryHeats(Number(checkinEvent))
      .then((d) => setCheckinRounds(d.data.rounds))
      .catch(() => setCheckinRounds([]));
  }, [checkinEvent]);

  return (
    <div className="space-y-4">
      <Section title="检录表" description="选择项目和赛次，导出检录表" />

      <Card>
        <CardHeader><CardTitle>检录表</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-[220px]"><div className="text-xs font-medium text-slate-700 mb-1">项目</div>
              <Select value={checkinEvent} onChange={(e) => { setCheckinEvent(e.target.value); setCheckinRound(""); setCheckinHeat(""); }}>
                <option value="">选择项目</option>
                {events.map((e) => (<option key={e.id} value={String(e.id)}>{e.name} {glabel(e.gender)}{label(e.group)}</option>))}
              </Select>
            </div>
            <div className="w-[140px]"><div className="text-xs font-medium text-slate-700 mb-1">赛次</div>
              <Select value={checkinRound} onChange={(e) => { setCheckinRound(e.target.value); setCheckinHeat(""); }}>
                <option value="">选择赛次</option>
                {checkinRounds.map((r) => (<option key={r.id} value={String(r.round_number)}>{r.round_name}</option>))}
              </Select>
            </div>
            {activeHeats.length > 0 && (
              <div className="w-[160px]"><div className="text-xs font-medium text-slate-700 mb-1">编组（可选）</div>
                <Select value={checkinHeat} onChange={(e) => setCheckinHeat(e.target.value)}>
                  <option value="">全部组 (ZIP)</option>
                  {activeHeats.map((h) => (<option key={h.id} value={String(h.id)}>{h.heat_name}</option>))}
                </Select>
              </div>
            )}
            <Button onClick={() => checkinEvent && checkinRound && window.open(exportCheckinXlsx(Number(checkinEvent), Number(checkinRound), checkinHeat ? Number(checkinHeat) : undefined))}>
              <Download className="h-4 w-4" />导出 XLSX
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
