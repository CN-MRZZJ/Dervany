import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  CalendarClock,
  ClipboardEdit,
  ClipboardList,
  Download,
  Eraser,
  Megaphone,
  ScrollText,
  Settings2,
  ShieldCheck,
  TrendingUp,
  Upload,
  Users,
  Users2,
  Building2,
  Waypoints,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  Icon: LucideIcon;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "概览",
    items: [
      { href: "/", label: "首页", Icon: BarChart3 },
    ],
  },
  {
    label: "编排",
    items: [
      { href: "/lanes", label: "分道编排", Icon: Waypoints },
      { href: "/advancement", label: "晋级管理", Icon: TrendingUp },
    ],
  },
  {
    label: "赛务",
    items: [
      { href: "/progress", label: "比赛进度", Icon: CalendarClock },
      { href: "/results", label: "成绩录入", Icon: ClipboardEdit },
      { href: "/publish", label: "成绩公示", Icon: ScrollText },
      { href: "/checkin", label: "检录表", Icon: ClipboardList },
    ],
  },
  {
    label: "数据",
    items: [
      { href: "/import", label: "导入中心", Icon: Upload },
      { href: "/export", label: "导出中心", Icon: Download },
      { href: "/notices", label: "通知中心", Icon: Megaphone },
    ],
  },
  {
    label: "管理",
    items: [
      { href: "/athletes", label: "运动员管理", Icon: Users },
      { href: "/teams", label: "队伍管理", Icon: Users2 },
      { href: "/departments", label: "单位管理", Icon: Building2 },
    ],
  },
  {
    label: "系统",
    items: [
      { href: "/rules", label: "规则配置", Icon: Settings2 },
      { href: "/clear", label: "清理数据", Icon: Eraser },
      { href: "/status", label: "系统状态", Icon: ShieldCheck },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);
