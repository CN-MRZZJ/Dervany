"use client";

import React from "react";
import { Section } from "@/components/ui/section";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, Th, Td } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast, ToastOverlay } from "@/components/ui/toast";
import { LaneAssignmentPanel } from "./lane-assignment-panel";
import {
  type EventInfo,
  queryEvents,
  type HeatEntry,
  type HeatInfo,
  type RoundHeats,
  type HeatsData,
  type UnassignedAthlete,
  configHeatRounds,
  generateHeats,
  queryHeats,
  clearHeats,
  queryUnassignedParticipants,
  addHeatEntry,
  removeHeatEntry,
  updateHeatEntry,
  listAlgorithms,
} from "@/lib/api";
import { Loader2, RefreshCcw, Zap, Trash2, Settings } from "lucide-react";
import { useGroupLabels } from "@/lib/use-group-labels";

const USE_MOCK = false;
const LANE_COUNT = 8;

const MOCK_EVENTS: EventInfo[] = [
  { id: 1, name: "100米", category: "competitive", gender: "male", group: "甲组", event_type: "track", scoring_strategy: "time", is_individual: 1, competition_format: "heats", heat_rounds: 3, round_names: { "1": "预赛", "2": "半决赛", "3": "决赛" }, registration_count: 18 },
  { id: 2, name: "100米", category: "competitive", gender: "female", group: "甲组", event_type: "track", scoring_strategy: "time", is_individual: 1, competition_format: "heats", heat_rounds: 2, round_names: { "1": "预赛", "2": "决赛" }, registration_count: 12 },
  { id: 3, name: "200米", category: "competitive", gender: "male", group: "乙组", event_type: "track", scoring_strategy: "time", is_individual: 1, competition_format: "heats", heat_rounds: 2, round_names: { "1": "预赛", "2": "决赛" }, registration_count: 16 },
  { id: 4, name: "跳远", category: "competitive", gender: "male", group: "甲组", event_type: "jump", scoring_strategy: "length", is_individual: 1 },
  { id: 5, name: "铅球", category: "competitive", gender: "female", group: "乙组", event_type: "throw", scoring_strategy: "length", is_individual: 1 },
];

const MOCK_UNASSIGNED: UnassignedAthlete[] = [
  { athlete_id: 109, athlete_name: "刘一", athlete_no: "C009", athlete_type: "competitive", department_name: "数学学院", group: "甲组" },
  { athlete_id: 110, athlete_name: "陈二", athlete_no: "C010", athlete_type: "competitive", department_name: "物理学院", group: "甲组" },
  { athlete_id: 111, athlete_name: "杨三", athlete_no: "C011", athlete_type: "competitive", department_name: "化学学院", group: "甲组" },
  { athlete_id: 112, athlete_name: "黄四", athlete_no: "C012", athlete_type: "competitive", department_name: "外语学院", group: "甲组" },
];

const MOCK_STRATEGIES = ["random", "seeded"];

