"use client";

import * as React from "react";
import { Section } from "@/components/ui/section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Megaphone, Send, Clock, Eye, Save } from "lucide-react";

type Template = {
  id: string;
  name: string;
  content: string;
};

const TEMPLATES: Template[] = [
  { id: "t1", name: "检录提醒", content: "请于 {time} 到 {place} 完成检录。项目：{event}" },
  { id: "t2", name: "场地调整", content: "项目 {event} 场地调整为 {place}，请知悉。" },
  { id: "t3", name: "颁奖集合", content: "请相关队伍于 {time} 到 {place} 集合颁奖。" },
];

type SendRecord = {
  id: string;
  at: string;
  template: string;
  target: string;
  status: "已发送" | "排程中" | "失败";
};

const MOCK_SENDS: SendRecord[] = [
  { id: "s1", at: "今天 10:12", template: "检录提醒", target: "全体", status: "已发送" },
  { id: "s2", at: "今天 09:45", template: "场地调整", target: "裁判组", status: "已发送" },
  { id: "s3", at: "昨天 19:03", template: "颁奖集合", target: "相关队伍", status: "失败" },
];

export function NoticeCenterPage() {
  const [templateId, setTemplateId] = React.useState(TEMPLATES[0].id);
  const [draft, setDraft] = React.useState(TEMPLATES[0].content);
  const [targetMode, setTargetMode] = React.useState("全体");
  const [previewMode, setPreviewMode] = React.useState<"个人" | "团队">("个人");
  const [schedule, setSchedule] = React.useState(false);
  const [scheduleAt, setScheduleAt] = React.useState("");

  React.useEffect(() => {
    const tpl = TEMPLATES.find((t) => t.id === templateId)!;
    setDraft(tpl.content);
  }, [templateId]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
        <Megaphone className="h-4 w-4 shrink-0" />
        <span className="font-semibold">此功能尚未实现</span>
        <span className="text-amber-600">— 当前为静态演示界面，数据均为模拟。</span>
      </div>
      <Section
        title="通知中心"
        description="编辑模板、选择对象、发送或预约发送通知"
        right={
          <Button size="sm" disabled>
            <Send className="h-4 w-4" />
            发送
          </Button>
        }
      />

      <div className="grid gap-3 lg:grid-cols-[380px_1fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-accent" />
              <CardTitle>编辑通知</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-xs font-medium text-slate-700 mb-1">模板</div>
              <Select value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
                {TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-700 mb-1">内容（支持 {'{event}'} {'{time}'} 等变量）</div>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="mt-1 min-h-[140px] w-full rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:border-accent"
              />
            </div>
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <Clock className="h-4 w-4 text-slate-400" />
                预约发送
              </div>
              <Switch checked={schedule} onCheckedChange={setSchedule} />
            </div>
            {schedule && (
              <Input value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} placeholder="2026-05-01 14:00" />
            )}
            <div>
              <div className="text-xs font-medium text-slate-700 mb-1">接收对象</div>
              <Select value={targetMode} onChange={(e) => setTargetMode(e.target.value)}>
                {["全体", "名单", "队伍", "裁判组"].map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </Select>
            </div>
            <Button variant="secondary" size="sm" className="w-full" disabled>
              <Save className="h-4 w-4" />
              保存草稿
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Card>
            <CardHeader className="flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-slate-500" />
                <CardTitle>预览</CardTitle>
              </div>
              <div className="flex items-center gap-1 rounded-md bg-slate-100 p-0.5">
                {(["个人", "团队"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPreviewMode(mode)}
                    className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${
                      previewMode === mode ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-slate-400 mb-2">
                预览模式：{previewMode} · 目标：{targetMode}
                {schedule ? ` · 预约：${scheduleAt || "未填写"}` : ""}
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 whitespace-pre-wrap leading-6">
                {draft}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>发送记录</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {MOCK_SENDS.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-2.5 hover:bg-slate-50 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="text-sm text-slate-900 font-medium">{r.template}</div>
                      <div className="text-xs text-slate-500">{r.at} · 目标：{r.target}</div>
                    </div>
                    <Badge
                      variant={r.status === "已发送" ? "success" : r.status === "排程中" ? "info" : "danger"}
                    >
                      {r.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
