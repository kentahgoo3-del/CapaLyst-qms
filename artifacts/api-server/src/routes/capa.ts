import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { capaTable, deviationsTable, efficacyReviewsTable, changeControlTable } from "@workspace/db";
import { sql, eq, ilike, or, and, lt } from "drizzle-orm";
import {
  GenerateChangeControlFromCapaParams,
  GetChangeControlResponse,
  ListCapaQueryParams,
  ListCapaResponse,
  CreateCapaBody,
  GetCapaParams,
  GetCapaResponse,
  UpdateCapaParams,
  UpdateCapaBody,
  UpdateCapaResponse,
  GetCapaCountsResponse,
  ListEfficacyReviewsQueryParams,
  ListEfficacyReviewsResponse,
  CreateEfficacyReviewBody,
  GetEfficacyReviewParams,
  GetEfficacyReviewResponse,
  UpdateEfficacyReviewParams,
  UpdateEfficacyReviewBody,
  UpdateEfficacyReviewResponse,
} from "@workspace/api-zod";
import { logAudit } from "./audit.js";

const router: IRouter = Router();

const CAPA_FIELD_LABELS: Record<string, string> = {
  title: "Title", description: "Description", capaType: "Type", specificAttribute: "Attribute",
  initialPlannedDate: "Planned Date", updatedPlannedDate: "Updated Planned Date",
  extendComment: "Extension Comment", location: "Location", implementationLeader: "Implementation Leader",
};

function buildFieldDiff(update: Record<string, unknown>, existing: Record<string, unknown>, labelMap: Record<string, string>): string {
  const parts: string[] = [];
  for (const [key, newVal] of Object.entries(update)) {
    const label = labelMap[key];
    if (!label) continue;
    const oldVal = existing[key];
    const oldStr = oldVal != null && oldVal !== "" ? String(oldVal) : "—";
    const newStr = newVal != null && newVal !== "" ? String(newVal) : "—";
    if (oldStr === newStr) continue;
    parts.push(`${label}: "${oldStr}" → "${newStr}"`);
  }
  return parts.join("; ");
}

function capaActionLabel(fields: Record<string, unknown>, existing: Record<string, unknown>, oldStatus?: string): { action: string; details?: string } {
  if ("status" in fields && fields.status !== oldStatus) {
    return { action: "Status Changed", details: `${oldStatus ?? "?"} → ${fields.status}` };
  }
  if ("implementationSummary" in fields || "implementationDate" in fields) return { action: "Implementation Saved" };
  if ("updatedPlannedDate" in fields || "extendComment" in fields) {
    return { action: "Due Date Extended", details: fields.updatedPlannedDate ? `New date: ${fields.updatedPlannedDate}` : undefined };
  }
  const diff = buildFieldDiff(fields, existing, CAPA_FIELD_LABELS);
  return { action: "Record Updated", details: diff || undefined };
}

