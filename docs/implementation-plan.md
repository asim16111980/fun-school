# EduQuest — Master Implementation Plan

> One plan. Three work areas. Each area will produce its own specification later.
> This document is the single source of truth for what gets built, in what order, and by whom.
> Constitution (00_CONSTITUTION.md) governs all rules, stack decisions, and constraints.

---

## Work Area Overview

```
┌─────────────────────────────────────────────────────────────┐
│  AREA 1: DATABASE                                           │
│  Owner tool: Claude Code + GLM4.7                           │
│  Output: Supabase schema, RLS, functions, seed data         │
├─────────────────────────────────────────────────────────────┤
│  AREA 2: BACKEND                                            │
│  Owner tool: Claude Code + GLM4.7                           │
│  Output: Route Handlers, data queries, auth, exports        │
├─────────────────────────────────────────────────────────────┤
│  AREA 3: FRONTEND                                           │
│  Owner tool: Antigravity (Gemini)                           │
│  Output: All UI — pages, components, charts, forms          │
└─────────────────────────────────────────────────────────────┘
```

**Dependency order:** Area 1 must be complete before Area 2 begins. Area 2 must have stable query interfaces before Area 3 connects to live data. Frontend can build with mock data in parallel, then wire up.

---

## Phase Map

```
Phase 0   Foundation          All areas bootstrap together
Phase 1   Database            Area 1 completes fully
Phase 2   Backend Core        Area 2 — auth, queries, API routes
Phase 3   Frontend Core       Area 3 — layout, overview, users
Phase 4   Backend Features    Area 2 — content, gamification, exports
Phase 5   Frontend Features   Area 3 — content, gamification, reports
Phase 6   Integration         All areas — wire up, realtime, exports
Phase 7   Hardening           All areas — perf, RLS audit, a11y, CI
```

---

---

# AREA 1 — DATABASE

> Supabase PostgreSQL schema, RLS policies, helper functions, aggregation tables, indexes, seed data.
> All changes go through numbered migration files. No manual dashboard edits in production.

---

## Phase 0 · Database Bootstrap

### DB-001 · Supabase project initialization
- Create new Supabase project, note connection strings and API keys
- Enable RLS globally (default deny on all tables)
- Enable Supabase Realtime for two tables: `activity_logs`, `leaderboard_snapshots`
- Configure Auth: email/password only, PKCE flow, set site URL to Railway domain
- Store all keys in Railway environment variables and `.env.local` (never committed)
- Confirm `supabase` CLI is linked to the project (`supabase link`)

---

## Phase 1 · Schema — All Migrations

Migrations run in strict numeric order. Each file is idempotent. Standard entity tables get: `id UUID DEFAULT gen_random_uuid() PRIMARY KEY`, `created_at TIMESTAMPTZ DEFAULT NOW()`, `updated_at TIMESTAMPTZ DEFAULT NOW()`, `deleted_at TIMESTAMPTZ` (soft delete, nullable). Append-only log tables and aggregate/stat tables may intentionally omit `updated_at`, `deleted_at`, or surrogate `id` when their table-specific spec says so.

---

### DB-002 · Migration 001 — Users & Roles

**File:** `supabase/migrations/001_users.sql`

**Create:**
- `role` ENUM type: `super_admin`, `content_manager`, `teacher`, `viewer`, `student`
- `user_profiles` table:

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | gen_random_uuid() |
| auth_user_id | UUID | FK → auth.users(id) ON DELETE CASCADE |
| role | role ENUM | NOT NULL |
| display_name | TEXT | NOT NULL |
| avatar_url | TEXT | nullable |
| grade_level | TEXT | nullable; primarily used for students and class placement |
| is_active | BOOLEAN | DEFAULT true |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | auto-updated via trigger |
| deleted_at | TIMESTAMPTZ | nullable, soft delete |

- `updated_at` trigger function (reusable across standard entity and assignment tables)

---

### DB-003 · Migration 002 — Subjects

**File:** `supabase/migrations/002_subjects.sql`

**Create:**
- `subjects` table:

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| name | TEXT | NOT NULL UNIQUE |
| description | TEXT | nullable |
| icon_url | TEXT | nullable |
| color_hex | TEXT | for UI display, e.g. '#4F46E5' |
| is_active | BOOLEAN | DEFAULT true |
| sort_order | INTEGER | for display ordering |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| deleted_at | TIMESTAMPTZ | |

- `classrooms` table:

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | gen_random_uuid() |
| name | TEXT | NOT NULL, e.g. "Grade 5 Math A" |
| subject_id | UUID | FK → subjects(id) |
| grade_level | TEXT | NOT NULL |
| school_year | TEXT | NOT NULL, e.g. "2026" |
| is_active | BOOLEAN | DEFAULT true |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | auto-updated via trigger |
| deleted_at | TIMESTAMPTZ | nullable, soft delete |

- `teacher_class_assignments` table:

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | gen_random_uuid() |
| teacher_id | UUID | FK → user_profiles(id), must have role `teacher` |
| classroom_id | UUID | FK → classrooms(id) |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | auto-updated via trigger |
| deleted_at | TIMESTAMPTZ | nullable, soft delete |

Unique constraint: `(teacher_id, classroom_id)` where `deleted_at IS NULL`

- `student_class_enrollments` table:

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | gen_random_uuid() |
| student_id | UUID | FK → user_profiles(id), must have role `student` |
| classroom_id | UUID | FK → classrooms(id) |
| enrolled_at | TIMESTAMPTZ | DEFAULT NOW() |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | auto-updated via trigger |
| deleted_at | TIMESTAMPTZ | nullable, soft delete |

Unique constraint: `(student_id, classroom_id)` where `deleted_at IS NULL`

---

### DB-004 · Migration 003 — Content Tables

**File:** `supabase/migrations/003_content.sql`

**Create:**

`lessons`:

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| subject_id | UUID | FK → subjects(id) |
| title | TEXT | NOT NULL |
| type | TEXT | CHECK IN ('video','text','interactive') |
| difficulty | INTEGER | CHECK 1–5 |
| duration_seconds | INTEGER | |
| is_published | BOOLEAN | DEFAULT false |
| sort_order | INTEGER | within subject |
| created_at / updated_at / deleted_at | TIMESTAMPTZ | |

