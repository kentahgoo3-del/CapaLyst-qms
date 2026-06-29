import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { changeControlTable, ccExpertReviewsTable, ccWorkPlansTable } from "@workspace/db";
import { sql, eq, ilike, or, and } from "drizzle-orm";
import {
  ListChangeControlQueryParams,
  ListChangeControlResponse,
  CreateChangeControlBody,
  GetChangeControlParams,
  GetChangeControlResponse,
  UpdateChangeControlParams,
  UpdateChangeControlBody,
  UpdateChangeControlResponse,
  CloseChangeControlParams,
  CloseChangeControlBody,
  ListChangeControlExpertReviewsParams,
  ListChangeControlExpertReviewsResponse,
  CreateChangeControlExpertReviewsParams,
  CreateChangeControlExpertReviewsBody,
  AcceptChangeControlExpertReviewsParams,
  AcceptChangeControlExpertReviewsResponse,
  RejectChangeControlExpertReviewsParams,
  RejectChangeControlExpertReviewsBody,
  RejectChangeControlExpertReviewsResponse,
  SubmitChangeControlExpertReviewParams,
  SubmitChangeControlExpertReviewBody,
  SubmitChangeControlExpertReviewResponse,
  ReassignChangeControlExpertReviewParams,
  ReassignChangeControlExpertReviewBody,
  ReassignChangeControlExpertReviewResponse,
  ListChangeControlWorkPlansParams,
  ListChangeControlWorkPlansResponse,
  CreateChangeControlWorkPlansParams,
  CreateChangeControlWorkPlansBody,
  DeleteChangeControlWorkPlanParams,
  SubmitChangeControlWorkPlanParams,
  SubmitChangeControlWorkPlanBody,
  SubmitChangeControlWorkPlanResponse,
} from "@workspace/api-zod";
import { logAudit } from "./audit.js";

const router: IRouter = Router();

const ser = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

