"use client";

import React from "react";
import { Section } from "@/components/ui/section";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, Th, Td } from "@/components/ui/table";
import { useToast, ToastOverlay } from "@/components/ui/toast";
import {
  type EventInfo,
  queryEvents,
  type RoundHeats,
  queryHeats,
  advanceRound,
  queryResults,
  type ResultRecord,
} from "@/lib/api";
import { Loader2, RefreshCcw } from "lucide-react";
import { useGroupLabels } from "@/lib/use-group-labels";

const DEFAULT_LANES = 8;

const STRATEGY_LABELS: Record<string, string> = {
  per_heat_top: "每组取前N名",
  overall_top: "总成绩取前N名",
};

type MergedRound = {
  roundNumber: number;
  label: string;
  actual: RoundHeats | undefined;
};

export function AdvancementPage() {
  const [events, setEvents] = React.useState<EventInfo[]>([]);
  const [selectedEventId, setSelectedEventId] = React.useState<number | null>(null);
  const [rounds, setRounds] = React.useState<RoundHeats[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [operating, setOperating] = React.useState(false);
  const [message, setMessage] = React.useState("");

  const [advancingRoundNum, setAdvancingRoundNum] = React.useState<number | null>(null);
  const [advancingResults, setAdvancingResults] = React.useState<ResultRecord[]>([]);
  const [resultsLoading, setResultsLoading] = React.useState(false);
  const [strategy, setStrategy] = React.useState("per_heat_top");
  const [topCount, setTopCount] = React.useState(2);
  const [extraCount, setExtraCount] = React.useState(0);
  const [nextAlgorithm, setNextAlgorithm] = React.useState("seeded");
  const [result, setResult] = React.useState<{ round_name: string; qualified: number } | null>(null);

  const { toast, show, dismiss } = useToast();
  const { label } = useGroupLabels();

  React.useEffect(() => {
    queryEvents()
      .then((data) => setEvents(data.items))
      .catch(() => setMessage("加载事件列表失败"))
      .finally(() => setLoading(false));
  }, []);

  const reload = async (eventId: number) => {
    setOperating(true);
    try {
      const data = await queryHeats(eventId);
      setRounds(data.data.rounds);
      setResult(null);
    } catch {
      show("加载编排数据失败", "error");
    } finally {
      setOperating(false);
    }
  };

  React.useEffect(() => {
    if (!selectedEventId) { setRounds([]); setAdvancingRoundNum(null); return; }
    reload(selectedEventId);
  }, [selectedEventId]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (!selectedEventId || advancingRoundNum == null) { setAdvancingResults([]); return; }
    setResultsLoading(true);
    queryResults({ event_id: selectedEventId, round_id: advancingRoundNum, page_size: 200 })
      .then((d) => setAdvancingResults(d.items))
      .catch(() => setAdvancingResults([]))
      .finally(() => setResultsLoading(false));
  }, [selectedEventId, advancingRoundNum]);

  const refreshAll = () => { if (!selectedEventId) return; reload(selectedEventId); };

  const handleAdvance = async () => {
    if (!selectedEventId || advancingRoundNum == null) return;
    setOperating(true);
    try {
      const res = await advanceRound(selectedEventId, advancingRoundNum, {
        strategy,
        lanes_per_heat: DEFAULT_LANES,
        algorithm: nextAlgorithm,
        params: strategy === "per_heat_top" ? { count: topCount, extra: extraCount } : { count: topCount },
      });
      setResult({ round_name: res.round_name, qualified: res.qualified });
      const data = await queryHeats(selectedEventId);
      setRounds(data.data.rounds);
      setAdvancingRoundNum(null);
      show(`晋级完成：${res.qualified} 人进入${res.round_name}`, "success");
    } catch {
      show("晋级执行失败", "error");
    } finally {
      setOperating(false);
    }
  };

  const heatsEvents = events.filter((e) => e.competition_format === "heats" || e.scoring_strategy === "time");
  const selectedEvent = events.find((e) => e.id === selectedEventId);

  const allRounds: MergedRound[] = React.useMemo(() => {
    if (!selectedEvent?.round_names) return [];
    const names = selectedEvent.round_names;
    const maxRound = selectedEvent.heat_rounds ?? Object.keys(names).length;
    const result: MergedRound[] = [];
    for (let i = 1; i <= maxRound; i++) {
      const label = names[String(i)] ?? `第${i}轮`;
      const actual = rounds.find((r) => r.round_number === i);
      result.push({ roundNumber: i, label, actual });
    }
    return result;
  }, [selectedEvent, rounds]);

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-slate-400 gap-2"><Loader2 className="h-5 w-5 animate-spin" />加载中…</div>;
  }

  return (
    <div className="space-y-4">
      <ToastOverlay toast={toast} onClose={dismiss} />
      <Section title="晋级管理" description="执行晋级：按策略筛选运动员，自动生成下一轮编排"
        right={<Button variant="secondary" size="sm" onClick={refreshAll} disabled={operating || !selectedEventId}><RefreshCcw className="h-4 w-4" />刷新</Button>} />

      {message && <div className={`text-sm p-3 rounded-md ${message.includes("失败") ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}>{message}</div>}

      <Card>
        <CardContent className="p-4">
          <div className="text-xs font-medium text-slate-700 mb-1">选择项目</div>
          <Select value={selectedEventId ?? ""} onChange={(e) => { const id = e.target.value ? Number(e.target.value) : null; setSelectedEventId(id); setRounds([]); setAdvancingRoundNum(null); setResult(null); }}>
            <option value="">-- 请选择径赛项目 --</option>
            {heatsEvents.map((e) => (<option key={e.id} value={e.id}>{e.name} {e.gender === "male" ? "男子" : "女子"} {label(e.group)}{e.heat_rounds ? ` (${e.heat_rounds}轮)` : ""}</option>))}
          </Select>
        </CardContent>
      </Card>

      {selectedEventId && allRounds.length === 0 && <Card><CardContent className="py-8 text-center text-slate-400">暂无编排数据，请先在分道编排中配置并生成</CardContent></Card>}

      {allRounds.length > 0 && (
        <div className="space-y-3">
          {allRounds.map((mr, i) => {
            const hasHeats = mr.actual && mr.actual.heats.length > 0;
            const totalEntries = mr.actual ? mr.actual.heats.reduce((s, h) => s + h.entries.length, 0) : 0;
            const isLast = i === allRounds.length - 1;
            const isActive = advancingRoundNum === mr.roundNumber;

            return (
              <div key={mr.roundNumber} className={`rounded-xl border-2 transition-colors ${isActive ? "border-accent bg-accent-bg/40" : hasHeats ? "border-slate-200 bg-white" : "border-slate-100 bg-slate-50/80"}`}>
                <div className="px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`text-lg font-bold ${hasHeats ? "text-slate-900" : "text-slate-400"}`}>{mr.label}</span>
                      {mr.actual?.advancement_rule && <Badge variant="success">{STRATEGY_LABELS[mr.actual.advancement_rule] ?? mr.actual.advancement_rule}</Badge>}
                      <span className="text-sm text-slate-400">{hasHeats ? `${mr.actual!.heats.length}组 · ${totalEntries}人` : mr.actual ? "待生成" : "未创建"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isLast && hasHeats && !isActive && (
                        <Button size="sm" onClick={() => { setAdvancingRoundNum(mr.roundNumber); setResult(null); if (mr.actual!.advancement_rule) setStrategy(mr.actual!.advancement_rule); }}>晋级 → {allRounds[i + 1]?.label}</Button>
                      )}
                      {isLast && hasHeats && <span className="text-xs text-slate-400">最后一轮</span>}
                      {!hasHeats && <span className="text-xs text-slate-400">{i === 0 ? "请先生成编排" : "晋级后自动生成"}</span>}
                    </div>
                  </div>

                  {isActive && (
                    <div className="mt-4 p-4 rounded-lg bg-white border border-slate-200 space-y-3">
                      <h3 className="text-sm font-semibold text-slate-900">晋级：{mr.label} → {allRounds[i + 1]?.label}</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <div className="text-xs font-medium text-slate-500 mb-1">策略</div>
                          <Select value={strategy} onChange={(e) => setStrategy(e.target.value)}>
                            <option value="per_heat_top">每组取前N名</option>
                            <option value="overall_top">总成绩取前N名</option>
                          </Select>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-slate-500 mb-1">{strategy === "per_heat_top" ? "每组晋级" : "晋级人数"}</div>
                          <Input className="h-9" type="number" min={1} value={topCount} onChange={(e) => setTopCount(Math.max(1, Number(e.target.value) || 1))} />
                        </div>
                        {strategy === "per_heat_top" && (
                          <div>
                            <div className="text-xs font-medium text-slate-500 mb-1">递补</div>
                            <Input className="h-9" type="number" min={0} value={extraCount} onChange={(e) => setExtraCount(Math.max(0, Number(e.target.value) || 0))} />
                          </div>
                        )}
                        <div>
                          <div className="text-xs font-medium text-slate-500 mb-1">分道</div>
                          <Select value={nextAlgorithm} onChange={(e) => setNextAlgorithm(e.target.value)}>
                            <option value="seeded">蛇形</option>
                            <option value="random">随机</option>
                          </Select>
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="secondary" size="sm" onClick={() => setAdvancingRoundNum(null)}>取消</Button>
                        <Button size="sm" onClick={handleAdvance} disabled={operating}>{operating ? "执行中…" : "执行晋级"}</Button>
                      </div>
                      {result && <div className="flex items-center gap-2 text-sm"><Badge variant="success">完成</Badge><span className="text-slate-700">{result.qualified} 人晋级至 {result.round_name}</span></div>}
                    </div>
                  )}

                  {isActive && hasHeats && (
                    <div className="mt-4">
                      <h3 className="text-sm font-semibold text-slate-900 mb-3">{mr.label}成绩</h3>
                      {resultsLoading ? (
                        <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-slate-400" /></div>
                      ) : (
                        <div className="space-y-3">
                          {mr.actual!.heats.map((h) => {
                            const raw = h.entries
                              .filter((e) => e.lane != null)
                              .map((e) => {
                                const res = advancingResults.find((r) => r.target_name === e.athlete_name);
                                return { ...e, performance: res?.performance, rank: res?.rank, heatRank: res?.heat_rank };
                              });
                            const hasResults = raw.some((e) => e.heatRank != null);
                            const sorted = raw.sort((a, b) => hasResults ? ((a.heatRank ?? 999) - (b.heatRank ?? 999)) : ((a.lane ?? 99) - (b.lane ?? 99)));

                            return (
                              <div key={h.id}>
                                <div className="text-xs font-medium text-slate-600 bg-slate-50 rounded px-2.5 py-1.5 mb-1.5">{h.heat_name} ({h.entries.length}人)</div>
                                <Table>
                                  <thead>
                                    <tr>
                                      <Th>道次</Th><Th>运动员</Th><Th>单位</Th><Th>成绩</Th><Th>组内</Th><Th>总排名</Th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {sorted.map((e) => (
                                      <tr key={e.id} className={(strategy === "per_heat_top" && e.heatRank != null && e.heatRank <= topCount) || (strategy === "overall_top" && e.rank != null && e.rank <= topCount) ? "bg-accent-bg" : ""}>
                                        <Td className="text-xs">{e.lane}道</Td>
                                        <Td className="text-sm">{e.athlete_name}<span className="text-xs text-slate-400 ml-1">{e.athlete_no}</span></Td>
                                        <Td className="text-xs text-slate-500">{e.department_name}</Td>
                                        <Td className="text-xs tabular-nums">{e.performance ?? "—"}</Td>
                                        <Td className="text-xs tabular-nums font-semibold">{e.heatRank ?? "—"}</Td>
                                        <Td className="text-xs tabular-nums">{e.rank ?? "—"}</Td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </Table>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
