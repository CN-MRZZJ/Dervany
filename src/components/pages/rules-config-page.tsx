"use client";

import * as React from "react";
import { Section } from "@/components/ui/section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Settings2, Plus, Trash2, Trophy, Users, Gauge, Tag, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { queryRules, saveRules, queryEventTypes, createEventType, updateEventType, deleteEventType, type RulesConfig, type EventType } from "@/lib/api";

type Tab = "points" | "scoring" | "ages";
const TABS: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "points", label: "积分规则", icon: Trophy },
  { key: "scoring", label: "成绩策略", icon: Gauge },
  { key: "ages", label: "组别选项", icon: Tag },
];

function recordToPairs(r: Record<string, number>): { rank: number; points: number }[] {
  return Object.entries(r)
    .map(([k, v]) => ({ rank: Number(k), points: v }))
    .sort((a, b) => a.rank - b.rank);
}

function pairsToRecord(arr: { rank: number; points: number }[]): Record<string, number> {
  const r: Record<string, number> = {};
  arr.forEach((p) => { if (p.rank > 0) r[String(p.rank)] = p.points; });
  return r;
}

export function RulesConfigPage() {
  const [tab, setTab] = React.useState<Tab>("points");
  const [config, setConfig] = React.useState<RulesConfig | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [msg, setMsg] = React.useState("");

  React.useEffect(() => {
    queryRules().then((d) => setConfig(d.config)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    if (!config) return;
    setSaving(true);
    try {
      await saveRules(config);
      setMsg("保存成功");
    } catch (e) { setMsg(e instanceof Error ? e.message : "保存失败"); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="flex items-center gap-2 text-slate-500 py-12 justify-center"><Loader2 className="h-5 w-5 animate-spin" /> 加载中…</div>;
  if (!config) return <div className="text-rose-500 py-12 text-center">加载规则失败</div>;

  return (
    <div className="space-y-4">
      <Section title="规则配置" description="积分规则、成绩策略与组别选项" right={<div className="flex gap-2"><Button size="sm" onClick={handleSave} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Settings2 className="h-4 w-4" />}保存规则</Button></div>} />

      {msg && <div className={`rounded-md px-3 py-2 text-sm ${msg.includes("失败") ? "bg-rose-50 text-rose-600 border border-rose-200" : "bg-emerald-50 text-emerald-600 border border-emerald-200"}`}>{msg}</div>}

      <div className="flex gap-1 rounded-lg bg-slate-100 p-1 w-fit">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} type="button" onClick={() => setTab(key)} className={cn("flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all", tab === key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}><Icon className="h-4 w-4" />{label}</button>
        ))}
      </div>

      {tab === "points" && <PointsTab config={config} onChange={(ind, team) => setConfig((p) => p ? { ...p, point_rule: { individual: pairsToRecord(ind), team: pairsToRecord(team) } } : p)} />}

      {tab === "scoring" && <ScoringTab config={config} onChangeDefault={(v) => setConfig((p) => p ? { ...p, group_options: { ...p.group_options, team_event_default: v } } : p)} onChangePolicy={(v) => setConfig((p) => p ? { ...p, attempt_policy: v } : p)} />}

      {tab === "ages" && <AgesTab config={config} onChangeAthlete={(arr) => setConfig((p) => p ? { ...p, group_options: { ...p.group_options, athlete: arr } } : p)} onChangeEvent={(arr) => setConfig((p) => p ? { ...p, group_options: { ...p.group_options, event: arr } } : p)} />}
    </div>
  );
}

function PointsTab({ config, onChange }: { config: RulesConfig; onChange: (ind: { rank: number; points: number }[], team: { rank: number; points: number }[]) => void }) {
  const ind = recordToPairs(config.point_rule.individual);
  const team = recordToPairs(config.point_rule.team);
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <PointsCard title="个人项目积分" icon={<Trophy className="h-4 w-4" />} points={ind} onChange={(v) => onChange(v, team)} />
      <PointsCard title="团体项目积分" icon={<Users className="h-4 w-4" />} points={team} onChange={(v) => onChange(ind, v)} />
    </div>
  );
}