`quizzes`:

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| lesson_id | UUID | FK → lessons(id), nullable (standalone quiz) |
| subject_id | UUID | FK → subjects(id), NOT NULL |
| title | TEXT | NOT NULL |
| total_questions | INTEGER | NOT NULL |
| pass_threshold | NUMERIC(5,2) | percentage, e.g. 70.00 |
| is_published | BOOLEAN | DEFAULT false |
| created_at / updated_at / deleted_at | TIMESTAMPTZ | |

`questions`:

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| quiz_id | UUID | FK → quizzes(id) |
| body | TEXT | NOT NULL |
| type | TEXT | CHECK IN ('mcq','true_false','open') |
| options | JSONB | array of choices for MCQ |
| correct_answer | TEXT | NOT NULL |
| difficulty_score | NUMERIC(3,2) | 0.00–1.00, computed or set |
| sort_order | INTEGER | |
| created_at / updated_at / deleted_at | TIMESTAMPTZ | |

`games`:

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| subject_id | UUID | FK → subjects(id) |
| title | TEXT | NOT NULL |
| game_type | TEXT | e.g. 'flashcard', 'matching', 'speed_quiz' |
| max_score | INTEGER | |
| is_published | BOOLEAN | DEFAULT false |
| created_at / updated_at / deleted_at | TIMESTAMPTZ | |

---

### DB-005 · Migration 004 — Progress & Performance

**File:** `supabase/migrations/004_progress.sql`

**Create:**

`lesson_completions`:

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID | FK → user_profiles(id) |
| lesson_id | UUID | FK → lessons(id) |
| completed_at | TIMESTAMPTZ | NOT NULL |
| time_spent_seconds | INTEGER | |
| score | NUMERIC(5,2) | nullable |
| created_at | TIMESTAMPTZ | |

`quiz_attempts`:

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID | FK → user_profiles(id) |
| quiz_id | UUID | FK → quizzes(id) |
| started_at | TIMESTAMPTZ | NOT NULL |
| completed_at | TIMESTAMPTZ | nullable (incomplete attempts) |
| score | NUMERIC(5,2) | nullable |
| passed | BOOLEAN | nullable |
| created_at | TIMESTAMPTZ | |

`question_responses`:

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| attempt_id | UUID | FK → quiz_attempts(id) |
| question_id | UUID | FK → questions(id) |
| user_answer | TEXT | |
| is_correct | BOOLEAN | |
| response_time_ms | INTEGER | |
| created_at | TIMESTAMPTZ | |

`game_sessions`:

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID | FK → user_profiles(id) |
| game_id | UUID | FK → games(id) |
| started_at | TIMESTAMPTZ | |
| ended_at | TIMESTAMPTZ | nullable |
| score | INTEGER | |
| created_at | TIMESTAMPTZ | |

---

### DB-006 · Migration 005 — Gamification

**File:** `supabase/migrations/005_gamification.sql`

**Create:**

`point_transactions`:

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID | FK → user_profiles(id) |
| amount | INTEGER | positive = earned, negative = spent |
| reason | TEXT | human-readable label |
| source_type | TEXT | CHECK IN ('quiz','lesson','game','reward','manual') |
| source_id | UUID | nullable, ID of the source entity |
| created_at | TIMESTAMPTZ | |

`rewards`:

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| name | TEXT | NOT NULL |
| description | TEXT | |
| point_cost | INTEGER | NOT NULL, > 0 |
| image_url | TEXT | nullable |
| is_active | BOOLEAN | DEFAULT true |
| stock | INTEGER | nullable (null = unlimited) |
| created_at / updated_at / deleted_at | TIMESTAMPTZ | |

`reward_redemptions`:

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID | FK → user_profiles(id) |
| reward_id | UUID | FK → rewards(id) |
| redeemed_at | TIMESTAMPTZ | NOT NULL |
| points_spent | INTEGER | NOT NULL, CHECK > 0 |
| created_at | TIMESTAMPTZ | |

`leaderboard_snapshots`:

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID | FK → user_profiles(id) |
| total_points | INTEGER | NOT NULL |
| rank | INTEGER | NOT NULL |
| previous_rank | INTEGER | nullable, for rank change calc |
| period | TEXT | CHECK IN ('daily','weekly','all_time') |
| snapshot_date | DATE | NOT NULL |
| created_at | TIMESTAMPTZ | |

Unique constraint: `(user_id, period, snapshot_date)`

---

### DB-007 · Migration 006 — Activity Logs

**File:** `supabase/migrations/006_logs.sql`

**Create:**

`activity_logs`:

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID | FK → user_profiles(id), nullable (system events) |
| action_type | TEXT | e.g. 'login', 'quiz_complete', 'reward_redeemed', 'export_csv' |
| entity_type | TEXT | nullable, e.g. 'quiz', 'lesson', 'user' |
| entity_id | UUID | nullable |
| metadata | JSONB | arbitrary context data |
| ip_address | INET | nullable |
| created_at | TIMESTAMPTZ | NOT NULL |

> Note: no `updated_at` or `deleted_at` — logs are immutable append-only.

Index immediately: `(user_id, created_at DESC)`, `(created_at DESC)`, `(action_type, created_at DESC)`

---

### DB-008 · Migration 007 — Aggregation Stats Tables

**File:** `supabase/migrations/007_stats.sql`

These are **regular tables** populated by scheduled functions (not materialized views — easier to incrementally update).

`daily_user_stats`:

| Column | Type |
|---|---|
| date | DATE PK |
| new_registrations | INTEGER |
| active_users | INTEGER |
| total_sessions | INTEGER |
| updated_at | TIMESTAMPTZ |

`daily_content_stats`:

| Column | Type |
|---|---|
| date | DATE |
| subject_id | UUID FK → subjects |
| lessons_completed | INTEGER |
| quizzes_taken | INTEGER |
| avg_score | NUMERIC(5,2) |
| updated_at | TIMESTAMPTZ |

PK: `(date, subject_id)`

`daily_gamification_stats`:

| Column | Type |
|---|---|
| date | DATE PK |
| points_awarded | INTEGER |
| points_redeemed | INTEGER |
| rewards_redeemed | INTEGER |
| active_leaderboard_users | INTEGER |
| updated_at | TIMESTAMPTZ |

