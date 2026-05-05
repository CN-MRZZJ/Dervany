"use client";

import * as React from "react";
import { Section } from "@/components/ui/section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, Td, Th } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Users, Search, UserPlus, Trash2, Plus, X, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  queryAthletes, addAthlete, deleteAthleteForm,
  addRegistrationForm, removeRegistrationForm,
  queryRegisteredEvents, queryEvents,
  type Athlete,
} from "@/lib/api";

const AGE_LABELS: Record<string, string> = { A: "甲组", B: "乙组", C: "丙组" };
function glabel(g: string) { return g === "male" ? "男" : g === "female" ? "女" : "混合"; }
function alabel(ag: string) { return AGE_LABELS[ag] || ag; }
function eventOptionLabel(e: { name: string; gender: string; group: string }) {
  return `${e.name} ${glabel(e.gender)}${alabel(e.group)}`;
}

export function AthleteOpsPage() {
  // search
  const [queryType, setQueryType] = React.useState("");
  const [queryKeyword, setQueryKeyword] = React.useState("");
  const [results, setResults] = React.useState<Athlete[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [msg, setMsg] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const pageSize = 15;

  // selection
  const [selected, setSelected] = React.useState<Athlete | null>(null);

  // registered events for selected athlete
  const [regEvents, setRegEvents] = React.useState<{ id: number; name: string; label: string }[]>([]);
  const [regLoading, setRegLoading] = React.useState(false);

  // all events for add-registration picker
  const [allEvents, setAllEvents] = React.useState<{ id: number; name: string; category: string; gender: string; group: string; is_individual: number }[]>([]);
  React.useEffect(() => { queryEvents().then((d) => setAllEvents(d.items)).catch(() => {}); }, []);

  // add form
  const [showAdd, setShowAdd] = React.useState(false);
  const [aType, setAType] = React.useState("competitive");
  const [aNo, setANo] = React.useState("");
  const [aName, setAName] = React.useState("");
  const [aGender, setAGender] = React.useState("male");
  const [aDept, setADept] = React.useState("");
  const [aAge, setAAge] = React.useState("A");

  // add registration
  const [addRegEventId, setAddRegEventId] = React.useState("");

  const fetchAthletes = React.useCallback((p: number) => {
    setLoading(true);
    queryAthletes({ athlete_type: queryType || undefined, keyword: queryKeyword || undefined, page: p, page_size: pageSize })
      .then((d) => { setResults(d.items); setTotal(d.total); setPage(d.page); setSelected(null); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [queryType, queryKeyword]);

  // Debounced search
  React.useEffect(() => {
    const timer = setTimeout(() => fetchAthletes(1), 300);
    return () => clearTimeout(timer);
  }, [fetchAthletes]);

  // Load registered events when selected athlete changes
  React.useEffect(() => {
    if (!selected) { setRegEvents([]); return; }
    setRegLoading(true);
    queryRegisteredEvents(selected.athlete_type, selected.athlete_no)
      .then((d) => setRegEvents(d.items))
      .catch(() => setRegEvents([]))
      .finally(() => setRegLoading(false));
  }, [selected]);

  async function handleAdd() {
    if (!aNo || !aName || !aDept) return;
    try {
      await addAthlete({ athlete_type: aType, athlete_no: aNo, name: aName, gender: aGender, department_name: aDept, group: aAge || undefined });
      setMsg("新增成功"); setANo(""); setAName(""); setShowAdd(false);
    } catch (e) { setMsg(e instanceof Error ? e.message : "新增失败"); }
  }

  async function handleDelete(athlete: Athlete) {
    if (!confirm(`确认删除运动员 ${athlete.name}（${athlete.athlete_no}）？`)) return;
    try {
      await deleteAthleteForm({ athlete_type: athlete.athlete_type, athlete_no: athlete.athlete_no });
      setMsg("删除成功");
      setResults((p) => p.filter((a) => a.athlete_no !== athlete.athlete_no));
      setSelected(null);
    } catch (e) { setMsg(e instanceof Error ? e.message : "删除失败"); }
  }

  async function handleAddReg() {
    if (!selected || !addRegEventId) return;
    try {
      await addRegistrationForm({ athlete_type: selected.athlete_type, athlete_no: selected.athlete_no, event_id: Number(addRegEventId) });
      setMsg("报名成功"); setAddRegEventId("");
      const d = await queryRegisteredEvents(selected.athlete_type, selected.athlete_no);
      setRegEvents(d.items);
    } catch (e) { setMsg(e instanceof Error ? e.message : "报名失败"); }
  }

  async function handleRemoveReg(eventId: number) {
    if (!selected) return;
    try {
      await removeRegistrationForm({ athlete_type: selected.athlete_type, athlete_no: selected.athlete_no, event_id: eventId });
      setRegEvents((p) => p.filter((e) => e.id !== eventId));
      setMsg("取消报名成功");
    } catch (e) { setMsg(e instanceof Error ? e.message : "操作失败"); }
  }

  // Available events for adding registration (individual only, matching athlete type)
  const availableEvents = allEvents.filter(
    (e) => e.is_individual === 1 && (!selected || e.category === selected.athlete_type)
  );

  function handlePageChange(p: number) { fetchAthletes(p); }

  return (
    <div className="space-y-4">
      <Section title="运动员管理" description="查询、新增与删除运动员，管理报名项目" />

      {msg && (
        <div className={`rounded-md px-3 py-2 text-sm ${msg.includes("失败") ? "bg-rose-50 text-rose-600 border border-rose-200" : "bg-emerald-50 text-emerald-600 border border-emerald-200"}`}>
          {msg}
        </div>
      )}

      {/* Search */}
      <Card>
        <CardHeader><div className="flex items-center gap-2"><Search className="h-4 w-4 text-slate-500" /><CardTitle>查询运动员</CardTitle></div></CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-[140px]">
              <Select value={queryType} onChange={(e) => setQueryType(e.target.value)}>
                <option value="">全部类型</option><option value="competitive">竞技</option><option value="fun">趣味</option>
              </Select>
            </div>
            <div className="w-[280px]">
              <Input value={queryKeyword} onChange={(e) => setQueryKeyword(e.target.value)} placeholder="运动员号 / 姓名 / 单位" />
            </div>
            {loading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
            {total > 0 && <Badge variant="info">共 {total} 条</Badge>}
          </div>
        </CardContent>
      </Card>

      {/* Results + Detail */}
      <div className={cn("grid gap-3", selected ? "lg:grid-cols-[1fr_360px]" : "")}>
        <Card>
          <CardContent className="p-0">
            <Table>
              <thead><tr><Th>类型</Th><Th>运动员号</Th><Th>姓名</Th><Th>性别</Th><Th>组别</Th><Th>单位</Th></tr></thead>
              <tbody>
                {results.length === 0 ? (
                  <tr><Td colSpan={6} className="text-slate-400 text-center py-8">{queryKeyword ? "无匹配数据" : "输入关键词自动查询"}</Td></tr>
                ) : results.map((a) => (
                  <tr
                    key={a.athlete_no}
                    onClick={() => setSelected(selected?.athlete_no === a.athlete_no ? null : a)}
                    className={cn(
                      "cursor-pointer transition-colors hover:bg-slate-100/70",
                      selected?.athlete_no === a.athlete_no ? "bg-accent-bg ring-1 ring-inset ring-accent/20" : "even:bg-slate-50/70"
                    )}
                  >
                    <Td><Badge variant={a.athlete_type === "competitive" ? "info" : "neutral"}>{a.athlete_type === "competitive" ? "竞技" : "趣味"}</Badge></Td>
                    <Td>{a.athlete_no}</Td>
                    <Td className="font-medium">{a.name}</Td>
                    <Td>{a.gender === "male" ? "男" : "女"}</Td>
                    <Td>{AGE_LABELS[a.group] || a.group}</Td>
                    <Td>{a.department_name}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            {total > pageSize && <Pagination page={page} pageSize={pageSize} total={total} onChange={handlePageChange} />}
          </CardContent>
        </Card>

        {/* Detail panel */}
        {selected && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{selected.name}</CardTitle>
                <Badge variant={selected.athlete_type === "competitive" ? "info" : "neutral"}>
                  {selected.athlete_type === "competitive" ? "竞技" : "趣味"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">运动员号</span><span className="font-medium">{selected.athlete_no}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">性别</span><span>{selected.gender === "male" ? "男" : "女"}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">组别</span><span>{AGE_LABELS[selected.group] || selected.group}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">单位</span><span className="font-medium">{selected.department_name}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">已报名数</span><span>{selected.registration_count}</span></div>
                </div>

                {/* Registered events */}
                <div>
                  <div className="text-xs font-semibold text-slate-700 mb-2">已报名项目</div>
                  {regLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                  ) : regEvents.length === 0 ? (
                    <div className="text-xs text-slate-400">暂无报名</div>
                  ) : (
                    <div className="space-y-1">
                      {regEvents.map((e) => (
                        <div key={e.id} className="flex items-center justify-between rounded-md bg-slate-50 px-2.5 py-1.5 text-xs">
                          <span className="text-slate-700">{e.label || e.name}</span>
                          <button onClick={() => handleRemoveReg(e.id)} className="text-rose-400 hover:text-rose-600"><X className="h-3 w-3" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add registration */}
                <div>
                  <div className="text-xs font-semibold text-slate-700 mb-2">添加报名</div>
                  <div className="flex gap-2">
                    <Select value={addRegEventId} onChange={(e) => setAddRegEventId(e.target.value)} className="flex-1">
                      <option value="">选择项目</option>
                      {availableEvents
                        .filter((e) => !regEvents.some((r) => r.id === e.id))
                        .map((e) => (<option key={e.id} value={String(e.id)}>{eventOptionLabel(e)}</option>))}
                    </Select>
                    <Button size="sm" onClick={handleAddReg} disabled={!addRegEventId}><Plus className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>

                <Button variant="danger" size="sm" className="w-full" onClick={() => handleDelete(selected)}>
                  <Trash2 className="h-4 w-4" />删除运动员
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add athlete */}
      <Card>
        <CardHeader
          className="cursor-pointer select-none hover:bg-slate-50/50 transition-colors"
          onClick={() => setShowAdd(!showAdd)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><UserPlus className="h-4 w-4 text-accent" /><CardTitle>新增运动员</CardTitle></div>
            {showAdd ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
          </div>
        </CardHeader>
        {showAdd && (
          <CardContent>
            <div className="max-w-md space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><div className="text-xs font-medium text-slate-700 mb-1">类型</div><Select value={aType} onChange={(e) => setAType(e.target.value)}><option value="competitive">竞技</option><option value="fun">趣味</option></Select></div>
                <div><div className="text-xs font-medium text-slate-700 mb-1">运动员号</div><Input value={aNo} onChange={(e) => setANo(e.target.value)} placeholder="如 C001" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><div className="text-xs font-medium text-slate-700 mb-1">姓名</div><Input value={aName} onChange={(e) => setAName(e.target.value)} placeholder="姓名" /></div>
                <div><div className="text-xs font-medium text-slate-700 mb-1">性别</div><Select value={aGender} onChange={(e) => setAGender(e.target.value)}><option value="male">男</option><option value="female">女</option></Select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><div className="text-xs font-medium text-slate-700 mb-1">归属单位</div><Input value={aDept} onChange={(e) => setADept(e.target.value)} placeholder="单位名称" /></div>
                <div><div className="text-xs font-medium text-slate-700 mb-1">年龄组</div><Select value={aAge} onChange={(e) => setAAge(e.target.value)}><option value="A">甲组</option><option value="B">乙组</option><option value="C">丙组</option></Select></div>
              </div>
              <Button onClick={handleAdd}>新增运动员</Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
