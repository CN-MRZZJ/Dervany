"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { NAV_GROUPS } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PanelLeft, Search, Trophy } from "lucide-react";

function Brand({ compact }: { compact: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-7 w-7 rounded-md bg-accent flex items-center justify-center">
        <Trophy className="h-4 w-4 text-white" />
      </div>
      {compact ? null : (
        <div className="leading-tight">
          <div className="text-sm font-semibold text-white">运动会后台</div>
          <div className="text-[11px] text-slate-400">Admin Console</div>
        </div>
      )}
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [globalSearch, setGlobalSearch] = React.useState("");

  return (
    <div className="h-screen overflow-hidden bg-slate-50">
      <div className="flex h-full w-full">
        <aside
          className={cn(
            "shrink-0 border-r border-slate-800 bg-slate-900 flex flex-col",
            "transition-[width] duration-300",
            sidebarOpen ? "w-64" : "w-[72px]"
          )}
        >
          <div className="h-14 px-4 flex items-center justify-between border-b border-slate-800">
            <Brand compact={!sidebarOpen} />
            <Button
              size="icon"
              variant="ghost"
              aria-label="切换侧边栏"
              onClick={() => setSidebarOpen((v) => !v)}
              title="切换侧边栏"
              className="text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <PanelLeft className="h-4 w-4" />
            </Button>
          </div>
          <nav className="flex-1 p-2 pb-3 space-y-4 overflow-y-auto">
            {NAV_GROUPS.map((group, gi) => (
              <div key={gi} className="space-y-1">
                {sidebarOpen && (
                  <div className="px-3 pt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    {group.label}
                  </div>
                )}
                {group.items.map((it) => {
                  const active = pathname === it.href;
                  return (
                    <Link
                      key={it.href}
                      href={it.href}
                      className={cn(
                        "h-9 flex items-center gap-3 rounded-md px-3 text-sm transition-colors",
                        "text-slate-400 hover:text-white hover:bg-slate-800",
                        active && "bg-accent text-white hover:bg-accent-light",
                        !sidebarOpen && "justify-center px-0"
                      )}
                      title={sidebarOpen ? undefined : it.label}
                    >
                      <it.Icon className="h-[18px] w-[18px] shrink-0" />
                      <span className={cn(
                        "truncate transition-opacity",
                        sidebarOpen ? "opacity-100" : "opacity-0 hidden"
                      )}>
                        {it.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="h-14 border-b border-slate-200 bg-white px-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 min-w-0">
              <div className="relative w-[320px] max-w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  placeholder="全局搜索（选手、队伍、项目…）"
                  className="pl-9"
                />
                <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-400">
                  Ctrl+K
                </kbd>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="hidden sm:inline">环境：</span>
              <span className="rounded-md border border-accent/20 bg-accent-bg px-2 py-1 text-accent-dark font-medium">
                本地开发
              </span>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4">{children}</main>
        </div>
      </div>
    </div>
  );
}
