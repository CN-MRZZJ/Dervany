"use client";

import * as React from "react";
import { Section } from "@/components/ui/section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, Td, Th } from "@/components/ui/table";
import { RefreshCcw, ShieldCheck, ShieldAlert, Database, Trophy, Loader2 } from "lucide-react";
import { queryStatus, type SystemStatus } from "@/lib/api";

export function StatusPage() {
  const [status, setStatus] = React.useState<SystemStatus | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await queryStatus();
      setStatus(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { load(); }, []);

  const checks = status?.checks ?? [];
  const okCount = checks.filter((c) => c.ok).length;
  const failCount = checks.filter((c) => !c.ok).length;

  return (
    <div className="space-y-4">
      <Section
        title="系统状态"
        description="检查各模块初始化状态与数据完整性"
        right={
          <Button variant="secondary" size="sm" onClick={load} disabled={loading}>
            <RefreshCcw className="h-4 w-4" />
            刷新
          </Button>
        }
      />

      {loading ? (
        <div className="flex items-center gap-2 text-slate-500 py-8 justify-center">
          <Loader2 className="h-5 w-5 animate-spin" /> 加载中…
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-8 text-center text-rose-500">{error}</CardContent>
        </Card>
      ) : status ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="检查通过" value={okCount} icon={<ShieldCheck className="h-5 w-5" />} color="emerald" />
            <StatCard label="检查未通过" value={failCount} icon={<ShieldAlert className="h-5 w-5" />} color="warning" />
            <StatCard label="总检查项" value={checks.length} icon={<Database className="h-5 w-5" />} color="slate" />
            <StatCard
              label="初始化状态"
              value={status.completed ? "已完成" : "未完成"}
              icon={<Trophy className="h-5 w-5" />}
              color={status.completed ? "accent" : "slate"}
            />
          </div>

          <div className="grid gap-3 lg:grid-cols-[2fr_1fr]">
            <Card>
              <CardHeader><CardTitle>检查项明细</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <thead>
                    <tr>
                      <Th>检查项</Th>
                      <Th className="w-[100px] text-center">状态</Th>
                      <Th>详情</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {checks.map((c, idx) => (
                      <tr key={idx} className="even:bg-slate-50/70 hover:bg-slate-100/70 transition-colors">
                        <Td className="font-medium">
                          <div className="flex items-center gap-2">
                            {c.ok ? <ShieldCheck className="h-4 w-4 text-emerald-500" /> : <ShieldAlert className="h-4 w-4 text-amber-500" />}
                            {c.label}
                          </div>
                        </Td>
                        <Td className="text-center"><Badge variant={c.ok ? "success" : "warning"}>{c.ok ? "通过" : "未通过"}</Badge></Td>
                        <Td className="text-xs">{c.detail}</Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <Card>
                <CardHeader><CardTitle>数据概览</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      ["项目数", status.summary.event_count],
                      ["部门数", status.summary.department_count],
                      ["运动员数", status.summary.athlete_count],
                    ].map(([label, val]) => (
                      <div key={label} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                        <span className="text-sm text-slate-600">{label}</span>
                        <span className="text-sm font-bold text-slate-900">{val}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function StatCard({ label, value, icon, color }: {
  label: string; value: string | number; icon: React.ReactNode;
  color: "slate" | "emerald" | "warning" | "accent";
}) {
  const c = {
    slate: { bg: "bg-slate-100", text: "text-slate-600" },
    emerald: { bg: "bg-emerald-100", text: "text-emerald-600" },
    warning: { bg: "bg-amber-100", text: "text-amber-600" },
    accent: { bg: "bg-accent-bg", text: "text-accent" },
  }[color];
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-lg ${c.bg} ${c.text} flex items-center justify-center`}>{icon}</div>
          <div>
            <div className="text-xs text-slate-500">{label}</div>
            <div className="text-xl font-bold text-slate-900">{value}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