function PointsCard({ title, icon, points, onChange }: { title: string; icon: React.ReactNode; points: { rank: number; points: number }[]; onChange: (v: { rank: number; points: number }[]) => void }) {
  const maxPts = Math.max(...points.map((p) => p.points), 0);
  return (
    <Card>
      <CardHeader><div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="text-accent">{icon}</span><CardTitle>{title}</CardTitle></div><Button variant="secondary" size="sm" onClick={() => onChange([...points, { rank: points.length + 1, points: 0 }])}><Plus className="h-3.5 w-3.5" />新增</Button></div></CardHeader>
      <CardContent>
        <div className="space-y-1.5">
          {points.map((p, idx) => {
            const ratio = maxPts > 0 ? p.points / maxPts : 0;
            return (
              <div key={idx} className="flex items-center gap-3 group">
                <Input type="number" min={1} value={p.rank} onChange={(e) => { const n = [...points]; n[idx] = { ...n[idx], rank: Number(e.target.value) }; onChange(n); }} className="w-[72px] text-center" />
                <span className="text-xs text-slate-400">→</span>
                <Input type="number" min={0} value={p.points} onChange={(e) => { const n = [...points]; n[idx] = { ...n[idx], points: Number(e.target.value) }; onChange(n); }} className="w-[72px] text-center" />
                <div className="flex-1 h-5 rounded bg-slate-100 overflow-hidden"><div className="h-full rounded bg-accent transition-all" style={{ width: `${Math.min(ratio * 100, 100)}%` }} /></div>
                <span className="text-[11px] text-slate-400 w-[32px] text-right">{p.points}分</span>
                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100" onClick={() => onChange(points.filter((_, i) => i !== idx))}><Trash2 className="h-3.5 w-3.5 text-rose-500" /></Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function ScoringTab({ config, onChangeDefault, onChangePolicy }: { config: RulesConfig; onChangeDefault: (v: string) => void; onChangePolicy: (v: string) => void }) {
  const [items, setItems] = React.useState<EventType[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState("");

  const fetch = React.useCallback(() => {
    queryEventTypes()
      .then((d) => { setItems(d.items); setErr(""); })
      .catch(() => setErr("加载失败"))
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => { fetch(); }, [fetch]);

  const [adding, setAdding] = React.useState(false);
  const [newCode, setNewCode] = React.useState("");
  const [newName, setNewName] = React.useState("");
  const [newStrategy, setNewStrategy] = React.useState("time");

  const [edits, setEdits] = React.useState<Record<string, { name?: string; scoring_strategy?: string }>>({});

  async function handleCreate() {
    if (!newCode.trim() || !newName.trim()) return;
    try {
      await createEventType({ code: newCode.trim(), name: newName.trim(), scoring_strategy: newStrategy });
      setNewCode(""); setNewName(""); setNewStrategy("time"); setAdding(false);
      fetch();
    } catch (e) { setErr(e instanceof Error ? e.message : "新增失败"); }
  }

  async function handleUpdate(code: string, body: { name?: string; scoring_strategy?: string }) {
    try {
      await updateEventType(code, body);
      setItems((p) => p.map((it) => it.code === code ? { ...it, ...body } : it));
      setEdits((p) => { const n = { ...p }; delete n[code]; return n; });
    } catch (e) { setErr(e instanceof Error ? e.message : "更新失败"); }
  }

  async function handleDelete(code: string) {
    if (!confirm(`确认删除项目类型「${code}」？`)) return;
    try {
      await deleteEventType(code);
      setItems((p) => p.filter((it) => it.code !== code));
    } catch (e) { setErr(e instanceof Error ? e.message : "删除失败"); }
  }

  if (loading) return <div className="flex items-center gap-2 text-slate-500 py-8 justify-center"><Loader2 className="h-4 w-4 animate-spin" />加载中…</div>;

  return (
    <div className="space-y-3">
      {err && <div className="rounded-md px-3 py-2 text-sm bg-rose-50 text-rose-600 border border-rose-200">{err}</div>}

      <Card>
        <CardHeader><div className="flex items-center justify-between"><div className="flex items-center gap-2"><Gauge className="h-4 w-4 text-accent" /><CardTitle>项目成绩策略</CardTitle></div><Button variant="secondary" size="sm" onClick={() => setAdding(true)}><Plus className="h-3.5 w-3.5" />新增</Button></div></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {items.length === 0 && !adding && <div className="text-xs text-slate-400 text-center py-4">暂未配置项目类型，点击"新增"添加</div>}
            {items.map((item) => {
              const dirty = edits[item.code];
              const displayName = dirty?.name ?? item.name;
              const displayStrategy = dirty?.scoring_strategy ?? item.scoring_strategy;
              return (
                <div key={item.code} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
                  <span className="text-sm font-mono font-medium text-slate-700 w-[100px]">{item.code}</span>
                  <Input value={displayName} onChange={(e) => setEdits((p) => ({ ...p, [item.code]: { ...p[item.code], name: e.target.value } }))} placeholder="显示名" className="w-[130px]" />
                  <span className="text-xs text-slate-400">策略</span>
                  <Select value={displayStrategy} onChange={(e) => setEdits((p) => ({ ...p, [item.code]: { ...p[item.code], scoring_strategy: e.target.value } }))} className="flex-1">
                    <option value="time">time（计时）</option>
                    <option value="length">length（长度）</option>
                    <option value="count">count（计数）</option>
                    <option value="count_miss">count_miss（脱靶）</option>
                  </Select>
                  {dirty && (
                    <Button variant="primary" size="sm" onClick={() => handleUpdate(item.code, dirty)}>保存</Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(item.code)}><Trash2 className="h-3.5 w-3.5 text-rose-500" /></Button>
                </div>
              );
            })}
            {adding && (
              <div className="flex items-center gap-3 rounded-lg border-2 border-accent/30 bg-accent-bg/30 p-3">
                <Input value={newCode} onChange={(e) => setNewCode(e.target.value)} placeholder="代号（如 throw）" className="w-[100px]" />
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="显示名（如 投掷）" className="w-[130px]" />
                <span className="text-xs text-slate-400">策略</span>
                <Select value={newStrategy} onChange={(e) => setNewStrategy(e.target.value)} className="flex-1">
                  <option value="time">time（计时）</option>
                  <option value="length">length（长度）</option>
                  <option value="count">count（计数）</option>
                  <option value="count_miss">count_miss（脱靶）</option>
                </Select>
                <Button variant="primary" size="sm" onClick={handleCreate}>保存</Button>
                <Button variant="ghost" size="icon" onClick={() => { setAdding(false); setNewCode(""); setNewName(""); }}><Trash2 className="h-3.5 w-3.5 text-slate-400" /></Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>多次尝试策略</CardTitle></CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500 mb-3">同一运动员多次录入成绩时采用的策略。</p>
            <Select value={config.attempt_policy} onChange={(e) => onChangePolicy(e.target.value)} className="w-[200px]">
              <option value="best">best（取最佳）</option>
              <option value="latest">latest（取最新）</option>
            </Select>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>特殊组别默认值</CardTitle></CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500 mb-3">趣味项目和团体项目默认使用的组别值。</p>
            <Select value={config.group_options.team_event_default} onChange={(e) => onChangeDefault(e.target.value)} className="w-[200px]">
              {config.group_options.event.map((a) => (<option key={a.value} value={a.value}>{a.label}</option>))}
            </Select>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AgesTab({ config, onChangeAthlete, onChangeEvent }: { config: RulesConfig; onChangeAthlete: (v: { value: string; label: string }[]) => void; onChangeEvent: (v: { value: string; label: string }[]) => void }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <AgeCard title="运动员组别" desc="选手报名时可选组别值" ages={config.group_options.athlete} onChange={onChangeAthlete} />
      <AgeCard title="项目组别" desc="项目配置时可选的组别值" ages={config.group_options.event} onChange={onChangeEvent} />
    </div>
  );
}

function AgeCard({ title, desc, ages, onChange }: { title: string; desc: string; ages: { value: string; label: string }[]; onChange: (v: { value: string; label: string }[]) => void }) {
  return (
    <Card>
      <CardHeader><div className="flex items-center justify-between"><div><CardTitle>{title}</CardTitle><p className="text-xs text-slate-500 mt-0.5">{desc}</p></div><Button variant="secondary" size="sm" onClick={() => onChange([...ages, { value: "", label: "" }])}><Plus className="h-3.5 w-3.5" />新增</Button></div></CardHeader>
      <CardContent>
        <div className="space-y-2">
          {ages.map((a, idx) => (
            <div key={idx} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
              <Input value={a.value} onChange={(e) => { const n = [...ages]; n[idx] = { ...n[idx], value: e.target.value }; onChange(n); }} placeholder="值（如 A）" className="w-[120px]" />
              <span className="text-xs text-slate-400">=</span>
              <Input value={a.label} onChange={(e) => { const n = [...ages]; n[idx] = { ...n[idx], label: e.target.value }; onChange(n); }} placeholder="显示名（如 甲组）" className="flex-1" />
              <Button variant="ghost" size="icon" onClick={() => onChange(ages.filter((_, i) => i !== idx))}><Trash2 className="h-3.5 w-3.5 text-rose-500" /></Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