router.get("/capa", async (req, res): Promise<void> => {
  const params = ListCapaQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { deviationId, flag, page = 1, pageSize = 20, search } = params.data;
  const offset = ((page ?? 1) - 1) * (pageSize ?? 20);
  const limit = pageSize ?? 20;
  const todayStr = new Date().toISOString().split("T")[0];

  const userName = (req.session as { userName?: string })?.userName ?? "";

  const conditions = [];
  if (deviationId) {
    conditions.push(eq(capaTable.deviationId, deviationId));
  }
  if (flag === "overdue") {
    conditions.push(sql`capa.status NOT IN ('Closed')`, lt(capaTable.initialPlannedDate, todayStr));
  } else if (flag === "todo") {
    conditions.push(
      sql`capa.status NOT IN ('Closed', 'Draft')`,
      eq(capaTable.implementationLeader, userName)
    );
  } else if (flag === "mine") {
    conditions.push(eq(capaTable.implementationLeader, userName));
  } else if (flag === "plants") {
    conditions.push(sql`${capaTable.location} IS NOT NULL AND ${capaTable.location} != ''`);
  } else if (flag && flag !== "all") {
    conditions.push(eq(capaTable.status, flag));
  }
  if (search) {
    conditions.push(or(ilike(capaTable.title, `%${search}%`), ilike(capaTable.capaNumber, `%${search}%`)));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [countResult] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(capaTable).where(where);
  const rows = await db.select({
    capa: capaTable,
    deviationNumber: deviationsTable.deviationNumber,
  }).from(capaTable).leftJoin(deviationsTable, eq(capaTable.deviationId, deviationsTable.id)).where(where).orderBy(sql`capa.created_at DESC`).limit(limit).offset(offset);

  const data = rows.map(r => ({
    ...r.capa,
    deviationNumber: r.deviationNumber ?? null,
    isOverdue: r.capa.status !== "Closed" && r.capa.initialPlannedDate < todayStr,
  }));

  res.json(ListCapaResponse.parse({
    data,
    total: countResult?.count ?? 0,
    page: page ?? 1,
    pageSize: limit,
  }));
});

router.post("/capa", async (req, res): Promise<void> => {
  const parsed = CreateCapaBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const count = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(capaTable);
  const nextNum = (count[0]?.count ?? 0) + 1;
  const year = new Date().getFullYear();
  const capaNumber = `CPT-${year}-CAPA-${String(nextNum).padStart(3, "0")}`;
  const todayStr = new Date().toISOString().split("T")[0];

  let deviationNumber: string | null = null;
  if (parsed.data.deviationId) {
    const [dev] = await db.select().from(deviationsTable).where(eq(deviationsTable.id, parsed.data.deviationId));
    deviationNumber = dev?.deviationNumber ?? null;
  }

  const [row] = await db.insert(capaTable).values({
    ...parsed.data,
    capaNumber,
    capaType: parsed.data.capaType,
    status: parsed.data.status ?? "Open",
    creationDate: todayStr,
  }).returning();

  const status = row.status === "Draft" ? "Saved as Draft" : "Created";
  logAudit({ req, action: status, module: "CAPA", recordId: row.id, recordNumber: capaNumber, details: row.title }).catch(() => {});

  res.status(201).json(GetCapaResponse.parse({ ...row, deviationNumber, isOverdue: false }));
});

router.get("/capa/counts", async (req, res): Promise<void> => {
  const todayStr = new Date().toISOString().split("T")[0];
  const due30Date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const privileged = req.session?.userRoles?.some((r) => r === "QA" || r === "Admin") ?? false;
  const userName = req.session?.userName ?? "";
  const uFilter = privileged ? undefined : eq(capaTable.implementationLeader, userName);
  const w = (...extra: (ReturnType<typeof eq> | ReturnType<typeof and> | ReturnType<typeof sql> | undefined)[]) => {
    const conds = [uFilter, ...extra].filter((c): c is NonNullable<typeof uFilter> => c !== undefined);
    return conds.length === 0 ? undefined : conds.length === 1 ? conds[0] : and(...conds);
  };

  const [total] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(capaTable).where(uFilter);
  const [open] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(capaTable).where(w(eq(capaTable.status, "Open")));
  const [closed] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(capaTable).where(w(eq(capaTable.status, "Closed")));
  const [overdue] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(capaTable).where(w(sql`status NOT IN ('Closed')`, lt(capaTable.initialPlannedDate, todayStr)));
  const [due30] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(capaTable).where(w(sql`status NOT IN ('Closed')`, lt(capaTable.initialPlannedDate, due30Date)));

  res.json(GetCapaCountsResponse.parse({
    total: total?.count ?? 0,
    open: open?.count ?? 0,
    closed: closed?.count ?? 0,
    overdue: overdue?.count ?? 0,
    due30: due30?.count ?? 0,
  }));
});

router.get("/capa/er", async (req, res): Promise<void> => {
  const params = ListEfficacyReviewsQueryParams.safeParse(req.query);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const { capaId, flag, page = 1, pageSize = 50 } = params.data;
  const offset = ((page ?? 1) - 1) * (pageSize ?? 50);
  const limit = pageSize ?? 50;
  const todayStr = new Date().toISOString().split("T")[0];

  const conditions = [];
  if (capaId) conditions.push(eq(efficacyReviewsTable.capaId, capaId));
  if (flag && flag !== "all") conditions.push(eq(efficacyReviewsTable.status, flag));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [countResult] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(efficacyReviewsTable).where(where);

  const rows = await db.select({
    er: efficacyReviewsTable,
    capaNumber: capaTable.capaNumber,
    deviationNumber: deviationsTable.deviationNumber,
  }).from(efficacyReviewsTable)
    .leftJoin(capaTable, eq(efficacyReviewsTable.capaId, capaTable.id))
    .leftJoin(deviationsTable, eq(capaTable.deviationId, deviationsTable.id))
    .where(where)
    .orderBy(sql`efficacy_reviews.created_at DESC`)
    .limit(limit)
    .offset(offset);

  const data = rows.map(r => ({
    ...r.er,
    capaNumber: r.capaNumber ?? null,
    deviationNumber: r.deviationNumber ?? null,
    createdAt: r.er.createdAt.toISOString(),
    status: r.er.status === "Pending" && r.er.expectedDate < todayStr ? "Overdue" : r.er.status,
  }));

  res.json(ListEfficacyReviewsResponse.parse({ data, total: countResult?.count ?? 0, page: page ?? 1, pageSize: limit }));
});

router.post("/capa/er", async (req, res): Promise<void> => {
  const parsed = CreateEfficacyReviewBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [row] = await db.insert(efficacyReviewsTable).values({
    capaId: parsed.data.capaId,
    reviewer: parsed.data.reviewer,
    expectedDate: parsed.data.expectedDate,
    instruction: parsed.data.instruction ?? null,
    criteria: parsed.data.criteria ?? null,
    round: parsed.data.round ?? 1,
    status: "Pending",
  }).returning();

  const [capa] = await db.select({ capaNumber: capaTable.capaNumber }).from(capaTable).where(eq(capaTable.id, row.capaId));
  const capaWithDev = await db.select({ deviationNumber: deviationsTable.deviationNumber })
    .from(capaTable)
    .leftJoin(deviationsTable, eq(capaTable.deviationId, deviationsTable.id))
    .where(eq(capaTable.id, row.capaId));

  const roundLabel = row.round > 1 ? ` (Round ${row.round})` : "";
  logAudit({ req, action: "Efficacy Review Created", module: "CAPA", recordId: row.capaId, recordNumber: capa?.capaNumber ?? undefined, details: `Reviewer: ${row.reviewer}${roundLabel}` }).catch(() => {});

  res.status(201).json(GetEfficacyReviewResponse.parse({
    ...row,
    capaNumber: capa?.capaNumber ?? null,
    deviationNumber: capaWithDev[0]?.deviationNumber ?? null,
    createdAt: row.createdAt.toISOString(),
  }));
});

router.get("/capa/er/:id", async (req, res): Promise<void> => {
  const params = GetEfficacyReviewParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const rows = await db.select({
    er: efficacyReviewsTable,
    capaNumber: capaTable.capaNumber,
    deviationNumber: deviationsTable.deviationNumber,
  }).from(efficacyReviewsTable)
    .leftJoin(capaTable, eq(efficacyReviewsTable.capaId, capaTable.id))
    .leftJoin(deviationsTable, eq(capaTable.deviationId, deviationsTable.id))
    .where(eq(efficacyReviewsTable.id, params.data.id));

  if (!rows[0]) { res.status(404).json({ error: "Efficacy review not found" }); return; }
  const r = rows[0];
  res.json(GetEfficacyReviewResponse.parse({ ...r.er, capaNumber: r.capaNumber ?? null, deviationNumber: r.deviationNumber ?? null, createdAt: r.er.createdAt.toISOString() }));
});

router.patch("/capa/er/:id", async (req, res): Promise<void> => {
  if (!req.session.userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const params = UpdateEfficacyReviewParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateEfficacyReviewBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [existing] = await db.select().from(efficacyReviewsTable).where(eq(efficacyReviewsTable.id, params.data.id)).limit(1);
  if (!existing) { res.status(404).json({ error: "Efficacy review not found" }); return; }

  const isAdmin = (req.session.userRoles ?? []).includes("Admin");
  const isAssignedReviewer = req.session.userName === existing.reviewer;
  if (!isAdmin && !isAssignedReviewer) { res.status(403).json({ error: "Only the assigned reviewer can submit this efficacy review." }); return; }

  const update: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data)) { if (v !== undefined) update[k] = v; }

  const [row] = await db.update(efficacyReviewsTable).set(update).where(eq(efficacyReviewsTable.id, params.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Efficacy review not found" }); return; }

  const rows = await db.select({ capaNumber: capaTable.capaNumber, deviationNumber: deviationsTable.deviationNumber })
    .from(capaTable)
    .leftJoin(deviationsTable, eq(capaTable.deviationId, deviationsTable.id))
    .where(eq(capaTable.id, row.capaId));

  let action = "Efficacy Review Updated";
  if (update.outcome === "Effective") action = "Efficacy Review — Effective";
  else if (update.outcome === "Not Effective") action = "Efficacy Review — Not Effective";
  else if (update.outcome === "Inconclusive") action = "Efficacy Review — Inconclusive";
  else if (update.status === "Completed") action = "Efficacy Review Completed";

  const outcomeNote = row.outcome ? ` | Outcome: ${row.outcome}` : "";
  logAudit({ req, action, module: "CAPA", recordId: row.capaId, recordNumber: rows[0]?.capaNumber ?? undefined, details: `Reviewer: ${row.reviewer}${outcomeNote}` }).catch(() => {});

  res.json(UpdateEfficacyReviewResponse.parse({ ...row, capaNumber: rows[0]?.capaNumber ?? null, deviationNumber: rows[0]?.deviationNumber ?? null, createdAt: row.createdAt.toISOString() }));
});

/* ── EXPORT CSV ─────────────────────────────────────────────── */
router.get("/capa/export", async (req, res): Promise<void> => {
  const { flag, search } = req.query as { flag?: string; search?: string };
  const todayStr = new Date().toISOString().split("T")[0];
  const userName = (req.session as { userName?: string })?.userName ?? "";
  const conditions = [];
  if (flag === "overdue") {
    conditions.push(sql`capa.status NOT IN ('Closed')`, lt(capaTable.initialPlannedDate, todayStr));
  } else if (flag === "todo") {
    conditions.push(sql`capa.status NOT IN ('Closed', 'Draft')`, eq(capaTable.implementationLeader, userName));
  } else if (flag === "mine") {
    conditions.push(eq(capaTable.implementationLeader, userName));
  } else if (flag === "plants") {
    conditions.push(sql`${capaTable.location} IS NOT NULL AND ${capaTable.location} != ''`);
  } else if (flag && flag !== "all") {
    conditions.push(eq(capaTable.status, flag));
  }
  if (search) {
    conditions.push(or(ilike(capaTable.title, `%${search}%`), ilike(capaTable.capaNumber, `%${search}%`)));
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const rows = await db.select({
    capa: capaTable,
    deviationNumber: deviationsTable.deviationNumber,
  }).from(capaTable).leftJoin(deviationsTable, eq(capaTable.deviationId, deviationsTable.id)).where(where).orderBy(sql`capa.created_at DESC`);
  const esc = (v: unknown) => { const s = v == null ? "" : String(v); return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const headers = ["Number","Title","Type","Attribute","Status","Workflow Status","Implementation Leader","Linked Deviation","Initial Planned Date","Updated Planned Date","Location","Overdue"];
  const csvRows = rows.map(r => [
    r.capa.capaNumber, r.capa.title, r.capa.capaType, r.capa.specificAttribute, r.capa.status,
    (r.capa as unknown as Record<string,unknown>).workflowStatus ?? r.capa.status,
    r.capa.implementationLeader, r.deviationNumber ?? "",
    r.capa.initialPlannedDate, r.capa.updatedPlannedDate ?? "",
    r.capa.location,
    r.capa.status !== "Closed" && r.capa.initialPlannedDate < todayStr ? "Yes" : "No",
  ].map(esc).join(","));
  const csv = "\uFEFF" + [headers.join(","), ...csvRows].join("\r\n");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="capa-${todayStr}.csv"`);
  res.send(csv);
});

router.get("/capa/:id", async (req, res): Promise<void> => {
  const params = GetCapaParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const todayStr = new Date().toISOString().split("T")[0];
  const rows = await db.select({
    capa: capaTable,
    deviationNumber: deviationsTable.deviationNumber,
  }).from(capaTable).leftJoin(deviationsTable, eq(capaTable.deviationId, deviationsTable.id)).where(eq(capaTable.id, params.data.id));

  if (!rows[0]) {
    res.status(404).json({ error: "CAPA not found" });
    return;
  }

  const { capa, deviationNumber } = rows[0];
  res.json(GetCapaResponse.parse({
    ...capa,
    deviationNumber: deviationNumber ?? null,
    isOverdue: capa.status !== "Closed" && capa.initialPlannedDate < todayStr,
  }));
});

router.patch("/capa/:id", async (req, res): Promise<void> => {
  if (!req.session.userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const isQA = (req.session.userRoles ?? []).includes("QA");
  const params = UpdateCapaParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateCapaBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const update: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v !== undefined) update[k] = v;
  }

  const isAdmin = (req.session.userRoles ?? []).includes("Admin");
  const [existing] = await db.select().from(capaTable).where(eq(capaTable.id, params.data.id));
  const isImplLeader = !!req.session.userName && req.session.userName === existing?.implementationLeader;
  if (!isQA && !isImplLeader) { res.status(403).json({ error: "Only a QA user or the Implementation Leader can update a CAPA" }); return; }

  // Only QA or Admin can change planned dates / extension fields
  if (!isQA && !isAdmin) {
    delete update.updatedPlannedDate;
    delete update.extendComment;
    delete update.initialPlannedDate;
  }

  const [row] = await db.update(capaTable).set(update).where(eq(capaTable.id, params.data.id)).returning();
  if (!row) {
    res.status(404).json({ error: "CAPA not found" });
    return;
  }

  const todayStr = new Date().toISOString().split("T")[0];
  let deviationNumber: string | null = null;
  if (row.deviationId) {
    const [dev] = await db.select().from(deviationsTable).where(eq(deviationsTable.id, row.deviationId));
    deviationNumber = dev?.deviationNumber ?? null;
  }

  const { action, details } = capaActionLabel(update, existing as unknown as Record<string, unknown> ?? {}, existing?.status);
  logAudit({ req, action, module: "CAPA", recordId: row.id, recordNumber: row.capaNumber, details }).catch(() => {});

  res.json(UpdateCapaResponse.parse({
    ...row,
    deviationNumber,
    isOverdue: row.status !== "Closed" && row.initialPlannedDate < todayStr,
  }));
});

/* POST /capa/:id/reassign-impl-leader — QA or Admin only */
router.post("/capa/:id/reassign-impl-leader", async (req, res): Promise<void> => {
  if (!req.session.userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const isQA = (req.session.userRoles ?? []).includes("QA");
  const isAdmin = (req.session.userRoles ?? []).includes("Admin");
  if (!isQA && !isAdmin) { res.status(403).json({ error: "Only a QA user or Admin can reassign the implementation leader" }); return; }
  const id = Number(req.params.id);
  const { newLeader } = req.body as { newLeader?: string };
  if (!newLeader?.trim()) { res.status(400).json({ error: "newLeader is required" }); return; }
  const [capa] = await db.select().from(capaTable).where(eq(capaTable.id, id)).limit(1);
  if (!capa) { res.status(404).json({ error: "CAPA not found" }); return; }
  if (capa.status === "Closed") { res.status(409).json({ error: "Cannot reassign implementation leader on a closed CAPA" }); return; }
  const previousLeader = capa.implementationLeader;
  const [updated] = await db.update(capaTable).set({ implementationLeader: newLeader.trim() }).where(eq(capaTable.id, id)).returning();
  const todayStr = new Date().toISOString().split("T")[0];
  let deviationNumber: string | null = null;
  if (updated.deviationId) {
    const [dev] = await db.select().from(deviationsTable).where(eq(deviationsTable.id, updated.deviationId));
    deviationNumber = dev?.deviationNumber ?? null;
  }
  logAudit({ req, action: "Implementation Leader Reassigned", module: "CAPA", recordId: id, recordNumber: capa.capaNumber, details: `Reassigned from "${previousLeader}" to "${newLeader.trim()}" by ${req.session.userName ?? "?"}` }).catch(() => {});
  res.json({ ...updated, deviationNumber, isOverdue: updated.status !== "Closed" && updated.initialPlannedDate < todayStr });
});

/* ══════════════════════════════════════════════════════════
   CAPA WORKFLOW ENDPOINTS
   ══════════════════════════════════════════════════════════ */

function getCapaWfStatus(row: { workflowStatus: string | null; status: string }): string {
  if (row.workflowStatus) return row.workflowStatus;
  if (row.status === "Draft") return "Draft";
  if (row.status === "Closed") return "Closed";
  return "Submitted";
}

/* POST /capa/:id/submit — QA only */
router.post("/capa/:id/submit", async (req, res): Promise<void> => {
  if (!req.session.userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const id = Number(req.params.id);
  const [capa] = await db.select().from(capaTable).where(eq(capaTable.id, id)).limit(1);
  if (!capa) { res.status(404).json({ error: "CAPA not found" }); return; }
  const wfStatus = getCapaWfStatus(capa);
  const isQA = (req.session.userRoles ?? []).includes("QA");
  if (!isQA) { res.status(403).json({ error: "Only a QA user can submit a CAPA" }); return; }
  if (!["Draft", "QA_Rejected"].includes(wfStatus)) { res.status(409).json({ error: `Cannot submit from current state: ${wfStatus}` }); return; }
  const [updated] = await db.update(capaTable).set({ workflowStatus: "QA_Accepted", status: "In Progress", qaRejectReason: null }).where(eq(capaTable.id, id)).returning();
  logAudit({ req, action: "CAPA Submitted", module: "CAPA", recordId: id, recordNumber: capa.capaNumber, details: `Submitted by ${req.session.userName ?? "?"}` }).catch(() => {});
  res.json(updated);
});

/* POST /capa/:id/qa-accept — QA only */
router.post("/capa/:id/qa-accept", async (req, res): Promise<void> => {
  if (!req.session.userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const id = Number(req.params.id);
  const [capa] = await db.select().from(capaTable).where(eq(capaTable.id, id)).limit(1);
  if (!capa) { res.status(404).json({ error: "CAPA not found" }); return; }
  if (!(req.session.userRoles ?? []).includes("QA")) { res.status(403).json({ error: "Only a QA user can accept" }); return; }
  const wfStatus = getCapaWfStatus(capa);
  if (wfStatus !== "Submitted") { res.status(409).json({ error: `Cannot accept from state: ${wfStatus}` }); return; }
  const [updated] = await db.update(capaTable).set({ workflowStatus: "QA_Accepted", status: "Accepted" }).where(eq(capaTable.id, id)).returning();
  logAudit({ req, action: "QA Accepted", module: "CAPA", recordId: id, recordNumber: capa.capaNumber, details: `Accepted by ${req.session.userName ?? "?"}` }).catch(() => {});
  res.json(updated);
});

/* POST /capa/:id/qa-reject — QA only */
router.post("/capa/:id/qa-reject", async (req, res): Promise<void> => {
  if (!req.session.userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const id = Number(req.params.id);
  const { reason } = req.body as { reason?: string };
  if (!reason?.trim()) { res.status(400).json({ error: "Rejection reason is required" }); return; }
  const [capa] = await db.select().from(capaTable).where(eq(capaTable.id, id)).limit(1);
  if (!capa) { res.status(404).json({ error: "CAPA not found" }); return; }
  if (!(req.session.userRoles ?? []).includes("QA")) { res.status(403).json({ error: "Only a QA user can reject" }); return; }
  const wfStatus = getCapaWfStatus(capa);
  if (wfStatus !== "Submitted") { res.status(409).json({ error: `Cannot reject from state: ${wfStatus}` }); return; }
  const [updated] = await db.update(capaTable).set({ workflowStatus: "QA_Rejected", qaRejectReason: reason, status: "Open" }).where(eq(capaTable.id, id)).returning();
  logAudit({ req, action: "QA Rejected", module: "CAPA", recordId: id, recordNumber: capa.capaNumber, details: `Rejected by ${req.session.userName ?? "?"}: ${reason}` }).catch(() => {});
  res.json(updated);
});

/* POST /capa/:id/submit-impl — Implementation Leader only: QA_Accepted or Impl_Rejected → Implementation_Submitted */
router.post("/capa/:id/submit-impl", async (req, res): Promise<void> => {
  if (!req.session.userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const id = Number(req.params.id);
  const [capa] = await db.select().from(capaTable).where(eq(capaTable.id, id)).limit(1);
  if (!capa) { res.status(404).json({ error: "CAPA not found" }); return; }
  const wfStatus = getCapaWfStatus(capa);
  const isImplLeader = req.session.userName === capa.implementationLeader;
  const isAdmin = (req.session.userRoles ?? []).includes("Admin");
  if (!isImplLeader && !isAdmin) { res.status(403).json({ error: "Only the Implementation Leader can submit implementation." }); return; }
  if (!["QA_Accepted", "Impl_Rejected", "Submitted"].includes(wfStatus)) { res.status(409).json({ error: `Cannot submit implementation from state: ${wfStatus}` }); return; }
  if (!capa.implementationSummary?.trim()) { res.status(422).json({ error: "Implementation summary is required before submitting." }); return; }
  if (!capa.implementationDate) { res.status(422).json({ error: "Implementation date is required before submitting." }); return; }
  const [updated] = await db.update(capaTable).set({ workflowStatus: "Implementation_Submitted", implRejectReason: null }).where(eq(capaTable.id, id)).returning();
  logAudit({ req, action: "Implementation Submitted", module: "CAPA", recordId: id, recordNumber: capa.capaNumber, details: `Implementation submitted for QA verification by ${req.session.userName ?? "?"}` }).catch(() => {});
  res.json(updated);
});

/* POST /capa/:id/reject-impl — QA only: Implementation_Submitted → Impl_Rejected */
router.post("/capa/:id/reject-impl", async (req, res): Promise<void> => {
  if (!req.session.userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const id = Number(req.params.id);
  const { reason } = req.body as { reason?: string };
  if (!reason?.trim()) { res.status(400).json({ error: "Rejection reason is required" }); return; }
  const [capa] = await db.select().from(capaTable).where(eq(capaTable.id, id)).limit(1);
  if (!capa) { res.status(404).json({ error: "CAPA not found" }); return; }
  if (!(req.session.userRoles ?? []).includes("QA")) { res.status(403).json({ error: "Only a QA user can reject an implementation" }); return; }
  const wfStatus = getCapaWfStatus(capa);
  if (wfStatus !== "Implementation_Submitted") { res.status(409).json({ error: `Cannot reject implementation from state: ${wfStatus}` }); return; }
  const [updated] = await db.update(capaTable).set({ workflowStatus: "Impl_Rejected", implRejectReason: reason, status: "In Progress" }).where(eq(capaTable.id, id)).returning();
  logAudit({ req, action: "Implementation Rejected", module: "CAPA", recordId: id, recordNumber: capa.capaNumber, details: `Implementation rejected by ${req.session.userName ?? "?"}: ${reason}` }).catch(() => {});
  res.json(updated);
});

/* POST /capa/:id/accept-impl — QA only: Implementation_Submitted → Implementation_Accepted */
router.post("/capa/:id/accept-impl", async (req, res): Promise<void> => {
  if (!req.session.userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const id = Number(req.params.id);
  const [capa] = await db.select().from(capaTable).where(eq(capaTable.id, id)).limit(1);
  if (!capa) { res.status(404).json({ error: "CAPA not found" }); return; }
  if (!(req.session.userRoles ?? []).includes("QA")) { res.status(403).json({ error: "Only a QA user can accept an implementation" }); return; }
  const wfStatus = getCapaWfStatus(capa);
  if (wfStatus !== "Implementation_Submitted") { res.status(409).json({ error: `Cannot accept implementation from state: ${wfStatus}` }); return; }
  const [updated] = await db.update(capaTable).set({ workflowStatus: "Implementation_Accepted", status: "In Progress", implRejectReason: null }).where(eq(capaTable.id, id)).returning();
  logAudit({ req, action: "Implementation Accepted", module: "CAPA", recordId: id, recordNumber: capa.capaNumber, details: `Implementation accepted by ${req.session.userName ?? "?"}` }).catch(() => {});
  res.json(updated);
});

/* POST /capa/:id/close — QA only: Implementation_Accepted → Closed */
router.post("/capa/:id/close", async (req, res): Promise<void> => {
  if (!req.session.userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const id = Number(req.params.id);
  const { comment } = req.body as { comment?: string };
  const [capa] = await db.select().from(capaTable).where(eq(capaTable.id, id)).limit(1);
  if (!capa) { res.status(404).json({ error: "CAPA not found" }); return; }
  if (!(req.session.userRoles ?? []).includes("QA")) { res.status(403).json({ error: "Only a QA user can close a CAPA" }); return; }
  const wfStatus = getCapaWfStatus(capa);
  if (wfStatus !== "Implementation_Accepted") { res.status(409).json({ error: `Cannot close from state: ${wfStatus}. Implementation must be accepted first.` }); return; }
  const closeData: Record<string, unknown> = { workflowStatus: "Closed", status: "Closed" };
  if (comment?.trim()) closeData.closeComment = comment;
  const [updated] = await db.update(capaTable).set(closeData).where(eq(capaTable.id, id)).returning();
  logAudit({ req, action: "CAPA Closed", module: "CAPA", recordId: id, recordNumber: capa.capaNumber, details: `Closed by ${req.session.userName ?? "?"}` }).catch(() => {});
  res.json(updated);
});

/* POST /capa/:id/request-extension — Impl Leader, QA, or Admin */
router.post("/capa/:id/request-extension", async (req, res): Promise<void> => {
  if (!req.session.userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const id = Number(req.params.id);
  const { date: requestedDate, reason } = req.body as { date?: string; reason?: string };
  if (!requestedDate) { res.status(400).json({ error: "Requested date is required" }); return; }
  if (!reason?.trim()) { res.status(400).json({ error: "Reason for extension is required" }); return; }
  const [capa] = await db.select().from(capaTable).where(eq(capaTable.id, id)).limit(1);
  if (!capa) { res.status(404).json({ error: "CAPA not found" }); return; }
  const wfStatus = getCapaWfStatus(capa);
  if (wfStatus === "Closed") { res.status(409).json({ error: "Cannot request extension on a closed CAPA" }); return; }
  const isImplLeader = req.session.userName === capa.implementationLeader;
  const isQA = (req.session.userRoles ?? []).includes("QA");
  const isAdmin = (req.session.userRoles ?? []).includes("Admin");
  if (!isImplLeader && !isQA && !isAdmin) { res.status(403).json({ error: "Only the Implementation Leader, QA, or Admin can request an extension" }); return; }
  const [updated] = await db.update(capaTable)
    .set({ extensionRequestedDate: requestedDate, extensionRequestedReason: reason, extensionRequestedBy: req.session.userName ?? "?" })
    .where(eq(capaTable.id, id)).returning();
  logAudit({ req, action: "Extension Requested", module: "CAPA", recordId: id, recordNumber: capa.capaNumber, details: `Extension to ${requestedDate} requested by ${req.session.userName ?? "?"}: ${reason}` }).catch(() => {});
  res.json(updated);
});

/* POST /capa/:id/generate-cc — QA/Admin only */
router.post("/capa/:id/generate-cc", async (req, res): Promise<void> => {
  if (!req.session.userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const params = GenerateChangeControlFromCapaParams.safeParse({ id: parseInt(req.params.id, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid ID" }); return; }

  const isQA = (req.session.userRoles ?? []).includes("QA");
  const isAdmin = (req.session.userRoles ?? []).includes("Admin");
  if (!isQA && !isAdmin) { res.status(403).json({ error: "QA or Admin role required" }); return; }

  const [capa] = await db.select().from(capaTable).where(eq(capaTable.id, params.data.id)).limit(1);
  if (!capa) { res.status(404).json({ error: "CAPA not found" }); return; }

  let deviationNumber: string | null = null;
  if (capa.deviationId) {
    const [dev] = await db.select({ deviationNumber: deviationsTable.deviationNumber }).from(deviationsTable).where(eq(deviationsTable.id, capa.deviationId)).limit(1);
    deviationNumber = dev?.deviationNumber ?? null;
  }

  const [countRow] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(changeControlTable);
  const nextNum = (countRow?.count ?? 0) + 1;
  const year = new Date().getFullYear();
  const changeControlNumber = `CPT-${year}-CC-${String(nextNum).padStart(3, "0")}`;

  const [row] = await db.insert(changeControlTable).values({
    changeControlNumber,
    title: capa.title,
    changeType: "Corrective Action",
    status: "Draft",
    plannedImplementationDate: capa.updatedPlannedDate ?? capa.initialPlannedDate,
    currentSituation: capa.description ?? `Generated from CAPA ${capa.capaNumber}`,
    proposedSituation: `Implement corrective actions defined in CAPA ${capa.capaNumber}`,
    location: capa.location,
    hierarchicResponsible: capa.implementationLeader,
    siteCoordinator: capa.implementationLeader,
    capaId: capa.id,
    capaNumber: capa.capaNumber,
    deviationId: capa.deviationId ?? null,
    deviationNumber,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();

  logAudit({ req, action: "Generated from CAPA", module: "Change Control", recordId: row.id, recordNumber: changeControlNumber, details: `Linked to CAPA ${capa.capaNumber}` }).catch(() => {});
  res.status(201).json(GetChangeControlResponse.parse(row));
});

/* POST /capa/:id/approve-extension — QA only */
router.post("/capa/:id/approve-extension", async (req, res): Promise<void> => {
  if (!req.session.userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const id = Number(req.params.id);
  const [capa] = await db.select().from(capaTable).where(eq(capaTable.id, id)).limit(1);
  if (!capa) { res.status(404).json({ error: "CAPA not found" }); return; }
  const isQA = (req.session.userRoles ?? []).includes("QA");
  if (!isQA) { res.status(403).json({ error: "Only a QA user can approve an extension" }); return; }
  if (!capa.extensionRequestedDate) { res.status(409).json({ error: "No extension request is pending" }); return; }
  const [updated] = await db.update(capaTable)
    .set({ updatedPlannedDate: capa.extensionRequestedDate, extendComment: capa.extensionRequestedReason, extensionRequestedDate: null, extensionRequestedReason: null, extensionRequestedBy: null })
    .where(eq(capaTable.id, id)).returning();
  logAudit({ req, action: "Extension Approved", module: "CAPA", recordId: id, recordNumber: capa.capaNumber, details: `Extension to ${capa.extensionRequestedDate} approved by ${req.session.userName ?? "?"}` }).catch(() => {});
  res.json(updated);
});

/* POST /capa/:id/reject-extension — QA only */
router.post("/capa/:id/reject-extension", async (req, res): Promise<void> => {
  if (!req.session.userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const id = Number(req.params.id);
  const [capa] = await db.select().from(capaTable).where(eq(capaTable.id, id)).limit(1);
  if (!capa) { res.status(404).json({ error: "CAPA not found" }); return; }
  const isQA = (req.session.userRoles ?? []).includes("QA");
  if (!isQA) { res.status(403).json({ error: "Only a QA user can reject an extension request" }); return; }
  if (!capa.extensionRequestedDate) { res.status(409).json({ error: "No extension request is pending" }); return; }
  const [updated] = await db.update(capaTable)
    .set({ extensionRequestedDate: null, extensionRequestedReason: null, extensionRequestedBy: null })
    .where(eq(capaTable.id, id)).returning();
  logAudit({ req, action: "Extension Rejected", module: "CAPA", recordId: id, recordNumber: capa.capaNumber, details: `Extension request to ${capa.extensionRequestedDate} rejected by ${req.session.userName ?? "?"}` }).catch(() => {});
  res.json(updated);
});

export default router;
