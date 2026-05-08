# Quick Start: Project Bootstrap

## Prerequisites

1. Node.js 18+ installed
2. npm or yarn package manager
3. Supabase CLI installed (`npm install -g supabase`)
4. Railway account with project access
5. GitHub repository initialized

## Setup Instructions

### 1. Database Setup

```bash
# Create new Supabase project
supabase new

# Link to existing project
supabase link --project-ref fjgsgtiivtuwhpmojflg

# Run migrations
supabase db push

# Enable RLS globally
supabase db reset

# Enable Realtime for specific tables
supabase realtime set activity_logs
supabase realtime set leaderboard_snapshots
```

### 2. Backend Setup

```bash
# Initialize Next.js project
npx create-next-app@latest eduquest --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Install dependencies
npm install @supabase/supabase-js

# Create environment file
cp .env.local.example .env.local
```

### 3. Frontend Setup

```bash
# Install Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Configure paths in tailwind.config.js
content: [
  './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
  './src/components/**/*.{js,ts,jsx,tsx,mdx}',
]

# Create global CSS
mkdir -p src/app/globals.css
```

### 4. Authentication Setup

```bash
# Create middleware for route protection
touch src/middleware.ts

# Set up Supabase client utilities
mkdir -p src/lib/supabase
```

### 5. Development Environment

```bash
# Install development dependencies
npm install -D prettier eslint-config-prettier eslint-plugin-prettier

# Create configuration files
touch .eslintrc.json
touch .prettierrc
```

### 6. CI/CD Setup

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run build
```

### 7. Railway Deployment

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

## Environment Variables

Create `.env.local` with:

```env
# Public (safe to expose to browser)
NEXT_PUBLIC_SUPABASE_URL=https://fjgsgtiivtuwhpmojflg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Server only (never in NEXT_PUBLIC_*)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
```

## Running the Application

```bash
# Development
npm run dev

# Build
npm run build

# Start
npm run start

# Type checking
npm run type-check

# Linting
npm run lint
```

## Project Structure

```
eduquest/
├── app/
│   ├── (auth)/          # Login pages
│   ├── (dashboard)/     # Protected admin routes
│   ├── api/              # Route handlers
│   └── layout.tsx        # Root layout
├── components/
│   ├── ui/              # shadcn components
│   ├── charts/          # Chart components
│   ├── tables/          # Data tables
│   └── shared/          # Navigation, sidebar
├── lib/
│   ├── supabase/        # Client utilities
│   ├── queries/         # Typed queries
│   ├── utils/           # Helper functions
│   └── types/           # TypeScript types
├── supabase/
│   └── migrations/      # Database migrations
├── .env.local           # Environment variables
└── middleware.ts        # Auth middleware
```

## Next Steps

1. Verify all environment variables are set
2. Test database connection with `npm run type-check`
3. Run lint checks: `npm run lint`
4. Build application: `npm run build`
5. Set up Railway deployment
6. Configure GitHub Actions CI pipeline