router.get("/changecontrol", async (req, res): Promise<void> => {
  const params = ListChangeControlQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { flag, page = 1, pageSize = 20, search, capaId } = params.data;
  const offset = ((page ?? 1) - 1) * (pageSize ?? 20);
  const limit = pageSize ?? 20;

  const userName = (req.session as { userName?: string })?.userName ?? "";

  const conditions = [];
  if (flag === "todo") {
    conditions.push(
      sql`${changeControlTable.status} NOT IN ('Closed', 'Rejected', 'Draft')`,
      or(eq(changeControlTable.hierarchicResponsible, userName), eq(changeControlTable.siteCoordinator, userName))!
    );
  } else if (flag === "mine") {
    conditions.push(
      or(eq(changeControlTable.hierarchicResponsible, userName), eq(changeControlTable.siteCoordinator, userName))!
    );
  } else if (flag === "plants") {
    conditions.push(sql`${changeControlTable.location} IS NOT NULL AND ${changeControlTable.location} != ''`);
  } else if (flag && flag !== "all") {
    conditions.push(eq(changeControlTable.status, flag));
  }
  if (search) {
    conditions.push(or(ilike(changeControlTable.title, `%${search}%`), ilike(changeControlTable.changeControlNumber, `%${search}%`)));
  }
  if (capaId) {
    conditions.push(eq(changeControlTable.capaId, capaId));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [countResult] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(changeControlTable).where(where);
  const rows = await db.select().from(changeControlTable).where(where).orderBy(sql`created_at DESC`).limit(limit).offset(offset);

  res.json(ListChangeControlResponse.parse({
    data: rows,
    total: countResult?.count ?? 0,
    page: page ?? 1,
    pageSize: limit,
  }));
});

router.post("/changecontrol", async (req, res): Promise<void> => {
  const parsed = CreateChangeControlBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const count = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(changeControlTable);
  const nextNum = (count[0]?.count ?? 0) + 1;
  const year = new Date().getFullYear();
  const changeControlNumber = `CPT-${year}-CC-${String(nextNum).padStart(3, "0")}`;

  const initialStatus = parsed.data.status ?? "Submitted";

  const [row] = await db.insert(changeControlTable).values({
    ...parsed.data,
    changeControlNumber,
    status: initialStatus,
  }).returning();

  const action = initialStatus === "Draft" ? "Saved as Draft" : "Submitted";
  logAudit({ req, action, module: "Change Control", recordId: row.id, recordNumber: changeControlNumber, details: row.title }).catch(() => {});

  res.status(201).json(GetChangeControlResponse.parse(row));
});

/* ── EXPORT CSV ─────────────────────────────────────────────── */
router.get("/changecontrol/export", async (req, res): Promise<void> => {
  const { flag, search } = req.query as { flag?: string; search?: string };
  const userName = (req.session as { userName?: string })?.userName ?? "";
  const todayStr = new Date().toISOString().split("T")[0];
  const conditions = [];
  if (flag === "todo") {
    conditions.push(sql`${changeControlTable.status} NOT IN ('Closed', 'Rejected', 'Draft')`, or(eq(changeControlTable.hierarchicResponsible, userName), eq(changeControlTable.siteCoordinator, userName))!);
  } else if (flag === "mine") {
    conditions.push(or(eq(changeControlTable.hierarchicResponsible, userName), eq(changeControlTable.siteCoordinator, userName))!);
  } else if (flag === "plants") {
    conditions.push(sql`${changeControlTable.location} IS NOT NULL AND ${changeControlTable.location} != ''`);
  } else if (flag && flag !== "all") {
    conditions.push(eq(changeControlTable.status, flag));
  }
  if (search) {
    conditions.push(or(ilike(changeControlTable.title, `%${search}%`), ilike(changeControlTable.changeControlNumber, `%${search}%`)));
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const rows = await db.select().from(changeControlTable).where(where).orderBy(sql`created_at DESC`);
  const esc = (v: unknown) => { const s = v == null ? "" : String(v); return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const headers = ["Number","Title","Type","Status","Site Coordinator","HR Responsible","Location","Planned Implementation Date","Rationale"];
  const csvRows = rows.map(r => [
    r.changeControlNumber, r.title, r.changeType, r.status,
    r.siteCoordinator, r.hierarchicResponsible, r.location,
    r.plannedImplementationDate, r.rationale ?? "",
  ].map(esc).join(","));
  const csv = "\uFEFF" + [headers.join(","), ...csvRows].join("\r\n");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="changecontrol-${todayStr}.csv"`);
  res.send(csv);
});

router.get("/changecontrol/:id", async (req, res): Promise<void> => {
  const params = GetChangeControlParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db.select().from(changeControlTable).where(eq(changeControlTable.id, params.data.id));
  if (!row) {
    res.status(404).json({ error: "Change control not found" });
    return;
  }

  res.json(GetChangeControlResponse.parse(row));
});

router.patch("/changecontrol/:id", async (req, res): Promise<void> => {
  const params = UpdateChangeControlParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateChangeControlBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const update: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v !== undefined) update[k] = v;
  }

  if (!req.session.userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const callerName = req.session.userName ?? "";
  const isQA = (req.session.userRoles ?? []).includes("QA");
  const isAdmin = (req.session.userRoles ?? []).includes("Admin");

  const [existing] = await db.select().from(changeControlTable).where(eq(changeControlTable.id, params.data.id));
  if (!existing) { res.status(404).json({ error: "Change control not found" }); return; }

  // HR accept/reject — only the hierarchicResponsible (or QA/Admin) may do this
  const isHrTransition = "status" in update && (update.status === "SC Review" || (update.status === "Rejected" && "hrRejectionReason" in update));
  if (isHrTransition && !isQA && !isAdmin && callerName !== existing.hierarchicResponsible) {
    res.status(403).json({ error: "Only the Area Responsible can approve or reject at this stage" }); return;
  }

  // SC accept/reject — only the siteCoordinator (or QA/Admin) may do this
  const isScTransition = "status" in update && (update.status === "Expert Review" || (update.status === "Rejected" && "scRejectionReason" in update));
  if (isScTransition && !isQA && !isAdmin && callerName !== existing.siteCoordinator) {
    res.status(403).json({ error: "Only the Site Coordinator can approve or reject at this stage" }); return;
  }

  const [row] = await db.update(changeControlTable).set(update).where(eq(changeControlTable.id, params.data.id)).returning();
  if (!row) {
    res.status(404).json({ error: "Change control not found" });
    return;
  }

  const CC_FIELD_LABELS: Record<string, string> = {
    title: "Title", changeType: "Type", plannedImplementationDate: "Planned Date",
    location: "Location", hierarchicResponsible: "HR Responsible", siteCoordinator: "Site Coordinator",
    justification: "Justification", justificationType: "Justification Type",
    currentSituation: "Current Situation", proposedChange: "Proposed Change",
  };

  function buildCCFieldDiff(upd: Record<string, unknown>, old: Record<string, unknown>): string {
    const parts: string[] = [];
    for (const [key, newVal] of Object.entries(upd)) {
      const label = CC_FIELD_LABELS[key];
      if (!label) continue;
      const oldVal = old[key];
      const oldStr = oldVal != null && oldVal !== "" ? String(oldVal) : "—";
      const newStr = newVal != null && newVal !== "" ? String(newVal) : "—";
      if (oldStr === newStr) continue;
      parts.push(`${label}: "${oldStr}" → "${newStr}"`);
    }
    return parts.join("; ");
  }

  let action = "Record Updated";
  let details: string | undefined;

  if ("status" in update && update.status !== existing?.status) {
    const s = update.status as string;
    if (s === "HR Review") { action = "Submitted for HR Review"; }
    else if (s === "SC Review" && "hrComment" in update) { action = "HR Review Approved"; details = String(update.hrComment); }
    else if (s === "Expert Review" && "scComment" in update) { action = "SC Review Approved"; details = String(update.scComment); }
    else if (s === "Rejected" && "hrRejectionReason" in update) { action = "HR Review Rejected"; details = String(update.hrRejectionReason); }
    else if (s === "Rejected" && "scRejectionReason" in update) { action = "SC Review Rejected"; details = String(update.scRejectionReason); }
    else { action = "Status Changed"; details = `${existing?.status ?? "?"} → ${s}`; }
  } else {
    const diff = buildCCFieldDiff(update, existing as unknown as Record<string, unknown> ?? {});
    if (diff) details = diff;
  }

  logAudit({ req, action, module: "Change Control", recordId: row.id, recordNumber: row.changeControlNumber, details }).catch(() => {});

  res.json(UpdateChangeControlResponse.parse(row));
});

router.post("/changecontrol/:id/close", async (req, res): Promise<void> => {
  const params = CloseChangeControlParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = CloseChangeControlBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const callerName = req.session.userName ?? "";
  const isQA = (req.session.userRoles ?? []).includes("QA");
  const isAdmin = (req.session.userRoles ?? []).includes("Admin");
  if (!isQA && !isAdmin) {
    const [ccRow] = await db.select({ siteCoordinator: changeControlTable.siteCoordinator }).from(changeControlTable).where(eq(changeControlTable.id, params.data.id));
    if (!ccRow || ccRow.siteCoordinator !== callerName) {
      res.status(403).json({ error: "Only QA, Admin, or the Site Coordinator can close this change control" }); return;
    }
  }

  const [row] = await db.update(changeControlTable)
    .set({ status: "Closed", closeComment: parsed.data.comment })
    .where(eq(changeControlTable.id, params.data.id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Change control not found" });
    return;
  }

  logAudit({ req, action: "Closed", module: "Change Control", recordId: row.id, recordNumber: row.changeControlNumber, details: parsed.data.comment }).catch(() => {});

  res.json(GetChangeControlResponse.parse(row));
});

router.get("/changecontrol/:id/expert-reviews", async (req, res): Promise<void> => {
  const params = ListChangeControlExpertReviewsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const rows = await db.select().from(ccExpertReviewsTable)
    .where(eq(ccExpertReviewsTable.changeControlId, params.data.id))
    .orderBy(sql`created_at ASC`);

  res.json(ListChangeControlExpertReviewsResponse.parse(ser({ data: rows })));
});

router.post("/changecontrol/:id/expert-reviews", async (req, res): Promise<void> => {
  const params = CreateChangeControlExpertReviewsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = CreateChangeControlExpertReviewsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await db.select({ count: sql<number>`cast(count(*) as int)` })
    .from(ccExpertReviewsTable)
    .where(eq(ccExpertReviewsTable.changeControlId, params.data.id));
  const alreadyStarted = (existing[0]?.count ?? 0) > 0;

  const inserts = parsed.data.assignments.map((a) => ({
    changeControlId: params.data.id,
    departmentName: a.departmentName,
    managerName: a.managerName,
    expectedDate: a.expectedDate,
  }));

  const rows = await db.insert(ccExpertReviewsTable).values(inserts).returning();

  if (!alreadyStarted) {
    await db.update(changeControlTable)
      .set({ status: "Expert Review" })
      .where(eq(changeControlTable.id, params.data.id));
  }

  const [cc] = await db.select({ changeControlNumber: changeControlTable.changeControlNumber }).from(changeControlTable).where(eq(changeControlTable.id, params.data.id));
  const action = alreadyStarted ? "Expert Review Expanded" : "Expert Review Started";
  logAudit({ req, action, module: "Change Control", recordId: params.data.id, recordNumber: cc?.changeControlNumber ?? undefined, details: `${rows.length} department(s) assigned` }).catch(() => {});

  res.status(201).json(ListChangeControlExpertReviewsResponse.parse(ser({ data: rows })));
});

router.post("/changecontrol/:id/expert-reviews/accept", async (req, res): Promise<void> => {
  const params = AcceptChangeControlExpertReviewsParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const callerName = req.session.userName ?? "";
  const isQA = (req.session.userRoles ?? []).includes("QA");
  const isAdmin = (req.session.userRoles ?? []).includes("Admin");
  const [cc] = await db.select({ siteCoordinator: changeControlTable.siteCoordinator }).from(changeControlTable).where(eq(changeControlTable.id, params.data.id));
  if (!isQA && !isAdmin && callerName !== cc?.siteCoordinator) {
    res.status(403).json({ error: "Only the Site Coordinator or QA can accept expert reviews" }); return;
  }

  // Auto-populate work plan from applicable expert reviews (exclude N/A ones)
  const applicableReviews = await db
    .select()
    .from(ccExpertReviewsTable)
    .where(eq(ccExpertReviewsTable.changeControlId, params.data.id));

  const toInsert = applicableReviews
    .filter((r) => !r.notApplicable)
    .map((r) => ({
      changeControlId: params.data.id,
      title: `${r.departmentName} — Implementation`,
      responsiblePerson: r.managerName,
      allocatedWorks: r.comment ?? `${r.departmentName} review implementation`,
      expectedDate: r.actualDate ?? r.expectedDate,
    }));

  if (toInsert.length > 0) {
    await db.insert(ccWorkPlansTable).values(toInsert);
  }

  const [row] = await db.update(changeControlTable).set({ status: "Works Plan" }).where(eq(changeControlTable.id, params.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Change control not found" }); return; }

  logAudit({ req, action: "Expert Reviews Accepted", module: "Change Control", recordId: row.id, recordNumber: row.changeControlNumber, details: `${toInsert.length} work plan item(s) auto-created` }).catch(() => {});
  res.json(AcceptChangeControlExpertReviewsResponse.parse(row));
});

router.post("/changecontrol/:id/expert-reviews/reject", async (req, res): Promise<void> => {
  const params = RejectChangeControlExpertReviewsParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = RejectChangeControlExpertReviewsBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const callerName = req.session.userName ?? "";
  const isQA = (req.session.userRoles ?? []).includes("QA");
  const isAdmin = (req.session.userRoles ?? []).includes("Admin");
  const [cc] = await db.select({ siteCoordinator: changeControlTable.siteCoordinator }).from(changeControlTable).where(eq(changeControlTable.id, params.data.id));
  if (!isQA && !isAdmin && callerName !== cc?.siteCoordinator) {
    res.status(403).json({ error: "Only the Site Coordinator or QA can reject expert reviews" }); return;
  }

  const [row] = await db.update(changeControlTable).set({ status: "Rejected", scRejectionReason: parsed.data.reason }).where(eq(changeControlTable.id, params.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Change control not found" }); return; }

  logAudit({ req, action: "Expert Reviews Rejected", module: "Change Control", recordId: row.id, recordNumber: row.changeControlNumber, details: parsed.data.reason }).catch(() => {});
  res.json(RejectChangeControlExpertReviewsResponse.parse(row));
});

router.patch("/changecontrol/expert-reviews/:reviewId", async (req, res): Promise<void> => {
  const params = SubmitChangeControlExpertReviewParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = SubmitChangeControlExpertReviewBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [existing] = await db.select().from(ccExpertReviewsTable).where(eq(ccExpertReviewsTable.id, params.data.reviewId));
  if (!existing) { res.status(404).json({ error: "Expert review not found" }); return; }
  if (existing.submittedAt) { res.status(409).json({ error: "Expert review already submitted" }); return; }

  const callerName = req.session.userName ?? "";
  if (callerName !== existing.managerName) {
    res.status(403).json({ error: "Only the assigned manager can submit this expert review" }); return;
  }

  const updateFields: Record<string, unknown> = { submittedAt: new Date() };
  if (parsed.data.hasImpact !== undefined) updateFields.hasImpact = parsed.data.hasImpact;
  if (parsed.data.hasQualityImpact !== undefined) updateFields.hasQualityImpact = parsed.data.hasQualityImpact;
  if (parsed.data.comment !== undefined) updateFields.comment = parsed.data.comment;
  if (parsed.data.actualDate !== undefined) updateFields.actualDate = parsed.data.actualDate;
  if (parsed.data.notApplicable !== undefined) updateFields.notApplicable = parsed.data.notApplicable;
  if (parsed.data.naReason !== undefined) updateFields.naReason = parsed.data.naReason;

  const [row] = await db.update(ccExpertReviewsTable).set(updateFields).where(eq(ccExpertReviewsTable.id, params.data.reviewId)).returning();

  const [cc] = await db.select({ changeControlNumber: changeControlTable.changeControlNumber }).from(changeControlTable).where(eq(changeControlTable.id, row.changeControlId));
  logAudit({ req, action: "Expert Review Submitted", module: "Change Control", recordId: row.changeControlId, recordNumber: cc?.changeControlNumber ?? undefined, details: `Dept: ${row.departmentName}` }).catch(() => {});

  res.json(SubmitChangeControlExpertReviewResponse.parse(ser(row)));
});

router.patch("/changecontrol/expert-reviews/:reviewId/reassign", async (req, res): Promise<void> => {
  const params = ReassignChangeControlExpertReviewParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const parsed = ReassignChangeControlExpertReviewBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [existing] = await db.select().from(ccExpertReviewsTable).where(eq(ccExpertReviewsTable.id, params.data.reviewId));
  if (!existing) { res.status(404).json({ error: "Expert review not found" }); return; }
  if (existing.submittedAt) { res.status(409).json({ error: "Cannot reassign a submitted review" }); return; }

  const callerName = req.session.userName ?? "";
  const isQA = (req.session.userRoles ?? []).includes("QA");
  const isAdmin = (req.session.userRoles ?? []).includes("Admin");

  // Also allow the CC siteCoordinator
  const [cc] = await db.select().from(changeControlTable).where(eq(changeControlTable.id, existing.changeControlId));
  const isSC = callerName === cc?.siteCoordinator;

  if (!isQA && !isAdmin && !isSC) {
    res.status(403).json({ error: "Only QA, Admin, or the Site Coordinator can reassign expert reviews" }); return;
  }

  const updateFields: Record<string, unknown> = { managerName: parsed.data.managerName };
  if (parsed.data.expectedDate !== undefined) updateFields.expectedDate = parsed.data.expectedDate;

  const [row] = await db.update(ccExpertReviewsTable).set(updateFields).where(eq(ccExpertReviewsTable.id, params.data.reviewId)).returning();

  logAudit({ req, action: "Expert Review Reassigned", module: "Change Control", recordId: row.changeControlId, recordNumber: cc?.changeControlNumber ?? undefined, details: `Dept: ${row.departmentName} → reassigned to ${parsed.data.managerName}` }).catch(() => {});

  res.json(ReassignChangeControlExpertReviewResponse.parse(ser(row)));
});

router.get("/changecontrol/:id/work-plans", async (req, res): Promise<void> => {
  const params = ListChangeControlWorkPlansParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const rows = await db.select().from(ccWorkPlansTable)
    .where(eq(ccWorkPlansTable.changeControlId, params.data.id))
    .orderBy(sql`created_at ASC`);

  res.json(ListChangeControlWorkPlansResponse.parse(ser({ data: rows })));
});

router.post("/changecontrol/:id/work-plans", async (req, res): Promise<void> => {
  const params = CreateChangeControlWorkPlansParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = CreateChangeControlWorkPlansBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const callerName = req.session.userName ?? "";
  const isQA = (req.session.userRoles ?? []).includes("QA");
  const isAdmin = (req.session.userRoles ?? []).includes("Admin");
  if (!isQA && !isAdmin) {
    const [ccRow] = await db.select({ siteCoordinator: changeControlTable.siteCoordinator }).from(changeControlTable).where(eq(changeControlTable.id, params.data.id));
    if (!ccRow || ccRow.siteCoordinator !== callerName) {
      res.status(403).json({ error: "Only QA, Admin, or the Site Coordinator can add work plan items" }); return;
    }
  }

  const inserts = parsed.data.items.map((item) => ({
    changeControlId: params.data.id,
    title: item.title,
    responsiblePerson: item.responsiblePerson,
    allocatedWorks: item.allocatedWorks,
    expectedDate: item.expectedDate,
  }));

  const rows = await db.insert(ccWorkPlansTable).values(inserts).returning();

  const [cc] = await db.select({ changeControlNumber: changeControlTable.changeControlNumber }).from(changeControlTable).where(eq(changeControlTable.id, params.data.id));
  logAudit({ req, action: "Work Plan Created", module: "Change Control", recordId: params.data.id, recordNumber: cc?.changeControlNumber ?? undefined, details: `${rows.length} item(s) added` }).catch(() => {});

  res.status(201).json(ListChangeControlWorkPlansResponse.parse(ser({ data: rows })));
});

router.delete("/changecontrol/work-plans/:planId", async (req, res): Promise<void> => {
  const params = DeleteChangeControlWorkPlanParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [plan] = await db.select().from(ccWorkPlansTable).where(eq(ccWorkPlansTable.id, params.data.planId));
  await db.delete(ccWorkPlansTable).where(eq(ccWorkPlansTable.id, params.data.planId));

  if (plan) {
    const [cc] = await db.select({ changeControlNumber: changeControlTable.changeControlNumber }).from(changeControlTable).where(eq(changeControlTable.id, plan.changeControlId));
    logAudit({ req, action: "Work Plan Item Deleted", module: "Change Control", recordId: plan.changeControlId, recordNumber: cc?.changeControlNumber ?? undefined, details: plan.title }).catch(() => {});
  }

  res.json({ success: true });
});

router.patch("/changecontrol/work-plans/:planId", async (req, res): Promise<void> => {
  const params = SubmitChangeControlWorkPlanParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = SubmitChangeControlWorkPlanBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [existing] = await db.select().from(ccWorkPlansTable).where(eq(ccWorkPlansTable.id, params.data.planId));
  if (!existing) { res.status(404).json({ error: "Work plan not found" }); return; }

  const callerName = req.session.userName ?? "";
  if (callerName !== existing.responsiblePerson) {
    res.status(403).json({ error: "Only the Responsible Person can submit this work plan item" }); return;
  }

  const update: Record<string, unknown> = { submittedAt: new Date() };
  if (parsed.data.actualDate !== undefined) update.actualDate = parsed.data.actualDate;
  if (parsed.data.worksComment !== undefined) update.worksComment = parsed.data.worksComment;

  const [row] = await db.update(ccWorkPlansTable)
    .set(update)
    .where(eq(ccWorkPlansTable.id, params.data.planId))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Work plan not found" });
    return;
  }

  const [cc] = await db.select({ changeControlNumber: changeControlTable.changeControlNumber }).from(changeControlTable).where(eq(changeControlTable.id, row.changeControlId));
  logAudit({ req, action: "Work Plan Item Completed", module: "Change Control", recordId: row.changeControlId, recordNumber: cc?.changeControlNumber ?? undefined, details: row.title }).catch(() => {});

  res.json(SubmitChangeControlWorkPlanResponse.parse(ser(row)));
});

export default router;
