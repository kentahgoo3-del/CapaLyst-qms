---
name: CAPA Workflow Engine
description: 6-state CAPA workflow rules, endpoint paths, role model, and DB columns.
---

## States
Draft → Submitted → QA_Accepted or QA_Rejected → Closed

## Transitions
- Submit (Draft/QA_Rejected → Submitted): implementationLeader OR QA
- QA Accept (Submitted → QA_Accepted): QA only
- QA Reject (Submitted → QA_Rejected): QA only + reason required
- Close (QA_Accepted → Closed): QA only

## Endpoints (all POST, auth required)
- `/api/capa/:id/submit`
- `/api/capa/:id/qa-accept`
- `/api/capa/:id/qa-reject` — body: `{ reason: string }`
- `/api/capa/:id/close` — body: `{ comment?: string }`

## DB Columns
- `capa.workflow_status TEXT` — added via startup migration in `app.ts` (idempotent)
- `capa.qa_reject_reason TEXT` — set on QA rejection, shown as red banner in UI

## Role check pattern
```ts
const isQA = (req.session.userRoles ?? []).includes("QA");
```

## Zod schema patch locations
All three CAPA Zod response schemas (`ListCapaResponse`, `GetCapaResponse`, `UpdateCapaResponse`)
in `lib/api-zod/src/generated/api.ts` and the type in `lib/api-zod/src/generated/types/capa.ts`
and `lib/api-zod/dist/generated/types/capa.d.ts` must be updated together when adding CAPA fields.

**Why:** Orval generates from OpenAPI and these files are not auto-regenerated when the DB schema changes — they must be patched manually to avoid type mismatches at query time.
