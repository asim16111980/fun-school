<!--
  Sync Impact Report
  ==================
  Version change: 0.0.0 (template) → 1.0.0
  Modified principles: N/A (initial population)
  Added sections:
    - Core Principles (7 principles from architectural contracts)
    - Core Stack & Repository Structure
    - Development Workflow & Conventions
    - Governance
  Removed sections: None
  Templates requiring updates:
    - .specify/templates/plan-template.md ✅ compatible (Constitution Check gate present)
    - .specify/templates/spec-template.md ✅ compatible (no constitution-specific refs)
    - .specify/templates/tasks-template.md ✅ compatible (phase structure aligns)
  Follow-up TODOs: None
-->

# EduQuest Admin Analytics Platform Constitution

## Core Principles

### I. Server-First Data Fetching

- Server Components fetch by default using `createServerClient`
  in Server Components and Route Handlers.
- Client Components MUST only fetch when realtime subscriptions
  or user-triggered mutations are needed.
- No direct Supabase calls from the client for sensitive
  operations — route through `/api` Route Handlers.
- Pagination is mandatory for all list/table queries.
  Default page size: 25.

### II. Defense-in-Depth Authorization

- Supabase Auth handles session management via PKCE + cookies.
- `middleware.ts` protects all `/dashboard/*` routes.
  Unauthenticated requests redirect to `/login`.
- Role-based access is enforced at two levels:
  1. Row-Level Security (RLS) in Supabase — always on for
     every table.
  2. UI-level gate in middleware and page components —
     hide/disable features by role.
- Role hierarchy: `super_admin > content_manager > teacher > viewer`

### III. Migration-Governed Database

- All schema changes MUST go through numbered migration files
  in `supabase/migrations/`.
- Never mutate schema via the Supabase dashboard UI in production.
- Every table MUST have: `id UUID DEFAULT gen_random_uuid() PRIMARY KEY`,
  `created_at TIMESTAMPTZ DEFAULT NOW()`,
  `updated_at TIMESTAMPTZ DEFAULT NOW()`.
- Soft deletes only: `deleted_at TIMESTAMPTZ` column.
  No hard deletes on user-facing data.
- Secrets (API keys, tokens) MUST be stored in Supabase Vault,
  never in plain columns.

### IV. Scoped Realtime

- Realtime is used only for: leaderboard widgets,
  active-user counter, live event feed.
- All other data uses polling with 30-second intervals.
- Realtime channels MUST be scoped per-session and
  unsubscribed on component unmount.

### V. Streamed Exports

- CSV export: streamed from a Route Handler, never buffered
  in full on the client.
- PDF export: generated server-side via a Route Handler
  using `@react-pdf/renderer` or equivalent.
- Exports MUST respect the current user's filter state
  (date range, entity filters).

### VI. Performance by Default

- Dashboard overview page MUST achieve LCP < 2.5s on desktop.
- All charts render with a skeleton loader — no layout shift
  on data load.
- Heavy tables MUST use virtualisation (TanStack Virtual)
  for > 100 rows.
- Analytics queries aggregating > 10k rows MUST be
  pre-computed via Postgres views or materialized views.

### VII. Type-Safe & Accessible Code

- TypeScript strict mode: no `any`, no `ts-ignore` without
  an accompanying comment explaining why.
- No inline styles — Tailwind utility classes only.
- Components are single-responsibility. Logic lives in
  hooks or `lib/`.
- All mutations go through optimistic UI + server validation.
- Error boundaries wrap every dashboard section.
- All interactive elements MUST have ARIA labels, keyboard
  navigation, and sufficient colour contrast (WCAG AA minimum).
- No `console.log` in committed code — use a structured
  logger utility.

## Core Stack & Repository Structure

### Technology Stack

| Layer | Technology | Version / Notes |
|---|---|---|
| Frontend framework | Next.js (App Router) | Latest stable (>= 15) |
| Frontend language | TypeScript | Strict mode enabled |
| Styling | Tailwind CSS | v4 |
| Component library | shadcn/ui | Radix primitives underneath |
| Charts | Recharts | For non-realtime charts |
| Realtime charts | Supabase Realtime + SVG/canvas | Key widgets only |
| Backend | Supabase | Auth + PostgreSQL + Vault + Storage |
| ORM / Query | Supabase JS Client v2 | Server-side via `createServerClient` |
| Auth | Supabase Auth | PKCE flow, SSR-compatible |
| Deployment | Railway (Next.js) + Supabase Cloud | Native buildpack, no Dockerfile |
| CI/CD | GitHub Actions | Lint -> typecheck -> build |

