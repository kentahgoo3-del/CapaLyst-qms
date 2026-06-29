---
name: QMS build lessons
description: Non-obvious pitfalls from building the QSolPharmaAlpha QMS — pnpm monorepo, contract-first API, Drizzle, Orval codegen
---

# QMS build lessons

## After adding new Drizzle tables, rebuild libs before typechecking artifacts

**Why:** After adding files to `lib/db/src/schema/`, the declaration cache is stale. Leaf artifacts (like api-server) will get TS2305 "no exported member" errors even though the code is correct.

**How to apply:** Always run `pnpm run typecheck:libs` before `pnpm --filter @workspace/api-server run typecheck` when new schema files were added.

## OpenAPI path must exactly match Express handler path

**Why:** Orval generates the client URL directly from the OpenAPI spec path. If the spec says `/dashboard/recent-activity` but the Express handler is registered as `/dashboard/activity`, every generated call returns 404.

**How to apply:** Before writing a route handler, grep the spec (`lib/api-spec/openapi.yaml`) for the exact path. Copy it literally into the Express `router.get(...)` call.

## Scripts package needs `@workspace/db` declared as a dependency

**Why:** `pnpm add @workspace/db` fails for workspace packages (not on npm). Must add `"@workspace/db": "workspace:*"` directly to `scripts/package.json` dependencies, then run `pnpm install`.

**How to apply:** Whenever a script in `scripts/src/` imports a workspace lib, manually add `"@workspace/lib-name": "workspace:*"` to `scripts/package.json` before running with tsx.

## `<Skeleton>` (renders a `<div>`) must not be inside a `<p>`

**Why:** React warns about invalid HTML nesting (hydration error) when a block element like `<div>` is inside an inline element like `<p>`. Shadcn's `<Skeleton>` renders a `<div>`.

**How to apply:** When a `<p>` conditionally renders `{loading ? <Skeleton /> : text}`, change the `<p>` to a `<div>` with the same className.
