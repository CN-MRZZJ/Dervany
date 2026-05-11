# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

运动会后台管理系统 (Sports Meet Management System) — admin dashboard for managing sports competitions: athletes, teams, departments, events, results, import/export, and system configuration.

## Commands

```bash
npm run dev      # Start dev server (Turbopack)
npm run build    # Static export to out/
npm run lint     # ESLint
```

The project outputs static HTML/CSS/JS via `output: "export"` in `next.config.ts`. All pages are prerendered at build time.

## Architecture

### Frontend-only static SPA

Every page is `"use client"` — the app is a client-rendered SPA that calls a separate backend API. There are no server components, no SSR data fetching, no API routes.

### API layer (`src/lib/api/`)

- **`client.ts`** — core `request<T>(path, init?)` function wrapping `fetch`. Adds `Content-Type: application/json` automatically (unless body is `FormData`). Reads `NEXT_PUBLIC_API_BASE` env var for backend URL.
- Domain files (`athletes.ts`, `teams.ts`, `events.ts`, `results.ts`, etc.) export typed functions that call `request()` with specific endpoints.
- All re-exported through `index.ts`.

### Component structure

```
src/
├── app/                    # Routes (one folder per page, each has page.tsx)
├── components/
│   ├── app-shell.tsx       # Root layout: sidebar nav + header + main area
│   ├── pages/              # Page-level components (dashboard-page, result-entry-page, etc.)
│   └── ui/                 # Generic UI primitives (Button, Card, Table, Input, Select, etc.)
└── lib/
    ├── api/                # Backend API client (see above)
    ├── nav.ts              # Sidebar navigation groups/items definition
    └── utils.ts            # cn() tailwind class merge helper
```

### UI patterns

- **Custom component library** — not shadcn/ui. Components in `src/components/ui/` are hand-built with Tailwind CSS 4.
- **`cn()`** from `@/lib/utils` merges Tailwind classes via `clsx` + `tailwind-merge`.
- **Accent color** — a single accent hue used throughout (`bg-accent`, `text-accent`, `border-accent`, `accent-bg`, `accent-light`, `accent-dark`). Defined as CSS custom properties (likely teal/emerald).
- **`Section`** component provides consistent page header with title, description, and optional action buttons.
- **`Card`** / **`Table`** are the primary layout primitives for data display.
- **`Badge`** supports `variant`: `success`, `warning`, `neutral`.

### Navigation

Sidebar nav is data-driven from `NAV_GROUPS` in `src/lib/nav.ts`. Each item has `href`, `label`, and `Icon` (lucide-react). Groups have a `label` displayed as a section header. Adding a new page requires: (1) add route folder, (2) add nav entry, (3) add API functions if needed.

### Backend API

Backend is a separate Flask service. Its URL is configured via `NEXT_PUBLIC_API_BASE` env var (set in `.env.local`, not committed). API follows RESTful conventions — some endpoints use POST form-style mutations (`/athletes/delete`, `/athletes/registrations/add`), others use standard REST verbs.

## Behavioral Guidelines

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

### 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No error handling for impossible scenarios.

### 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- Remove only imports/variables made unused by YOUR changes.

### 4. Goal-Driven Execution

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
```
