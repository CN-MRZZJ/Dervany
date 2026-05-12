"use client";

import * as React from "react";
import { Section } from "@/components/ui/section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Download, CloudRain } from "lucide-react";
import {
  queryEvents,
  saveReportEnv,
  queryHeats,
  exportGroupedResultXlsx,
  exportFullResultXlsx,
  type RoundHeats,
} from "@/lib/api";
import { useGroupLabels } from "@/lib/use-group-labels";

type EnvInfo = {
  date: string; wind_direction: string; wind_speed: string;
  air_quality: string; weather: string; temperature_high: string; temperature_low: string;
};

const STORAGE_KEY = "sportsmeet.result_publication.v1";

function todayISO() { return new Date().toISOString().slice(0, 10); }

function glabel(g: string) { return g === "male" ? "男" : g === "female" ? "女" : "混合"; }

export function ResultPublicationPage() {
  const [env, setEnv] = React.useState<EnvInfo>({ date: todayISO(), wind_direction: "", wind_speed: "", air_quality: "", weather: "", temperature_high: "", temperature_low: "" });
  const [events, setEvents] = React.useState<{ id: number; name: string; is_individual: number; gender: string; group: string; competition_format?: string }[]>([]);
  const { label } = useGroupLabels();

  const [heatEvent, setHeatEvent] = React.useState("");
  const [heatRound, setHeatRound] = React.useState("");
  const [heatRounds, setHeatRounds] = React.useState<RoundHeats[]>([]);

  const [overallEvent, setOverallEvent] = React.useState("");
  const [overallRound, setOverallRound] = React.useState("");
  const [overallRounds, setOverallRounds] = React.useState<RoundHeats[]>([]);

  React.useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) { try { const d = JSON.parse(raw); if (d) setEnv((p) => ({ ...p, ...d })); } catch {} }
    queryEvents().then((d) => setEvents(d.items)).catch(() => {});
  }, []);

  React.useEffect(() => {
    if (!heatEvent) { setHeatRounds([]); setHeatRound(""); return; }
    queryHeats(Number(heatEvent)).then((d) => setHeatRounds(d.data.rounds)).catch(() => setHeatRounds([]));
  }, [heatEvent]);

  React.useEffect(() => {
    if (!overallEvent) { setOverallRounds([]); setOverallRound(""); return; }
    queryHeats(Number(overallEvent)).then((d) => setOverallRounds(d.data.rounds)).catch(() => setOverallRounds([]));
  }, [overallEvent]);

  async function handleSaveEnv() {
    try {
      await saveReportEnv(env);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(env));
    } catch {}
  }

  return (
    <div className="space-y-4">
      <Section title="成绩公示" description="配置环境信息，选择项目和赛次，导出成绩公告" />

      <Card>
        <CardHeader><div className="flex items-center gap-2"><CloudRain className="h-4 w-4 text-slate-500" /><CardTitle>环境信息</CardTitle></div></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 items-end">
            {[
              ["日期", "date", "130px"], ["风向", "wind_direction", "90px"], ["风速", "wind_speed", "90px"],
              ["空气", "air_quality", "110px"], ["天气", "weather", "90px"], ["最高℃", "temperature_high", "70px"], ["最低℃", "temperature_low", "70px"],
            ].map(([lab, key, w]) => (
              <div key={key} style={{ width: w }}><div className="text-xs font-medium text-slate-700 mb-1">{lab}</div><Input value={(env as any)[key]} onChange={(e) => setEnv((p) => ({ ...p, [key]: e.target.value }))} /></div>
            ))}
            <Button variant="secondary" onClick={handleSaveEnv}>保存</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>分组成绩</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-[220px]"><div className="text-xs font-medium text-slate-700 mb-1">项目</div>
              <Select value={heatEvent} onChange={(e) => { setHeatEvent(e.target.value); setHeatRound(""); }}>
                <option value="">选择项目</option>
                {events.map((e) => (<option key={e.id} value={String(e.id)}>{e.name} {glabel(e.gender)}{label(e.group)}</option>))}
              </Select>
            </div>
            <div className="w-[140px]"><div className="text-xs font-medium text-slate-700 mb-1">赛次</div>
              <Select value={heatRound} onChange={(e) => setHeatRound(e.target.value)}>
                <option value="">选择赛次</option>
                {heatRounds.map((r) => (<option key={r.id} value={String(r.round_number)}>{r.round_name}</option>))}
              </Select>
            </div>
            <Button onClick={() => heatEvent && heatRound && window.open(exportGroupedResultXlsx(Number(heatEvent), Number(heatRound), ""))}>
              <Download className="h-4 w-4" />导出 XLSX
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>总成绩</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-[220px]"><div className="text-xs font-medium text-slate-700 mb-1">项目</div>
              <Select value={overallEvent} onChange={(e) => { setOverallEvent(e.target.value); setOverallRound(""); }}>
                <option value="">选择项目</option>
                {events.map((e) => (<option key={e.id} value={String(e.id)}>{e.name} {glabel(e.gender)}{label(e.group)}</option>))}
              </Select>
            </div>
            <div className="w-[140px]"><div className="text-xs font-medium text-slate-700 mb-1">赛次</div>
              <Select value={overallRound} onChange={(e) => setOverallRound(e.target.value)}>
                <option value="">选择赛次</option>
                {overallRounds.map((r) => (<option key={r.id} value={String(r.round_number)}>{r.round_name}</option>))}
              </Select>
            </div>
            <Button onClick={() => overallEvent && overallRound && window.open(exportFullResultXlsx(Number(overallEvent), Number(overallRound), ""))}>
              <Download className="h-4 w-4" />导出 XLSX
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
