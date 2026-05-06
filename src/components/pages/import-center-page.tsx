"use client";

import * as React from "react";
import { Section } from "@/components/ui/section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Users, ClipboardList, Check, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { setupMeetDate, importEventsCsv, importAthletesCsv, importRegistrationsCsv, downloadImportTemplate, downloadRegistrationTemplate } from "@/lib/api";

const STEPS = [
  { num: 1, label: "项目 CSV", icon: FileText, desc: "导入比赛项目列表", fileKey: "events" },
  { num: 2, label: "竞技运动员", icon: Users, desc: "导入竞技类运动员名单", fileKey: "competitive" },
  { num: 3, label: "趣味运动员", icon: Users, desc: "导入趣味类运动员名单", fileKey: "fun" },
  { num: 4, label: "竞技报名", icon: ClipboardList, desc: "导入竞技项目报名矩阵", fileKey: "competitiveReg" },
  { num: 5, label: "趣味报名", icon: ClipboardList, desc: "导入趣味项目报名矩阵", fileKey: "funReg" },
];

const TEMPLATES = [
  { label: "项目模板", key: "events_template.csv" },
  { label: "竞技运动员模板", key: "competitive_athletes_template.csv" },
  { label: "趣味运动员模板", key: "fun_athletes_template.csv" },
  { label: "竞技报名矩阵模板", key: "registration_template", category: "competitive" },
  { label: "趣味报名矩阵模板", key: "registration_template", category: "fun" },
];

export function ImportCenterPage() {
  const [meetDate, setMeetDate] = React.useState(() => {
    if (typeof window === "undefined") return "2026-04-23";
    return localStorage.getItem("meetDate") || "2026-04-23";
  });
  const [activeStep, setActiveStep] = React.useState(0);
  const [uploading, setUploading] = React.useState(""); // which fileKey is uploading
  const [msg, setMsg] = React.useState("");

  async function handleSaveDate() {
    try {
      await setupMeetDate(meetDate);
      localStorage.setItem("meetDate", meetDate);
      setMsg("日期已保存");
    } catch (e) { setMsg(e instanceof Error ? e.message : "保存失败"); }
  }

  async function handleImport(file: File, stepIdx: number) {
    const step = STEPS[stepIdx];
    setUploading(step.fileKey);
    setMsg("");
    try {
      if (step.fileKey === "events") {
        await importEventsCsv(file);
      } else if (step.fileKey === "competitive" || step.fileKey === "fun") {
        await importAthletesCsv(step.fileKey, file);
      } else {
        const cat = step.fileKey === "competitiveReg" ? "competitive" : "fun";
        await importRegistrationsCsv(cat, file);
      }
      setMsg(`${step.label} 导入成功`);
      setActiveStep(stepIdx + 1);
    } catch (e) { setMsg(e instanceof Error ? e.message : "导入失败"); }
    finally { setUploading(""); }
  }

  return (
    <div className="space-y-4">
      <Section
        title="数据导入"
        description="按步骤导入：项目 → 运动员名单 → 报名矩阵"
        right={
          <div className="flex gap-2">
            <Link href="/rules"><Button variant="secondary" size="sm">规则配置</Button></Link>
            <Link href="/status"><Button variant="secondary" size="sm">初始化状态</Button></Link>
          </div>
        }
      />

      {msg && (
        <div className={`rounded-md px-3 py-2 text-sm ${msg.includes("失败") ? "bg-rose-50 text-rose-600 border border-rose-200" : "bg-emerald-50 text-emerald-600 border border-emerald-200"}`}>
          {msg}
        </div>
      )}

      {/* Step Progress */}
      <Card>
        <CardContent className="p-4 overflow-x-auto">
          <div className="flex items-center gap-2">
            {STEPS.map((step, i) => (
              <React.Fragment key={step.num}>
                {i > 0 && <ArrowRight className="h-4 w-4 shrink-0 text-slate-300" />}
                <button
                  type="button"
                  onClick={() => setActiveStep(i)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 transition-colors whitespace-nowrap ${
                    i === activeStep ? "bg-accent text-white" :
                    i < activeStep ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                    "bg-slate-50 text-slate-500 border border-slate-200"
                  }`}
                >
                  <step.icon className="h-4 w-4" />
                  <div className="text-left">
                    <div className="text-xs font-medium">步骤{step.num}</div>
                    <div className="text-sm font-semibold">{step.label}</div>
                  </div>
                  {i < activeStep && <Check className="h-4 w-4 shrink-0" />}
                </button>
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>系统初始化</CardTitle></CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500 mb-3">保存比赛日期后，导入和公示将使用此基础信息。</p>
            <div className="flex items-end gap-3">
              <div className="w-[180px]">
                <div className="text-xs font-medium text-slate-700 mb-1">比赛日期</div>
                <Input value={meetDate} onChange={(e) => setMeetDate(e.target.value)} placeholder="YYYY-MM-DD" />
              </div>
              <Button onClick={handleSaveDate}>保存日期</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>模板下载</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {TEMPLATES.map((t) => (
                <a
                  key={t.label}
                  href={t.category ? downloadRegistrationTemplate(t.category) : downloadImportTemplate(t.key)}
                  className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors bg-slate-50 text-slate-700 hover:bg-slate-100"
                >
                  <Download className="h-3.5 w-3.5 shrink-0" />
                  <span>{t.label}</span>
                  <span className="ml-auto text-[11px] text-slate-400">CSV</span>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {STEPS.map((step, i) => (
          <Card key={step.num}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">{step.num}</span>
                <CardTitle>导入{step.label} CSV</CardTitle>
                {i < activeStep && <Badge variant="success">已完成</Badge>}
                {uploading === step.fileKey && <Badge variant="info"><Loader2 className="h-3 w-3 animate-spin" /> 上传中</Badge>}
              </div>
            </CardHeader>
            <CardContent>
              <FileDropzone onFile={(f) => handleImport(f, i)} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
