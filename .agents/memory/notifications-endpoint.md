---
name: Notifications endpoint
description: How the /api/notifications endpoint and notification bell work.
---

## Endpoint
`GET /api/notifications` — requires session auth.
Returns `{ items: NotificationItem[], count: number }`.

## Logic
Queries deviations and CAPAs where `workflow_status` requires the current user's action.
Uses `inArray(table.workflowStatus, [...states])` for efficiency — no full-table scan.
Sorted by priority (high → medium → low).

## NotificationItem shape
```ts
{ id: string, type: "action_required"|"info", priority: "high"|"medium"|"low",
  module: "Deviation"|"CAPA", recordId: number, recordNumber: string,
  message: string, url: string }
```

## Bell behaviour
- Polls `/api/notifications` AND `/api/audit?pageSize=20` every 30 s.
- Shows **Action Required** section (from notifications) and **Recent Activity** section (from audit).
- Dismiss IDs stored separately in localStorage: `qms_dismissed_action_items` (string IDs) and `qms_dismissed_notifications` (number IDs).

**Why:** The old bell showed ALL audit entries as "notifications". The new bell separates user-relevant pending actions from general activity so QA users can see what needs their attention.
