---
name: Orval inline requestBody naming conflict
description: Why inline anonymous requestBody schemas cause TS2308 duplicate export errors in this Orval codegen setup, and how to fix it.
---

When an OpenAPI operation uses an inline anonymous `requestBody` schema (not a `$ref`), Orval generates:
- A named Zod const in `lib/api-zod/src/generated/api.ts` (e.g. `ApproveRiskAssessmentBody`)
- A matching TypeScript type in `lib/api-zod/src/generated/types/<name>.ts`

Because `lib/api-zod/src/index.ts` re-exports from both `./generated/api` and `./generated/types`, TypeScript sees TS2308 ("has already exported a member named X").

**Why:** The `types/` folder exports a TypeScript `type` alias with the same PascalCase name that `api.ts` exports as a Zod schema constant value. Even though one is a value and one is a type, `export *` causes a namespace collision.

**How to apply:** Whenever adding new POST endpoints with request bodies to the OpenAPI spec, always define them as named schemas under `components/schemas` and reference with `$ref`. Never use inline anonymous `schema: { type: object, ... }` inside `requestBody` for this project's Orval config. For simple workflow transitions with no required body (submit, approve, close), omit `requestBody` entirely from the spec — Express can still read `req.body` without it being in the spec.