export function LaneAssignmentPage() {
  const [events, setEvents] = React.useState<EventInfo[]>([]);
  const [selectedEventId, setSelectedEventId] = React.useState<number | null>(null);
  const [rounds, setRounds] = React.useState<RoundHeats[]>([]);
  const [activeRoundIdx, setActiveRoundIdx] = React.useState(0);
  const [activeHeatId, setActiveHeatId] = React.useState<number | null>(null);
  const [rawUnassigned, setRawUnassigned] = React.useState<UnassignedAthlete[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [operating, setOperating] = React.useState(false);
  const [message, setMessage] = React.useState("");

  // Config modal
  const [showConfigModal, setShowConfigModal] = React.useState(false);
  const [configRounds, setConfigRounds] = React.useState(3);

  // Generate modal
  const [showGenerateModal, setShowGenerateModal] = React.useState(false);
  const [genAlgorithm, setGenAlgorithm] = React.useState("random");
  const [genLanes, setGenLanes] = React.useState(8);

  // Add entry modal
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [addTargetLane, setAddTargetLane] = React.useState<number | null>(null);
  const [addAthleteId, setAddAthleteId] = React.useState<number | null>(null);

  // Move modal
  const [showMoveModal, setShowMoveModal] = React.useState(false);
  const [moveEntry, setMoveEntry] = React.useState<HeatEntry | null>(null);
  const [moveTargetHeat, setMoveTargetHeat] = React.useState<number | null>(null);
  const [moveTargetLane, setMoveTargetLane] = React.useState<number | null>(null);

  // Batch heats
  const [showBatchModal, setShowBatchModal] = React.useState(false);
  const [batchMode, setBatchMode] = React.useState<"track" | "field">("field");
  const [batchLanes, setBatchLanes] = React.useState(8);
  const [batchEventIds, setBatchEventIds] = React.useState<Set<number>>(new Set());

  // Mock state (only used when USE_MOCK=true)
  const [mockData, setMockData] = React.useState<HeatsData>({
    event_id: 1, rounds: [],
  });
  const [mockUnassigned, setMockUnassigned] = React.useState<UnassignedAthlete[]>([]);

  const { toast, show, dismiss } = useToast();
  const { label } = useGroupLabels();

  // Derive truly unassigned: backend result minus anyone already in any round's heat entry
  const assignedIds = React.useMemo(() => {
    const ids = new Set<number>();
    rounds.forEach((r) =>
      r.heats.forEach((h) =>
        h.entries.forEach((e) => ids.add(e.athlete_ref_id))
      )
    );
    return ids;
  }, [rounds]);

  const unassigned = React.useMemo(
    () => rawUnassigned.filter((a) => !assignedIds.has(a.athlete_id)),
    [rawUnassigned, assignedIds]
  );

  // Load events
  React.useEffect(() => {
    if (USE_MOCK) {
      setEvents(MOCK_EVENTS);
      setLoading(false);
      return;
    }
    queryEvents()
      .then((data) => setEvents(data.items))
      .catch(() => setMessage("加载事件列表失败"))
      .finally(() => setLoading(false));
  }, []);

  const heatsEvents = events.filter(
    (e) => e.competition_format === "heats" || e.scoring_strategy === "time"
  );

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  const reload = async (eventId: number) => {
    setOperating(true);
    try {
      const heatData = await queryHeats(eventId);
      setRounds(heatData.data.rounds);
      if (heatData.data.rounds.length > 0) {
        // preserve current round/heat selection when possible
        const keepIdx = activeRoundIdx < heatData.data.rounds.length ? activeRoundIdx : 0;
        const round = heatData.data.rounds[keepIdx];
        const heat = round.heats.find((h) => h.id === activeHeatId);
        setActiveRoundIdx(keepIdx);
        if (!heat && round.heats.length > 0) {
          setActiveHeatId(round.heats[0].id);
        } else if (round.heats.length === 0) {
          setActiveHeatId(null);
        }
      }
      // Best-effort: unassigned participants
      queryUnassignedParticipants(eventId)
        .then((d) => setRawUnassigned(d.items))
        .catch(() => {});
    } catch {
      show("加载编排数据失败", "error");
    } finally {
      setOperating(false);
    }
  };

  // Load heats + unassigned when event selected
  React.useEffect(() => {
    if (!selectedEventId) { setRounds([]); setRawUnassigned([]); return; }
    reload(selectedEventId);
  }, [selectedEventId]); // eslint-disable-line react-hooks/exhaustive-deps

  const refreshAll = () => {
    if (!selectedEventId) return;
    reload(selectedEventId);
  };

  const handleConfigRounds = async () => {
    if (!selectedEventId) return;
    setOperating(true);
    try {
      await configHeatRounds(selectedEventId, { heat_rounds: configRounds });
      // Keep local event state in sync so needsGenerate/needsConfig don't use stale heat_rounds
      setEvents((prev) =>
        prev.map((e) =>
          e.id === selectedEventId ? { ...e, heat_rounds: configRounds } : e
        )
      );
      show("轮次配置成功", "success");
      setShowConfigModal(false);
      await reload(selectedEventId);
    } catch {
      show("配置失败", "error");
    } finally {
      setOperating(false);
    }
  };

  const handleGenerateHeats = async () => {
    if (!selectedEventId) return;
    setOperating(true);
    try {
      await generateHeats(selectedEventId, {
        lanes_per_heat: genLanes,
        algorithm: genAlgorithm,
      });
      show("编排生成成功", "success");
      setShowGenerateModal(false);
      // Refresh events too — registration_count may have changed, round_names now populated
      queryEvents()
        .then((d) => setEvents(d.items))
        .catch(() => {});
      await reload(selectedEventId);
    } catch {
      show("生成编排失败", "error");
    } finally {
      setOperating(false);
    }
  };

  const handleClearHeats = async () => {
    if (!selectedEventId) return;
    if (!confirm("确认清除该项目的所有编排？此操作不可撤销。")) return;
    setOperating(true);
    try {
      await clearHeats(selectedEventId);
      show("编排已清除", "success");
      setRounds([]);
      setRawUnassigned([]);
      setActiveHeatId(null);
    } catch {
      show("清除失败", "error");
    } finally {
      setOperating(false);
    }
  };

  const handleBatchHeats = async () => {
    setOperating(true);
    let done = 0;
    let skipped = 0;
    let failed = 0;
    for (const eventId of batchEventIds) {
      const ev = events.find((e) => e.id === eventId);
      if (!ev?.registration_count) { skipped++; continue; }
      try {
        await generateHeats(eventId, {
          algorithm: "random",
          lanes_per_heat: batchMode === "track" ? batchLanes : ev.registration_count,
        });
        done++;
      } catch { failed++; }
    }
    show(`${done} 个生成，${skipped} 个跳过，${failed} 个失败`, failed ? "error" : "success");
    setShowBatchModal(false);
    queryEvents().then((d) => setEvents(d.items)).catch(() => {});
    if (selectedEventId) reload(selectedEventId);
    setOperating(false);
  };

  const handleAddEntry = async () => {
    if (!selectedEventId || !activeHeatId || !addAthleteId) return;
    setOperating(true);
    try {
      await addHeatEntry(selectedEventId, activeHeatId, {
        athlete_id: addAthleteId,
        athlete_type: "competitive",
        lane: addTargetLane,
      });
      show("分配成功", "success");
      setShowAddModal(false);
      setAddAthleteId(null);
      setAddTargetLane(null);
      await reload(selectedEventId);
    } catch {
      show("分配失败", "error");
    } finally {
      setOperating(false);
    }
  };

  const handleRemoveEntry = async (entry: HeatEntry) => {
    if (!selectedEventId) return;
    setOperating(true);
    try {
      await removeHeatEntry(selectedEventId, entry.heat_id, entry.id);
      show("已移除", "success");
      await reload(selectedEventId);
    } catch {
      show("移除失败", "error");
    } finally {
      setOperating(false);
    }
  };

  const handleMoveEntry = async () => {
    if (!selectedEventId || !moveEntry || !moveTargetHeat) return;
    setOperating(true);
    try {
      await updateHeatEntry(selectedEventId, moveEntry.heat_id, moveEntry.id, {
        heat_id: moveTargetHeat,
        lane: moveTargetLane ?? undefined,
      });
      show("调整成功", "success");
      setShowMoveModal(false);
      setMoveEntry(null);
      await reload(selectedEventId);
    } catch {
      show("调整失败", "error");
    } finally {
      setOperating(false);
    }
  };

  const openAddModal = (laneNumber: number) => {
    setAddTargetLane(laneNumber);
    setAddAthleteId(null);
    setShowAddModal(true);
  };

  const openAddForAthlete = (athlete: UnassignedAthlete) => {
    setAddAthleteId(athlete.athlete_id);
    const activeRound = rounds[activeRoundIdx];
    const activeHeat = activeRound?.heats.find((h) => h.id === activeHeatId);
    const occupied = new Set((activeHeat?.entries ?? []).filter((e) => e.lane != null).map((e) => e.lane));
    const firstEmpty = Array.from({ length: activeLaneCount }, (_, i) => i + 1).find((n) => !occupied.has(n));
    setAddTargetLane(firstEmpty ?? null);
    setShowAddModal(true);
  };

  const openMoveModal = (entry: HeatEntry) => {
    setMoveEntry(entry);
    setMoveTargetHeat(null);
    setMoveTargetLane(null);
    setShowMoveModal(true);
  };

  const activeRound = rounds[activeRoundIdx];
  const activeHeat = activeRound?.heats.find((h) => h.id === activeHeatId);
  const activeLaneCount = Math.max(LANE_COUNT, ...(activeHeat?.entries.map((e) => e.lane ?? 0) ?? []));

  const hasHeats = rounds.some((r) => r.heats.length > 0);
  const needsConfig = selectedEvent && !(selectedEvent.heat_rounds && selectedEvent.heat_rounds > 0);
  const needsGenerate = selectedEvent && (selectedEvent.heat_rounds ?? 0) > 0 && !hasHeats;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />加载中…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ToastOverlay toast={toast} onClose={dismiss} />

      <Section
        title="分道编排"
        description="配置轮次、生成编排、手动调整道次"
        right={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => {
              const list = events.filter((e) => e.event_type === "track" && e.competition_format === "heats");
              setBatchMode("track");
              setBatchEventIds(new Set(list.filter((e) => (e.heat_rounds ?? 0) > 0).map((e) => e.id)));
              setShowBatchModal(true);
            }} disabled={operating}>
              <Zap className="h-4 w-4" />一键编排径赛
            </Button>
            <Button variant="secondary" size="sm" onClick={() => {
              const list = events.filter((e) => e.event_type === "field" && e.competition_format === "heats");
              setBatchMode("field");
              setBatchEventIds(new Set(list.filter((e) => (e.heat_rounds ?? 0) > 0).map((e) => e.id)));
              setShowBatchModal(true);
            }} disabled={operating}>
              <Zap className="h-4 w-4" />一键编排田赛
            </Button>
            {selectedEventId && hasHeats && (
              <Button variant="warning" size="sm" onClick={handleClearHeats} disabled={operating}>
                <Trash2 className="h-4 w-4" />清除编排
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={refreshAll} disabled={operating || !selectedEventId}>
              <RefreshCcw className="h-4 w-4" />刷新
            </Button>
          </div>
        }
      />

      {message && (
        <div className={`text-sm p-3 rounded-md ${message.includes("失败") ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}>
          {message}
        </div>
      )}

      {/* Event Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <div className="text-xs font-medium text-slate-700 mb-1">选择项目</div>
              <Select
                value={selectedEventId ?? ""}
                onChange={(e) => {
                  const id = e.target.value ? Number(e.target.value) : null;
                  setSelectedEventId(id);
                  setRounds([]);
                  setRawUnassigned([]);
                  setActiveHeatId(null);
                }}
              >
                <option value="">-- 请选择径赛项目 --</option>
                {heatsEvents.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} {e.gender === "male" ? "男子" : "女子"} {label(e.group)}
                    {e.is_individual === 0 ? " (团体)" : ""}
                  </option>
                ))}
              </Select>
            </div>
            {selectedEvent && (
              <div className="flex items-center gap-3 text-sm text-slate-500 pb-0.5">
                <span>报名 {selectedEvent.registration_count ?? "—"} 人</span>
                <span className="text-slate-300">|</span>
                <span>{selectedEvent.heat_rounds ? `${selectedEvent.heat_rounds} 轮` : "未配置轮次"}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setConfigRounds(selectedEvent.heat_rounds || 2);
                    setShowConfigModal(true);
                  }}
                >
                  <Settings className="h-3.5 w-3.5 mr-1" />配置
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Config prompt */}
      {needsConfig && (
        <Card>
          <CardContent className="py-8 text-center space-y-3">
            <p className="text-slate-500">该项目尚未配置比赛轮次</p>
            <Button onClick={() => { setConfigRounds(2); setShowConfigModal(true); }}>
              <Settings className="h-4 w-4 mr-1" />配置轮次
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Generate prompt */}
      {needsGenerate && (
        <Card>
          <CardContent className="py-8 text-center space-y-3">
            <p className="text-slate-500">轮次已配置，尚未生成编排</p>
            <Button onClick={() => setShowGenerateModal(true)}>
              <Zap className="h-4 w-4 mr-1" />生成编排
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Main content */}
      {selectedEventId && hasHeats && rounds.length > 0 && (
        <>
          {/* Round Tabs */}
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1 w-fit flex-wrap">
            {rounds.map((r, i) => {
              const totalEntries = r.heats.reduce((s, h) => s + h.entries.length, 0);
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    setActiveRoundIdx(i);
                    setActiveHeatId(r.heats[0]?.id ?? null);
                  }}
                  className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
                    i === activeRoundIdx ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {r.round_name}
                  {r.advancement_rule && <span className="ml-1 text-xs text-accent">●</span>}
                  <span className="ml-1 text-xs text-slate-400">({totalEntries}人)</span>
                </button>
              );
            })}
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
            {/* Left: Heat tabs + Lane panel */}
            <div className="space-y-3 min-w-0">
              {activeRound && activeRound.heats.length > 0 && (
                <div className="flex gap-1 rounded-lg bg-slate-100 p-1 w-fit flex-wrap">
                  {activeRound.heats.map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => setActiveHeatId(h.id)}
                      className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                        activeHeatId === h.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      {h.heat_name}
                      <span className="ml-1 text-xs text-slate-400">({h.entries.length})</span>
                    </button>
                  ))}
                </div>
              )}

              {activeHeat ? (
                <LaneAssignmentPanel
                  heatLabel={activeHeat.heat_name}
                  entries={activeHeat.entries}
                  laneCount={activeLaneCount}
                  onAddClick={openAddModal}
                  onRemoveClick={handleRemoveEntry}
                  onMoveClick={openMoveModal}
                />
              ) : activeRound && activeRound.heats.length === 0 ? (
                <Card><CardContent className="py-8 text-center text-slate-400">该轮次暂无编组</CardContent></Card>
              ) : null}
            </div>

            {/* Right: Unassigned + Summary */}
            <div className="space-y-3 min-w-0">
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">
                    未分配运动员 ({unassigned.length}人)
                  </h3>
                  {unassigned.length === 0 ? (
                    <div className="text-center py-4 text-sm text-slate-400">所有运动员已分配</div>
                  ) : (
                    <div className="max-h-[300px] overflow-y-auto">
                      <Table>
                        <thead>
                          <tr>
                            <Th>编号</Th>
                            <Th>姓名</Th>
                            <Th>操作</Th>
                          </tr>
                        </thead>
                        <tbody>
                          {unassigned.map((a) => (
                            <tr key={a.athlete_id}>
                              <Td className="text-xs">{a.athlete_no}</Td>
                              <Td className="text-sm">
                                {a.athlete_name}
                                <div className="text-xs text-slate-400">{a.department_name}</div>
                              </Td>
                              <Td>
                                <Button variant="ghost" size="sm" className="text-accent" onClick={() => openAddForAthlete(a)}>
                                  →分配
                                </Button>
                              </Td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* All-rounds summary */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">各轮分配概览</h3>
                  <div className="text-xs space-y-2 max-h-[300px] overflow-y-auto">
                    {rounds.map((r) => {
                      const total = r.heats.reduce((s, h) => s + h.entries.length, 0);
                      if (total === 0) return null;
                      return (
                        <div key={r.id}>
                          <div className="font-medium text-slate-700 mb-1 flex items-center gap-1.5">
                            <Badge variant="info">{r.round_name}</Badge>
                            <span className="text-slate-400">{total}人</span>
                          </div>
                          {r.heats.map((h) =>
                            h.entries
                              .filter((e) => e.lane != null)
                              .sort((a, b) => (a.lane ?? 99) - (b.lane ?? 99))
                              .map((e) => (
                                <div key={e.id} className="flex justify-between py-0.5 text-slate-500 pl-2">
                                  <span>{h.heat_name} {e.lane}道</span>
                                  <span>{e.athlete_name}</span>
                                </div>
                              ))
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* Config Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowConfigModal(false)}>
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-900">配置轮次</h3>
            <p className="text-sm text-slate-500">设置该项目比赛的轮次数量</p>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setConfigRounds(n)}
                  className={`rounded-lg px-3 py-3 text-sm font-medium transition-all border text-center ${
                    configRounds === n
                      ? "bg-accent text-white border-accent"
                      : "bg-white text-slate-700 border-slate-200 hover:border-accent"
                  }`}
                >
                  <div className="text-base font-bold">{n}轮</div>
                  <div className="text-xs opacity-70 mt-0.5 leading-tight">
                    {n === 1 && "决赛"}
                    {n === 2 && "预赛→决赛"}
                    {n === 3 && "预赛→半决赛→决赛"}
                    {n === 4 && "预赛→复赛→半决赛→决赛"}
                  </div>
                </button>
              ))}
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setShowConfigModal(false)}>取消</Button>
              <Button onClick={handleConfigRounds} disabled={operating}>确认</Button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowGenerateModal(false)}>
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-900">生成编排</h3>
            <div>
              <div className="text-xs font-medium text-slate-700 mb-1">分道算法</div>
              <div className="flex gap-2">
                {MOCK_STRATEGIES.map((algo) => (
                  <button
                    key={algo}
                    type="button"
                    onClick={() => setGenAlgorithm(algo)}
                    className={`flex-1 rounded-md px-3 py-2 text-sm font-medium border transition-all ${
                      genAlgorithm === algo ? "bg-accent text-white border-accent" : "bg-white text-slate-700 border-slate-200"
                    }`}
                  >
                    {algo === "random" ? "随机" : "种子蛇形"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-700 mb-1">每组道数</div>
              <Input type="number" min={2} max={10} value={genLanes} onChange={(e) => setGenLanes(Number(e.target.value) || 8)} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setShowGenerateModal(false)}>取消</Button>
              <Button onClick={handleGenerateHeats} disabled={operating}><Zap className="h-4 w-4 mr-1" />生成</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-900">添加运动员</h3>
            <div>
              <div className="text-xs font-medium text-slate-700 mb-1">运动员</div>
              <Select value={addAthleteId ?? ""} onChange={(e) => setAddAthleteId(e.target.value ? Number(e.target.value) : null)}>
                <option value="">-- 选择运动员 --</option>
                {unassigned.map((a) => (
                  <option key={a.athlete_id} value={a.athlete_id}>{a.athlete_name} ({a.athlete_no})</option>
                ))}
              </Select>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-700 mb-1">道次（可选）</div>
              <Select value={addTargetLane ?? ""} onChange={(e) => setAddTargetLane(e.target.value ? Number(e.target.value) : null)}>
                <option value="">-- 仅分组不指定道次 --</option>
                {Array.from({ length: activeLaneCount }, (_, i) => i + 1).map((n) => {
                  const occupied = activeHeat?.entries.some((e) => e.lane === n);
                  return (
                    <option key={n} value={n} disabled={occupied}>{n}道{occupied ? " (已占用)" : ""}</option>
                  );
                })}
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setShowAddModal(false)}>取消</Button>
              <Button onClick={handleAddEntry} disabled={operating || !addAthleteId}>确认添加</Button>
            </div>
          </div>
        </div>
      )}

      {/* Move Modal */}
      {showMoveModal && moveEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowMoveModal(false)}>
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-900">调整组别/道次</h3>
            <div className="text-sm text-slate-600 bg-slate-50 rounded p-2">
              {moveEntry.athlete_name} ({moveEntry.athlete_no})
              <span className="text-slate-400 ml-1">
                · 当前: {rounds.find((r) => r.heats.some((h) => h.id === moveEntry.heat_id))?.round_name}{" "}
                {rounds.flatMap((r) => r.heats).find((h) => h.id === moveEntry.heat_id)?.heat_name}{" "}
                {moveEntry.lane != null ? `${moveEntry.lane}道` : "未指定道次"}
              </span>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-700 mb-1">目标编组</div>
              <Select value={moveTargetHeat ?? ""} onChange={(e) => setMoveTargetHeat(e.target.value ? Number(e.target.value) : null)}>
                <option value="">-- 选择目标编组 --</option>
                {rounds.flatMap((r) => r.heats).map((h) => {
                  const roundName = rounds.find((r) => r.heats.some((x) => x.id === h.id))?.round_name;
                  return (
                    <option key={h.id} value={h.id}>
                      {roundName} · {h.heat_name}
                    </option>
                  );
                })}
              </Select>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-700 mb-1">目标道次（可选，留空不指定）</div>
              <Select value={moveTargetLane ?? ""} onChange={(e) => setMoveTargetLane(e.target.value ? Number(e.target.value) : null)}>
                <option value="">-- 不指定 --</option>
                {Array.from({ length: activeLaneCount }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n}道</option>
                ))}
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setShowMoveModal(false)}>取消</Button>
              <Button onClick={handleMoveEntry} disabled={operating || !moveTargetHeat}>确认调整</Button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Field Heats Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowBatchModal(false)}>
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg mx-4 space-y-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-900">一键编排{batchMode === "track" ? "径赛" : "田赛"}</h3>
            <p className="text-sm text-slate-500">勾选需要生成编排的项目，未配置轮次的已排除</p>
            {batchMode === "track" && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-700">每组道数</span>
                <Input className="w-20" type="number" min={2} max={10} value={batchLanes} onChange={(e) => setBatchLanes(Number(e.target.value) || 8)} />
              </div>
            )}
            {batchMode === "field" && <p className="text-xs text-slate-400">每组道数 = 报名人数</p>}
            <div className="space-y-1">
              {events
                .filter((e) => e.event_type === batchMode && e.competition_format === "heats")
                .map((e) => {
                  const configured = (e.heat_rounds ?? 0) > 0;
                  const checked = batchEventIds.has(e.id);
                  return (
                    <label key={e.id} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 border transition-colors ${!configured ? "bg-slate-50 border-slate-100 text-slate-300" : checked ? "border-accent bg-accent-bg" : "border-slate-200 hover:border-slate-300 cursor-pointer"}`}>
                      <input
                        type="checkbox"
                        disabled={!configured}
                        checked={configured && checked}
                        onChange={(ev) => {
                          setBatchEventIds((prev) => {
                            const next = new Set(prev);
                            if (ev.target.checked) next.add(e.id); else next.delete(e.id);
                            return next;
                          });
                        }}
                      />
                      <div className="flex-1 text-sm">
                        <span className={configured ? "text-slate-900 font-medium" : "text-slate-400"}>{e.name} {e.gender === "male" ? "男子" : "女子"} {label(e.group)}</span>
                        <span className="text-xs text-slate-400 ml-2">
                          {configured
                            ? `${e.heat_rounds}轮 · 报名${e.registration_count ?? "?"}人`
                            : "未配置轮次"}
                        </span>
                      </div>
                    </label>
                  );
                })}
            </div>
            {Array.from(batchEventIds).length === 0 && (
              <div className="text-center text-sm text-slate-400 py-2">没有可编排的项目</div>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setShowBatchModal(false)}>取消</Button>
              <Button onClick={handleBatchHeats} disabled={operating || batchEventIds.size === 0}>
                {operating ? "编排中…" : `为 ${batchEventIds.size} 个项目生成编排`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
