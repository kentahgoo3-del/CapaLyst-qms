# Capalyst — Pharmaceutical QMS

A pharmaceutical Quality Management System for QA professionals in regulated pharma/biotech environments. Covers Deviations, CAPA, Change Control, and User Administration with a live dashboard.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at `/api`)
- `pnpm --filter @workspace/qms run dev` — run the QMS frontend (port 25912, served at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/scripts run seed` — seed demo data (clears and re-seeds all tables)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite + Tailwind + shadcn/ui + wouter + recharts + framer-motion
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec at `lib/api-spec/openapi.yaml`)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle table definitions (deviations, capa, changecontrol, users)
- `artifacts/api-server/src/routes/` — Express route handlers (one file per domain)
- `artifacts/qms/src/pages/` — React pages organized by domain
- `artifacts/qms/src/components/` — Shared UI components (layout, sidebar, status-badge, etc.)
- `scripts/src/seed.ts` — Demo data seed script

## Architecture decisions

- Contract-first API: OpenAPI spec → Orval codegen → typed React Query hooks + Zod validation schemas
- All frontend API calls use generated hooks from `@workspace/api-client-react` — never raw fetch
- Route handlers import Zod schemas from `@workspace/api-zod` to validate both inputs and outputs
- Date columns use `date(..., { mode: "string" })` for calendar values (YYYY-MM-DD) and `timestamp` for instants
- `isOverdue` is computed at query time (not stored), based on `dueDate < today AND status != Closed`

## Product

- **Dashboard**: KPI summary cards (total deviations, overdue, open CAPAs, CCs in review) + deviation trend chart + by-area bar chart + recent activity feed
- **Deviations**: Searchable/filterable list + tabbed detail view (General, Investigation, Root Cause, CAPA Link, QA Acceptance, Completion)
- **CAPA**: Searchable list with deviation linkage + detail view with implementation and efficacy review tabs
- **Change Control**: List with approval-chain statuses + detail view showing HR/SC/Expert review workflow
- **Users**: User table with role badges (QA / User) + add user dialog + role change dialog

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After adding new tables to `lib/db/src/schema/`, run `pnpm run typecheck:libs` before typechecking any artifacts — stale lib declarations cause false TS2305 errors.
- `scripts` package needs `@workspace/db` declared as a `dependencies` entry (`"workspace:*"`) to run seed scripts with tsx.
- OpenAPI route paths must exactly match Express handler paths — the generated hook URL comes from the spec, not the handler filename.
- Express 5: wildcard routes need names (`/{*splat}`), async handlers need `Promise<void>`, early returns must use `res.json(); return;` not `return res.json()`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
