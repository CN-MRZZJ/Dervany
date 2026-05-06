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
import { cn } from "@/lib/utils";
import {
  Users2, Search, Plus, Trash2, UserPlus, X, Loader2,
} from "lucide-react";
import {
  queryTeams, addTeam, batchAddTeams, deleteTeamForm,
  addTeamMemberForm, removeTeamMemberForm,
  queryTeamMembers, queryEvents, queryDepartments,
  type Team,
} from "@/lib/api";

import { useGroupLabels } from "@/lib/use-group-labels";

function glabel(g: string) { return g === "male" ? "男" : g === "female" ? "女" : "混合"; }

export function TeamOpsPage() {
  // search
  const [queryEvent, setQueryEvent] = React.useState("");
  const [queryDept, setQueryDept] = React.useState("");
  const [queryKeyword, setQueryKeyword] = React.useState("");
  const [results, setResults] = React.useState<Team[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [msg, setMsg] = React.useState("");
  const [page, setPage] = React.useState(1);
  const pageSize = 12;

  // events & departments
  const [events, setEvents] = React.useState<{ id: number; name: string; is_individual: number; gender: string; group: string }[]>([]);
  const [departments, setDepartments] = React.useState<string[]>([]);
  React.useEffect(() => {
    queryEvents().then((d) => setEvents(d.items)).catch(() => {});
    queryDepartments({ page_size: 200 }).then((d) => {
      setDepartments(d.items.map((d) => d.name));
    }).catch(() => {});
  }, []);

  // group labels
  const { label } = useGroupLabels();

  // selection
  const [selected, setSelected] = React.useState<Team | null>(null);

  // members
  const [members, setMembers] = React.useState<{ athlete_type: string; athlete_no: string; name: string }[]>([]);
  const [memberLoading, setMemberLoading] = React.useState(false);

  // add form
  const [showAdd, setShowAdd] = React.useState(false);
  const [aDept, setADept] = React.useState("");
  const [aEventId, setAEventId] = React.useState("");
  const [aTeamName, setATeamName] = React.useState("");

  // batch form
  const [showBatch, setShowBatch] = React.useState(false);
  const [batchEvent, setBatchEvent] = React.useState("");
  const [batchDepts, setBatchDepts] = React.useState<Record<string, boolean>>({});

  // member add/remove
  const [mAthleteType, setMAthleteType] = React.useState("competitive");
  const [mAthleteNo, setMAthleteNo] = React.useState("");

  const teamEvents = events.filter((e) => e.is_individual === 0);

  async function doQuery() {
    setLoading(true);
    try {
      const data = await queryTeams({
        keyword: queryKeyword || undefined,
        department_name: queryDept || undefined,
        event_id: queryEvent ? Number(queryEvent) : undefined,
      });
      setResults(data.items);
      setSelected(null);
      setPage(1);
    } catch (e) { setMsg(e instanceof Error ? e.message : "查询失败"); }
    finally { setLoading(false); }
  }

  // load members when selected changes
  React.useEffect(() => {
    if (!selected) { setMembers([]); return; }
    setMemberLoading(true);
    queryTeamMembers(selected.id)
      .then((d) => setMembers(d.items))
      .catch(() => setMembers([]))
      .finally(() => setMemberLoading(false));
  }, [selected]);

  async function handleAdd() {
    if (!aDept || !aEventId || !aTeamName) return;
    try {
      await addTeam({ department_name: aDept, event_id: Number(aEventId), team_name: aTeamName });
      setMsg("新增成功"); setATeamName(""); setShowAdd(false);
    } catch (e) { setMsg(e instanceof Error ? e.message : "新增失败"); }
  }

  async function handleBatchAdd() {
    if (!batchEvent) return;
    const depts = Object.entries(batchDepts).filter(([, v]) => v).map(([k]) => k);
    if (depts.length === 0) return;
    try {
      await batchAddTeams({ event_id: Number(batchEvent), department_names: depts });
      setMsg("批量新增成功"); setShowBatch(false);
    } catch (e) { setMsg(e instanceof Error ? e.message : "批量新增失败"); }
  }

  async function handleDelete() {
    if (!selected) return;
    if (!confirm(`确认删除队伍「${selected.team_name}」？`)) return;
    try {
      await deleteTeamForm({ team_id: selected.id });
      setMsg("删除成功");
      setResults((p) => p.filter((t) => t.id !== selected.id));
      setSelected(null);
    } catch (e) { setMsg(e instanceof Error ? e.message : "删除失败"); }
  }

  async function handleAddMember() {
    if (!selected || !mAthleteNo) return;
    try {
      await addTeamMemberForm({ team_id: selected.id, athlete_type: mAthleteType, athlete_no: mAthleteNo });
      setMsg("成员添加成功"); setMAthleteNo("");
      const d = await queryTeamMembers(selected.id);
      setMembers(d.items);
    } catch (e) { setMsg(e instanceof Error ? e.message : "操作失败"); }
  }

  async function handleRemoveMember(athleteNo: string) {
    if (!selected) return;
    try {
      await removeTeamMemberForm({ team_id: selected.id, athlete_type: mAthleteType, athlete_no: athleteNo });
      setMembers((p) => p.filter((m) => m.athlete_no !== athleteNo));
      setMsg("成员移除成功");
    } catch (e) { setMsg(e instanceof Error ? e.message : "操作失败"); }
  }

  function toggleAllDepts(check: boolean) {
    const n: Record<string, boolean> = {};
    departments.forEach((d) => (n[d] = check));
    setBatchDepts(n);
  }

  // client-side pagination
  const pagedResults = results.slice((page - 1) * pageSize, page * pageSize);
  const total = results.length;

  const selectedDeptCount = Object.values(batchDepts).filter(Boolean).length;

  return (
    <div className="space-y-4">
      <Section
        title="队伍管理"
        description="查询、新增、删除队伍，管理队伍成员"
        right={
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => { setBatchEvent(""); setBatchDepts({}); setShowBatch(true); }}>
              <Users2 className="h-4 w-4" />批量新增
            </Button>
            <Button size="sm" onClick={() => { setADept(""); setAEventId(""); setATeamName(""); setShowAdd(true); }}>
              <Plus className="h-4 w-4" />新增队伍
            </Button>
          </div>
        }
      />

      {msg && (
        <div className={cn(
          "rounded-md px-3 py-2 text-sm",
          msg.includes("失败") ? "bg-rose-50 text-rose-600 border border-rose-200" : "bg-emerald-50 text-emerald-600 border border-emerald-200"
        )}>
          {msg}
        </div>
      )}

      {/* Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-slate-500" />
            <CardTitle>查询队伍</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-[220px]">
              <div className="text-xs font-medium text-slate-700 mb-1">团体项目</div>
              <Select value={queryEvent} onChange={(e) => setQueryEvent(e.target.value)}>
                <option value="">全部团体项目</option>
                {teamEvents.map((e) => (
                  <option key={e.id} value={String(e.id)}>{e.name} {glabel(e.gender)}{label(e.group)}</option>
                ))}
              </Select>
            </div>
            <div className="w-[160px]">
              <div className="text-xs font-medium text-slate-700 mb-1">单位</div>
              <Input value={queryDept} onChange={(e) => setQueryDept(e.target.value)} placeholder="单位（可选）" />
            </div>
            <div className="w-[200px]">
              <div className="text-xs font-medium text-slate-700 mb-1">关键词</div>
              <Input
                value={queryKeyword}
                onChange={(e) => setQueryKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && doQuery()}
                placeholder="队伍名 / 项目名 / 单位"
              />
            </div>
            <Button onClick={doQuery} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}查询
            </Button>
            <Button variant="secondary" onClick={() => { setQueryEvent(""); setQueryDept(""); setQueryKeyword(""); setResults([]); setSelected(null); }}>
              重置
            </Button>
            {total > 0 && <Badge variant="info">共 {total} 条</Badge>}
          </div>
        </CardContent>
      </Card>

      {/* Results + Detail */}
      <div className={cn("grid gap-3", selected ? "lg:grid-cols-[1fr_380px]" : "")}>
        <Card>
          <CardContent className="p-0">
            <Table>
              <thead>
                <tr>
                  <Th className="w-[60px]">ID</Th>
                  <Th>队伍名称</Th>
                  <Th>单位</Th>
                  <Th>项目</Th>
                  <Th className="w-[60px] text-center">人数</Th>
                </tr>
              </thead>
              <tbody>
                {results.length === 0 ? (
                  <tr>
                    <Td colSpan={5} className="text-slate-400 text-center py-8">
                      {queryKeyword || queryEvent || queryDept ? "无匹配数据" : "设置筛选条件后点击查询"}
                    </Td>
                  </tr>
                ) : pagedResults.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => setSelected(selected?.id === t.id ? null : t)}
                    className={cn(
                      "cursor-pointer transition-colors hover:bg-slate-100/70",
                      selected?.id === t.id
                        ? "bg-accent-bg ring-1 ring-inset ring-accent/20"
                        : "even:bg-slate-50/70"
                    )}
                  >
                    <Td className="tabular-nums text-xs text-slate-500">{t.id}</Td>
                    <Td className="font-medium">{t.team_name}</Td>
                    <Td>{t.department_name}</Td>
                    <Td className="text-xs">{t.event_name}</Td>
                    <Td className="text-center tabular-nums">{t.member_count}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            {total > pageSize && (
              <Pagination page={page} pageSize={pageSize} total={total} onChange={setPage} />
            )}
          </CardContent>
        </Card>

        {/* Detail panel */}
        {selected && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{selected.team_name}</CardTitle>
                <Badge variant="info">{selected.department_name}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Team info */}
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">队伍 ID</span>
                    <span className="font-medium tabular-nums">{selected.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">项目</span>
                    <span className="font-medium">{selected.event_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">单位</span>
                    <span className="font-medium">{selected.department_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">成员数</span>
                    <span className="font-medium tabular-nums">{selected.member_count}</span>
                  </div>
                  {selected.members_summary && (
                    <div>
                      <span className="text-slate-500">成员</span>
                      <p className="mt-0.5 text-xs text-slate-600">{selected.members_summary}</p>
                    </div>
                  )}
                </div>

                {/* Members */}
                <div>
                  <div className="text-xs font-semibold text-slate-700 mb-2">队伍成员</div>
                  {memberLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                  ) : members.length === 0 ? (
                    <div className="text-xs text-slate-400">暂无成员</div>
                  ) : (
                    <div className="space-y-1 max-h-[200px] overflow-y-auto">
                      {members.map((m) => (
                        <div key={m.athlete_no} className="flex items-center justify-between rounded-md bg-slate-50 px-2.5 py-1.5 text-xs">
                          <div>
                            <span className="text-slate-700 font-medium">{m.name}</span>
                            <span className="text-slate-400 ml-1.5">{m.athlete_no}</span>
                          </div>
                          <button
                            onClick={() => handleRemoveMember(m.athlete_no)}
                            className="text-rose-400 hover:text-rose-600 shrink-0"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add member */}
                <div className="rounded-md border border-slate-200 p-3">
                  <div className="text-xs font-semibold text-slate-700 mb-2">添加成员</div>
                  <div className="space-y-2">
                    <Select value={mAthleteType} onChange={(e) => setMAthleteType(e.target.value)}>
                      <option value="competitive">竞技</option>
                      <option value="fun">趣味</option>
                    </Select>
                    <div className="flex gap-2">
                      <Input
                        value={mAthleteNo}
                        onChange={(e) => setMAthleteNo(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddMember()}
                        placeholder="运动员号"
                        className="flex-1"
                      />
                      <Button size="sm" onClick={handleAddMember} disabled={!mAthleteNo}>
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Delete */}
                <Button variant="danger" size="sm" className="w-full" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4" />删除队伍
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add team modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="text-sm font-semibold text-slate-900">新增队伍</div>
            <div>
              <div className="text-xs font-medium text-slate-700 mb-1">团体项目</div>
              <Select value={aEventId} onChange={(e) => setAEventId(e.target.value)}>
                <option value="">请选择</option>
                {teamEvents.map((e) => (
                  <option key={e.id} value={String(e.id)}>{e.name} {glabel(e.gender)}{label(e.group)}</option>
                ))}
              </Select>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-700 mb-1">归属单位</div>
              <Input value={aDept} onChange={(e) => setADept(e.target.value)} placeholder="输入单位名称" />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-700 mb-1">队伍名称</div>
              <Input value={aTeamName} onChange={(e) => setATeamName(e.target.value)} placeholder="输入队伍名称" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setShowAdd(false)}>取消</Button>
              <Button onClick={handleAdd}>新增</Button>
            </div>
          </div>
        </div>
      )}

      {/* Batch add modal */}
      {showBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowBatch(false)}>
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="text-sm font-semibold text-slate-900">批量新增队伍</div>
            <div>
              <div className="text-xs font-medium text-slate-700 mb-1">团体项目</div>
              <Select value={batchEvent} onChange={(e) => setBatchEvent(e.target.value)}>
                <option value="">请选择项目</option>
                {teamEvents.map((e) => (
                  <option key={e.id} value={String(e.id)}>{e.name} {glabel(e.gender)}{label(e.group)}</option>
                ))}
              </Select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-700">
                  选择单位
                  {selectedDeptCount > 0 && <span className="ml-1 text-accent">({selectedDeptCount})</span>}
                </span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => toggleAllDepts(true)}>全选</Button>
                  <span className="text-slate-200">|</span>
                  <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => toggleAllDepts(false)}>清空</Button>
                </div>
              </div>
              {departments.length === 0 ? (
                <div className="rounded-md border border-dashed border-slate-200 bg-slate-50/50 py-8 text-center text-xs text-slate-400">
                  加载单位中...
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5 max-h-[180px] overflow-y-auto rounded-md border border-slate-200 bg-white p-3">
                  {departments.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setBatchDepts((p) => ({ ...p, [d]: !p[d] }))}
                      className={cn(
                        "rounded-md px-2.5 py-1 text-xs font-medium transition-all",
                        batchDepts[d]
                          ? "bg-accent text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setShowBatch(false)}>取消</Button>
              <Button onClick={handleBatchAdd} disabled={!batchEvent || selectedDeptCount === 0}>批量新增</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
