"use client";

import * as React from "react";
import { Section } from "@/components/ui/section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Download, FileDown, Filter } from "lucide-react";
import { exportViewCsv } from "@/lib/api";
import { useGroupLabels } from "@/lib/use-group-labels";

const DATA_VIEWS: Record<string, string> = {
  events: "项目", athletes: "运动员", results: "成绩",
  teams: "队伍", departments: "部门", registrations: "报名",
};

export function ExportCenterPage() {
  const { athleteOptions } = useGroupLabels();
  const [view, setView] = React.useState("events");
  const [keyword, setKeyword] = React.useState("");
  const [departmentName, setDepartmentName] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [scoringStrategy, setScoringStrategy] = React.useState("");
  const [gender, setGender] = React.useState("");
  const [ageGroup, setAgeGroup] = React.useState("");

  function doExport(params?: Record<string, string>) {
    window.open(exportViewCsv(view, params || {}), "_blank");
  }

  return (
    <div className="space-y-4">
      <Section title="数据导出" description="快速导出完整数据集，或按条件筛选后导出 CSV" />

      <Card>
        <CardHeader><CardTitle>快速导出</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(DATA_VIEWS).map(([key, label]) => (
              <Button key={key} variant="secondary" size="sm" className="justify-start" onClick={() => { setView(key); doExport(); }}>
                <Download className="h-3.5 w-3.5" />{label} CSV
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2"><Filter className="h-4 w-4 text-slate-500" /><CardTitle>条件导出</CardTitle></div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="w-[140px]"><div className="text-xs font-medium text-slate-700 mb-1">数据类型</div>
              <Select value={view} onChange={(e) => setView(e.target.value)}>
                {Object.entries(DATA_VIEWS).map(([k, l]) => (<option key={k} value={k}>{l}</option>))}
              </Select>
            </div>
            <div className="w-[180px]"><div className="text-xs font-medium text-slate-700 mb-1">关键词</div>
              <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="姓名/项目/编号" />
            </div>
            <div className="w-[150px]"><div className="text-xs font-medium text-slate-700 mb-1">部门</div>
              <Select value={departmentName} onChange={(e) => setDepartmentName(e.target.value)}><option value="">全部</option></Select>
            </div>
            <div className="w-[110px]"><div className="text-xs font-medium text-slate-700 mb-1">类别</div>
              <Select value={category} onChange={(e) => setCategory(e.target.value)}><option value="">全部</option><option value="competitive">竞技</option><option value="fun">趣味</option></Select>
            </div>
            <div className="w-[90px]"><div className="text-xs font-medium text-slate-700 mb-1">性别</div>
              <Select value={gender} onChange={(e) => setGender(e.target.value)}><option value="">全部</option><option value="male">男</option><option value="female">女</option><option value="mixed">混合</option></Select>
            </div>
            <div className="w-[110px]"><div className="text-xs font-medium text-slate-700 mb-1">组别</div>
              <Select value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)}><option value="">全部</option>{athleteOptions.map((g) => (<option key={g.value} value={g.value}>{g.label}</option>))}</Select>
            </div>
            <Button onClick={() => doExport({ keyword, department_name: departmentName, category, scoring_strategy: scoringStrategy, gender, group: ageGroup })}>
              <FileDown className="h-4 w-4" />导出
            </Button>
          </div>
          <div className="mt-3 text-xs text-slate-500">导出格式为 CSV，字段与数据中心页面当前数据视图一致。</div>
        </CardContent>
      </Card>
    </div>
  );
}
