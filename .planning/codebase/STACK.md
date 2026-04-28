# Technology Stack

**Analysis Date:** 2026-04-28

## Languages

**Primary:**
- TypeScript 5.x - Full codebase (frontend and backend)
- JSX/TSX - React components in Next.js

**Secondary:**
- CSS (via Tailwind)

## Runtime

**Environment:**
- Node.js (version not pinned in repo, recommend 18+)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` (present)

## Frameworks

**Core:**
- Next.js 16.2.4 - Full-stack React framework with App Router
- React 19.2.4 - UI library
- React DOM 19.2.4 - React rendering

**Styling:**
- TailwindCSS 4 - Utility-first CSS framework
- PostCSS 4 (via @tailwindcss/postcss) - CSS processing

**UI Components:**
- @base-ui/react 1.4.1 - Unstyled, accessible components
- shadcn 4.4.0 - Component library (Tailwind + Radix)
- lucide-react 1.11.0 - Icon library
- class-variance-authority 0.7.1 - CSS variant management
- clsx 2.1.1 - Utility for conditional CSS classes
- tailwind-merge 3.5.0 - Merges Tailwind class conflicts
- tw-animate-css 1.4.0 - Animation utilities

**Authentication:**
- next-auth 5.0.0-beta.31 - Session and authentication management

**Database & ORM:**
- Prisma 7.8.0 - Node.js ORM
- @prisma/client 7.8.0 - Prisma client for database queries
- @prisma/adapter-better-sqlite3 7.8.0 - SQLite adapter for Prisma
- better-sqlite3 12.9.0 - Fast SQLite3 database driver

**Security:**
- bcryptjs 3.0.3 - Password hashing

**AI/ML:**
- @anthropic-ai/sdk 0.91.0 - Anthropic Claude API client

**Testing:**
- Not detected

**Build/Dev:**
- ESLint 9 - JavaScript/TypeScript linting
- eslint-config-next 16.2.4 - Next.js ESLint config

## Key Dependencies

**Critical:**
- next-auth (5.0.0-beta.31) - Handles session management and user authentication with JWT strategy
- @prisma/client (7.8.0) - ORM for all database operations and data modeling
- better-sqlite3 (12.9.0) - Local SQLite database engine; application data persistence
- @anthropic-ai/sdk (0.91.0) - Claude API for AI features: transaction categorization, PDF parsing, insight generation

**Infrastructure:**
- bcryptjs (3.0.3) - Password hashing for secure credential storage

## Configuration

**Environment:**
- `.env` file present (contains environment configuration)
- Key variables passed through `next.config.ts`:
  - `AUTH_SECRET` - Session encryption key
  - `NEXTAUTH_SECRET` - NextAuth configuration
  - `ANTHROPIC_API_KEY` - Claude API authentication (required for AI features)

**Build:**
- `tsconfig.json` - TypeScript configuration with strict mode, path aliases (`@/*` → `./src/*`)
- `eslint.config.mjs` - ESLint rules (Next.js Core Web Vitals + TypeScript)
- `postcss.config.mjs` - PostCSS configuration for Tailwind
- `next.config.ts` - Next.js configuration
- `prisma/schema.prisma` - Database schema and models

**Package Scripts:**
```bash
npm run dev          # Start Next.js dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:push      # Push Prisma schema changes to database
npm run db:studio    # Launch Prisma Studio UI
```

**PostInstall Hook:**
- `prisma generate` - Auto-generates Prisma client on npm install

## Database

**Type:** SQLite (via better-sqlite3)

**Location:** `prisma/dev.db` (development)

**Adapter:** PrismaBetterSqlite3 - Synchronous SQLite driver for faster operations

**Configuration File:** `prisma.config.ts` defines schema path and database URL

## Platform Requirements

**Development:**
- Node.js 18+ (recommended, not explicitly specified)
- npm 9+ (for package management)
- Git (for version control)

**Production:**
- Node.js 18+ (to run Next.js server)
- Environment variables: `AUTH_SECRET`, `NEXTAUTH_SECRET`, `ANTHROPIC_API_KEY`

---

*Stack analysis: 2026-04-28*
