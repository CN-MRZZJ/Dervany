"use client";

import * as React from "react";
import { Section } from "@/components/ui/section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RefreshCcw, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { queryEventProgress, updateProgressForm, type SessionProgress } from "@/lib/api";

const STAGES = [
  { key: "checkin", label: "检录", color: "bg-amber-500", textColor: "text-amber-600", bgColor: "bg-amber-50", borderColor: "border-amber-200" },
  { key: "compete", label: "比赛", color: "bg-sky-500", textColor: "text-sky-600", bgColor: "bg-sky-50", borderColor: "border-sky-200" },
  { key: "record", label: "录入", color: "bg-indigo-500", textColor: "text-indigo-600", bgColor: "bg-indigo-50", borderColor: "border-indigo-200" },
  { key: "publish", label: "公示", color: "bg-emerald-500", textColor: "text-emerald-600", bgColor: "bg-emerald-50", borderColor: "border-emerald-200" },
] as const;

function stageFromProgress(s: SessionProgress): number {
  if (s.publish_done) return 3;    // 公示
  if (s.record_done) return 2;     // 录入
  if (s.competition_done) return 1; // 比赛
  if (s.checkin_done) return 0;    // 检录
  return 0; // 未开始则视为检录阶段
}

function genderText(g: string) {
  if (g === "male") return "男";
  if (g === "female") return "女";
  if (g === "mixed") return "混合";
  return g;
}

export function EventProgressPage() {
  const [sessions, setSessions] = React.useState<SessionProgress[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [keyword, setKeyword] = React.useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await queryEventProgress();
      setSessions(data.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { load(); }, []);

  const filtered = sessions.filter((s) => {
    if (!keyword) return true;
    const kw = keyword.toLowerCase();
    return [s.name, s.category, genderText(s.gender), s.age_group]
      .join(" ").toLowerCase().includes(kw);
  });

  async function advanceStage(eventId: number, currentStage: number) {
    const next = currentStage + 1;
    const checkinDone = next >= 0;
    const competitionDone = next >= 1;
    const recordDone = next >= 2;
    const publishDone = next >= 3;
    try {
      await updateProgressForm({ event_id: eventId, checkin_done: checkinDone, competition_done: competitionDone, record_done: recordDone, publish_done: publishDone });
      setSessions((prev) =>
        prev.map((s) =>
          s.id === eventId
            ? { ...s, checkin_done: checkinDone ? 1 : 0, competition_done: competitionDone ? 1 : 0, record_done: recordDone ? 1 : 0, publish_done: publishDone ? 1 : 0, updated_at: new Date().toISOString().replace("T", " ").slice(0, 19) }
            : s
        )
      );
    } catch (e) {
      alert(e instanceof Error ? e.message : "更新失败");
    }
  }

  return (
    <div className="space-y-4">
      <Section
        title="比赛进度"
        description="按阶段跟踪各项目场次流程"
        right={
          <Button variant="secondary" size="sm" onClick={load} disabled={loading}>
            <RefreshCcw className="h-4 w-4" />刷新
          </Button>
        }
      />

      {loading ? (
        <div className="flex items-center gap-2 text-slate-500 py-8 justify-center">
          <Loader2 className="h-5 w-5 animate-spin" /> 加载中…
        </div>
      ) : error ? (
        <Card><CardContent className="py-8 text-center text-rose-500">{error}</CardContent></Card>
      ) : (
        <>
          {/* 阶段概览 */}
          <div className="flex items-center gap-0 overflow-x-auto">
            {STAGES.map((stage, idx) => {
              const count = sessions.filter((s) => stageFromProgress(s) >= idx).length;
              const isLast = idx === STAGES.length - 1;
              return (
                <React.Fragment key={stage.key}>
                  <div className={cn("flex items-center gap-2 rounded-lg border px-4 py-3 whitespace-nowrap shrink-0", stage.borderColor, stage.bgColor)}>
                    <div className={cn("h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white", stage.color)}>{idx + 1}</div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{stage.label}</div>
                      <div className={cn("text-xs", stage.textColor)}>{count} 场次</div>
                    </div>
                  </div>
                  {!isLast && <ChevronRight className="h-5 w-5 shrink-0 text-slate-300 mx-1" />}
                </React.Fragment>
              );
            })}
          </div>

          {/* 场次列表 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <CardTitle>场次列表</CardTitle>
                <div className="w-[280px]"><Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="筛选项目名、类型、组别…" /></div>
              </div>
            </CardHeader>
            <CardContent>
              {filtered.length === 0 ? (
                <div className="text-slate-400 text-center py-8">无匹配场次</div>
              ) : (
                <div className="space-y-2">
                  {filtered.map((s) => {
                    const stage = stageFromProgress(s);
                    const currentStage = STAGES[stage];
                    const isLast = stage >= STAGES.length - 1;
                    return (
                      <div key={s.id} className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3 hover:border-slate-300 hover:shadow-sm transition-all">
                        <div className="min-w-0 w-[140px]">
                          <div className="text-sm font-semibold text-slate-900 truncate">{s.name}</div>
                          <div className="text-[11px] text-slate-400">#{s.id} · {genderText(s.gender)} · {s.age_group}</div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge variant={s.category_text === "竞技" ? "info" : "neutral"}>{s.category_text}</Badge>
                          <Badge variant={s.event_type === "track" ? "info" : s.event_type === "field" ? "warning" : "success"}>
                            {s.event_type === "track" ? "径赛" : s.event_type === "field" ? "田赛" : "趣味"}
                          </Badge>
                        </div>
                        <div className="shrink-0 w-[210px]">
                          <div className="flex items-center justify-between">
                            {STAGES.map((st, idx) => {
                              const past = idx < stage;
                              const current = idx === stage;
                              return (
                                <React.Fragment key={st.key}>
                                  <div className={cn(
                                    "h-6 w-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold",
                                    past && `${st.color} border-transparent text-white`,
                                    current && `${st.borderColor} ${st.bgColor} ${st.textColor}`,
                                    !past && !current && "border-slate-200 text-slate-300 bg-white"
                                  )}>{idx + 1}</div>
                                  {idx < STAGES.length - 1 && <div className={cn("h-0.5 flex-1 mx-0.5", idx < stage ? st.color : "bg-slate-200")} />}
                                </React.Fragment>
                              );
                            })}
                          </div>
                        </div>
                        <Badge variant={stage === 0 ? "warning" : stage === 1 ? "info" : stage === 2 ? "info" : "success"} className="shrink-0 w-[52px] text-center">{currentStage.label}</Badge>
                        <div className="ml-auto shrink-0 flex items-center gap-2">
                          <span className="text-[11px] text-slate-400 w-[115px] text-right shrink-0 whitespace-nowrap">{s.updated_at}</span>
                          <Button variant="primary" size="sm" className="w-[72px]" disabled={isLast} onClick={() => advanceStage(s.id, stage)}>
                            {isLast ? "已完成" : "推进"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
