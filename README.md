# 运动会后台管理系统

运动会比赛成绩管理、赛务调度、数据导入导出的后台管理系统。

## 技术栈

- **Next.js 16** (App Router + 静态导出)
- **TypeScript**
- **Tailwind CSS 4**
- **Lucide React** (图标)

## 本地开发

```bash
npm install
npm run dev
```

浏览器打开 [http://localhost:3000](http://localhost:3000)。

## 编译部署

项目配置为静态导出模式，编译后生成 `out/` 目录。

```bash
npm run build   # 编译到 out/
```

### Nginx 部署

`nginx.conf` 包含完整的 Nginx 配置（Gzip、缓存策略、SPA fallback）。使用 `deploy.sh` 一键部署到云服务器：

```bash
./deploy.sh <服务器IP> [ssh用户名]
```

部署目标路径为 `/var/www/frontend`。

## 功能模块

| 模块 | 页面 | 说明 |
|------|------|------|
| 概览 | 首页 | 赛况总览仪表盘 |
| 赛务 | 比赛进度、成绩录入、成绩公示、轮次成绩 | 核心赛务流程 |
| 数据 | 导入中心、导出中心、通知中心 | 数据流转 |
| 管理 | 运动员管理、队伍管理、单位管理 | 基础数据管理 |
| 系统 | 规则配置、清理数据、系统状态 | 系统配置与维护 |

## 目录结构

```
src/
├── app/          # 页面路由
├── components/   # UI 组件
│   ├── app-shell.tsx
│   ├── pages/    # 页面级组件
│   └── ui/       # 通用 UI 组件
└── lib/          # 工具函数、API 封装、导航配置
```