---

### DB-009 · Migration 008 — Postgres Functions

**File:** `supabase/migrations/008_functions.sql`

**Functions to create:**

1. `get_user_role()` — returns current user's role. Define once here before RLS policies reference it.

```sql
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS role
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role
  FROM user_profiles
  WHERE auth_user_id = auth.uid()
    AND deleted_at IS NULL
    AND is_active = true
$$;
```

2. `teacher_can_access_student(p_student_id UUID)` — returns true when the current teacher is assigned to at least one active class where the student is actively enrolled.

3. `compute_leaderboard_snapshot(p_period TEXT, p_date DATE)` — recalculates rankings for a given period, upserts into `leaderboard_snapshots` with `previous_rank` populated from prior snapshot

4. `refresh_daily_stats(p_date DATE)` — aggregates data for a given date and upserts into all three `daily_*_stats` tables

5. `get_cohort_retention(p_cohort_weeks INTEGER)` — returns a matrix of cohort × retention day (1/7/14/30/60/90) as a JSON array, used by backend retention query

6. `flag_churn_risk(p_inactive_days INTEGER)` — returns `user_id`s of previously active users with no activity in the last N days

All functions: `SECURITY DEFINER`, include inline SQL comments, owned by `postgres`, and set an explicit `search_path`.

---

### DB-010 · Migration 009 — RLS Policies

**File:** `supabase/migrations/009_rls.sql`

**Enable RLS on every table** (`ALTER TABLE x ENABLE ROW LEVEL SECURITY`).

**Policy matrix:**

| Table | super_admin | content_manager | teacher | viewer | student |
|---|---|---|---|---|---|
| user_profiles | ALL | SELECT | SELECT (self + assigned students) | SELECT | SELECT self |
| classrooms | ALL | ALL | SELECT assigned classes | SELECT | SELECT enrolled classes |
| teacher_class_assignments | ALL | SELECT | SELECT own assignments | NONE | NONE |
| student_class_enrollments | ALL | SELECT | SELECT assigned students' enrollments | NONE | SELECT own enrollments |
| subjects | ALL | ALL | SELECT | SELECT | SELECT enrolled subjects |
| lessons | ALL | ALL | SELECT | SELECT | SELECT published lessons for enrolled subjects |
| quizzes | ALL | ALL | SELECT | SELECT | SELECT published quizzes for enrolled subjects |
| questions | ALL | ALL | SELECT | SELECT | SELECT questions for accessible quizzes |
| games | ALL | ALL | SELECT | SELECT | SELECT published games for enrolled subjects |
| lesson_completions | ALL | SELECT | SELECT assigned students | NONE | SELECT/INSERT own |
| quiz_attempts | ALL | SELECT | SELECT assigned students | NONE | SELECT/INSERT own |
| question_responses | ALL | SELECT | SELECT assigned students via attempt | NONE | SELECT/INSERT own via attempt |
| game_sessions | ALL | SELECT | SELECT assigned students | NONE | SELECT/INSERT own |
| point_transactions | ALL | SELECT | SELECT assigned students | NONE | SELECT own |
| rewards | ALL | ALL | SELECT | SELECT | SELECT |
| reward_redemptions | ALL | SELECT | SELECT assigned students | NONE | SELECT/INSERT own |
| leaderboard_snapshots | ALL | SELECT | SELECT | SELECT | SELECT |
| activity_logs | ALL | SELECT | SELECT own + assigned student events | NONE | SELECT own |
| daily_user_stats | ALL | SELECT | NONE | NONE | NONE |
| daily_content_stats | ALL | SELECT | SELECT assigned class subjects | NONE | NONE |
| daily_gamification_stats | ALL | SELECT | NONE | NONE | NONE |

Policy naming convention: `{table}_{role}_{operation}` — e.g. `quiz_attempts_teacher_select`

Teacher "assigned students" scope = students actively enrolled in at least one active class assigned to the teacher through `teacher_class_assignments` and `student_class_enrollments`. Teachers must not see students merely because they share a subject.

---

### DB-011 · Migration 010 — Performance Indexes

**File:** `supabase/migrations/010_indexes.sql`

```sql
-- User lookups
CREATE INDEX idx_user_profiles_auth_user   ON user_profiles(auth_user_id);
CREATE INDEX idx_user_profiles_role        ON user_profiles(role);
CREATE INDEX idx_user_profiles_active      ON user_profiles(is_active, created_at DESC);
CREATE INDEX idx_classrooms_subject        ON classrooms(subject_id);
CREATE INDEX idx_teacher_class_teacher     ON teacher_class_assignments(teacher_id, classroom_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_student_class_student     ON student_class_enrollments(student_id, classroom_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_student_class_classroom   ON student_class_enrollments(classroom_id, student_id) WHERE deleted_at IS NULL;

-- Content
CREATE INDEX idx_lessons_subject           ON lessons(subject_id);
CREATE INDEX idx_quizzes_subject           ON quizzes(subject_id);
CREATE INDEX idx_questions_quiz            ON questions(quiz_id);

-- Progress (heaviest query paths)
CREATE INDEX idx_lesson_completions_user_date  ON lesson_completions(user_id, completed_at DESC);
CREATE INDEX idx_lesson_completions_lesson     ON lesson_completions(lesson_id, completed_at DESC);
CREATE INDEX idx_quiz_attempts_user_date       ON quiz_attempts(user_id, completed_at DESC);
CREATE INDEX idx_quiz_attempts_quiz            ON quiz_attempts(quiz_id);
CREATE INDEX idx_question_responses_attempt    ON question_responses(attempt_id);
CREATE INDEX idx_question_responses_question   ON question_responses(question_id, is_correct);

-- Gamification
CREATE INDEX idx_point_transactions_user       ON point_transactions(user_id, created_at DESC);
CREATE INDEX idx_point_transactions_source     ON point_transactions(source_type, created_at DESC);
CREATE INDEX idx_leaderboard_period_rank       ON leaderboard_snapshots(period, snapshot_date DESC, rank ASC);
CREATE INDEX idx_reward_redemptions_user       ON reward_redemptions(user_id, redeemed_at DESC);

-- Logs (frequently filtered)
CREATE INDEX idx_activity_logs_user_date       ON activity_logs(user_id, created_at DESC);
CREATE INDEX idx_activity_logs_date            ON activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_action_date     ON activity_logs(action_type, created_at DESC);
```

