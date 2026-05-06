"use client";

import * as React from "react";
import { Section } from "@/components/ui/section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, Td, Th } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Building2, Search, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import {
  queryDepartments, addDepartment, updateDepartment,
  deleteDepartmentForm, type Department,
} from "@/lib/api";

export function DepartmentOpsPage() {
  const [keyword, setKeyword] = React.useState("");
  const [results, setResults] = React.useState<Department[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [msg, setMsg] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const pageSize = 15;

  // add form
  const [showAdd, setShowAdd] = React.useState(false);
  const [aName, setAName] = React.useState("");
  const [aTotal, setATotal] = React.useState("");

  // edit
  const [editing, setEditing] = React.useState<Department | null>(null);
  const [eName, setEName] = React.useState("");
  const [eTotal, setETotal] = React.useState("");

  // selection
  const [selected, setSelected] = React.useState<Department | null>(null);

  const fetchDepartments = React.useCallback((p: number) => {
    setLoading(true);
    queryDepartments({ keyword: keyword || undefined, page: p, page_size: pageSize })
      .then((d) => { setResults(d.items); setTotal(d.total); setPage(d.page); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [keyword]);

  React.useEffect(() => {
    const timer = setTimeout(() => fetchDepartments(1), 300);
    return () => clearTimeout(timer);
  }, [fetchDepartments]);

  function handlePageChange(p: number) { fetchDepartments(p); setSelected(null); }

  async function handleAdd() {
    if (!aName.trim()) return;
    try {
      await addDepartment({ name: aName.trim(), total_members: aTotal ? Number(aTotal) : undefined });
      setMsg("新增成功"); setAName(""); setATotal(""); setShowAdd(false);
      fetchDepartments(page);
    } catch (e) { setMsg(e instanceof Error ? e.message : "新增失败"); }
  }

  function startEdit(d: Department) {
    setEditing(d); setEName(d.name); setETotal(String(d.total_members || ""));
  }

  async function handleSave() {
    if (!editing || !eName.trim()) return;
    try {
      await updateDepartment(editing.id, { name: eName.trim(), total_members: eTotal ? Number(eTotal) : undefined });
      setMsg("更新成功"); setEditing(null);
      fetchDepartments(page);
    } catch (e) { setMsg(e instanceof Error ? e.message : "更新失败"); }
  }

  async function handleDelete(d: Department) {
    if (!confirm(`确认删除单位「${d.name}」？\n有运动员或队伍引用时将拒绝删除。`)) return;
    try {
      await deleteDepartmentForm({ department_id: d.id });
      setMsg("删除成功"); setSelected(null);
      fetchDepartments(page);
    } catch (e) { setMsg(e instanceof Error ? e.message : "删除失败"); }
  }

  return (
    <div className="space-y-4">
      <Section
        title="单位管理"
        description="维护参赛单位，新增、编辑和删除"
        right={
          <Button size="sm" onClick={() => { setAName(""); setATotal(""); setShowAdd(true); }}>
            <Plus className="h-4 w-4" />新增单位
          </Button>
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
            <CardTitle>查询单位</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-[280px]">
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchDepartments(1)}
                placeholder="单位名称"
              />
            </div>
            <Button onClick={() => fetchDepartments(1)} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}查询
            </Button>
            {total > 0 && <Badge variant="info">共 {total} 条</Badge>}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className={cn("grid gap-3", selected ? "lg:grid-cols-[1fr_360px]" : "")}>
        <Card>
          <CardContent className="p-0">
            <Table>
              <thead>
                <tr>
                  <Th className="w-[80px]">ID</Th>
                  <Th>单位名称</Th>
                  <Th className="w-[100px] text-center">人数</Th>
                  <Th className="w-[100px] text-center">操作</Th>
                </tr>
              </thead>
              <tbody>
                {results.length === 0 ? (
                  <tr>
                    <Td colSpan={4} className="text-slate-400 text-center py-8">
                      {keyword ? "无匹配数据" : "输入关键词自动查询"}
                    </Td>
                  </tr>
                ) : results.map((d) => (
                  <tr
                    key={d.id}
                    onClick={() => setSelected(selected?.id === d.id ? null : d)}
                    className={cn(
                      "cursor-pointer transition-colors hover:bg-slate-100/70",
                      selected?.id === d.id
                        ? "bg-accent-bg ring-1 ring-inset ring-accent/20"
                        : "even:bg-slate-50/70"
                    )}
                  >
                    <Td className="tabular-nums text-xs text-slate-500">{d.id}</Td>
                    <Td className="font-medium">{d.name}</Td>
                    <Td className="text-center tabular-nums">{d.total_members || "-"}</Td>
                    <Td className="text-center">
                      <div className="flex items-center justify-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(d)}>
                          <Pencil className="h-3.5 w-3.5 text-slate-400" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(d)}>
                          <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                        </Button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            {total > pageSize && (
              <Pagination page={page} pageSize={pageSize} total={total} onChange={handlePageChange} />
            )}
          </CardContent>
        </Card>

        {/* Detail */}
        {selected && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{selected.name}</CardTitle>
                <Badge variant="info">ID {selected.id}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">单位 ID</span>
                    <span className="font-medium tabular-nums">{selected.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">总人数</span>
                    <span className="font-medium tabular-nums">{selected.total_members || "-"}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" className="flex-1" onClick={() => startEdit(selected)}>
                    <Pencil className="h-3.5 w-3.5" />编辑
                  </Button>
                  <Button size="sm" variant="danger" className="flex-1" onClick={() => handleDelete(selected)}>
                    <Trash2 className="h-3.5 w-3.5" />删除
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="text-sm font-semibold text-slate-900">新增单位</div>
            <div>
              <div className="text-xs font-medium text-slate-700 mb-1">单位名称</div>
              <Input value={aName} onChange={(e) => setAName(e.target.value)} placeholder="如 计算机学院" />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-700 mb-1">总人数（可选）</div>
              <Input value={aTotal} onChange={(e) => setATotal(e.target.value.replace(/\D/g, ""))} type="number" placeholder="0" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setShowAdd(false)}>取消</Button>
              <Button onClick={handleAdd}>新增</Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit dialog - inline modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="text-sm font-semibold text-slate-900">编辑单位</div>
            <div>
              <div className="text-xs font-medium text-slate-700 mb-1">单位名称</div>
              <Input value={eName} onChange={(e) => setEName(e.target.value)} />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-700 mb-1">总人数</div>
              <Input value={eTotal} onChange={(e) => setETotal(e.target.value.replace(/\D/g, ""))} type="number" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setEditing(null)}>取消</Button>
              <Button onClick={handleSave}>保存</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
