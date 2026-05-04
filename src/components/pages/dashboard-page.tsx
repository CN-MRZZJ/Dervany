"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, Th, Td } from "@/components/ui/table";
import { RefreshCcw, Trophy, Building2, Users, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { queryStatus, queryResults, type SystemStatus } from "@/lib/api";

export function DashboardPage() {
  const [status, setStatus] = React.useState<SystemStatus | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const s = await queryStatus();
      setStatus(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { load(); }, []);

  return (
    <div className="space-y-4">
      <Section
        title="工作台"
        description="统计概览、系统状态与最近数据"
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
      ) : status ? (
        <>
          <div className="grid gap-3 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>系统状态</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  {status.completed ? "初始化已完成，系统运行正常" : "初始化未完成"}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>初始化状态</CardTitle></CardHeader>
              <CardContent>
                <Badge variant={status.completed ? "success" : "neutral"}>
                  {status.completed ? "已完成" : "未完成"}
                </Badge>
                <Link href="/status" className="ml-3">
                  <Button variant="secondary" size="sm">查看详情</Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <StatCard label="项目总数" value={status.summary.event_count} Icon={Trophy} />
            <StatCard label="部门总数" value={status.summary.department_count} Icon={Building2} />
            <StatCard label="运动员总数" value={status.summary.athlete_count} Icon={Users} />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>检查项</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <thead><tr><Th>检查项</Th><Th className="w-[80px]">状态</Th></tr></thead>
                  <tbody>
                    {status.checks.slice(0, 8).map((c, i) => (
                      <tr key={i} className="even:bg-slate-50/70 hover:bg-slate-100/70 transition-colors">
                        <Td>{c.label}</Td>
                        <Td><Badge variant={c.ok ? "success" : "warning"}>{c.ok ? "通过" : "警告"}</Badge></Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </CardContent>
            </Card>

            <RecentResultsCard />
          </div>
        </>
      ) : null}
    </div>
  );
}

function RecentResultsCard() {
  const [results, setResults] = React.useState<{
    event_name: string; category: string; target_name: string; department_name: string;
    rank: number; points: number; performance: string; entered_by: string; created_at: string;
  }[]>([]);

  React.useEffect(() => {
    queryResults({ page: 1, page_size: 10 }).then((d) => setResults(d.items ?? [])).catch(() => {});
  }, []);

  return (
    <Card>
      <CardHeader><CardTitle>最近成绩</CardTitle></CardHeader>
      <CardContent>
        {results.length === 0 ? (
          <div className="text-slate-400 text-sm py-4 text-center">暂无数据</div>
        ) : (
          <Table>
            <thead><tr><Th>项目</Th><Th>对象</Th><Th>名次</Th><Th>积分</Th><Th>成绩</Th></tr></thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i} className="even:bg-slate-50/70 hover:bg-slate-100/70 transition-colors">
                  <Td>{r.event_name}</Td>
                  <Td>{r.target_name}</Td>
                  <Td>{r.rank}</Td>
                  <Td>{r.points}</Td>
                  <Td>{r.performance || "-"}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function StatCard({ label, value, Icon }: { label: string; value: number; Icon: React.ComponentType<{ className?: string }> }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-accent-bg flex items-center justify-center">
            <Icon className="h-5 w-5 text-accent" />
          </div>
          <div>
            <div className="text-sm text-slate-500">{label}</div>
            <div className="mt-1 text-2xl font-bold text-slate-900 tracking-tight">{value}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
