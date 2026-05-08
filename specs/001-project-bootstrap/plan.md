# Implementation Plan: Project Bootstrap

**Branch**: `001-project-bootstrap` | **Date**: 2026-05-07 | **Spec**: [link](./spec.md)
**Input**: Feature specification from `/specs/001-project-bootstrap/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Initialize the EduQuest Admin Analytics Platform by setting up the complete development stack including Supabase database, Next.js backend with App Router, frontend application structure, authentication system, and CI/CD pipeline. Establish the foundation for building the educational platform with proper security, performance, and development standards.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 5+ | Next.js 15+ | Node.js 18+  
**Primary Dependencies**: @supabase/supabase-js, tailwindcss, eslint, prettier, shadcn/ui  
**Storage**: Supabase (PostgreSQL with Auth, Realtime, Storage)  
**Testing**: Jest (for future implementation, not in bootstrap scope)  
**Target Platform**: Web application (desktop-first, responsive down to tablet)  
**Project Type**: Web application - Admin analytics dashboard  
**Performance Goals**: Page loads < 2s, API responses < 500ms, LCP < 2.5s on desktop  
**Constraints**: Must follow constitution principles, type-safe strict mode, RLS always on  
**Scale/Scope**: Foundation for 10k+ users admin dashboard, 50+ screens in future

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Core Principles Compliance
- ✅ **Server-First Data Fetching**: Plan uses `createServerClient` for server components
- ✅ **Defense-in-Depth Authorization**: Auth middleware + RLS + UI gates implemented
- ✅ **Migration-Governed Database**: All schema changes through numbered migrations
- ✅ **Scoped Realtime**: Only specific tables enabled for Realtime
- ✅ **Streamed Exports**: Foundation for future export functionality
- ✅ **Performance by Default**: Performance targets specified and measured
- ✅ **Type-Safe & Accessible Code**: TypeScript strict mode, ARIA labels, no inline styles

### Stack Compliance
- ✅ Uses Next.js 15 with App Router as specified
- ✅ TypeScript strict mode enabled
- ✅ Tailwind CSS for styling
- ✅ Supabase for database and auth
- ✅ Railway deployment platform
- ✅ GitHub Actions CI/CD

All gates pass. No violations need justification.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
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

**Structure Decision**: Single Next.js project with App Router structure as defined in Constitution Core Stack & Repository Structure section

```text
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

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
