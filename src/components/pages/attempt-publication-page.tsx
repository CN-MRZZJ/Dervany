"use client";

import * as React from "react";
import { Section } from "@/components/ui/section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Download, Eye, Printer, CloudRain } from "lucide-react";
import { queryEvents, saveReportEnv, previewPersonalAttemptPdf, previewTeamAttemptPdf, exportPersonalAttemptXlsx, exportTeamAttemptXlsx } from "@/lib/api";

type EnvInfo = {
  date: string; wind_direction: string; wind_speed: string;
  air_quality: string; weather: string; temperature_high: string; temperature_low: string;
};

const STORAGE_KEY = "sportsmeet.attempt_publication.v1";

function todayISO() { return new Date().toISOString().slice(0, 10); }

function glabel(g: string) { return g === "male" ? "男" : g === "female" ? "女" : "混合"; }
function alabel(ag: string) { return ag === "A" ? "甲组" : ag === "B" ? "乙组" : ag === "C" ? "丙组" : ag; }

export function AttemptPublicationPage() {
  const [env, setEnv] = React.useState<EnvInfo>({ date: todayISO(), wind_direction: "", wind_speed: "", air_quality: "", weather: "", temperature_high: "", temperature_low: "" });
  const [events, setEvents] = React.useState<{ id: number; name: string; is_individual: number; gender: string; group: string }[]>([]);
  const [indEvent, setIndEvent] = React.useState("");
  const [indTemplate, setIndTemplate] = React.useState("personal_attempt_template.xlsx");
  const [indAttemptNum, setIndAttemptNum] = React.useState("1");
  const [indFrameSrc, setIndFrameSrc] = React.useState("");
  const [teamEvent, setTeamEvent] = React.useState("");
  const [teamTemplate, setTeamTemplate] = React.useState("team_attempt_template.xlsx");
  const [teamAttemptNum, setTeamAttemptNum] = React.useState("1");
  const [teamFrameSrc, setTeamFrameSrc] = React.useState("");

  React.useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) { try { const d = JSON.parse(raw); if (d) setEnv((p) => ({ ...p, ...d })); } catch {} }
    queryEvents().then((d) => setEvents(d.items)).catch(() => {});
  }, []);

  async function handleSaveEnv() {
    try {
      await saveReportEnv(env);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(env));
    } catch {}
  }

  return (
    <div className="space-y-4">
      <Section title="轮次成绩公示" description="配置环境信息，选择项目和模板，预览与导出轮次成绩公示单" />

      <Card>
        <CardHeader><div className="flex items-center gap-2"><CloudRain className="h-4 w-4 text-slate-500" /><CardTitle>环境信息</CardTitle></div></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 items-end">
            {[
              ["日期", "date", "130px"],
              ["风向", "wind_direction", "90px"],
              ["风速", "wind_speed", "90px"],
              ["空气", "air_quality", "110px"],
              ["天气", "weather", "90px"],
              ["最高℃", "temperature_high", "70px"],
              ["最低℃", "temperature_low", "70px"],
            ].map(([label, key, w]) => (
              <div key={key} style={{ width: w }}><div className="text-xs font-medium text-slate-700 mb-1">{label}</div><Input value={(env as any)[key]} onChange={(e) => setEnv((p) => ({ ...p, [key]: e.target.value }))} /></div>
            ))}
            <Button variant="secondary" onClick={handleSaveEnv}>保存</Button>
          </div>
        </CardContent>
      </Card>

      <PublishCard
        title="个人轮次成绩公示单"
        events={events.filter((e) => e.is_individual === 1)}
        eventVal={indEvent}
        onEventChange={setIndEvent}
        templateVal={indTemplate}
        onTemplateChange={setIndTemplate}
        attemptNum={indAttemptNum}
        onAttemptNumChange={setIndAttemptNum}
        templates={[{ value: "personal_attempt_template.xlsx", label: "个人轮次标准模板" }]}
        onPreview={() => indEvent && indTemplate && setIndFrameSrc(previewPersonalAttemptPdf(Number(indEvent), indTemplate, Number(indAttemptNum)))}
        onExport={() => indEvent && indTemplate && window.open(exportPersonalAttemptXlsx(Number(indEvent), indTemplate, Number(indAttemptNum)))}
        frameSrc={indFrameSrc}
      />

      <PublishCard
        title="团体轮次成绩公示单"
        events={events.filter((e) => e.is_individual === 0)}
        eventVal={teamEvent}
        onEventChange={setTeamEvent}
        templateVal={teamTemplate}
        onTemplateChange={setTeamTemplate}
        attemptNum={teamAttemptNum}
        onAttemptNumChange={setTeamAttemptNum}
        templates={[{ value: "team_attempt_template.xlsx", label: "团体轮次标准模板" }]}
        onPreview={() => teamEvent && teamTemplate && setTeamFrameSrc(previewTeamAttemptPdf(Number(teamEvent), teamTemplate, Number(teamAttemptNum)))}
        onExport={() => teamEvent && teamTemplate && window.open(exportTeamAttemptXlsx(Number(teamEvent), teamTemplate, Number(teamAttemptNum)))}
        frameSrc={teamFrameSrc}
      />
    </div>
  );
}

function PublishCard({
  title, events, eventVal, onEventChange, templateVal, onTemplateChange,
  attemptNum, onAttemptNumChange,
  onPreview, onExport, frameSrc, templates,
}: {
  title: string; events: { id: number; name: string; is_individual: number; gender: string; group: string }[];
  eventVal: string; onEventChange: (v: string) => void;
  templateVal: string; onTemplateChange: (v: string) => void;
  attemptNum: string; onAttemptNumChange: (v: string) => void;
  onPreview: () => void; onExport: () => void;
  frameSrc: string;
  templates: { value: string; label: string }[];
}) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-end gap-3 mb-3">
          <div className="w-[240px]"><div className="text-xs font-medium text-slate-700 mb-1">项目</div>
            <Select value={eventVal} onChange={(e) => onEventChange(e.target.value)}><option value="">选择项目</option>{events.map((e) => (<option key={e.id} value={String(e.id)}>{e.name} {glabel(e.gender)}{alabel(e.group)}</option>))}</Select>
          </div>
          <div className="w-[200px]"><div className="text-xs font-medium text-slate-700 mb-1">模板</div>
            <Select value={templateVal} onChange={(e) => onTemplateChange(e.target.value)}><option value="">选择模板</option>{templates.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}</Select>
          </div>
          <div className="w-[90px]"><div className="text-xs font-medium text-slate-700 mb-1">轮次</div>
            <Input value={attemptNum} onChange={(e) => onAttemptNumChange(e.target.value)} type="number" min="1" />
          </div>
          <Button variant="secondary" onClick={onExport}><Download className="h-4 w-4" />导出 XLSX</Button>
          <Button onClick={onPreview}><Eye className="h-4 w-4" />在线预览</Button>
          <Button variant="warning" onClick={onPreview}><Printer className="h-4 w-4" />打印</Button>
        </div>
        <div className="rounded-md border border-slate-200 overflow-hidden bg-white">
          <iframe title="PDF预览" className="w-full h-[400px]" src={frameSrc || "about:blank"} />
        </div>
      </CardContent>
    </Card>
  );
}