### Repository Layout

```
eduquest/
├── app/
│   ├── (auth)/                 # login, forgot-password
│   ├── (dashboard)/            # all protected admin routes
│   │   ├── overview/
│   │   ├── users/
│   │   ├── content/
│   │   ├── gamification/
│   │   ├── reports/
│   │   └── settings/
│   ├── api/                    # Route Handlers (server-side only)
│   └── layout.tsx
├── components/
│   ├── ui/                     # shadcn primitives
│   ├── charts/                 # chart wrappers
│   ├── tables/                 # data table components
│   └── shared/                 # nav, sidebar, header
├── lib/
│   ├── supabase/               # client, server, middleware helpers
│   ├── queries/                # typed Supabase query functions
│   ├── utils/                  # formatters, date helpers
│   └── types/                  # shared TypeScript types
├── supabase/
│   ├── migrations/             # SQL migration files (numbered)
│   ├── seed.sql                # dev seed data
│   └── functions/              # Edge Functions (if needed)
├── middleware.ts               # Auth guard
└── .env.local                  # secrets (never committed)
```

### Environment Variables

```
# Public (safe to expose to browser)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Server only (never in NEXT_PUBLIC_*)
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=
```

## Development Workflow & Conventions

### Naming Conventions

| Concept | Convention | Example |
|---|---|---|
| Files/folders | kebab-case | `user-growth-chart.tsx` |
| Components | PascalCase | `UserGrowthChart` |
| Hooks | camelCase prefixed `use` | `useLeaderboard` |
| DB tables | snake_case plural | `user_profiles` |
| DB columns | snake_case | `created_at` |
| Env vars | SCREAMING_SNAKE | `NEXT_PUBLIC_SUPABASE_URL` |
| Route Handlers | REST-style nouns | `/api/reports/export` |

### Project Identity

- **Name:** EduQuest — Admin Analytics Dashboard
- **Type:** Internal admin dashboard for a Gamified Learning
  & Content Platform
- **Users:** Super Admins, Content Managers,
  Teachers/Moderators, Read-only Viewers
- **Goal:** Full visibility into user growth, learning
  performance, engagement, gamification health, and content
  quality — with exportable reports and real-time widgets.

### Scope Boundaries

- This is NOT a student-facing app. Admin-only.
- This is NOT a content authoring tool. Content is managed
  elsewhere; this dashboard reads it.
- This is NOT a real-time collaborative editor.
- This is NOT a mobile-first app (desktop-first, responsive
  down to tablet).

### AI Tooling Roles

| Tool | Scope |
|---|---|
| Claude Code | Backend Route Handlers, Supabase queries, migration SQL, data hooks, logic utilities |
| GLM4.7 | Supplementary code generation, boilerplate, SQL optimisation suggestions |
| Antigravity (Gemini) | Frontend UI component generation — dashboard pages, charts, tables, modals |

AI-generated code MUST be reviewed by a human before merging.
AI output is a first draft, not a final commit.

## Governance

This constitution is the source of truth for the EduQuest
Admin Analytics Platform. All specs, plans, and tasks derive
from it. When in conflict with other documents, this file wins.

### Amendment Procedure

1. Propose changes via a pull request modifying this file.
2. Changes MUST include a version bump following semantic
   versioning (see below).
3. All team members MUST be notified of principle changes.

### Versioning Policy

- **MAJOR**: Backward-incompatible governance or principle
  removals/redefinitions.
- **MINOR**: New principle or section added, or materially
  expanded guidance.
- **PATCH**: Clarifications, wording, typo fixes,
  non-semantic refinements.

### Compliance Review

- All PRs MUST verify compliance with these principles.
- Complexity beyond what principles allow MUST be justified
  in the PR description.
- Use CLAUDE.md for runtime development guidance that
  supplements this constitution.

**Version**: 1.0.0 | **Ratified**: 2026-05-03 | **Last Amended**: 2026-05-03
