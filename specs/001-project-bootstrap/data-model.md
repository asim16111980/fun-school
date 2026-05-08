# Data Model: Project Bootstrap

## Core Entities

### 1. Supabase Project
- **Fields**:
  - `id UUID DEFAULT gen_random_uuid() PRIMARY KEY`
  - `name TEXT NOT NULL`
  - `url TEXT NOT NULL`
  - `anon_key TEXT NOT NULL`
  - `service_role_key TEXT NOT NULL`
  - `created_at TIMESTAMPTZ DEFAULT NOW()`
  - `updated_at TIMESTAMPTZ DEFAULT NOW()`
  - `deleted_at TIMESTAMPTZ`
- **Relationships**: 
  - One-to-many with Database Tables
- **Validation**: URL must be valid Supabase URL format

### 2. Next.js Application
- **Fields**:
  - `id UUID DEFAULT gen_random_uuid() PRIMARY KEY`
  - `name TEXT NOT NULL`
  - `version TEXT NOT NULL`
  - `type TEXT NOT NULL ('app' | 'package')`
  - `created_at TIMESTAMPTZ DEFAULT NOW()`
  - `updated_at TIMESTAMPTZ DEFAULT NOW()`
  - `deleted_at TIMESTAMPTZ`
- **Relationships**:
  - One-to-many with Application Components
- **Validation**: Version must be semantic version

### 3. User Profile
- **Fields**:
  - `id UUID DEFAULT gen_random_uuid() PRIMARY KEY`
  - `auth_id UUID REFERENCES auth.users(id)`
  - `email TEXT NOT NULL UNIQUE`
  - `role TEXT NOT NULL DEFAULT 'viewer'`
  - `first_name TEXT`
  - `last_name TEXT`
  - `avatar_url TEXT`
  - `created_at TIMESTAMPTZ DEFAULT NOW()`
  - `updated_at TIMESTAMPTZ DEFAULT NOW()`
  - `deleted_at TIMESTAMPTZ`
- **Relationships**:
  - One-to-many with User Sessions
- **Validation**: Role must be one of: super_admin, content_manager, teacher, viewer

### 4. Environment Configuration
- **Fields**:
  - `id UUID DEFAULT gen_random_uuid() PRIMARY KEY`
  - `name TEXT NOT NULL UNIQUE`
  - `value TEXT NOT NULL`
  - `is_public BOOLEAN DEFAULT false`
  - `description TEXT`
  - `created_at TIMESTAMPTZ DEFAULT NOW()`
  - `updated_at TIMESTAMPTZ DEFAULT NOW()`
  - `deleted_at TIMESTAMPTZ`
- **Relationships**:
  - Many-to-one with Next.js Application
- **Validation**: Name must be SCREAMING_SNAKE_CASE

### 5. Database Table
- **Fields**:
  - `id UUID DEFAULT gen_random_uuid() PRIMARY KEY`
  - `name TEXT NOT NULL UNIQUE`
  - `schema TEXT NOT NULL`
  - `rls_enabled BOOLEAN DEFAULT false`
  - `realtime_enabled BOOLEAN DEFAULT false`
  - `migration_number INTEGER`
  - `created_at TIMESTAMPTZ DEFAULT NOW()`
  - `updated_at TIMESTAMPTZ DEFAULT NOW()`
  - `deleted_at TIMESTAMPTZ`
- **Relationships**:
  - Many-to-one with Supabase Project
- **Validation**: Name must be snake_case plural

### 6. Migration File
- **Fields**:
  - `id UUID DEFAULT gen_random_uuid() PRIMARY KEY`
  - `filename TEXT NOT NULL UNIQUE`
  - `version TEXT NOT NULL`
  - `hash TEXT NOT NULL`
  - `content TEXT NOT NULL`
  - `applied_at TIMESTAMPTZ`
  - `created_at TIMESTAMPTZ DEFAULT NOW()`
  - `updated_at TIMESTAMPTZ DEFAULT NOW()`
- **Relationships**:
  - Many-to-one with Supabase Project
- **Validation**: Filename must follow YYYYMMDDHHMMSS format

### 7. Activity Log
- **Fields**:
  - `id UUID DEFAULT gen_random_uuid() PRIMARY KEY`
  - `user_id UUID REFERENCES auth.users(id)`
  - `action TEXT NOT NULL`
  - `entity_type TEXT NOT NULL`
  - `entity_id UUID`
  - `metadata JSONB`
  - `created_at TIMESTAMPTZ DEFAULT NOW()`
- **Relationships**:
  - Many-to-one with User Profile
- **Validation**: Action must be predefined event type

### 8. Leaderboard Snapshot
- **Fields**:
  - `id UUID DEFAULT gen_random_uuid() PRIMARY KEY`
  - `period TEXT NOT NULL`
  - `rankings JSONB NOT NULL`
  - `generated_at TIMESTAMPTZ DEFAULT NOW()`
- **Validation**: Period must be daily, weekly, monthly, or all_time

## Database Schema Requirements

### Mandatory Fields per Table
Every table MUST have:
- `id UUID DEFAULT gen_random_uuid() PRIMARY KEY`
- `created_at TIMESTAMPTZ DEFAULT NOW()`
- `updated_at TIMESTAMPTZ DEFAULT NOW()`
- `deleted_at TIMESTAMPTZ` (soft deletes only)

### RLS Policy
- All tables have RLS enabled by default
- Default policy: DENY all access
- Explicit policies created per role in migrations

### Realtime Configuration
- Only specific tables enabled for Realtime:
  - `activity_logs` - for live activity feed
  - `leaderboard_snapshots` - for live leaderboard updates
- Channels scoped per session with proper cleanup

### Index Strategy
- Indexes on all foreign keys
- Indexes on frequently queried columns
- Composite indexes for common query patterns