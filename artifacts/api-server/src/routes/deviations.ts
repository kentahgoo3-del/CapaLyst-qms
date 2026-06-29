import { Router, type IRouter } from "express";
  import { db } from "@workspace/db";
  import { deviationsTable, capaTable, deviationLinksTable, usersTable, efficacyReviewsTable, changeControlTable, ccExpertReviewsTable, ccWorkPlansTable } from "@workspace/db";
  import { sql, eq, ilike, or, and, lt, ne, gte, inArray } from "drizzle-orm";
  import { alias } from "drizzle-orm/pg-core";
  import {
    ListDeviationsQueryParams,
    ListDeviationsResponse,
    CreateDeviationBody,
    GetDeviationParams,
    GetDeviationResponse,
    UpdateDeviationParams,
    UpdateDeviationBody,
    UpdateDeviationResponse,
    GetDeviationStatusCountsParams,
    GetDeviationStatusCountsResponse,
    GetDeviationCountsResponse,
  } from "@workspace/api-zod";
  import { logAudit } from "./audit.js";

  const router: IRouter = Router();

  /* ── Impact severity helpers ───────────────────────────────────── */
  const IMPACT_SEVERITY = ["None", "Minor", "Moderate", "Major", "Critical"];
  function computeEventPriority(
    a: string | null | undefined,
    b: string | null | undefined
  ): string | null {
    const ia = IMPACT_SEVERITY.indexOf(a ?? "");
    const ib = IMPACT_SEVERITY.indexOf(b ?? "");
    if (ia < 0 && ib < 0) return null;
    if (ia < 0) return b ?? null;
    if (ib < 0) return a ?? null;
    return ia >= ib ? a! : b!;
  }

  /* ── Workflow helpers ─────────────────────────────────────────── */
  function getWfStatus(row: { workflowStatus: string | null; status: string }): string {
    if (row.workflowStatus) return row.workflowStatus;
    if (row.status === "Closed") return "Completed";
    if (row.status === "Draft") return "Draft";
    return "Submitted";
  }

  function fmtRow(row: typeof deviationsTable.$inferSelect): Record<string, unknown> {
    const today = new Date().toISOString().split("T")[0];
    return { ...row, isOverdue: row.status !== "Closed" && row.dueDate < today };
  }

  const DEV_FIELD_LABELS: Record<string, string> = {
    title: "Title", deviationType: "Type", location: "Location", description: "Description",
    immediateAction: "Immediate Action", eventDate: "Event Date", detectionDate: "Detection Date",
    priority: "Priority", dueDate: "Due Date", areaResponsible: "Area Responsible",
    investigationLeader: "Investigation Leader", assignedExpert: "Assigned Expert",
    riskManager: "Risk Manager", additionalQA: "Additional QA",
  };

  function buildDevFieldDiff(update: Record<string, unknown>, existing: Record<string, unknown>): string {
    const parts: string[] = [];
    for (const [key, newVal] of Object.entries(update)) {
      const label = DEV_FIELD_LABELS[key];
      if (!label) continue;
      const oldVal = existing[key];
      const oldStr = oldVal != null && oldVal !== "" ? String(oldVal) : "—";
      const newStr = newVal != null && newVal !== "" ? String(newVal) : "—";
      if (oldStr === newStr) continue;
      parts.push(`${label}: "${oldStr}" → "${newStr}"`);
    }
    return parts.join("; ");
  }

  function deviationActionLabel(fields: Record<string, unknown>, existing: Record<string, unknown>, oldStatus?: string): { action: string; details?: string } {
    if ("status" in fields && fields.status !== oldStatus) {
      return { action: "Status Changed", details: `${oldStatus ?? "?"} → ${fields.status}` };
    }
    if ("completionComment" in fields) return { action: "Completion Saved" };
    if ("qaComment" in fields || "requiresInvestigation" in fields) return { action: "QA Acceptance Saved" };
    if ("capaNeeded" in fields || "capaComment" in fields || "erNeeded" in fields || "erComment" in fields) return { action: "CAPA / ER Updated" };
    if ("rootCause" in fields || "rootCauseCategory" in fields || "solvingMethod" in fields || "isRepeatedDeviation" in fields) return { action: "Root Cause Saved" };
    if ("investigation" in fields || "productImpact" in fields || "gxpCompliance" in fields || "gmpComment" in fields) return { action: "Investigation Saved" };
    if ("extendedDate" in fields) return { action: "Due Date Extended", details: `New date: ${fields.extendedDate}` };
    const diff = buildDevFieldDiff(fields, existing);
    return { action: "Record Updated", details: diff || undefined };
  }

  /* ── LIST ─────────────────────────────────────────────────────── */
  router.get("/deviations", async (req, res): Promise<void> => {
    const params = ListDeviationsQueryParams.safeParse(req.query);
    if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

    const { flag, page = 1, pageSize = 20, search } = params.data;
    const offset = ((page ?? 1) - 1) * (pageSize ?? 20);
    const limit = pageSize ?? 20;
    const todayStr = new Date().toISOString().split("T")[0];
    const userName = req.session.userName ?? "";

    const conditions = [];
    if (flag === "overdue") {
      conditions.push(sql`status NOT IN ('Closed')`, lt(deviationsTable.dueDate, todayStr));
    } else if (flag === "todo") {
      conditions.push(
        sql`${deviationsTable.status} NOT IN ('Closed', 'Draft')`,
        or(eq(deviationsTable.areaResponsible, userName), eq(deviationsTable.qaExpert, userName))!
      );
    } else if (flag === "mine") {
      conditions.push(or(eq(deviationsTable.areaResponsible, userName), eq(deviationsTable.qaExpert, userName))!);
    } else if (flag === "plants") {
      conditions.push(sql`${deviationsTable.location} IS NOT NULL AND ${deviationsTable.location} != ''`);
    } else if (flag && flag !== "all") {
      conditions.push(eq(deviationsTable.status, flag));
    }
    if (search) {
      conditions.push(or(ilike(deviationsTable.title, `%${search}%`), ilike(deviationsTable.deviationNumber, `%${search}%`)));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const [countResult] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(deviationsTable).where(where);
    const rows = await db.select().from(deviationsTable).where(where).orderBy(sql`created_at DESC`).limit(limit).offset(offset);

    const data = rows.map(r => ({ ...r, isOverdue: r.status !== "Closed" && r.dueDate < todayStr }));
    res.json(ListDeviationsResponse.parse({ data, total: countResult?.count ?? 0, page: page ?? 1, pageSize: limit }));
  });

  /* ── CREATE ───────────────────────────────────────────────────── */
  router.post("/deviations", async (req, res): Promise<void> => {
    const parsed = CreateDeviationBody.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

    const count = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(deviationsTable);
    const nextNum = (count[0]?.count ?? 0) + 1;
    const year = new Date().getFullYear();
    const deviationNumber = `CPT-${year}-DEV-${String(nextNum).padStart(3, "0")}`;
    const detectionDate = new Date(parsed.data.detectionDate);
    const dueDate = new Date(detectionDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const isDraft = parsed.data.status === "Draft";
    const [row] = await db.insert(deviationsTable).values({
      ...parsed.data,
      deviationNumber,
      dueDate,
      status: parsed.data.status ?? "Open",
      workflowStatus: isDraft ? "Draft" : "Submitted",
    }).returning();

    const status = isDraft ? "Saved as Draft" : "Created";
    logAudit({ req, action: status, module: "Deviation", recordId: row.id, recordNumber: deviationNumber, details: row.title }).catch(() => {});
    res.status(201).json(GetDeviationResponse.parse(fmtRow(row)));
  });

  /* ── COUNTS ───────────────────────────────────────────────────── */
  router.get("/deviations/counts", async (req, res): Promise<void> => {
    const todayStr = new Date().toISOString().split("T")[0];
    const privileged = req.session?.userRoles?.some((r) => r === "QA" || r === "Admin") ?? false;
    const userName = req.session?.userName ?? "";
    const uFilter = privileged ? undefined : or(
      eq(deviationsTable.qaExpert, userName),
      eq(deviationsTable.areaResponsible, userName),
      eq(deviationsTable.investigationLeader, userName),
      eq(deviationsTable.assignedExpert, userName),
    );
    const w = (...extra: (typeof uFilter)[]) => {
      const conds = [uFilter, ...extra].filter((c): c is NonNullable<typeof uFilter> => c !== undefined);
      return conds.length === 0 ? undefined : conds.length === 1 ? conds[0] : and(...conds);
    };

    const [total] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(deviationsTable).where(uFilter);
    const [open] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(deviationsTable).where(w(eq(deviationsTable.status, "Open")));
    const [closed] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(deviationsTable).where(w(eq(deviationsTable.status, "Closed")));
    const [overdue] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(deviationsTable).where(w(sql`status NOT IN ('Closed')`, lt(deviationsTable.dueDate, todayStr)));
    const byTypeRows = await db.select({ label: deviationsTable.deviationType, count: sql<number>`cast(count(*) as int)` }).from(deviationsTable).where(uFilter).groupBy(deviationsTable.deviationType);

    res.json(GetDeviationCountsResponse.parse({
      total: total?.count ?? 0, open: open?.count ?? 0, closed: closed?.count ?? 0, overdue: overdue?.count ?? 0,
      byType: byTypeRows.map(r => ({ label: r.label, count: r.count })),
    }));
  });

  /* ── EXPORT CSV ───────────────────────────────────────────────── */
  router.get("/deviations/export", async (req, res): Promise<void> => {
    const { flag, search } = req.query as { flag?: string; search?: string };
    const todayStr = new Date().toISOString().split("T")[0];
    const userName = req.session.userName ?? "";
    const conditions = [];
    if (flag === "overdue") {
      conditions.push(sql`status NOT IN ('Closed')`, lt(deviationsTable.dueDate, todayStr));
    } else if (flag === "todo") {
      conditions.push(sql`${deviationsTable.status} NOT IN ('Closed', 'Draft')`, or(eq(deviationsTable.areaResponsible, userName), eq(deviationsTable.qaExpert, userName))!);
    } else if (flag === "mine") {
      conditions.push(or(eq(deviationsTable.areaResponsible, userName), eq(deviationsTable.qaExpert, userName))!);
    } else if (flag === "plants") {
      conditions.push(sql`${deviationsTable.location} IS NOT NULL AND ${deviationsTable.location} != ''`);
    } else if (flag && flag !== "all") {
      conditions.push(eq(deviationsTable.status, flag));
    }
    if (search) {
      conditions.push(or(ilike(deviationsTable.title, `%${search}%`), ilike(deviationsTable.deviationNumber, `%${search}%`)));
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const rows = await db.select().from(deviationsTable).where(where).orderBy(sql`created_at DESC`);
    const esc = (v: unknown) => { const s = v == null ? "" : String(v); return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const headers = ["Number","Title","Type","Operation","Status","Workflow Status","Area Responsible","QA Expert","Investigation Leader","Event Date","Detection Date","Due Date","Extended Date","Location","Overdue"];
    const csvRows = rows.map(r => [
      r.deviationNumber, r.title, r.deviationType, r.operation, r.status, getWfStatus(r),
      r.areaResponsible, r.qaExpert, r.investigationLeader, r.eventDate, r.detectionDate,
      r.dueDate, r.extendedDate ?? "", r.location,
      r.status !== "Closed" && r.dueDate < todayStr ? "Yes" : "No",
    ].map(esc).join(","));
    const csv = "\uFEFF" + [headers.join(","), ...csvRows].join("\r\n");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="deviations-${todayStr}.csv"`);
    res.send(csv);
  });

  /* ── GET ONE ──────────────────────────────────────────────────── */
  router.get("/deviations/:id", async (req, res): Promise<void> => {
    const params = GetDeviationParams.safeParse(req.params);
    if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
    const [row] = await db.select().from(deviationsTable).where(eq(deviationsTable.id, params.data.id));
    if (!row) { res.status(404).json({ error: "Deviation not found" }); return; }
    res.json(GetDeviationResponse.parse(fmtRow(row)));
  });

  /* ── UPDATE (PATCH) ───────────────────────────────────────────── */
  router.patch("/deviations/:id", async (req, res): Promise<void> => {
    const params = UpdateDeviationParams.safeParse(req.params);
    if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
    const parsed = UpdateDeviationBody.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

    const update: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(parsed.data)) { if (v !== undefined) update[k] = v; }

    const [existing] = await db.select().from(deviationsTable).where(eq(deviationsTable.id, params.data.id));
    const [row] = await db.update(deviationsTable).set(update).where(eq(deviationsTable.id, params.data.id)).returning();
    if (!row) { res.status(404).json({ error: "Deviation not found" }); return; }

    const { action, details } = deviationActionLabel(update, existing as unknown as Record<string, unknown> ?? {}, existing?.status);
    logAudit({ req, action, module: "Deviation", recordId: row.id, recordNumber: row.deviationNumber, details }).catch(() => {});
    res.json(UpdateDeviationResponse.parse(fmtRow(row)));
  });

  router.get("/deviations/:id/status-counts", async (req, res): Promise<void> => {
    const params = GetDeviationStatusCountsParams.safeParse(req.params);
    if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
    const todayStr = new Date().toISOString().split("T")[0];
    const rows = await db.select({
      status: deviationsTable.status,
      dueDate: deviationsTable.dueDate,
    }).from(deviationsTable);
    const open = rows.filter((r) => r.status === "Open").length;
    const inProgress = rows.filter((r) => r.status === "In Progress").length;
    const closed = rows.filter((r) => r.status === "Closed").length;
    const overdue = rows.filter((r) => r.status !== "Closed" && r.dueDate !== null && r.dueDate < todayStr).length;
    res.json(GetDeviationStatusCountsResponse.parse({ open, inProgress, closed, overdue }));
  });

  /* ═══════════════════════════════════════════════════════════════
     WORKFLOW TRANSITION ENDPOINTS
  ═══════════════════════════════════════════════════════════════ */

  async function fetchDev(id: number) {
    const [row] = await db.select().from(deviationsTable).where(eq(deviationsTable.id, id));
    return row ?? null;
  }

  async function advanceWf(
    id: number,
    newWfStatus: string,
    extraFields: Record<string, unknown> = {},
    newStatus?: string
  ) {
    const set: Record<string, unknown> = { workflowStatus: newWfStatus, ...extraFields };
    if (newStatus) set.status = newStatus;
    const [row] = await db.update(deviationsTable).set(set).where(eq(deviationsTable.id, id)).returning();
    return row!;
  }

  /* POST /deviations/:id/submit — any user, Draft → Submitted */
  router.post("/deviations/:id/submit", async (req, res): Promise<void> => {
    if (!req.session.userId) { res.status(401).json({ error: "Not authenticated" }); return; }
    const id = parseInt(req.params.id, 10);
    const dev = await fetchDev(id);
    if (!dev) { res.status(404).json({ error: "Not found" }); return; }
    const wfs = getWfStatus(dev);
    if (!["Draft", "Area_Rejected", "QA_Rejected"].includes(wfs)) {
      res.status(400).json({ error: `Cannot submit from state: ${wfs}` }); return;
    }
    const row = await advanceWf(id, "Submitted", {}, dev.status === "Draft" ? "Open" : undefined);
    logAudit({ req, action: "Deviation Submitted", module: "Deviation", recordId: id, recordNumber: dev.deviationNumber, details: `Submitted by ${req.session.userName ?? "?"}` }).catch(() => {});
    res.json(fmtRow(row));
  });

  /* POST /deviations/:id/area-accept — area responsible */
  router.post("/deviations/:id/area-accept", async (req, res): Promise<void> => {
    if (!req.session.userId) { res.status(401).json({ error: "Not authenticated" }); return; }
    const id = parseInt(req.params.id, 10);
    const dev = await fetchDev(id);
    if (!dev) { res.status(404).json({ error: "Not found" }); return; }
    const wfs = getWfStatus(dev);
    if (!["Submitted", "Area_Rejected"].includes(wfs)) {
      res.status(400).json({ error: `Cannot accept from state: ${wfs}` }); return;
    }
    const isAreaResp = req.session.userName === dev.areaResponsible;
    if (!isAreaResp) { res.status(403).json({ error: "Only the Area Responsible can accept this deviation" }); return; }
    const { eventPriority, areaResponsibleComment } = req.body ?? {};
    const row = await advanceWf(id, "Area_Accepted", { ...(eventPriority ? { eventPriority } : {}), ...(areaResponsibleComment !== undefined ? { areaResponsibleComment } : {}) });
    logAudit({ req, action: "Area Accepted", module: "Deviation", recordId: id, recordNumber: dev.deviationNumber, details: `Accepted by ${req.session.userName ?? "?"}` }).catch(() => {});
    res.json(fmtRow(row));
  });

  /* POST /deviations/:id/area-reject — area responsible */
  router.post("/deviations/:id/area-reject", async (req, res): Promise<void> => {
    if (!req.session.userId) { res.status(401).json({ error: "Not authenticated" }); return; }
    const id = parseInt(req.params.id, 10);
    const dev = await fetchDev(id);
    if (!dev) { res.status(404).json({ error: "Not found" }); return; }
    const wfs = getWfStatus(dev);
    if (wfs !== "Submitted") { res.status(400).json({ error: `Cannot reject from state: ${wfs}` }); return; }
    const isAreaResp = req.session.userName === dev.areaResponsible;
    if (!isAreaResp) { res.status(403).json({ error: "Only the Area Responsible can reject this deviation" }); return; }
    const { reason, areaResponsibleComment } = req.body ?? {};
    if (!reason) { res.status(400).json({ error: "Rejection reason is required" }); return; }
    const row = await advanceWf(id, "Area_Rejected", { areaRejectReason: reason, ...(areaResponsibleComment !== undefined ? { areaResponsibleComment } : {}) });
    logAudit({ req, action: "Area Rejected", module: "Deviation", recordId: id, recordNumber: dev.deviationNumber, details: `Rejected by ${req.session.userName ?? "?"}: ${reason}` }).catch(() => {});
    res.json(fmtRow(row));
  });

  /* POST /deviations/:id/qa-accept — Assigned QA Expert only */
  router.post("/deviations/:id/qa-accept", async (req, res): Promise<void> => {
    if (!req.session.userId) { res.status(401).json({ error: "Not authenticated" }); return; }
    const id = parseInt(req.params.id, 10);
    const dev = await fetchDev(id);
    if (!dev) { res.status(404).json({ error: "Not found" }); return; }
    const wfs = getWfStatus(dev);
    if (!["Area_Accepted", "QA_Rejected"].includes(wfs)) {
      res.status(400).json({ error: `Cannot QA-accept from state: ${wfs}` }); return;
    }
    if (req.session.userName !== dev.qaExpert) {
      res.status(403).json({ error: "Only the assigned QA Expert can accept this deviation" }); return;
    }
    const { requiresInvestigation, qaComment } = req.body ?? {};
    const row = await advanceWf(id, "QA_Accepted", {
      ...(requiresInvestigation !== undefined ? { requiresInvestigation } : {}),
      ...(qaComment !== undefined ? { qaComment } : {}),
    });
    logAudit({ req, action: "QA Accepted", module: "Deviation", recordId: id, recordNumber: dev.deviationNumber, details: `QA accepted by ${req.session.userName ?? "?"}` }).catch(() => {});
    res.json(fmtRow(row));
  });

  /* POST /deviations/:id/delegate-qa — QA role, reassign QA Expert when original is unavailable */
  router.post("/deviations/:id/delegate-qa", async (req, res): Promise<void> => {
    if (!req.session.userId) { res.status(401).json({ error: "Not authenticated" }); return; }
    const id = parseInt(req.params.id, 10);
    const dev = await fetchDev(id);
    if (!dev) { res.status(404).json({ error: "Not found" }); return; }
    const wfs = getWfStatus(dev);
    if (!["Area_Accepted", "QA_Rejected"].includes(wfs)) {
      res.status(400).json({ error: `Cannot delegate QA Expert from state: ${wfs}` }); return;
    }
    if (!(req.session.userRoles ?? []).includes("QA")) {
      res.status(403).json({ error: "Only a QA user can delegate the QA Expert" }); return;
    }
    const { qaExpert } = req.body ?? {};
    if (!qaExpert || typeof qaExpert !== "string") { res.status(400).json({ error: "qaExpert name is required" }); return; }
    const [row] = await db.update(deviationsTable).set({ qaExpert }).where(eq(deviationsTable.id, id)).returning();
    logAudit({ req, action: "QA Expert Delegated", module: "Deviation", recordId: id, recordNumber: dev.deviationNumber, details: `Delegated from ${dev.qaExpert ?? "—"} to ${qaExpert} by ${req.session.userName ?? "?"}` }).catch(() => {});
    res.json(fmtRow(row));
  });

  /* POST /deviations/:id/delegate-area-responsible — QA role */
  router.post("/deviations/:id/delegate-area-responsible", async (req, res): Promise<void> => {
    if (!req.session.userId) { res.status(401).json({ error: "Not authenticated" }); return; }
    const id = parseInt(req.params.id, 10);
    const dev = await fetchDev(id);
    if (!dev) { res.status(404).json({ error: "Not found" }); return; }
    const wfs = getWfStatus(dev);
    if (wfs === "Completed" || wfs === "Draft") {
      res.status(400).json({ error: `Cannot delegate Area Responsible from state: ${wfs}` }); return;
    }
    if (!(req.session.userRoles ?? []).includes("QA")) {
      res.status(403).json({ error: "Only a QA user can delegate the Area Responsible" }); return;
    }
    const { areaResponsible } = req.body ?? {};
    if (!areaResponsible || typeof areaResponsible !== "string") { res.status(400).json({ error: "areaResponsible name is required" }); return; }
    const [row] = await db.update(deviationsTable).set({ areaResponsible }).where(eq(deviationsTable.id, id)).returning();
    logAudit({ req, action: "Area Responsible Delegated", module: "Deviation", recordId: id, recordNumber: dev.deviationNumber, details: `Delegated from ${dev.areaResponsible ?? "—"} to ${areaResponsible} by ${req.session.userName ?? "?"}` }).catch(() => {});
    res.json(fmtRow(row));
  });

  /* POST /deviations/:id/delegate-investigation-leader — QA role */
  router.post("/deviations/:id/delegate-investigation-leader", async (req, res): Promise<void> => {
    if (!req.session.userId) { res.status(401).json({ error: "Not authenticated" }); return; }
    const id = parseInt(req.params.id, 10);
    const dev = await fetchDev(id);
    if (!dev) { res.status(404).json({ error: "Not found" }); return; }
    const wfs = getWfStatus(dev);
    const LEADER_STATES = ["Roles_Assigned", "Investigation_Submitted", "Risk_Mgmt_Submitted", "Root_Cause_Submitted", "CAPA_ER_Submitted"];
    if (!LEADER_STATES.includes(wfs)) {
      res.status(400).json({ error: `Cannot delegate Investigation Leader from state: ${wfs}` }); return;
    }
    if (!(req.session.userRoles ?? []).includes("QA")) {
      res.status(403).json({ error: "Only a QA user can delegate the Investigation Leader" }); return;
    }
    const { investigationLeader } = req.body ?? {};
    if (!investigationLeader || typeof investigationLeader !== "string") { res.status(400).json({ error: "investigationLeader name is required" }); return; }
    const [row] = await db.update(deviationsTable).set({ investigationLeader }).where(eq(deviationsTable.id, id)).returning();
    logAudit({ req, action: "Investigation Leader Delegated", module: "Deviation", recordId: id, recordNumber: dev.deviationNumber, details: `Delegated from ${dev.investigationLeader ?? "—"} to ${investigationLeader} by ${req.session.userName ?? "?"}` }).catch(() => {});
    res.json(fmtRow(row));
  });

  /* POST /deviations/:id/qa-reject — QA role */
  router.post("/deviations/:id/qa-reject", async (req, res): Promise<void> => {
    if (!req.session.userId) { res.status(401).json({ error: "Not authenticated" }); return; }
    const id = parseInt(req.params.id, 10);
    const dev = await fetchDev(id);
    if (!dev) { res.status(404).json({ error: "Not found" }); return; }
    const wfs = getWfStatus(dev);
    if (wfs !== "Area_Accepted") { res.status(400).json({ error: `Cannot QA-reject from state: ${wfs}` }); return; }
    if (!(req.session.userRoles ?? []).includes("QA")) { res.status(403).json({ error: "Only a QA user can reject" }); return; }
    const { reason, qaComment } = req.body ?? {};
    if (!reason) { res.status(400).json({ error: "Rejection reason is required" }); return; }
    const row = await advanceWf(id, "QA_Rejected", { qaRejectReason: reason, ...(qaComment !== undefined ? { qaComment } : {}) });
    logAudit({ req, action: "QA Rejected", module: "Deviation", recordId: id, recordNumber: dev.deviationNumber, details: `QA rejected by ${req.session.userName ?? "?"}: ${reason}` }).catch(() => {});
    res.json(fmtRow(row));
  });

  /* POST /deviations/:id/submit-roles — QA role */
  router.post("/deviations/:id/submit-roles", async (req, res): Promise<void> => {
    if (!req.session.userId) { res.status(401).json({ error: "Not authenticated" }); return; }
    const id = parseInt(req.params.id, 10);
    const dev = await fetchDev(id);
    if (!dev) { res.status(404).json({ error: "Not found" }); return; }
    if (getWfStatus(dev) !== "QA_Accepted") { res.status(400).json({ error: "Roles can only be assigned after QA acceptance" }); return; }
    if (!(req.session.userRoles ?? []).includes("QA")) { res.status(403).json({ error: "Only a QA user can assign roles" }); return; }
    const { investigationLeader, assignedExpert, riskManager, assignedAdditionalQa } = req.body ?? {};
    const row = await advanceWf(id, "Roles_Assigned", {
      ...(investigationLeader !== undefined ? { investigationLeader } : {}),
      ...(assignedExpert !== undefined ? { assignedExpert } : {}),
      ...(riskManager !== undefined ? { riskManager } : {}),
      ...(assignedAdditionalQa !== undefined ? { assignedAdditionalQa } : {}),
    });
    logAudit({ req, action: "Roles Assigned", module: "Deviation", recordId: id, recordNumber: dev.deviationNumber, details: `By ${req.session.userName ?? "?"}. Leader: ${investigationLeader ?? "—"}` }).catch(() => {});
    res.json(fmtRow(row));
  });

  /* POST /deviations/:id/submit-investigation — QA Expert */
  router.post("/deviations/:id/submit-investigation", async (req, res): Promise<void> => {
    if (!req.session.userId) { res.status(401).json({ error: "Not authenticated" }); return; }
    const id = parseInt(req.params.id, 10);
    const dev = await fetchDev(id);
    if (!dev) { res.status(404).json({ error: "Not found" }); return; }
    if (getWfStatus(dev) !== "Roles_Assigned") { res.status(400).json({ error: "Investigation can only be submitted after roles are assigned" }); return; }
    const isQAExpert = req.session.userName === dev.qaExpert;
    const isQA = (req.session.userRoles ?? []).includes("QA");
    if (!isQAExpert && !isQA) { res.status(403).json({ error: "Only the QA Expert can submit the investigation" }); return; }
    const { investigation, productImpact, gxpCompliance, gmpComment, extendedDate, extendedDateComment, barrier, secondBarrier, teamMembers } = req.body ?? {};
    const computedPriority = computeEventPriority(
      productImpact ?? dev.productImpact,
      gxpCompliance ?? dev.gxpCompliance
    );
    const row = await advanceWf(id, "Investigation_Submitted", {
      ...(investigation !== undefined ? { investigation } : {}),
      ...(productImpact !== undefined ? { productImpact } : {}),
      ...(gxpCompliance !== undefined ? { gxpCompliance } : {}),
      ...(gmpComment !== undefined ? { gmpComment } : {}),
      ...(extendedDate !== undefined ? { extendedDate } : {}),
      ...(extendedDateComment !== undefined ? { extendedDateComment } : {}),
      ...(barrier !== undefined ? { barrier } : {}),
      ...(secondBarrier !== undefined ? { secondBarrier } : {}),
      ...(teamMembers !== undefined ? { teamMembers } : {}),
      ...(computedPriority ? { eventPriority: computedPriority } : {}),
    });
    logAudit({ req, action: "Investigation Submitted", module: "Deviation", recordId: id, recordNumber: dev.deviationNumber, details: `By ${req.session.userName ?? "?"}` }).catch(() => {});
    res.json(fmtRow(row));
  });

  /* POST /deviations/:id/submit-risk-management — QA role */
  router.post("/deviations/:id/submit-risk-management", async (req, res): Promise<void> => {
    if (!req.session.userId) { res.status(401).json({ error: "Not authenticated" }); return; }
    const id = parseInt(req.params.id, 10);
    const dev = await fetchDev(id);
    if (!dev) { res.status(404).json({ error: "Not found" }); return; }
    if (getWfStatus(dev) !== "Investigation_Submitted") { res.status(400).json({ error: "Risk management can only be submitted after investigation" }); return; }
    if (!(req.session.userRoles ?? []).includes("QA")) { res.status(403).json({ error: "Only a QA user can submit risk management" }); return; }
    const { rmPotentialRisk, rmComment } = req.body ?? {};
    const row = await advanceWf(id, "Risk_Mgmt_Submitted", {
      ...(rmPotentialRisk !== undefined ? { rmPotentialRisk } : {}),
      ...(rmComment !== undefined ? { rmComment } : {}),
    });
    logAudit({ req, action: "Risk Management Submitted", module: "Deviation", recordId: id, recordNumber: dev.deviationNumber, details: `By ${req.session.userName ?? "?"}` }).catch(() => {});
    res.json(fmtRow(row));
  });

  /* POST /deviations/:id/submit-root-cause — Investigation Leader, Area Responsible, QA Expert, or QA role */
  router.post("/deviations/:id/submit-root-cause", async (req, res): Promise<void> => {
    if (!req.session.userId) { res.status(401).json({ error: "Not authenticated" }); return; }
    const id = parseInt(req.params.id, 10);
    const dev = await fetchDev(id);
    if (!dev) { res.status(404).json({ error: "Not found" }); return; }
    if (getWfStatus(dev) !== "Risk_Mgmt_Submitted") { res.status(400).json({ error: "Root cause can only be submitted after risk management" }); return; }
    const uname = req.session.userName ?? "";
    const isLeader = !!dev.investigationLeader && uname === dev.investigationLeader;
    const isExpert = !!dev.assignedExpert && uname === dev.assignedExpert;
    if (!isLeader && !isExpert) { res.status(403).json({ error: "Only the Investigation Leader or Assigned Expert can submit root cause" }); return; }
    const { rootCauseCategory, rootCause, solvingMethod, isRepeatedDeviation, repeatedDeviationComment } = req.body ?? {};
    const row = await advanceWf(id, "Root_Cause_Submitted", {
      ...(rootCauseCategory !== undefined ? { rootCauseCategory } : {}),
      ...(rootCause !== undefined ? { rootCause } : {}),
      ...(solvingMethod !== undefined ? { solvingMethod } : {}),
      ...(isRepeatedDeviation !== undefined ? { isRepeatedDeviation } : {}),
      ...(repeatedDeviationComment !== undefined ? { repeatedDeviationComment } : {}),
    });
    logAudit({ req, action: "Root Cause Submitted", module: "Deviation", recordId: id, recordNumber: dev.deviationNumber, details: `By ${req.session.userName ?? "?"}` }).catch(() => {});
    res.json(fmtRow(row));
  });

  /* POST /deviations/:id/submit-capa-er — QA or QA Expert */
  router.post("/deviations/:id/submit-capa-er", async (req, res): Promise<void> => {
    if (!req.session.userId) { res.status(401).json({ error: "Not authenticated" }); return; }
    const id = parseInt(req.params.id, 10);
    const dev = await fetchDev(id);
    if (!dev) { res.status(404).json({ error: "Not found" }); return; }
    if (getWfStatus(dev) !== "Root_Cause_Submitted") { res.status(400).json({ error: "CAPA & ER can only be submitted after root cause" }); return; }
    const isQA = (req.session.userRoles ?? []).includes("QA");
    const isQAExpert = req.session.userName === dev.qaExpert;
    if (!isQA && !isQAExpert) { res.status(403).json({ error: "Only a QA user or the QA Expert can submit CAPA & ER requirements" }); return; }
    const { capaNeeded, capaComment, erNeeded, erComment } = req.body ?? {};
    const row = await advanceWf(id, "CAPA_ER_Submitted", {
      ...(capaNeeded !== undefined ? { capaNeeded } : {}),
      ...(capaComment !== undefined ? { capaComment } : {}),
      ...(erNeeded !== undefined ? { erNeeded } : {}),
      ...(erComment !== undefined ? { erComment } : {}),
    });
    logAudit({ req, action: "CAPA & ER Submitted", module: "Deviation", recordId: id, recordNumber: dev.deviationNumber, details: `By ${req.session.userName ?? "?"}` }).catch(() => {});
    res.json(fmtRow(row));
  });

  /* POST /deviations/:id/complete — QA Expert */
  router.post("/deviations/:id/complete", async (req, res): Promise<void> => {
    if (!req.session.userId) { res.status(401).json({ error: "Not authenticated" }); return; }
    const id = parseInt(req.params.id, 10);
    const dev = await fetchDev(id);
    if (!dev) { res.status(404).json({ error: "Not found" }); return; }
    if (getWfStatus(dev) !== "CAPA_ER_Submitted") { res.status(400).json({ error: "Deviation can only be completed after CAPA & ER submission" }); return; }
    const isQAExpert = req.session.userName === dev.qaExpert;
    const isQA = (req.session.userRoles ?? []).includes("QA");
    if (!isQAExpert && !isQA) { res.status(403).json({ error: "Only the QA Expert can complete the deviation" }); return; }
    const { completionComment } = req.body ?? {};
    const row = await advanceWf(id, "Completed", { ...(completionComment !== undefined ? { completionComment } : {}) }, "Closed");
    logAudit({ req, action: "Deviation Completed", module: "Deviation", recordId: id, recordNumber: dev.deviationNumber, details: `Completed by ${req.session.userName ?? "?"}` }).catch(() => {});
    res.json(fmtRow(row));
  });

  /* ── SIMILAR DEVIATIONS ───────────────────────────────────────── */
  // Extract meaningful keywords from a title for overlap scoring.
  // Strips stop-words and short tokens; returns lowercased unique set.
  function titleKeywords(title: string): Set<string> {
    const STOP = new Set(["a","an","the","in","of","for","on","at","by","is","was","to","and","or","with","from","this","that","due","as","be","not","no","n/a","other","high","low"]);
    return new Set(
      title.toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter(w => w.length >= 3 && !STOP.has(w))
    );
  }

  router.get("/deviations/:id/similar", async (req, res): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
    const dev = await fetchDev(id);
    if (!dev) { res.status(404).json({ error: "Not found" }); return; }

    // Need at least a title to run meaningful similarity matching
    if (!dev.title) {
      res.json({ count: 0, items: [] }); return;
    }

    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - 1);
    const cutoffDate = cutoff.toISOString().split("T")[0];

    // Parse current deviation's equipment list (stored as JSON array)
    let devEquipment: string[] = [];
    try { devEquipment = dev.equipment ? JSON.parse(dev.equipment) : []; } catch { devEquipment = []; }

    // Fetch all other deviations within the past 12 months
    const candidates = await db.select({
      id: deviationsTable.id,
      deviationNumber: deviationsTable.deviationNumber,
      title: deviationsTable.title,
      deviationType: deviationsTable.deviationType,
      location: deviationsTable.location,
      equipment: deviationsTable.equipment,
      rootCauseCategory: deviationsTable.rootCauseCategory,
      areaResponsible: deviationsTable.areaResponsible,
      operation: deviationsTable.operation,
      eventDate: deviationsTable.eventDate,
      status: deviationsTable.status,
      workflowStatus: deviationsTable.workflowStatus,
    }).from(deviationsTable).where(
      and(ne(deviationsTable.id, id), gte(deviationsTable.eventDate, cutoffDate))
    ).orderBy(sql`event_date DESC`);

    const devKeywords = titleKeywords(dev.title ?? "");

    // Score each candidate: count how many specific fields match
    const scored = candidates.map(c => {
      const matchedFields: string[] = [];

      if (dev.deviationType && c.deviationType === dev.deviationType)
        matchedFields.push("Deviation Type");

      if (dev.location && c.location && c.location !== "N/A" && dev.location !== "N/A" && c.location === dev.location)
        matchedFields.push("Location");

      // Equipment: match if any specific equipment item overlaps
      let cEquipment: string[] = [];
      try { cEquipment = c.equipment ? JSON.parse(c.equipment) : []; } catch { cEquipment = []; }
      const equipmentOverlap = devEquipment.filter(e => cEquipment.includes(e));
      if (devEquipment.length > 0 && equipmentOverlap.length > 0)
        matchedFields.push(`Equipment (${equipmentOverlap.join(", ")})`);

      if (dev.rootCauseCategory && c.rootCauseCategory && c.rootCauseCategory === dev.rootCauseCategory)
        matchedFields.push("Root Cause Category");

      if (dev.areaResponsible && c.areaResponsible && c.areaResponsible === dev.areaResponsible)
        matchedFields.push("Area Responsible");

      if (dev.operation && c.operation && c.operation === dev.operation)
        matchedFields.push("Operation");

      // Title keyword overlap: score if 2+ meaningful words are shared
      const cKeywords = titleKeywords(c.title ?? "");
      const sharedKeywords = [...devKeywords].filter(w => cKeywords.has(w));
      if (sharedKeywords.length >= 2)
        matchedFields.push(`Title Keywords (${sharedKeywords.slice(0, 3).join(", ")})`);

      return { ...c, matchScore: matchedFields.length, matchedFields };
    }).filter(c => {
      const hasTypeMatch = c.matchedFields.includes("Deviation Type");
      const hasKeywordMatch = c.matchedFields.some(f => f.startsWith("Title Keywords"));
      // Surface if: type + 1 other field, OR 3+ structural fields, OR keyword overlap + 1 structural field
      return (hasTypeMatch && c.matchScore >= 2) || c.matchScore >= 3 || (hasKeywordMatch && c.matchScore >= 2);
    }).sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10);

    res.json({ count: scored.length, items: scored });
  });

  /* ── RELATED DEVIATIONS ───────────────────────────────────────── */
  const relDev = alias(deviationsTable, "rel_dev");

  router.get("/deviations/:id/related", async (req, res): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

    const fwd = await db.select({
      id: deviationLinksTable.id,
      deviationId: deviationLinksTable.deviationId,
      relatedDeviationId: deviationLinksTable.relatedDeviationId,
      relatedDeviationNumber: deviationsTable.deviationNumber,
      relatedTitle: deviationsTable.title,
      relatedStatus: deviationsTable.status,
      relatedWorkflowStatus: deviationsTable.workflowStatus,
      createdAt: deviationLinksTable.createdAt,
    }).from(deviationLinksTable)
      .innerJoin(deviationsTable, eq(deviationLinksTable.relatedDeviationId, deviationsTable.id))
      .where(eq(deviationLinksTable.deviationId, id));

    const rev = await db.select({
      id: deviationLinksTable.id,
      deviationId: deviationLinksTable.deviationId,
      relatedDeviationId: deviationLinksTable.relatedDeviationId,
      relatedDeviationNumber: relDev.deviationNumber,
      relatedTitle: relDev.title,
      relatedStatus: relDev.status,
      relatedWorkflowStatus: relDev.workflowStatus,
      createdAt: deviationLinksTable.createdAt,
    }).from(deviationLinksTable)
      .innerJoin(relDev, eq(deviationLinksTable.deviationId, relDev.id))
      .where(eq(deviationLinksTable.relatedDeviationId, id));

    const combined = [
      ...fwd.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })),
      ...rev.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })),
    ];
    res.json(combined);
  });

  router.post("/deviations/:id/related", async (req, res): Promise<void> => {
    if (!req.session.userId) { res.status(401).json({ error: "Not authenticated" }); return; }
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
    const relatedDeviationId = parseInt(req.body?.relatedDeviationId, 10);
    if (isNaN(relatedDeviationId)) { res.status(400).json({ error: "relatedDeviationId is required" }); return; }
    if (id === relatedDeviationId) { res.status(400).json({ error: "Cannot link a deviation to itself" }); return; }

    const [target] = await db.select().from(deviationsTable).where(eq(deviationsTable.id, relatedDeviationId));
    if (!target) { res.status(404).json({ error: "Related deviation not found" }); return; }
    const [source] = await db.select().from(deviationsTable).where(eq(deviationsTable.id, id));
    if (!source) { res.status(404).json({ error: "Deviation not found" }); return; }

    const [row] = await db.insert(deviationLinksTable).values({ deviationId: id, relatedDeviationId }).onConflictDoNothing().returning();
    if (!row) { res.status(409).json({ error: "Link already exists" }); return; }

    logAudit({ req, action: "Related Deviation Linked", module: "Deviation", recordId: id, recordNumber: source.deviationNumber, details: `Linked to ${target.deviationNumber}` }).catch(() => {});
    res.status(201).json({ ...row, relatedDeviationNumber: target.deviationNumber, relatedTitle: target.title, relatedStatus: target.status, relatedWorkflowStatus: target.workflowStatus, createdAt: row.createdAt.toISOString() });
  });

  router.delete("/deviations/:id/related/:relatedId", async (req, res): Promise<void> => {
    if (!req.session.userId) { res.status(401).json({ error: "Not authenticated" }); return; }
    const id = parseInt(req.params.id, 10);
    const relatedId = parseInt(req.params.relatedId, 10);
    if (isNaN(id) || isNaN(relatedId)) { res.status(400).json({ error: "Invalid ids" }); return; }

    const [source] = await db.select().from(deviationsTable).where(eq(deviationsTable.id, id));

    await db.delete(deviationLinksTable).where(
      or(
        and(eq(deviationLinksTable.deviationId, id), eq(deviationLinksTable.relatedDeviationId, relatedId))!,
        and(eq(deviationLinksTable.deviationId, relatedId), eq(deviationLinksTable.relatedDeviationId, id))!
      )!
    );
    if (source) logAudit({ req, action: "Related Deviation Unlinked", module: "Deviation", recordId: id, recordNumber: source.deviationNumber, details: `Unlinked deviation id ${relatedId}` }).catch(() => {});
    res.status(204).end();
  });

  /* ── GENERATE CAPA ────────────────────────────────────────────── */
  router.post("/deviations/:id/generate-capa", async (req, res): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

    const [deviation] = await db.select().from(deviationsTable).where(eq(deviationsTable.id, id));
    if (!deviation) { res.status(404).json({ error: "Deviation not found" }); return; }

    const isQAExpert = req.session.userName === deviation.qaExpert;
    const isQA = (req.session.userRoles ?? []).includes("QA");
    if (!isQAExpert && !isQA) { res.status(403).json({ error: "Only the QA Expert or QA can generate a CAPA" }); return; }

    const [existing] = await db.select().from(capaTable).where(eq(capaTable.deviationId, id));
    if (existing) {
      const todayStr = new Date().toISOString().split("T")[0];
      res.status(409).json({
        error: "A CAPA already exists for this deviation",
        existing: { ...existing, deviationNumber: deviation.deviationNumber, isOverdue: existing.status !== "Closed" && existing.initialPlannedDate < todayStr },
      });
      return;
    }

    const count = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(capaTable);
    const nextNum = (count[0]?.count ?? 0) + 1;
    const capaYear = new Date().getFullYear();
    const capaNumber = `CPT-${capaYear}-CAPA-${String(nextNum).padStart(3, "0")}`;
    const todayStr = new Date().toISOString().split("T")[0];
    const dueDate30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    // Default implementation leader: first active user whose roles include "User"
    // but do NOT include "QA" or "Admin" — the designated non-QA implementer.
    // Falls back to the deviation's QA Expert if no such user exists.
    const implLeaderUser = await db
      .select({ name: usersTable.name })
      .from(usersTable)
      .where(sql`'User' = ANY(${usersTable.roles}) AND NOT ('QA' = ANY(${usersTable.roles})) AND NOT ('Admin' = ANY(${usersTable.roles})) AND ${usersTable.status} = 'active'`)
      .limit(1);
    const defaultImplLeader = implLeaderUser[0]?.name ?? deviation.qaExpert;

    const [row] = await db.insert(capaTable).values({
      capaNumber,
      deviationId: id,
      title: `CAPA for ${deviation.deviationNumber}: ${deviation.title}`,
      description: `Corrective and preventive action generated from deviation ${deviation.deviationNumber}.`,
      capaType: "Corrective",
      status: "Draft",
      workflowStatus: "Draft",
      creationDate: todayStr,
      initialPlannedDate: dueDate30,
      implementationLeader: defaultImplLeader,
      location: deviation.areaResponsible,
    }).returning();

    logAudit({ req, action: "CAPA Generated", module: "Deviation", recordId: id, recordNumber: deviation.deviationNumber, details: capaNumber }).catch(() => {});
    logAudit({ req, action: "Created", module: "CAPA", recordId: row.id, recordNumber: capaNumber, details: `Auto-generated from ${deviation.deviationNumber}` }).catch(() => {});
    res.status(201).json({ ...row, deviationNumber: deviation.deviationNumber, isOverdue: false });
  });

  router.get("/deviations/:id/traceability-report", async (req, res): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

    const [deviation] = await db.select().from(deviationsTable).where(eq(deviationsTable.id, id));
    if (!deviation) { res.status(404).json({ error: "Not found" }); return; }

    const capas = await db.select().from(capaTable)
      .where(eq(capaTable.deviationId, id))
      .orderBy(capaTable.capaNumber);

    const capaIds = capas.map(c => c.id);

    const efficacyReviews = capaIds.length > 0
      ? await db.select().from(efficacyReviewsTable)
          .where(inArray(efficacyReviewsTable.capaId, capaIds))
          .orderBy(efficacyReviewsTable.capaId, efficacyReviewsTable.round)
      : [];

    const ccWhere = capaIds.length > 0
      ? or(eq(changeControlTable.deviationId, id), inArray(changeControlTable.capaId, capaIds))
      : eq(changeControlTable.deviationId, id);

    const changeControls = await db.select().from(changeControlTable)
      .where(ccWhere)
      .orderBy(changeControlTable.changeControlNumber);

    const ccIds = changeControls.map(c => c.id);

    const expertReviews = ccIds.length > 0
      ? await db.select().from(ccExpertReviewsTable)
          .where(inArray(ccExpertReviewsTable.changeControlId, ccIds))
          .orderBy(ccExpertReviewsTable.changeControlId, ccExpertReviewsTable.id)
      : [];

    const workPlans = ccIds.length > 0
      ? await db.select().from(ccWorkPlansTable)
          .where(inArray(ccWorkPlansTable.changeControlId, ccIds))
          .orderBy(ccWorkPlansTable.changeControlId, ccWorkPlansTable.id)
      : [];

    res.json({ deviation, capas, efficacyReviews, changeControls, expertReviews, workPlans });
  });

  export default router;
  