---

### DB-012 · Seed Data

**File:** `supabase/seed.sql`

**Contents:**
- 5 subjects: Mathematics, Science, Arabic, English, History
- Per subject: 4 lessons (mix of types), 2 quizzes, 10 questions per quiz, 1 game
- Users: 1 super admin (`admin@eduquest.dev`), 2 content managers, 5 teachers, 100 students (distributed across grades)
- Classes: at least 10 active classrooms across subjects/grades, teacher assignments for every classroom, and student enrollments so each student belongs to 1–3 classes
- 30 days of synthetic activity: lesson completions, quiz attempts with question responses, game sessions, point transactions, reward redemptions, activity logs
- Initial leaderboard snapshots for all three periods
- Daily stats tables populated for all 30 days
- All inserts use `ON CONFLICT DO NOTHING` (idempotent)
- Seed admin password documented in `README.md` only, never hardcoded in source

---

---

# AREA 2 — BACKEND

> Next.js Route Handlers, Supabase query functions, auth layer, middleware, export pipeline.
> All server-side logic. No UI. Consumed by Area 3 (frontend).

---

## Phase 0 · Backend Bootstrap

### BE-001 · Project scaffold and dependencies
- Init Next.js 15 app with App Router, TypeScript strict, Tailwind v4
- Install all dependencies per Constitution §2 stack table
- Configure `tsconfig.json` with `@/*` path alias
- Configure ESLint + Prettier
- Set up `.env.local` from template
- Confirm `next build` exits 0 on empty scaffold

---

### BE-002 · Supabase client helpers
**Files:** `lib/supabase/server.ts`, `lib/supabase/client.ts`, `lib/supabase/middleware.ts`

- `createServerClient` — cookie-based, for Server Components and Route Handlers
- `createBrowserClient` — singleton, for Client Components (realtime + mutations only)
- `createMiddlewareClient` — for `middleware.ts` session refresh
- All three functions are typed and re-export the Supabase client type

---

### BE-003 · Auth middleware
**File:** `middleware.ts`

- Runs on every request matching `/(dashboard)/:path*`
- Refreshes session on every request (Supabase PKCE requirement)
- If no valid session → redirect to `/login`
- If session exists but role insufficient for route → redirect to `/dashboard/overview` with `?error=unauthorized`
- Attaches user role to request headers for downstream use

---

### BE-004 · TypeScript types
**Files:** `lib/types/database.ts`, `lib/types/index.ts`

- `database.ts`: generated via `supabase gen types typescript --local`
- `index.ts` exports domain types:
  - `UserProfile`, `UserRole`, `UserWithStats`
  - `Classroom`, `TeacherClassAssignment`, `StudentClassEnrollment`
  - `Subject`, `Lesson`, `Quiz`, `Question`, `Game`
  - `LessonCompletion`, `QuizAttempt`, `QuestionResponse`
  - `PointTransaction`, `Reward`, `RewardRedemption`, `LeaderboardEntry`
  - `ActivityLog`
  - `DateRange`, `PaginatedResult<T>`, `ReportFilter`
  - `KpiSnapshot`, `UserGrowthPoint`, `SubjectEngagement`
  - `CohortRetentionMatrix`, `ContentFunnelStep`, `QuestionDifficulty`

---

### BE-005 · GitHub Actions CI
**File:** `.github/workflows/ci.yml`

- Trigger: every PR to `main`
- Steps: `npm ci` → `tsc --noEmit` → `eslint .` → `next build`
- Railway auto-deploys `main` via native Next.js buildpack (no Dockerfile)
- Comment in file: `# FUTURE: Add Dockerfile for multi-service or custom runtime needs`

---

## Phase 2 · Backend Core Queries

### BE-006 · Overview queries
**File:** `lib/queries/overview.ts`

Functions:
- `getKpiSnapshot(dateRange: DateRange): Promise<KpiSnapshot>` — total users, active today, lessons completed today, points awarded today. Reads from `daily_user_stats` + live counts for "today".
- `getUserGrowthSeries(dateRange: DateRange, granularity: 'daily'|'weekly'|'monthly'): Promise<UserGrowthPoint[]>` — new registrations per period
- `getTopSubjects(dateRange: DateRange, limit: number): Promise<SubjectEngagement[]>` — top N subjects ranked by engagement score
- All functions: server-side only, use `createServerClient`, return typed results, throw typed errors

---

### BE-007 · User queries
**File:** `lib/queries/users.ts`

Functions:
- `getUsers(params: UserListParams): Promise<PaginatedResult<UserWithStats>>` — paginated, filterable (role, grade, status, search), sortable (name, last_active, total_points)
- `getUserById(id: string): Promise<UserProfile>` — single user with full stats
- `getUserActivityTimeline(userId: string, limit: number): Promise<ActivityLog[]>`
- `getUserQuizHistory(userId: string, params: PaginationParams): Promise<PaginatedResult<QuizAttempt>>`
- `getUserLessonHistory(userId: string, params: PaginationParams): Promise<PaginatedResult<LessonCompletion>>`
- `getUserPointsHistory(userId: string, dateRange: DateRange): Promise<PointTransaction[]>`

---

### BE-008 · User growth & retention queries
**File:** `lib/queries/user-growth.ts`

Functions:
- `getRegistrationTrend(dateRange, granularity)` — wraps `getUserGrowthSeries` with additional cohort data
- `getCohortRetention(cohortWeeks: number): Promise<CohortRetentionMatrix>` — calls `get_cohort_retention()` Postgres function
- `getRoleDistribution(): Promise<Record<UserRole, number>>`
- `getChurnRiskUsers(inactiveDays: number, limit: number): Promise<UserProfile[]>` — calls `flag_churn_risk()` Postgres function

---

### BE-009 · Content queries
**File:** `lib/queries/content.ts`

