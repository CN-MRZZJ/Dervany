"use client";

import * as React from "react";
import { Section } from "@/components/ui/section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, Td, Th } from "@/components/ui/table";
import { UserCheck, User, Users, Trophy, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { queryEvents, submitResult, queryResults, queryAthletes, queryTeams, queryAttempts, voidAttempt, type ResultRecord, type Athlete, type AttemptRecord } from "@/lib/api";
import { useToast, ToastOverlay } from "@/components/ui/toast";

const STORAGE_KEY = "sportsmeet.result_entry.v1";

function glabel(g: string) { return g === "male" ? "男" : g === "female" ? "女" : "混合"; }
function alabel(ag: string) { return ag === "A" ? "甲组" : ag === "B" ? "乙组" : ag === "C" ? "丙组" : ag; }

export function ResultEntryPage() {
  const [enteredBy, setEnteredBy] = React.useState("");
  const [confirmedBy, setConfirmedBy] = React.useState("");
  const [tab, setTab] = React.useState<"individual" | "team">("individual");
  const [events, setEvents] = React.useState<{ id: number; name: string; category: string; is_individual: number; gender: string; age_group: string }[]>([]);
  const { toast, show, dismiss } = useToast();
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const d = JSON.parse(raw);
        if (d?.enteredBy) { setEnteredBy(d.enteredBy); setConfirmedBy(d.enteredBy); }
      } catch {}
    }
    queryEvents().then((d) => setEvents(d.items)).catch(() => {});
  }, []);

  function confirmEnteredBy() {
    const v = enteredBy.trim();
    if (!v) return;
    setConfirmedBy(v);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ enteredBy: v })); } catch {}
  }

  const confirmed = confirmedBy && enteredBy.trim() === confirmedBy;

  // Individual
  const [indEvent, setIndEvent] = React.useState("");
  const [indNo, setIndNo] = React.useState("");
  const [indPerf, setIndPerf] = React.useState("");
  const [indRank, setIndRank] = React.useState("");
  const indNoRef = React.useRef<HTMLInputElement>(null);
  const indPerfRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => { indNoRef.current?.focus(); }, []);

  // Athlete lookup
  const [athleteInfo, setAthleteInfo] = React.useState<Athlete | null>(null);
  const [athleteLoading, setAthleteLoading] = React.useState(false);

  // Attempts
  const [attempts, setAttempts] = React.useState<AttemptRecord[]>([]);
  const [attemptsLoading, setAttemptsLoading] = React.useState(false);

  async function loadAttempts() {
    if (!athleteInfo?.athlete_ref_id || !indEvent) { setAttempts([]); return; }
    setAttemptsLoading(true);
    try {
      const d = await queryAttempts({
        event_id: Number(indEvent),
        athlete_type: athleteInfo.athlete_type,
        athlete_ref_id: athleteInfo.athlete_ref_id,
      });
      setAttempts(d.items);
    } catch { setAttempts([]); }
    finally { setAttemptsLoading(false); }
  }

  React.useEffect(() => { loadAttempts(); }, [athleteInfo?.athlete_ref_id, indEvent]);

  async function handleVoid(attemptId: number, isVoid: boolean) {
    try {
      await voidAttempt(attemptId, isVoid);
      setAttempts((prev) => prev.map((a) => a.id === attemptId ? { ...a, is_void: isVoid ? 1 : 0 } : a));
    } catch (e) { show(e instanceof Error ? e.message : "操作失败", "error"); }
  }

  React.useEffect(() => {
    if (!indNo.trim()) { setAthleteInfo(null); return; }
    const event = events.find((e) => e.id === Number(indEvent));
    const athleteType = event?.category || "competitive";
    const timer = setTimeout(() => {
      setAthleteLoading(true);
      queryAthletes({ athlete_type: athleteType, keyword: indNo.trim() })
        .then((d) => setAthleteInfo(d.items.find((a) => a.athlete_no === indNo.trim()) ?? null))
        .catch(() => setAthleteInfo(null))
        .finally(() => setAthleteLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [indNo, indEvent, events]);

  async function submitInd() {
    if (!indEvent || !indNo.trim() || !indPerf.trim()) return;
    setSubmitting(true);
    try {
      await submitResult({ event_id: Number(indEvent), athlete_no: indNo.trim(), athlete_type: events.find((e) => e.id === Number(indEvent))?.category || "competitive", entered_by: confirmedBy, performance: indPerf, rank: indRank ? Number(indRank) : undefined });
      show("提交成功", "success");
    } catch (e) { show(e instanceof Error ? e.message : "提交失败", "error"); }
    finally {
      setSubmitting(false);
      setIndNo(""); setIndPerf(""); setIndRank("");
      setTimeout(() => indNoRef.current?.focus(), 0);
    }
  }

  // Team
  const [teEvent, setTeEvent] = React.useState("");
  const [teId, setTeId] = React.useState("");
  const [tePerf, setTePerf] = React.useState("");
  const [teRank, setTeRank] = React.useState("");
  const [teams, setTeams] = React.useState<{ id: number; team_name: string; department_name: string }[]>([]);
  React.useEffect(() => {
    if (teEvent) {
      queryTeams({ event_id: Number(teEvent) }).then((d) => setTeams(d.items)).catch(() => setTeams([]));
    } else {
      setTeams([]);
    }
  }, [teEvent]);

  async function submitTeam() {
    if (!teEvent || !teId || !tePerf.trim()) return;
    setSubmitting(true);
    try {
      await submitResult({ event_id: Number(teEvent), team_id: Number(teId), entered_by: confirmedBy, performance: tePerf, rank: teRank ? Number(teRank) : undefined });
      show("提交成功", "success");
    } catch (e) { show(e instanceof Error ? e.message : "提交失败", "error"); }
    finally {
      setSubmitting(false);
      setTeId(""); setTePerf(""); setTeRank("");
    }
  }

  return (
    <div className="space-y-4">
      <ToastOverlay toast={toast} onClose={dismiss} />
      <Section title="成绩录入" description="先确认身份，选择项目后连续录入" />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-accent" /><CardTitle>录入人</CardTitle>
            {confirmedBy && <Badge variant={confirmed ? "success" : "warning"} className="ml-2">{confirmed ? "已确认" : "已保存，待确认"}</Badge>}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            <Input value={enteredBy} onChange={(e) => setEnteredBy(e.target.value)} onKeyDown={(e) => e.key === "Enter" && confirmEnteredBy()} placeholder="录入人姓名或编号" className="max-w-[280px]" />
            <Button onClick={confirmEnteredBy}>确认</Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-1 rounded-lg bg-slate-100 p-1 w-fit">
        {([{ k: "individual" as const, l: "个人成绩", i: User }, { k: "team" as const, l: "团体成绩", i: Users }]).map(({ k, l, i: I }) => (
          <button key={k} type="button" onClick={() => setTab(k)} className={cn("flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all", tab === k ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}><I className="h-4 w-4" />{l}</button>
        ))}
      </div>

      {tab === "individual" && (
        <div className="grid gap-3 lg:grid-cols-[1fr_300px]">
          <Card>
            <CardHeader><div className="flex items-center gap-2"><User className="h-4 w-4 text-accent" /><CardTitle>个人成绩录入</CardTitle></div></CardHeader>
            <CardContent>
              <div className="max-w-md space-y-3">
                <div><div className="text-xs font-medium text-slate-700 mb-1">项目</div>
                  <Select value={indEvent} onChange={(e) => { setIndEvent(e.target.value); setTimeout(() => indNoRef.current?.focus(), 0); }}><option value="">选择个人项目</option>{events.filter((e) => e.is_individual === 1).map((e) => (<option key={e.id} value={String(e.id)}>{e.name} {glabel(e.gender)}{alabel(e.age_group)}</option>))}</Select>
                </div>
                <div><div className="text-xs font-medium text-slate-700 mb-1">运动员号</div><Input ref={indNoRef} value={indNo} onChange={(e) => setIndNo(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && indNo.trim()) { e.preventDefault(); indPerfRef.current?.focus(); } }} placeholder="输入运动员号，回车跳成绩" /></div>
                <div><div className="text-xs font-medium text-slate-700 mb-1">成绩</div><Input ref={indPerfRef} value={indPerf} onChange={(e) => setIndPerf(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && indPerf.trim()) { e.preventDefault(); submitInd(); } }} placeholder="如 12.34，回车提交" /></div>
                <details className="text-xs text-slate-400"><summary className="cursor-pointer">手动指定名次（可选）</summary><div className="mt-2"><Input type="number" min={1} value={indRank} onChange={(e) => setIndRank(e.target.value)} placeholder="留空则自动计算" /></div></details>
                <Button className="w-full" onClick={submitInd} disabled={submitting}>{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}提交成绩</Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <AthleteInfoCard athlete={athleteInfo} loading={athleteLoading} athleteNo={indNo.trim()} />
            {athleteInfo && indEvent && (
              <Card>
                <CardHeader><CardTitle>历史尝试</CardTitle></CardHeader>
                <CardContent>
                  {attemptsLoading ? (
                    <div className="flex justify-center py-3"><Loader2 className="h-4 w-4 animate-spin text-slate-400" /></div>
                  ) : attempts.length === 0 ? (
                    <div className="text-xs text-slate-400 text-center py-3">暂无记录</div>
                  ) : (
                    <div className="space-y-1.5">
                      {attempts.map((a) => (
                        <div key={a.id} className={cn(
                          "flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs",
                          a.is_void ? "bg-rose-50 text-slate-400 line-through" : "bg-slate-50 text-slate-700"
                        )}>
                          <span className="w-6 font-medium text-center">#{a.attempt_number}</span>
                          <span className="w-20">{a.performance || "-"}</span>
                          <span className="w-10 text-slate-400">第{a.rank}名</span>
                          <button
                            onClick={() => handleVoid(a.id, !a.is_void)}
                            className={cn(
                              "px-1.5 py-0.5 rounded text-[11px] font-medium transition-colors",
                              a.is_void
                                ? "text-emerald-600 hover:bg-emerald-100"
                                : "text-rose-500 hover:bg-rose-100"
                            )}
                          >
                            {a.is_void ? "恢复" : "作废"}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {tab === "team" && (
        <Card>
          <CardHeader><div className="flex items-center gap-2"><Users className="h-4 w-4 text-accent" /><CardTitle>团体成绩录入</CardTitle></div></CardHeader>
          <CardContent>
            <div className="max-w-md space-y-3">
              <div><div className="text-xs font-medium text-slate-700 mb-1">项目</div><Select value={teEvent} onChange={(e) => setTeEvent(e.target.value)}><option value="">选择团体项目</option>{events.filter((e) => e.is_individual === 0).map((e) => (<option key={e.id} value={String(e.id)}>{e.name} {glabel(e.gender)}{alabel(e.age_group)}</option>))}</Select></div>
              <div><div className="text-xs font-medium text-slate-700 mb-1">队伍</div><Select value={teId} onChange={(e) => setTeId(e.target.value)}><option value="">选择队伍</option>{teams.map((t) => (<option key={t.id} value={String(t.id)}>{t.team_name} · {t.department_name}</option>))}</Select></div>
              <div><div className="text-xs font-medium text-slate-700 mb-1">成绩</div><Input value={tePerf} onChange={(e) => setTePerf(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && tePerf.trim()) { e.preventDefault(); submitTeam(); } }} placeholder="如 45.67，回车提交" /></div>
              <details className="text-xs text-slate-400"><summary className="cursor-pointer">手动指定名次（可选）</summary><div className="mt-2"><Input type="number" min={1} value={teRank} onChange={(e) => setTeRank(e.target.value)} placeholder="留空则自动计算" /></div></details>
              <Button className="w-full" onClick={submitTeam} disabled={submitting}>{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}提交成绩</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <RecentResults tab={tab} />
    </div>
  );
}

function AthleteInfoCard({ athlete, loading, athleteNo }: { athlete: Athlete | null; loading: boolean; athleteNo: string }) {
  return (
    <Card>
      <CardHeader><CardTitle>运动员信息</CardTitle></CardHeader>
      <CardContent>
        {!athleteNo ? (
          <div className="text-slate-400 text-sm py-4 text-center">输入运动员号后自动查询</div>
        ) : loading ? (
          <div className="flex items-center gap-2 justify-center py-4 text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> 查询中…</div>
        ) : !athlete ? (
          <div className="text-rose-500 text-sm py-4 text-center">未找到该运动员</div>
        ) : (
          <div className="space-y-3">
            <div className="text-center">
              <div className="text-lg font-bold text-slate-900">{athlete.name}</div>
              <div className="text-xs text-slate-400 mt-0.5">{athlete.athlete_no}</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">单位</span><span className="font-medium text-slate-800">{athlete.department_name}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">性别</span><span className="font-medium text-slate-800">{athlete.gender === "male" ? "男" : "女"}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">组别</span><span className="font-medium text-slate-800">{athlete.age_group}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">类型</span><Badge variant={athlete.athlete_type === "competitive" ? "info" : "neutral"}>{athlete.athlete_type === "competitive" ? "竞技" : "趣味"}</Badge></div>
            </div>
            {athlete.registered_events && (
              <div>
                <div className="text-xs font-medium text-slate-700 mb-1">已报名项目 ({athlete.registration_count})</div>
                <div className="text-xs text-slate-500 leading-relaxed">{athlete.registered_events}</div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RecentResults({ tab }: { tab: "individual" | "team" }) {
  const [results, setResults] = React.useState<ResultRecord[]>([]);
  React.useEffect(() => {
    queryResults({ page: 1, page_size: 50 }).then((d) => setResults(d.items ?? [])).catch(() => {});
  }, [tab]);

  const wantType = tab === "individual" ? "个人" : "团体";
  const filtered = results.filter((r) => r.result_type === wantType);
  return (
    <Card>
      <CardHeader><div className="flex items-center gap-2"><Trophy className="h-4 w-4 text-slate-500" /><CardTitle>最近成绩</CardTitle></div></CardHeader>
      <CardContent>
        {filtered.length === 0 ? <div className="text-slate-400 text-sm py-4 text-center">暂无数据</div> : (
          <Table>
            <thead><tr><Th>项目</Th><Th>类别</Th><Th>对象</Th><Th>部门</Th><Th>名次</Th><Th>积分</Th><Th>成绩</Th><Th>录入人</Th><Th>时间</Th></tr></thead>
            <tbody>{filtered.map((r) => (<tr key={r.id} className="even:bg-slate-50/70 hover:bg-slate-100/70 transition-colors">
              <Td className="font-medium">{r.event_name}</Td><Td><Badge variant={r.category === "竞技" ? "info" : "neutral"}>{r.category}</Badge></Td>
              <Td>{r.target_name}</Td><Td>{r.department_name}</Td><Td>{r.rank}</Td><Td>{r.points}</Td>
              <Td>{r.performance || "-"}</Td><Td>{r.entered_by}</Td><Td className="text-xs">{r.created_at}</Td>
            </tr>))}</tbody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
