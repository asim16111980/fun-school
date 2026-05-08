# Research: Project Bootstrap

## Research Tasks Completed

### 1. Database Architecture Research
**Decision**: Use Supabase as the primary database
**Rationale**: Specified in requirements (FR-001) and constitution (Core Stack §2)
**Alternatives**: PostgreSQL self-hosted, PlanetScale, Firebase
- Supabase chosen for managed service, Auth integration, and Realtime capabilities
- Constitution mandates Supabase for the EduQuest platform

### 2. Next.js Framework Research
**Decision**: Next.js 15 with App Router and TypeScript strict mode
**Rationale**: Specified in requirements (FR-005) and constitution (Core Stack §1)
**Alternatives**: Nuxt.js, Remix, Vite with React
- App Router required for server components and route handlers
- TypeScript strict mode mandated by constitution for type safety

### 3. Authentication Flow Research
**Decision**: Supabase Auth with email/password and PKCE flow
**Rationale**: Specified in requirements (FR-004) and constitution (Defense-in-Depth §II)
**Alternatives**: Custom JWT, Auth0, Clerk
- PKCE flow required for security
- Email/password only method specified in requirements
- Must integrate with middleware.ts for route protection

### 4. Development Dependencies Research
**Decision**: Install stack from Constitution §2 table
**Rationale**: Constitution mandates specific technology stack
**Dependencies to install**:
- @supabase/supabase-js v2
- next-auth (not needed - using Supabase Auth directly)
- @types/node, @types/react, @types/react-dom
- tailwindcss, postcss, autoprefixer
- eslint, eslint-config-next, prettier
-typescript

### 5. CI/CD Pipeline Research
**Decision**: GitHub Actions for PR validation, Railway for deployment
**Rationale**: Specified in requirements (FR-012, FR-013)
**Alternatives**: Vercel, Netlify, CircleCI
- GitHub Actions integrated with GitHub repository
- Railway provides native Next.js deployment
- PR triggers must run: npm ci, tsc, eslint, next build

### 6. Environment Variables Research
**Decision**: Use .env.local with validation
**Rationale**: Specified in requirements (FR-017, FR-018)
**Variables needed**:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- SUPABASE_JWT_SECRET

### 7. Project Structure Research
**Decision**: Follow repository layout from Constitution
**Rationale**: Constitution defines standard structure for EduQuest platform
**Structure**:
```
eduquest/
├── app/
│   ├── (auth)/
│   ├── (dashboard)/
│   ├── api/
│   └── layout.tsx
├── components/
│   ├── ui/
│   ├── charts/
│   ├── tables/
│   └── shared/
├── lib/
│   ├── supabase/
│   ├── queries/
│   ├── utils/
│   └── types/
├── supabase/
│   ├── migrations/
│   ├── seed.sql
│   └── functions/
├── middleware.ts
└── .env.local
```

### 8. Performance Targets Research
**Decision**: Standard targets per clarifications
**Rationale**: Clarified in spec (Performance targets)
**Targets**:
- Page loads < 2 seconds
- API responses < 500ms
- All routes must load within performance targets

### 9. Realtime Configuration Research
**Decision**: Enable Realtime for specific tables only
**Rationale**: Specified in requirements (FR-003) and Constitution (Scoped Realtime §IV)
**Tables to enable**: activity_logs, leaderboard_snapshots
- Must be scoped per-session and unsubscribed on unmount

### 10. RLS Configuration Research
**Decision**: Enable RLS with default deny policy
**Rationale**: Specified in requirements (FR-002) and Constitution (Migration-Governed §III)
**Implementation**:
- Enable RLS globally on project creation
- All tables default to deny policy
- Row-level security enforced at database level