Functions:
- `getSubjectOverview(): Promise<SubjectSummary[]>` — per subject: lesson count, quiz count, avg completion rate, avg score
- `getSubjectScoreMatrix(dateRange: DateRange): Promise<SubjectScoreCell[][]>` — subject × week matrix for heatmap
- `getCompletionFunnel(subjectId?: string): Promise<ContentFunnelStep[]>` — started/completed/passed counts
- `getHardestQuestions(params): Promise<QuestionDifficulty[]>` — sorted by error rate
- `getLessonEngagementScores(): Promise<LessonEngagement[]>` — per lesson 0–100 score
- `getDropoffData(lessonId: string): Promise<DropoffPoint[]>` — % drop-off per lesson segment

---

### BE-010 · Gamification queries
**File:** `lib/queries/gamification.ts`

Functions:
- `getLeaderboard(period, limit): Promise<LeaderboardEntry[]>` — with rank change from previous snapshot
- `getPointsTimeline(dateRange): Promise<PointsTimelinePoint[]>` — awarded vs redeemed per day
- `getTopEarners(period, limit): Promise<UserWithPoints[]>`
- `getPointsBySource(dateRange): Promise<PointsBySource[]>` — breakdown by source_type
- `getRewardStats(dateRange): Promise<RewardStat[]>` — redemptions per reward + trend
- `getEngagementFunnel(): Promise<GamificationFunnelStep[]>` — earned → checked → redeemed

---

### BE-011 · Activity log queries
**File:** `lib/queries/activity-logs.ts`

Functions:
- `getActivityLogs(params: ActivityLogParams): Promise<PaginatedResult<ActivityLog>>` — filterable by user, action_type[], date range; paginated 25/page
- `logAction(entry: ActivityLogInsert): Promise<void>` — internal utility used by all Route Handlers to write to `activity_logs`

---

## Phase 2 · Backend Core — API Routes

### BE-012 · Auth login/logout actions
**Files:** `app/(auth)/login/actions.ts`

- `loginAction(formData)` — calls Supabase Auth `signInWithPassword`, sets session cookie, redirects to `/dashboard/overview`
- `logoutAction()` — calls `signOut`, clears cookie, redirects to `/login`
- Both are Next.js Server Actions (not Route Handlers)

---

## Phase 4 · Backend Features — Export Pipeline

### BE-013 · Report preview API
**File:** `app/api/reports/preview/route.ts`

- `POST` — body: `{ reportType, dateRange, filters }`
- Validates session + role (must be `content_manager` or `super_admin`)
- Calls appropriate query function, returns first 50 rows as `{ columns: string[], rows: Record<string, unknown>[] }`
- Returns `400` for unknown report types, `403` for insufficient role
- Logs preview action to `activity_logs`

**Supported report types:**
1. `user_growth` — from `getUserGrowthSeries`
2. `learning_performance` — from `getSubjectOverview` + `getCompletionFunnel`
3. `gamification_summary` — from `getPointsTimeline` + `getRewardStats`
4. `activity_log` — from `getActivityLogs`
5. `question_difficulty` — from `getHardestQuestions`

---

### BE-014 · CSV export Route Handler
**File:** `app/api/reports/export/route.ts` (CSV branch)

- `GET` with query params: `reportType`, `format=csv`, `from`, `to`, plus report-specific filters
- Validates session + role
- Streams full dataset via `ReadableStream` — no row limit
- Response headers: `Content-Type: text/csv; charset=utf-8`, `Content-Disposition: attachment; filename="eduquest-{type}-{date}.csv"`
- UTF-8 with BOM for Excel compatibility
- Dates in ISO 8601, numbers unformatted
- Logs export to `activity_logs` with `action_type: 'export_csv'`

---

### BE-015 · PDF export Route Handler
**File:** `app/api/reports/export/route.ts` (PDF branch) + `lib/pdf/ReportTemplate.tsx`

- `GET` with `format=pdf`
- Validates session + role
- Enforces 500-row max — returns `400` with `{ error: 'Use CSV for datasets over 500 rows' }` if exceeded
- Generates PDF server-side using `@react-pdf/renderer`
- PDF includes: EduQuest logo placeholder, report title, date range, generated-by user email, generated-at timestamp (UTC)
- Response headers: `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="eduquest-{type}-{date}.pdf"`
- Logs export to `activity_logs` with `action_type: 'export_pdf'`

---

## Phase 4 · Backend Features — Admin API Routes

### BE-016 · Admin user management routes
**Files:** `app/api/admin/invite/route.ts`, `app/api/admin/roles/route.ts`, `app/api/users/[id]/deactivate/route.ts`

- `POST /api/admin/invite` — calls Supabase Auth `admin.inviteUserByEmail`, inserts `user_profiles` row with given role. Super Admin only.
- `PATCH /api/admin/roles` — body: `{ userId, newRole }`. Updates `user_profiles.role`. Super Admin only.
- `POST /api/users/[id]/deactivate` — sets `is_active = false`, calls `auth.admin.signOut(userId)` to revoke active session. Super Admin only.
- All three routes: validate session, assert `super_admin` role, log to `activity_logs`.

---

### BE-017 · Vault / API key management route
**File:** `app/api/admin/vault/route.ts`

- `GET` — returns list of key names (not values) stored in Supabase Vault. Super Admin only.
- `GET ?reveal=true&key=name` — returns masked value (first 8 chars + `••••••••`). Super Admin only.
- `POST` with `{ keyName }` — generates new UUID secret, stores in Vault, logs rotation event. Super Admin only.
- Uses `SUPABASE_SERVICE_ROLE_KEY` (server-only env var) to access Vault via management API.

---

### BE-018 · Realtime server configuration
**Files:** Supabase Realtime settings, RLS policies for `activity_logs` and `leaderboard_snapshots`

- Confirm Realtime is enabled for `activity_logs` INSERT events and `leaderboard_snapshots` changes
- Confirm Realtime payloads respect RLS for each role
- Document channel names and filters consumed by frontend hooks
- Add integration notes for presence channel `admin-presence`
# AREA 3 — FRONTEND

> All UI: pages, components, charts, forms, layouts.
> Built with Antigravity (Gemini). Consumes Area 2 query functions and hooks.
> Can be built with mock data first, then wired to live backend.

---

## Phase 0 · Frontend Bootstrap

### FE-001 · App shell and routing structure
**Files:** `app/layout.tsx`, `app/(auth)/layout.tsx`, `app/(dashboard)/layout.tsx`

