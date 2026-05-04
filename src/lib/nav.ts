import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  CalendarClock,
  ClipboardEdit,
  Download,
  Eraser,
  Megaphone,
  ScrollText,
  Table2,
  Settings2,
  ShieldCheck,
  Upload,
  Users,
  Users2,
  Building2,
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
    label: "赛务",
    items: [
      { href: "/progress", label: "比赛进度", Icon: CalendarClock },
      { href: "/results", label: "成绩录入", Icon: ClipboardEdit },
      { href: "/publish", label: "成绩公示", Icon: ScrollText },
      { href: "/attempts", label: "轮次成绩", Icon: Table2 },
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
