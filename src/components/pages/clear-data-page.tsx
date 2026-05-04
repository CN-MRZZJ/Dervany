"use client";

import * as React from "react";
import { Section } from "@/components/ui/section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Trash2, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { clearData } from "@/lib/api";

const TABLE_OPTIONS: Record<string, string> = {
  results: "成绩数据", events: "赛事/场次", athletes: "运动员",
  teams: "队伍", registrations: "报名", notices: "通知记录",
};

const CLEAR_CODE = "CLEAR-0";

export function ClearDataPage() {
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});
  const [confirmText, setConfirmText] = React.useState("");
  const [confirmCode, setConfirmCode] = React.useState("");
  const [acknowledged, setAcknowledged] = React.useState(false);
  const [running, setRunning] = React.useState(false);
  const [msg, setMsg] = React.useState("");

  const selectedCount = Object.values(selected).filter(Boolean).length;
  const canRun = selectedCount > 0 && acknowledged && confirmText === "DELETE" && confirmCode === CLEAR_CODE;

  async function handleClear() {
    if (!canRun) return;
    setRunning(true);
    setMsg("");
    try {
      await clearData({
        tables: Object.entries(selected).filter(([, v]) => v).map(([k]) => k),
        confirm_text: confirmText,
        confirm_code: confirmCode,
        acknowledged,
      });
      setMsg("清除成功");
      setSelected({}); setConfirmText(""); setConfirmCode(""); setAcknowledged(false);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "操作失败");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-4">
      <Section title="清除数据" description="维护与重新初始化。日常数据导入请前往导入中心。" right={running ? <Badge variant="danger">执行中</Badge> : null} />

      {msg && (
        <div className={`rounded-md px-3 py-2 text-sm ${msg.includes("失败") ? "bg-rose-50 text-rose-600 border border-rose-200" : "bg-emerald-50 text-emerald-600 border border-emerald-200"}`}>{msg}</div>
      )}

      <Card>
        <CardHeader><CardTitle>清除操作</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 flex items-start gap-2 mb-4">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <div><strong>不可恢复</strong> — 执行前请确认已备份数据库。</div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-sm font-semibold text-slate-900 mb-2">
                选择数据表 {selectedCount > 0 && <span className="ml-2 text-xs font-normal text-rose-600">已选 {selectedCount} 项</span>}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {Object.entries(TABLE_OPTIONS).map(([key, label]) => (
                  <div key={key} className={`rounded-md border px-3 py-2 transition-colors ${selected[key] ? "border-rose-300 bg-rose-50" : "border-slate-200 hover:border-slate-300"}`}>
                    <Checkbox checked={!!selected[key]} onChange={(e) => setSelected((p) => ({ ...p, [key]: e.target.checked }))} label={label} />
                    <div className="text-[11px] text-slate-400 mt-0.5 ml-6">{key}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-sm font-semibold text-slate-900 mb-1">确认口令</div>
                <div className="flex items-center gap-3">
                  <Input className="w-[180px]" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="输入 DELETE" error={confirmText.length > 0 && confirmText !== "DELETE"} />
                  <span className="text-xs text-slate-500">必须输入 <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">DELETE</code></span>
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900 mb-1">校验码</div>
                <div className="flex items-center gap-3">
                  <Input className="w-[180px]" value={confirmCode} onChange={(e) => setConfirmCode(e.target.value)} placeholder="输入校验码" error={confirmCode.length > 0 && confirmCode !== CLEAR_CODE} />
                  <span className="text-xs text-slate-500">当前：<code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">{CLEAR_CODE}</code></span>
                </div>
              </div>
            </div>

            <Checkbox checked={acknowledged} onChange={(e) => setAcknowledged(e.target.checked)} label="我已确认这是不可逆操作，并已备份相关数据" />

            <div className="flex items-center gap-2 pt-2">
              <Button variant="danger" disabled={!canRun || running} onClick={handleClear}>
                {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                执行清除
              </Button>
              <Link href="/import"><Button variant="secondary"><ArrowLeft className="h-4 w-4" />返回导入中心</Button></Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