- Root layout: font (Inter or Geist), global CSS, metadata (`title: 'EduQuest Admin'`)
- Auth layout: centered card, no sidebar
- Dashboard layout: two-column (sidebar + main), top header strip

---

### FE-002 · Sidebar navigation
**File:** `components/shared/Sidebar.tsx`

Nav items and their routes:

| Label | Route | Icon | Role visibility |
|---|---|---|---|
| Overview | `/dashboard/overview` | LayoutDashboard | All |
| Users | `/dashboard/users` | Users | All |
| Content | `/dashboard/content` | BookOpen | All |
| Gamification | `/dashboard/gamification` | Trophy | All |
| Reports | `/dashboard/reports` | FileText | super_admin, content_manager |
| Activity Logs | `/dashboard/activity-logs` | ScrollText | super_admin, content_manager |
| Settings | `/dashboard/settings` | Settings | super_admin only |

Behaviour:
- Active route highlighted
- Collapsible to icon-only at ≤ 1280px
- Hidden with hamburger toggle at ≤ 768px
- Bottom: user avatar, display name, role badge, logout button

---

### FE-003 · Top header
**File:** `components/shared/Header.tsx`

- Left: hamburger (mobile) + page title (dynamic, from route)
- Right: global date range picker + user avatar dropdown (profile link, logout)
- Date range picker state synced to URL search params (`?from=&to=`)
- Presets: Last 7 days, Last 30 days, Last 90 days, Last year, Custom

---

### FE-004 · Login page
**File:** `app/(auth)/login/page.tsx`

- EduQuest logo + "Admin Dashboard" subtitle
- Email + password fields
- Submit calls `loginAction` server action
- Inline error on invalid credentials (no page reload)
- Loading state on submit button
- No "forgot password" in v1 (Super Admin resets via Supabase dashboard)

---

### FE-005 · Shared UI primitives
**Files:** `components/shared/KpiCard.tsx`, `components/shared/DateRangePicker.tsx`, `components/shared/DataTable.tsx`, `components/shared/PageHeader.tsx`, `components/shared/EmptyState.tsx`, `components/shared/ErrorBoundary.tsx`

**KpiCard:**
- Props: `label`, `value`, `trend?: { direction: 'up'|'down'|'flat', percent: number }`, `icon`, `isLoading`
- Skeleton pulse on `isLoading`
- Trend arrow: green ↑ / red ↓ / gray —
- ARIA: `role="region"`, `aria-label` includes label + value

**DataTable:**
- Wraps TanStack Table + TanStack Virtual
- Props: `columns`, `data`, `isLoading`, `pagination`, `onPageChange`
- Skeleton rows on `isLoading`
- Empty state slot

**PageHeader:**
- Title + optional subtitle + optional action button slot

**EmptyState:**
- Icon + heading + description + optional CTA button

**ErrorBoundary:**
- Wraps sections; shows "Something went wrong" card with retry button

---

### FE-006A · Realtime subscription hooks
**File:** `lib/hooks/useRealtimeSubscription.ts`, `lib/hooks/useLeaderboard.ts`, `lib/hooks/useActivityFeed.ts`, `lib/hooks/useActiveUsers.ts`

- `useRealtimeSubscription` — generic Client Component hook: takes table name, filter, callback. Manages subscribe/unsubscribe lifecycle.
- `useLeaderboard(period)` — subscribes to `leaderboard_snapshots` for given period. Returns `{ data, isLoading }`. Re-subscribes on period change.
- `useActivityFeed(limit)` — subscribes to `activity_logs` INSERT. Prepends new events, caps at `limit`. Returns `{ events }`.
- `useActiveUsers()` — joins Supabase Realtime presence channel `admin-presence`. Returns `{ count }`.
- All hooks: unsubscribe on unmount, handle connection errors gracefully (return stale data, not empty).

---

## Phase 3 · Frontend Core — Overview Dashboard

### FE-006 · Overview page
**File:** `app/(dashboard)/overview/page.tsx`

Layout (desktop): 4 KPI cards across top → 2-column below (growth chart left, top subjects bar right) → 3-column below (active users counter, live leaderboard, activity feed)

- Server Component: fetches KPI snapshot + growth series + top subjects
- Each section in its own `<Suspense>` with matching skeleton
- Date range filter (from URL params) passed to all server-fetched sections
- Realtime sections (active users, leaderboard, feed) are Client Components

---

### FE-007 · User Growth Chart
**File:** `components/charts/UserGrowthChart.tsx`

- Recharts `AreaChart`, `ResponsiveContainer`
- Toggle tabs: Daily / Weekly / Monthly (re-fetches with `granularity` param)
- X-axis: formatted date labels (adaptive: "Jan 5" for daily, "Week of Jan 5" for weekly)
- Y-axis: integer count, no decimals
- Tooltip: date + count formatted
- Gradient fill under line
- Skeleton while loading

---

### FE-008 · Subject Engagement Bar Chart
**File:** `components/charts/SubjectEngagementBar.tsx`

- Recharts `BarChart`, horizontal orientation
- Top 5 subjects, sorted descending by engagement score
- Each bar coloured by subject's `color_hex`
- Score label at end of each bar
- Skeleton while loading

---

### FE-009 · Realtime widgets
**Files:** `components/realtime/ActiveUsersCounter.tsx`, `components/realtime/LiveLeaderboard.tsx`, `components/realtime/ActivityFeed.tsx`

**ActiveUsersCounter:**
- Uses `useActiveUsers()` hook
- Pulsing green dot + count + "admins online"
- Fallback: "–" on connection error

**LiveLeaderboard:**
- Uses `useLeaderboard('weekly')` hook
- Top 10 rows: rank, rank change badge (↑ green / ↓ red / — gray), avatar, name, points
- Brief colour flash on rank change (CSS transition)
- "View full leaderboard →" link

**ActivityFeed:**
- Uses `useActivityFeed(20)` hook
- Each item: coloured action-type icon, user name, action description, relative timestamp ("2m ago")
- Slide-in animation on new event prepend

---

## Phase 3 · Frontend Core — Users Module

### FE-010 · Users section layout
**File:** `app/(dashboard)/users/layout.tsx`

- Secondary tab nav: User List | Growth & Retention
- Teachers see "User List" only (scoped to students assigned to their classes)

---

### FE-011 · User list page
**File:** `app/(dashboard)/users/page.tsx`

- Filter bar: search input (debounced 300ms), role multiselect, grade select, status toggle (active/inactive)
- Filters sync to URL params
- Uses `DataTable` component
- Columns: avatar + name, role badge, grade, last active (relative), total points, status pill, actions menu
- Actions menu: "View profile", "Deactivate" (with confirmation dialog, super_admin only)
- Server-side pagination: 25/page
- Sort on: name, last active, total points (column header click)

---

### FE-012 · User growth & retention page
**File:** `app/(dashboard)/users/growth/page.tsx`

Four sections:
1. **Registration Trend** — `UserGrowthChart` (reused)
2. **Cohort Retention Heatmap** — custom SVG grid component (see FE-013)
3. **Role Distribution** — Recharts PieChart with legend and label percentages
4. **Churn Risk** — table of flagged users: name, last active date, days inactive, "Send re-engagement" action placeholder

---

### FE-013 · Cohort Retention Heatmap
**File:** `components/charts/RetentionHeatmap.tsx`

- Custom SVG grid: rows = cohort weeks (Y axis), columns = Day 1 / 7 / 14 / 30 / 60 / 90 (X axis)
- Cell colour: 0% = `#f0f9ff` (lightest), 100% = `#0369a1` (darkest) — uses subject-safe teal scale
- Tooltip on hover: cohort week, retention day, exact %
- Colour scale legend bar below grid
- ARIA: `role="img"`, `aria-label` describes the heatmap purpose; each cell has `aria-label`

---

### FE-014 · User detail page
**File:** `app/(dashboard)/users/[id]/page.tsx`

- Page header: avatar, name, role badge, status pill, "Deactivate" button (super_admin only)
- Stats row: 4 KpiCards — Lessons Completed, Quizzes Passed, Total Points, Rewards Redeemed
- Tab panel:
  - **Overview** — weekly points trend line chart (last 12 weeks)
  - **Quiz History** — paginated table: quiz name, subject, score, passed badge, date
  - **Lesson History** — paginated table: lesson title, subject, time spent, score, date
  - **Points & Rewards** — timeline of point transactions + redemptions
  - **Activity Log** — last 50 actions by this user

---

## Phase 5 · Frontend Features — Content Module

### FE-015 · Content overview page
**File:** `app/(dashboard)/content/page.tsx`

- Subject filter dropdown (affects all sections)
- **Subject cards grid** — 3/2/1 columns (desktop/tablet/mobile): icon (from `icon_url`), subject name, lesson count, quiz count, avg completion rate (progress ring), avg score badge
- **Content status table** below grid: all lessons + quizzes with columns: title, type badge, subject, status (published/draft), completions, avg score
- Table filterable by type, status; sortable by completions, avg score

---

### FE-016 · Content performance analytics page
**File:** `app/(dashboard)/content/performance/page.tsx`

Four charts:
1. **Subject Score Heatmap** — same pattern as RetentionHeatmap, subject × week, colour by avg score
2. **Completion Funnel** — Recharts FunnelChart or vertical stepped bar: Started → Completed → Passed, per selected subject
3. **Lesson Engagement Scores** — horizontal bar chart per lesson, colour-coded tier: green ≥ 70, amber 40–69, red < 40
4. **Drop-off Points** — area chart showing % of users remaining at each lesson segment (0–100% Y axis, segment index X axis)

---

### FE-017 · Question difficulty analysis page
**File:** `app/(dashboard)/content/questions/page.tsx`

- **Hardest Questions panel** — top 10 questions by error rate, displayed as ranked cards: rank number, question excerpt (truncated), quiz name, error rate % (bold, coloured red if > 60%)
- **Full question table** — columns: question excerpt, quiz, subject, error rate %, avg response time (ms), skip rate %, difficulty score. Sort by error rate (default). 50/page. Subject + quiz filter dropdowns.

---

## Phase 5 · Frontend Features — Gamification Module

### FE-018 · Gamification hub page
**File:** `app/(dashboard)/gamification/page.tsx`

