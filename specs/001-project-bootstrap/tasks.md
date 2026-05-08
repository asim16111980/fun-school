# Tasks: Project Bootstrap

**Input**: Design documents from `/specs/001-project-bootstrap/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Tests**: Tests are NOT included in this bootstrap phase as per specification scope

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `app/`, `components/`, `lib/`, `supabase/` at repository root
- Based on plan.md structure using Next.js with App Router

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Initialize the project structure and basic configuration

- [X] T001 Initialize Next.js 15 project with TypeScript and App Router
- [X] T002 [P] Configure Tailwind CSS and PostCSS
- [X] T003 [P] Set up ESLint and Prettier with configuration files
- [X] T004 [P] Create project directory structure per implementation plan

---

## Phase 2: Foundational (Core Infrastructure)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 [P] Create Supabase client utilities in lib/supabase/
- [ ] T006 [P] Implement authentication middleware in middleware.ts
- [ ] T007 [P] Setup environment configuration management with .env.local
- [ ] T008 [P] Create database types in lib/types/database.ts
- [ ] T009 [P] Initialize Supabase project and migrations structure
- [ ] T010 Configure error handling and logging infrastructure

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Database Bootstrap Setup (Priority: P1) 🎯 MVP

**Goal**: Initialize the Supabase project and configure core database settings

**Independent Test**: Verify Supabase project creation, RLS settings, Auth configuration, and CLI linkage

### Implementation for User Story 1

- [ ] T011 [P] [US1] Create Supabase migrations directory in supabase/migrations/
- [ ] T012 [P] [US1] Initialize RLS with default deny policy in supabase/migrations/0001_initial_setup.sql
- [ ] T013 [P] [US1] Configure Realtime for activity_logs and leaderboard_snapshots tables
- [ ] T014 [US1] Set up authentication with email/password and PKCE flow
- [ ] T015 [US1] Link Railway site URL in Supabase authentication settings
- [ ] T016 [US1] Validate database connection and RLS policies

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Backend Project Foundation (Priority: P1)

**Goal**: Create a properly scaffolded Next.js application with all core dependencies and configuration

**Independent Test**: Run `npm run build` successfully and confirm all dependencies are installed and configured correctly

### Implementation for User Story 2

- [ ] T017 [P] [US2] Install dependencies from Constitution §2 stack table
- [ ] T018 [P] [US2] Configure TypeScript path alias for @/* imports in tsconfig.json
- [ ] T019 [P] [US2] Set up ESLint and Prettier configuration files
- [ ] T020 [US2] Create API route handlers structure in app/api/
- [ ] T021 [US2] Implement basic error handling middleware
- [ ] T022 [US2] Build and validate application with `npm run build`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Frontend App Shell (Priority: P1)

**Goal**: Create the basic application structure, routing, and shared components for the admin dashboard

**Independent Test**: Start the dev server and verify all routes render correctly with proper layout

### Implementation for User Story 3

- [ ] T023 [P] [US3] Create root layout with fonts and global CSS in app/layout.tsx
- [ ] T024 [P] [US3] Create auth layout with centered card design in app/(auth)/layout.tsx
- [ ] T025 [P] [US3] Create dashboard layout with two-column structure in app/(dashboard)/layout.tsx
- [ ] T026 [P] [US3] Implement navigation component with active route highlighting
- [ ] T027 [P] [US3] Create shared components in components/shared/
- [ ] T028 [US3] Set up route protection and user context

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: User Story 4 - Authentication System Integration (Priority: P2)

**Goal**: Implement authentication middleware and client helpers for proper session management

**Independent Test**: Simulate login attempts and verify unauthorized access is blocked

### Implementation for User Story 4

- [ ] T029 [P] [US4] Implement createServerClient utility in lib/supabase/server.ts
- [ ] T030 [P] [US4] Create browser client utility in lib/supabase/client.ts
- [ ] T031 [US4] Update middleware.ts for route protection and session refresh
- [ ] T032 [US4] Create login page in app/(auth)/login/page.tsx
- [ ] T033 [US4] Implement typed auth hooks in lib/hooks/
- [ ] T034 [US4] Add role-based access control in middleware and components

**Checkpoint**: Authentication system protects all dashboard routes correctly

---

## Phase 7: User Story 5 - Development Environment Setup (Priority: P3)

**Goal**: Configure CI/CD pipeline and development tools for team collaboration

**Independent Test**: Create a PR and verify CI runs successfully

### Implementation for User Story 5

- [ ] T035 [P] [US5] Create GitHub Actions CI workflow in .github/workflows/ci.yml
- [ ] T036 [P] [US5] Configure Railway auto-deployment for main branch
- [ ] T037 [P] [US5] Generate TypeScript database types from Supabase schema
- [ ] T038 [P] [US5] Create .env.local template with all required variables
- [ ] T039 [US5] Implement environment variable validation at startup
- [ ] T040 [US5] Add development scripts to package.json

**Checkpoint**: Development environment enables automated quality checks and deployment

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T041 [P] Update documentation with setup instructions
- [ ] T042 Run type checking across entire codebase
- [ ] T043 [P] Performance validation for all routes
- [ ] T044 [US5] Implement performance monitoring for LCP < 2.5s on dashboard overview
- [ ] T045 [US5] Add API response time tracking to ensure < 500ms for all endpoints
- [ ] T046 [US5] Create performance test suite that validates SC-011 and SC-012 thresholds
- [ ] T047 [US5] Implement error boundary testing to verify SC-013 (user-friendly messages with resolution guidance)
- [ ] T048 [US5] Add validation that all error states display guidance on resolution
- [ ] T049 Security hardening of authentication flows
- [ ] T050 Validate against constitution principles
- [ ] T051 Test complete application startup flow

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Depends on database connection
- **User Story 3 (P1)**: Can start after Foundational (Phase 2) - No story dependencies
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - Integrates with US2 and US3
- **User Story 5 (P3)**: Can start after Foundational (Phase 2) - Integrates with all previous stories

### Within Each User Story

- Core implementation before integration
- Story complete before moving to next priority
- Validate each story independently after completion

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all database setup tasks together:
Task: "Create Supabase migrations directory in supabase/migrations/"
Task: "Initialize RLS with default deny policy in supabase/migrations/0001_initial_setup.sql"
Task: "Configure Realtime for activity_logs and leaderboard_snapshots tables"
Task: "Set up authentication with email/password and PKCE flow"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo
6. Add User Story 5 → Test independently → Deploy/Demo
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Database)
   - Developer B: User Story 2 (Backend)
   - Developer C: User Story 3 (Frontend)
   - Developer D: User Story 4 (Auth)
   - Developer E: User Story 5 (DevOps)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- No test tasks included as per specification scope
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence