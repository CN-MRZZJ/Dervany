"use client";

import * as React from "react";
import { Section } from "@/components/ui/section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Settings2, Plus, Trash2, Trophy, Users, Gauge, Tag, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { queryRules, saveRules, type RulesConfig } from "@/lib/api";

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

      {tab === "scoring" && <ScoringTab config={config} onChange={(s) => setConfig((p) => p ? { ...p, event_scoring_strategy: s } : p)} onChangeDefault={(v) => setConfig((p) => p ? { ...p, age_group_options: { ...p.age_group_options, team_event_default: v } } : p)} onChangePolicy={(v) => setConfig((p) => p ? { ...p, attempt_policy: v } : p)} />}

      {tab === "ages" && <AgesTab config={config} onChangeAthlete={(arr) => setConfig((p) => p ? { ...p, age_group_options: { ...p.age_group_options, athlete: arr } } : p)} onChangeEvent={(arr) => setConfig((p) => p ? { ...p, age_group_options: { ...p.age_group_options, event: arr } } : p)} />}
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

function ScoringTab({ config, onChange, onChangeDefault, onChangePolicy }: { config: RulesConfig; onChange: (s: RulesConfig["event_scoring_strategy"]) => void; onChangeDefault: (v: string) => void; onChangePolicy: (v: string) => void }) {
  const s = config.event_scoring_strategy;
  const entries = [
    { key: "track", label: "径赛 (track)" },
    { key: "field", label: "田赛 (field)" },
    { key: "fun", label: "趣味 (fun)" },
  ] as const;

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader><div className="flex items-center gap-2"><Gauge className="h-4 w-4 text-accent" /><CardTitle>项目成绩策略</CardTitle></div></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {entries.map(({ key, label }) => (
              <div key={key} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
                <span className="text-sm font-medium text-slate-700 w-[130px]">{label}</span>
                <span className="text-xs text-slate-400">策略</span>
                <Select
                  value={s[key]}
                  onChange={(e) => onChange({ ...s, [key]: e.target.value })}
                >
                  <option value="time">time（计时）</option>
                  <option value="length">length（长度）</option>
                  <option value="count">count（计数）</option>
                  <option value="count_miss">count_miss（脱靶）</option>
                </Select>
              </div>
            ))}
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
            <Select value={config.age_group_options.team_event_default} onChange={(e) => onChangeDefault(e.target.value)} className="w-[200px]">
              {config.age_group_options.event.map((a) => (<option key={a.value} value={a.value}>{a.label}</option>))}
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
      <AgeCard title="运动员组别" desc="选手报名时可选组别值" ages={config.age_group_options.athlete} onChange={onChangeAthlete} />
      <AgeCard title="项目组别" desc="项目配置时可选的组别值" ages={config.age_group_options.event} onChange={onChangeEvent} />
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