- Four navigation cards linking to sub-sections: Leaderboard, Points Economy, Rewards, Engagement Funnel
- Each card shows a top-line metric (current #1 user, total points this week, top reward, funnel conversion %)

---

### FE-019 · Realtime leaderboard page
**File:** `app/(dashboard)/gamification/leaderboard/page.tsx`

- Period tabs: Daily | Weekly | All Time
- Full top-50 table: rank, rank change indicator (animated), avatar, display name, total points, points change vs previous period
- Rank change: green ↑ badge / red ↓ badge / gray — for no change. Brief glow animation on update.
- "Last updated" timestamp (from latest snapshot_date)
- Switching period tab re-subscribes realtime channel

---

### FE-020 · Points economy page
**File:** `app/(dashboard)/gamification/economy/page.tsx`

- Date range filter (from URL params)
- **Stacked Area Chart** — points awarded (solid fill) vs points redeemed (hatched/lighter fill), Recharts AreaChart
- **Top 10 Earners** table — rank, avatar, name, points earned in period, source breakdown mini-bar
- **Points by Source** — Recharts PieChart: quiz / lesson / game / reward / manual
- **Inflation Metric** — line chart: avg points per active user per day over time

---

### FE-021 · Rewards analytics page
**File:** `app/(dashboard)/gamification/rewards/page.tsx`

- **Redemptions by Reward** — horizontal bar chart, sorted by redemptions desc
- **Popularity cards** — top 3 rewards (green cards) + bottom 3 rewards (amber cards): reward name, image, redemption count, point cost
- **Redemptions over time** — line chart per reward (top 5 only, others grouped as "Other")

---

## Phase 5 · Frontend Features — Reports & Logs

### FE-022 · Report builder page
**File:** `app/(dashboard)/reports/page.tsx`, `components/reports/ReportBuilder.tsx`

**Report Builder component:**
- Step 1: Report type selector (5 types in styled cards with icon + description)
- Step 2: Date range picker
- Step 3: Dynamic secondary filters (rendered per type — e.g. subject dropdown for learning performance, role filter for user growth)
- "Preview" button → calls `POST /api/reports/preview` → renders preview table (columns + first 50 rows) below builder
- "Export CSV" → `GET /api/reports/export?format=csv&...` → browser download
- "Export PDF" → `GET /api/reports/export?format=pdf&...` → browser download
- Loading spinners on all async actions
- Inline error display if API fails

---

### FE-023 · Activity logs page
**File:** `app/(dashboard)/activity-logs/page.tsx`

- Filter bar: user search (debounced), action type multiselect (all known action_types listed), date range picker
- Filters sync to URL params
- Table: user avatar + name, action type badge (colour-coded), entity type, entity ID (truncated UUID), timestamp (full on hover), IP address
- Expandable row: renders `metadata` JSONB as syntax-highlighted JSON block
- "Export CSV" button (calls export API with `type=activity_logs` and current filters)
- Pagination: 25/page

---

## Phase 5 · Frontend Features — Settings Module

### FE-024 · Settings layout and navigation
**File:** `app/(dashboard)/settings/layout.tsx`

- Left sidebar sub-nav (within settings): Admin Users, Notifications, Data Retention, API Keys
- Super Admin gate: any non-super_admin visiting `/settings/*` is redirected to `/dashboard/overview`

---

### FE-025 · Admin users management page
**File:** `app/(dashboard)/settings/users/page.tsx`

- **Invite form**: email input + role selector → calls `POST /api/admin/invite` → success toast
- **Admin users table**: avatar, name, email, role badge (editable dropdown), status, "Deactivate" button
- Role dropdown change → calls `PATCH /api/admin/roles` with optimistic UI update
- Deactivate → confirmation dialog → calls `POST /api/users/[id]/deactivate`
- All actions show toast notifications (success / error)

---

### FE-026 · API keys page
**File:** `app/(dashboard)/settings/api-keys/page.tsx`

- List of key names from Vault (no values shown by default)
- "Reveal" button per key → calls GET with `?reveal=true` → shows masked value (e.g. `sk_live_a3f9••••••••`) in a monospace input
- "Rotate" button → confirmation dialog → calls POST to rotate → updates display
- Warning banner: "Rotating a key immediately invalidates the old one"
# Phase 6 · Integration

### INT-001 · Wire frontend to live backend queries
- Replace all mock data in Area 3 pages with real calls to Area 2 query functions
- Confirm all TypeScript types align between `lib/queries/*.ts` and component props
- Test all date range filter URL param flows end-to-end
- Test all realtime subscriptions with live Supabase connection

---

### INT-002 · Realtime end-to-end validation
- Trigger a quiz completion in seed data → confirm activity feed updates within 3 seconds
- Trigger a leaderboard recalculation → confirm leaderboard widget animates rank changes
- Open two browser sessions → confirm active user count increments/decrements correctly

---

### INT-003 · Export pipeline end-to-end validation
- Test CSV export for all 5 report types: confirm download, valid UTF-8 BOM, correct headers, correct data
- Test PDF export: confirm layout, logo placeholder, date range, generated-by metadata
- Test 500-row PDF limit: seed > 500 rows and confirm `400` response with correct error message
- Confirm `activity_logs` entries created for every export action

---

### INT-004 · RBAC end-to-end validation
- Log in as each admin/dashboard role (super_admin, content_manager, teacher, viewer) and validate student RLS with a student session token
- Confirm sidebar items match permissions matrix from Constitution
- Confirm Route Handlers return 403 for out-of-role requests
- Confirm RLS blocks direct Supabase client queries for out-of-scope data
- Teacher: confirm they cannot see other teachers' students in any query

---

# Phase 7 · Hardening

### HARD-001 · Performance audit
- Add `React.Suspense` + skeleton to every chart and table section (audit all pages)
- Run `next/bundle-analyzer`; target: no chunk > 500 kB
- Run `EXPLAIN ANALYZE` on the 5 slowest queries; document in `PERFORMANCE.md`
- Confirm aggregation/stats refresh function is scheduled (pg_cron or Edge Function cron)
- Measure Overview page Lighthouse LCP on production Railway URL; target < 2.5s
- Add `next/dynamic` lazy loading for heavy chart components (Recharts bundles)

---

### HARD-002 · Accessibility audit
- Run `axe-core` against: Overview, Users list, User detail, Content performance, Leaderboard, Reports, Activity logs
- Fix all critical + serious violations before sign-off
- Keyboard navigation walkthrough: Tab through all interactive elements on Overview page
- Verify colour contrast: all chart colours, all badge variants, all status pills meet WCAG AA (4.5:1)
- Document audit results and sign-off in `ACCESSIBILITY.md`

---

### HARD-003 · Security hardening
- Audit all Route Handlers: confirm every one validates session + role before touching data
- Confirm `SUPABASE_SERVICE_ROLE_KEY` is never referenced in any `NEXT_PUBLIC_*` variable or client-side code
- Confirm no raw SQL is constructed via string interpolation (must use parameterized queries or Supabase client methods)
- Review all RLS policies with a DBA-style read: attempt to construct a query that bypasses each policy
- Confirm Vault keys are never logged in `activity_logs` metadata

---

### HARD-004 · Final README and developer docs
**File:** `README.md`

Sections:
- Project overview (one paragraph)
- Architecture diagram reference (link to this plan)
- Local dev setup: `npm install` → `supabase start` → `supabase db reset` → `npm run dev`
- Environment variables: table of all vars, what they do, where to get them
- Running migrations: `supabase db push` or `supabase db reset`
- Running seed: `psql ... < supabase/seed.sql`
- Deployment: Railway auto-deploys `main`; set env vars in Railway dashboard
- AI tooling: which tool covers which area
- Seed admin credentials (never commit actual password; document pattern only)

---

## Summary Counts

| Area | Items | Phases covered |
|---|---|---|
| Database | 12 items (DB-001 → DB-012) | 0, 1 |
| Backend | 18 items (BE-001 → BE-018) | 0, 2, 4 |
| Frontend | 27 items (FE-001 → FE-026 + FE-006A) | 0, 3, 5 |
| Integration | 4 items (INT-001 → INT-004) | 6 |
| Hardening | 4 items (HARD-001 → HARD-004) | 7 |
| **Total** | **65 items** | |

---

*Implementation Plan v1.0 — EduQuest — aligned with 00_CONSTITUTION.md*
*Next step: extract Area 1, Area 2, Area 3 into individual specification documents.*
