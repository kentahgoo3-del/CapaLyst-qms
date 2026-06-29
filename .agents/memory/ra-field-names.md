---
name: Risk Assessment field names and mutation shapes
description: Exact field names for RA sub-entities and mutation call signatures; wrong names cause TS errors.
---

## RaTeamMember
- Fields: `id, assessmentId, name, area, designation, role, acknowledgedAt, createdAt`
- No `department`, no `email`
- Acknowledged = `acknowledgedAt !== null` (null means pending)
- Input required: `name, area`; optional: `designation, role`

## RaCommunicationEntry
- Fields: `id, assessmentId, communicatedTo, method, communicationDate, summary, loggedBy, createdAt`
- No `audience`, no `content`, no `communicatedBy`
- Input required: `communicatedTo, method, communicationDate, summary`
- Delete mutation param: `{ id, logId }` (NOT `entryId`)

## RaLink
- Fields: `id, assessmentId, moduleType, moduleId (integer!), moduleNumber, moduleTitle, linkedBy, createdAt`
- No `notes` field
- Input required: `moduleType, moduleId (integer), moduleNumber`; optional: `moduleTitle`
- Delete mutation param: `{ id, linkId }`

## RaClassifyInput
- Required: `riskClass`; optional: `nextReviewDate, decisionTreeData`
- NO `classificationRationale` field — store free-text rationale in `decisionTreeData`

## RaReviewReportInput
- Required: `reviewedBy, reviewDate, outcome`
- Optional: `newReviewDate, deviationsReviewed, changesReviewed, newRisksIdentified, mitigationsAdhered, recommendReassessment, notes, status`
- NO `capasReviewed` — use `changesReviewed` for CC references
- `updateMut` needs ALL required fields even for partial status/notes edits — store `{ reviewedBy, reviewDate, outcome }` in editRarr state

## closeRiskAssessment
- Mutation takes only `{ id: number }` — NO data body (comment is just UI-only, ignored)

## isQA pattern
- `user?.roles?.includes()` returns `boolean | undefined`; use `!!()` wrapper when passing as `boolean` prop to child components
