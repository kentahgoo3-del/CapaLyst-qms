import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  riskAssessmentsTable,
  fmeaEntriesTable,
  raTeamMembersTable,
  raCommunicationLogTable,
  raReviewReportsTable,
  raModuleLinksTable,
  capaTable,
  changeControlTable,
} from "@workspace/db";
import { sql, eq, ilike, or, and, desc } from "drizzle-orm";
import {
  ListRiskAssessmentsQueryParams,
  ListRiskAssessmentsResponse,
  CreateRiskAssessmentBody,
  GetRiskAssessmentParams,
  GetRiskAssessmentResponse,
  UpdateRiskAssessmentParams,
  UpdateRiskAssessmentBody,
  UpdateRiskAssessmentResponse,
  SubmitRiskAssessmentParams,
  SubmitRiskAssessmentResponse,
  ApproveRiskAssessmentParams,
  ApproveRiskAssessmentResponse,
  RejectRiskAssessmentParams,
  RejectRiskAssessmentBody,
  RejectRiskAssessmentResponse,
  CloseRiskAssessmentParams,
  CloseRiskAssessmentResponse,
  ListFmeaEntriesParams,
  ListFmeaEntriesResponse,
  CreateFmeaEntryParams,
  CreateFmeaEntryBody,
  UpdateFmeaEntryParams,
  UpdateFmeaEntryBody,
  UpdateFmeaEntryResponse,
  DeleteFmeaEntryParams,
  GetRiskMasterPlanResponse,
  ListRaTeamMembersParams,
  ListRaTeamMembersResponse,
  AddRaTeamMemberParams,
  AddRaTeamMemberBody,
  DeleteRaTeamMemberParams,
  AcknowledgeRaTeamMemberParams,
  AcknowledgeRaTeamMemberResponse,
  ListRaCommunicationLogParams,
  ListRaCommunicationLogResponse,
  AddRaCommunicationEntryParams,
  AddRaCommunicationEntryBody,
  DeleteRaCommunicationEntryParams,
  ListRaReviewReportsParams,
  ListRaReviewReportsResponse,
  CreateRaReviewReportParams,
  CreateRaReviewReportBody,
  UpdateRaReviewReportParams,
  UpdateRaReviewReportBody,
  ListRaLinksParams,
  ListRaLinksResponse,
  AddRaLinkParams,
  AddRaLinkBody,
  DeleteRaLinkParams,
  ClassifyRiskAssessmentParams,
  ClassifyRiskAssessmentBody,
  ClassifyRiskAssessmentResponse,
  ReAssessRiskAssessmentParams,
  GenerateCapaFromEntryParams,
  GenerateCcFromEntryParams,
} from "@workspace/api-zod";
import { logAudit } from "./audit.js";

const router: IRouter = Router();

// ─── SOP-aligned scoring (SOPPQA016 v05) ────────────────────────────────────
// S (Severity)   = {1, 2, 4, 8}  Negligible / Minor / Major / Major+Recall
// P (Probability)= {1, 2, 4, 8}  Remote / Low / Moderate / High
// D (Detection)  = {1, 2, 3, 4}  AlmostCertain / High / Low / AbsoluteUncertainty
// RES = S × P   (Risk Evaluation Score)
// RPN = RES × D  (Risk Priority Number)
// riskLevel: RPN > 8 → "Major", ≤ 8 → "Minor"

function computeRisk(s: number, p: number, d: number): { res: number; rpn: number; riskLevel: string } {
  const res = s * p;
  const rpn = res * d;
  const riskLevel = rpn > 8 ? "Major" : "Minor";
  return { res, rpn, riskLevel };
}

// Review period by class (SOP 5.5.4)
function computeNextReviewDate(approvalDate: string, riskClass: string): string | null {
  const date = new Date(approvalDate);
  if (isNaN(date.getTime())) return null;
  switch (riskClass) {
    case "Class I":   date.setFullYear(date.getFullYear() + 2); break;
    case "Class II":  date.setFullYear(date.getFullYear() + 3); break;
    case "Class III": date.setFullYear(date.getFullYear() + 4); break;
    case "Class IV":  return null; // event-driven
    default: return null;
  }
  return date.toISOString().split("T")[0];
}

async function generateAssessmentNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `CPT-${year}-RA-`;
  const [last] = await db
    .select({ n: riskAssessmentsTable.assessmentNumber })
    .from(riskAssessmentsTable)
    .where(ilike(riskAssessmentsTable.assessmentNumber, `${prefix}%`))
    .orderBy(sql`assessment_number DESC`)
    .limit(1);
  if (!last) return `${prefix}001`;
  const num = parseInt(last.n.slice(prefix.length), 10);
  return `${prefix}${String(num + 1).padStart(3, "0")}`;
}

async function generateRarrNumber(assessmentId: number): Promise<string> {
  const existing = await db
    .select({ id: raReviewReportsTable.id })
    .from(raReviewReportsTable)
    .where(eq(raReviewReportsTable.assessmentId, assessmentId));
  const num = existing.length + 1;
  return `RARR-${assessmentId}-${String(num).padStart(2, "0")}`;
}

// ─── Master Plan ─────────────────────────────────────────────────────────────
router.get("/risk-assessments/master-plan", async (req, res): Promise<void> => {
  const rows = await db
    .select({
      id: riskAssessmentsTable.id,
      assessmentNumber: riskAssessmentsTable.assessmentNumber,
      title: riskAssessmentsTable.title,
      riskClass: riskAssessmentsTable.riskClass,
      status: riskAssessmentsTable.status,
      initiatedBy: riskAssessmentsTable.initiatedBy,
      approvalDate: riskAssessmentsTable.approvalDate,
      nextReviewDate: riskAssessmentsTable.nextReviewDate,
      raArea: riskAssessmentsTable.raArea,
      riskVersion: riskAssessmentsTable.riskVersion,
      updatedAt: riskAssessmentsTable.updatedAt,
    })
    .from(riskAssessmentsTable)
    .orderBy(desc(riskAssessmentsTable.updatedAt));

  res.json(GetRiskMasterPlanResponse.parse({ data: rows }));
});

// ─── List / Create ────────────────────────────────────────────────────────────
router.get("/risk-assessments", async (req, res): Promise<void> => {
  const params = ListRiskAssessmentsQueryParams.safeParse(req.query);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const { page = 1, pageSize = 20, search, status, assessmentType } = params.data;
  const offset = ((page ?? 1) - 1) * (pageSize ?? 20);
  const limit = pageSize ?? 20;

  const conditions = [];
  if (search) conditions.push(or(ilike(riskAssessmentsTable.title, `%${search}%`), ilike(riskAssessmentsTable.assessmentNumber, `%${search}%`)));
  if (status) conditions.push(eq(riskAssessmentsTable.status, status));
  if (assessmentType) conditions.push(eq(riskAssessmentsTable.assessmentType, assessmentType));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [countResult] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(riskAssessmentsTable).where(where);
  const rows = await db.select().from(riskAssessmentsTable).where(where).orderBy(sql`created_at DESC`).limit(limit).offset(offset);

  res.json(ListRiskAssessmentsResponse.parse({ data: rows, total: countResult?.count ?? 0, page, pageSize }));
});

router.post("/risk-assessments", async (req, res): Promise<void> => {
  const body = CreateRiskAssessmentBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }

  const assessmentNumber = await generateAssessmentNumber();
  const [row] = await db.insert(riskAssessmentsTable).values({
    ...body.data,
    assessmentNumber,
    status: "Draft",
    sopReference: body.data.sopReference ?? "SOPPQA016",
  }).returning();

  logAudit({ req, module: "RiskAssessment", action: "Record Created", recordId: row.id, recordNumber: assessmentNumber, details: `Title: "${row.title}"` }).catch(() => {});
  res.status(201).json(GetRiskAssessmentResponse.parse(row));
});

// ─── Get / Update ─────────────────────────────────────────────────────────────
router.get("/risk-assessments/:id", async (req, res): Promise<void> => {
  const params = GetRiskAssessmentParams.safeParse({ id: parseInt(req.params.id, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid ID" }); return; }

  const [row] = await db.select().from(riskAssessmentsTable).where(eq(riskAssessmentsTable.id, params.data.id));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(GetRiskAssessmentResponse.parse(row));
});

router.put("/risk-assessments/:id", async (req, res): Promise<void> => {
  const params = UpdateRiskAssessmentParams.safeParse({ id: parseInt(req.params.id, 10) });
  const body = UpdateRiskAssessmentBody.safeParse(req.body);
  if (!params.success || !body.success) { res.status(400).json({ error: "Invalid input" }); return; }

  const [existing] = await db.select().from(riskAssessmentsTable).where(eq(riskAssessmentsTable.id, params.data.id));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  if (existing.status !== "Draft") { res.status(400).json({ error: "Only Draft assessments can be edited" }); return; }

  const [row] = await db.update(riskAssessmentsTable).set({ ...body.data, updatedAt: new Date() }).where(eq(riskAssessmentsTable.id, params.data.id)).returning();
  logAudit({ req, module: "RiskAssessment", action: "Record Updated", recordId: row.id, recordNumber: row.assessmentNumber }).catch(() => {});
  res.json(UpdateRiskAssessmentResponse.parse(row));
});

// ─── Workflow transitions ──────────────────────────────────────────────────────
router.post("/risk-assessments/:id/submit", async (req, res): Promise<void> => {
  const params = SubmitRiskAssessmentParams.safeParse({ id: parseInt(req.params.id, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid ID" }); return; }

  const [existing] = await db.select().from(riskAssessmentsTable).where(eq(riskAssessmentsTable.id, params.data.id));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  if (existing.status !== "Draft") { res.status(400).json({ error: "Only Draft assessments can be submitted" }); return; }

  const entries = await db.select({ id: fmeaEntriesTable.id }).from(fmeaEntriesTable).where(eq(fmeaEntriesTable.assessmentId, params.data.id));
  if (entries.length === 0) { res.status(400).json({ error: "Add at least one FMEA entry before submitting" }); return; }

  const [row] = await db.update(riskAssessmentsTable).set({ status: "In Review", updatedAt: new Date() }).where(eq(riskAssessmentsTable.id, params.data.id)).returning();
  logAudit({ req, module: "RiskAssessment", action: "Submitted for Review", recordId: row.id, recordNumber: row.assessmentNumber }).catch(() => {});
  res.json(SubmitRiskAssessmentResponse.parse(row));
});

router.post("/risk-assessments/:id/approve", async (req, res): Promise<void> => {
  const params = ApproveRiskAssessmentParams.safeParse({ id: parseInt(req.params.id, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid ID" }); return; }

  const isQA = (req.session.userRoles ?? []).includes("QA");
  const isAdmin = (req.session.userRoles ?? []).includes("Admin");
  if (!isQA && !isAdmin) { res.status(403).json({ error: "QA or Admin role required to approve" }); return; }

  const [existing] = await db.select().from(riskAssessmentsTable).where(eq(riskAssessmentsTable.id, params.data.id));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  if (existing.status !== "In Review") { res.status(400).json({ error: "Only In Review assessments can be approved" }); return; }

  const userName = req.session.userName ?? "";
  const todayStr = new Date().toISOString().split("T")[0];
  let nextReviewDate: string | null = existing.nextReviewDate ?? null;
  if (existing.riskClass && !nextReviewDate) {
    nextReviewDate = computeNextReviewDate(todayStr, existing.riskClass);
  }

  const [row] = await db.update(riskAssessmentsTable).set({
    status: "Approved",
    approvedBy: userName,
    approvalDate: todayStr,
    nextReviewDate: nextReviewDate ?? undefined,
    qaRejectReason: null,
    updatedAt: new Date(),
  }).where(eq(riskAssessmentsTable.id, params.data.id)).returning();
  logAudit({ req, module: "RiskAssessment", action: "Approved", recordId: row.id, recordNumber: row.assessmentNumber, details: `Approved by ${userName}` }).catch(() => {});
  res.json(ApproveRiskAssessmentResponse.parse(row));
});

router.post("/risk-assessments/:id/reject", async (req, res): Promise<void> => {
  const params = RejectRiskAssessmentParams.safeParse({ id: parseInt(req.params.id, 10) });
  const body = RejectRiskAssessmentBody.safeParse(req.body);
  if (!params.success || !body.success) { res.status(400).json({ error: "Reason is required" }); return; }

  const isQA = (req.session.userRoles ?? []).includes("QA");
  const isAdmin = (req.session.userRoles ?? []).includes("Admin");
  if (!isQA && !isAdmin) { res.status(403).json({ error: "QA or Admin role required to reject" }); return; }

  const [existing] = await db.select().from(riskAssessmentsTable).where(eq(riskAssessmentsTable.id, params.data.id));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  if (existing.status !== "In Review") { res.status(400).json({ error: "Only In Review assessments can be rejected" }); return; }

  const [row] = await db.update(riskAssessmentsTable).set({ status: "Draft", qaRejectReason: body.data.reason, updatedAt: new Date() }).where(eq(riskAssessmentsTable.id, params.data.id)).returning();
  logAudit({ req, module: "RiskAssessment", action: "Rejected", recordId: row.id, recordNumber: row.assessmentNumber, details: body.data.reason }).catch(() => {});
  res.json(RejectRiskAssessmentResponse.parse(row));
});

router.post("/risk-assessments/:id/close", async (req, res): Promise<void> => {
  const params = CloseRiskAssessmentParams.safeParse({ id: parseInt(req.params.id, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid ID" }); return; }

  const isQA = (req.session.userRoles ?? []).includes("QA");
  const isAdmin = (req.session.userRoles ?? []).includes("Admin");
  if (!isQA && !isAdmin) { res.status(403).json({ error: "QA or Admin role required to close" }); return; }

  const [existing] = await db.select().from(riskAssessmentsTable).where(eq(riskAssessmentsTable.id, params.data.id));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  if (existing.status !== "Approved") { res.status(400).json({ error: "Only Approved assessments can be closed" }); return; }

  const comment = typeof req.body?.comment === "string" ? req.body.comment : null;
  const [row] = await db.update(riskAssessmentsTable).set({ status: "Closed", closeComment: comment, updatedAt: new Date() }).where(eq(riskAssessmentsTable.id, params.data.id)).returning();
  logAudit({ req, module: "RiskAssessment", action: "Closed", recordId: row.id, recordNumber: row.assessmentNumber, details: comment ?? undefined }).catch(() => {});
  res.json(CloseRiskAssessmentResponse.parse(row));
});

// ─── Classify ─────────────────────────────────────────────────────────────────
router.post("/risk-assessments/:id/classify", async (req, res): Promise<void> => {
  const params = ClassifyRiskAssessmentParams.safeParse({ id: parseInt(req.params.id, 10) });
  const body = ClassifyRiskAssessmentBody.safeParse(req.body);
  if (!params.success || !body.success) { res.status(400).json({ error: "Invalid input" }); return; }

  const [existing] = await db.select().from(riskAssessmentsTable).where(eq(riskAssessmentsTable.id, params.data.id));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }

  const { riskClass, nextReviewDate, decisionTreeData } = body.data;
  let reviewDate = nextReviewDate ?? null;
  if (!reviewDate && riskClass) {
    const base = existing.approvalDate ?? new Date().toISOString().split("T")[0];
    reviewDate = computeNextReviewDate(base, riskClass);
  }

  const [row] = await db.update(riskAssessmentsTable).set({
    riskClass,
    nextReviewDate: reviewDate ?? undefined,
    decisionTreeData: decisionTreeData ?? undefined,
    updatedAt: new Date(),
  }).where(eq(riskAssessmentsTable.id, params.data.id)).returning();

  logAudit({ req, module: "RiskAssessment", action: "Classified", recordId: row.id, recordNumber: row.assessmentNumber, details: `Class: ${riskClass}` }).catch(() => {});
  res.json(ClassifyRiskAssessmentResponse.parse(row));
});

// ─── Re-assess ────────────────────────────────────────────────────────────────
router.post("/risk-assessments/:id/re-assess", async (req, res): Promise<void> => {
  const params = ReAssessRiskAssessmentParams.safeParse({ id: parseInt(req.params.id, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid ID" }); return; }

  const [existing] = await db.select().from(riskAssessmentsTable).where(eq(riskAssessmentsTable.id, params.data.id));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  if (existing.status !== "Approved" && existing.status !== "Closed") {
    res.status(400).json({ error: "Can only re-assess Approved or Closed assessments" }); return;
  }

  const assessmentNumber = await generateAssessmentNumber();
  const [row] = await db.insert(riskAssessmentsTable).values({
    assessmentNumber,
    title: existing.title,
    assessmentType: existing.assessmentType,
    documentNumber: existing.documentNumber ?? undefined,
    revision: existing.revision ?? undefined,
    scope: existing.scope ?? undefined,
    productProcess: existing.productProcess ?? undefined,
    regulatoryContext: existing.regulatoryContext ?? undefined,
    riskAcceptanceCriteria: existing.riskAcceptanceCriteria ?? undefined,
    status: "Draft",
    initiatedBy: req.session.userName ?? existing.initiatedBy,
    sopReference: existing.sopReference ?? "SOPPQA016",
    raArea: existing.raArea ?? undefined,
    methodology: existing.methodology ?? undefined,
    riskVersion: existing.riskVersion + 1,
    parentAssessmentId: existing.id,
  }).returning();

  logAudit({ req, module: "RiskAssessment", action: "Re-Assessment Created", recordId: row.id, recordNumber: assessmentNumber, details: `From ${existing.assessmentNumber} v${existing.riskVersion}` }).catch(() => {});
  res.status(201).json(GetRiskAssessmentResponse.parse(row));
});

// ─── FMEA Entries ─────────────────────────────────────────────────────────────
router.get("/risk-assessments/:id/entries", async (req, res): Promise<void> => {
  const params = ListFmeaEntriesParams.safeParse({ id: parseInt(req.params.id, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid ID" }); return; }

  const rows = await db.select().from(fmeaEntriesTable).where(eq(fmeaEntriesTable.assessmentId, params.data.id)).orderBy(fmeaEntriesTable.sortOrder, fmeaEntriesTable.id);
  res.json(ListFmeaEntriesResponse.parse({ data: rows }));
});

router.post("/risk-assessments/:id/entries", async (req, res): Promise<void> => {
  const params = CreateFmeaEntryParams.safeParse({ id: parseInt(req.params.id, 10) });
  const body = CreateFmeaEntryBody.safeParse(req.body);
  if (!params.success || !body.success) { res.status(400).json({ error: body.success ? "Invalid ID" : body.error.message }); return; }

  const [assessment] = await db.select().from(riskAssessmentsTable).where(eq(riskAssessmentsTable.id, params.data.id));
  if (!assessment) { res.status(404).json({ error: "Assessment not found" }); return; }
  if (assessment.status === "Closed") { res.status(400).json({ error: "Cannot add entries to a Closed assessment" }); return; }

  const { severity = 1, occurrence = 1, detection = 1 } = body.data;
  const { res: resScore, rpn, riskLevel } = computeRisk(severity, occurrence, detection);

  let revisedRpn: number | null = null;
  let revisedRiskLevel: string | null = null;
  let revisedRes: number | null = null;
  if (body.data.revisedSeverity != null && body.data.revisedOccurrence != null && body.data.revisedDetection != null) {
    const r = computeRisk(body.data.revisedSeverity, body.data.revisedOccurrence, body.data.revisedDetection);
    revisedRpn = r.rpn;
    revisedRiskLevel = r.riskLevel;
    revisedRes = r.res;
  }

  const [row] = await db.insert(fmeaEntriesTable).values({
    ...body.data,
    assessmentId: params.data.id,
    severity, occurrence, detection, rpn, riskLevel,
    res: resScore,
    revisedRpn,
    revisedRiskLevel,
    revisedRes,
  }).returning();

  logAudit({ req, module: "RiskAssessment", action: "Entry Added", recordId: params.data.id, recordNumber: assessment.assessmentNumber, details: `Step: "${body.data.processStep}" | RES: ${resScore} | RPN: ${rpn} | ${riskLevel}` }).catch(() => {});
  res.status(201).json(row);
});

router.put("/risk-assessments/:id/entries/:entryId", async (req, res): Promise<void> => {
  const params = UpdateFmeaEntryParams.safeParse({ id: parseInt(req.params.id, 10), entryId: parseInt(req.params.entryId, 10) });
  const body = UpdateFmeaEntryBody.safeParse(req.body);
  if (!params.success || !body.success) { res.status(400).json({ error: "Invalid input" }); return; }

  const [existing] = await db.select().from(fmeaEntriesTable).where(and(eq(fmeaEntriesTable.id, params.data.entryId), eq(fmeaEntriesTable.assessmentId, params.data.id)));
  if (!existing) { res.status(404).json({ error: "Entry not found" }); return; }

  const severity = body.data.severity ?? existing.severity;
  const occurrence = body.data.occurrence ?? existing.occurrence;
  const detection = body.data.detection ?? existing.detection;
  const { res: resScore, rpn, riskLevel } = computeRisk(severity, occurrence, detection);

  let revisedRpn: number | null = existing.revisedRpn;
  let revisedRiskLevel: string | null = existing.revisedRiskLevel;
  let revisedRes: number | null = existing.revisedRes;
  const rs = body.data.revisedSeverity ?? existing.revisedSeverity;
  const ro = body.data.revisedOccurrence ?? existing.revisedOccurrence;
  const rd = body.data.revisedDetection ?? existing.revisedDetection;
  if (rs != null && ro != null && rd != null) {
    const r = computeRisk(rs, ro, rd);
    revisedRpn = r.rpn;
    revisedRiskLevel = r.riskLevel;
    revisedRes = r.res;
  } else if (body.data.revisedSeverity === null || body.data.revisedOccurrence === null || body.data.revisedDetection === null) {
    revisedRpn = null;
    revisedRiskLevel = null;
    revisedRes = null;
  }

  const [row] = await db.update(fmeaEntriesTable).set({
    ...body.data,
    severity, occurrence, detection, rpn, riskLevel,
    res: resScore,
    revisedRpn,
    revisedRiskLevel,
    revisedRes,
    updatedAt: new Date(),
  }).where(eq(fmeaEntriesTable.id, params.data.entryId)).returning();

  res.json(UpdateFmeaEntryResponse.parse(row));
});

router.delete("/risk-assessments/:id/entries/:entryId", async (req, res): Promise<void> => {
  const params = DeleteFmeaEntryParams.safeParse({ id: parseInt(req.params.id, 10), entryId: parseInt(req.params.entryId, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid params" }); return; }

  const [assessment] = await db.select().from(riskAssessmentsTable).where(eq(riskAssessmentsTable.id, params.data.id));
  if (!assessment) { res.status(404).json({ error: "Assessment not found" }); return; }

  await db.delete(fmeaEntriesTable).where(and(eq(fmeaEntriesTable.id, params.data.entryId), eq(fmeaEntriesTable.assessmentId, params.data.id)));
  logAudit({ req, module: "RiskAssessment", action: "Entry Deleted", recordId: params.data.id, recordNumber: assessment.assessmentNumber }).catch(() => {});
  res.status(204).send();
});

// ─── Generate CAPA from entry ─────────────────────────────────────────────────
router.post("/risk-assessments/:id/entries/:entryId/generate-capa", async (req, res): Promise<void> => {
  const params = GenerateCapaFromEntryParams.safeParse({ id: parseInt(req.params.id, 10), entryId: parseInt(req.params.entryId, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid params" }); return; }

  const isQA = (req.session.userRoles ?? []).includes("QA");
  const isAdmin = (req.session.userRoles ?? []).includes("Admin");
  if (!isQA && !isAdmin) { res.status(403).json({ error: "QA or Admin role required" }); return; }

  const [[assessment], [entry]] = await Promise.all([
    db.select().from(riskAssessmentsTable).where(eq(riskAssessmentsTable.id, params.data.id)),
    db.select().from(fmeaEntriesTable).where(and(eq(fmeaEntriesTable.id, params.data.entryId), eq(fmeaEntriesTable.assessmentId, params.data.id))),
  ]);
  if (!assessment || !entry) { res.status(404).json({ error: "Assessment or entry not found" }); return; }

  // Generate CAPA number
  const year = new Date().getFullYear();
  const capaPrefix = `CPT-${year}-CA-`;
  const [lastCapa] = await db.select({ n: capaTable.capaNumber }).from(capaTable).where(ilike(capaTable.capaNumber, `${capaPrefix}%`)).orderBy(sql`capa_number DESC`).limit(1);
  const capaNum = lastCapa ? parseInt(lastCapa.n.slice(capaPrefix.length), 10) + 1 : 1;
  const capaNumber = `${capaPrefix}${String(capaNum).padStart(3, "0")}`;

  const today = new Date().toISOString().split("T")[0];
  const thirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const [capa] = await db.insert(capaTable).values({
    capaNumber,
    title: `Risk Mitigation: ${entry.failureMode} (${assessment.assessmentNumber})`,
    capaType: "Corrective",
    status: "Open",
    creationDate: today,
    initialPlannedDate: entry.targetDate ?? thirtyDays,
    implementationLeader: entry.responsiblePerson ?? req.session.userName ?? "TBD",
    location: assessment.raArea ?? "CPT",
    sourceType: "Risk Assessment",
    externalReferences: assessment.assessmentNumber,
  }).returning();

  // Link to RA
  await db.insert(raModuleLinksTable).values({
    assessmentId: params.data.id,
    moduleType: "CAPA",
    moduleId: capa.id,
    moduleNumber: capaNumber,
    moduleTitle: capa.title,
    linkedBy: req.session.userName ?? "",
  });

  logAudit({ req, module: "RiskAssessment", action: "CAPA Generated", recordId: params.data.id, recordNumber: assessment.assessmentNumber, details: `CAPA: ${capaNumber}` }).catch(() => {});
  res.status(201).json({ capaId: capa.id, capaNumber });
});

// ─── Generate Change Control from entry ───────────────────────────────────────
router.post("/risk-assessments/:id/entries/:entryId/generate-cc", async (req, res): Promise<void> => {
  const params = GenerateCcFromEntryParams.safeParse({ id: parseInt(req.params.id, 10), entryId: parseInt(req.params.entryId, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid params" }); return; }

  const isQA = (req.session.userRoles ?? []).includes("QA");
  const isAdmin = (req.session.userRoles ?? []).includes("Admin");
  if (!isQA && !isAdmin) { res.status(403).json({ error: "QA or Admin role required" }); return; }

  const [[assessment], [entry]] = await Promise.all([
    db.select().from(riskAssessmentsTable).where(eq(riskAssessmentsTable.id, params.data.id)),
    db.select().from(fmeaEntriesTable).where(and(eq(fmeaEntriesTable.id, params.data.entryId), eq(fmeaEntriesTable.assessmentId, params.data.id))),
  ]);
  if (!assessment || !entry) { res.status(404).json({ error: "Assessment or entry not found" }); return; }

  const year = new Date().getFullYear();
  const ccPrefix = `CPT-${year}-CC-`;
  const [lastCc] = await db.select({ n: changeControlTable.changeControlNumber }).from(changeControlTable).where(ilike(changeControlTable.changeControlNumber, `${ccPrefix}%`)).orderBy(sql`change_control_number DESC`).limit(1);
  const ccNum = lastCc ? parseInt(lastCc.n.slice(ccPrefix.length), 10) + 1 : 1;
  const changeControlNumber = `${ccPrefix}${String(ccNum).padStart(3, "0")}`;

  const thirtyDaysCC = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const [cc] = await db.insert(changeControlTable).values({
    changeControlNumber,
    title: `Risk Control: ${entry.recommendedAction ?? entry.failureMode} (${assessment.assessmentNumber})`,
    changeType: "Other",
    status: "Draft",
    plannedImplementationDate: entry.targetDate ?? thirtyDaysCC,
    currentSituation: `Failure mode: ${entry.failureMode}. RPN: ${entry.rpn} (${entry.riskLevel}).`,
    proposedSituation: entry.recommendedAction ?? "See Risk Assessment for recommended action.",
    location: assessment.raArea ?? "CPT",
    hierarchicResponsible: req.session.userName ?? "TBD",
    siteCoordinator: req.session.userName ?? "TBD",
    justification: `RPN: ${entry.rpn} (${entry.riskLevel}). Source: ${assessment.assessmentNumber}`,
    validationRequired: false,
    regulatoryFilingRequired: false,
  }).returning();

  await db.insert(raModuleLinksTable).values({
    assessmentId: params.data.id,
    moduleType: "ChangeControl",
    moduleId: cc.id,
    moduleNumber: changeControlNumber,
    moduleTitle: cc.title,
    linkedBy: req.session.userName ?? "",
  });

  logAudit({ req, module: "RiskAssessment", action: "Change Control Generated", recordId: params.data.id, recordNumber: assessment.assessmentNumber, details: `CC: ${changeControlNumber}` }).catch(() => {});
  res.status(201).json({ changeControlId: cc.id, changeControlNumber });
});

// ─── Team Members ─────────────────────────────────────────────────────────────
router.get("/risk-assessments/:id/team-members", async (req, res): Promise<void> => {
  const params = ListRaTeamMembersParams.safeParse({ id: parseInt(req.params.id, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid ID" }); return; }

  const rows = await db.select().from(raTeamMembersTable).where(eq(raTeamMembersTable.assessmentId, params.data.id)).orderBy(raTeamMembersTable.createdAt);
  res.json(ListRaTeamMembersResponse.parse({ data: rows }));
});

router.post("/risk-assessments/:id/team-members", async (req, res): Promise<void> => {
  const params = AddRaTeamMemberParams.safeParse({ id: parseInt(req.params.id, 10) });
  const body = AddRaTeamMemberBody.safeParse(req.body);
  if (!params.success || !body.success) { res.status(400).json({ error: "Invalid input" }); return; }

  const [row] = await db.insert(raTeamMembersTable).values({ ...body.data, assessmentId: params.data.id }).returning();
  res.status(201).json(row);
});

router.delete("/risk-assessments/:id/team-members/:memberId", async (req, res): Promise<void> => {
  const params = DeleteRaTeamMemberParams.safeParse({ id: parseInt(req.params.id, 10), memberId: parseInt(req.params.memberId, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid params" }); return; }

  await db.delete(raTeamMembersTable).where(and(eq(raTeamMembersTable.id, params.data.memberId), eq(raTeamMembersTable.assessmentId, params.data.id)));
  res.status(204).send();
});

router.post("/risk-assessments/:id/team-members/:memberId/acknowledge", async (req, res): Promise<void> => {
  const params = AcknowledgeRaTeamMemberParams.safeParse({ id: parseInt(req.params.id, 10), memberId: parseInt(req.params.memberId, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid params" }); return; }

  const [row] = await db.update(raTeamMembersTable).set({ acknowledgedAt: new Date() }).where(and(eq(raTeamMembersTable.id, params.data.memberId), eq(raTeamMembersTable.assessmentId, params.data.id))).returning();
  if (!row) { res.status(404).json({ error: "Member not found" }); return; }
  res.json(AcknowledgeRaTeamMemberResponse.parse(row));
});

// ─── Communication Log ────────────────────────────────────────────────────────
router.get("/risk-assessments/:id/communication-log", async (req, res): Promise<void> => {
  const params = ListRaCommunicationLogParams.safeParse({ id: parseInt(req.params.id, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid ID" }); return; }

  const rows = await db.select().from(raCommunicationLogTable).where(eq(raCommunicationLogTable.assessmentId, params.data.id)).orderBy(desc(raCommunicationLogTable.createdAt));
  res.json(ListRaCommunicationLogResponse.parse({ data: rows }));
});

router.post("/risk-assessments/:id/communication-log", async (req, res): Promise<void> => {
  const params = AddRaCommunicationEntryParams.safeParse({ id: parseInt(req.params.id, 10) });
  const body = AddRaCommunicationEntryBody.safeParse(req.body);
  if (!params.success || !body.success) { res.status(400).json({ error: "Invalid input" }); return; }

  const [row] = await db.insert(raCommunicationLogTable).values({
    ...body.data,
    assessmentId: params.data.id,
    loggedBy: req.session.userName ?? "Unknown",
  }).returning();
  res.status(201).json(row);
});

router.delete("/risk-assessments/:id/communication-log/:logId", async (req, res): Promise<void> => {
  const params = DeleteRaCommunicationEntryParams.safeParse({ id: parseInt(req.params.id, 10), logId: parseInt(req.params.logId, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid params" }); return; }

  await db.delete(raCommunicationLogTable).where(and(eq(raCommunicationLogTable.id, params.data.logId), eq(raCommunicationLogTable.assessmentId, params.data.id)));
  res.status(204).send();
});

// ─── Review Reports (RARR) ────────────────────────────────────────────────────
router.get("/risk-assessments/:id/review-reports", async (req, res): Promise<void> => {
  const params = ListRaReviewReportsParams.safeParse({ id: parseInt(req.params.id, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid ID" }); return; }

  const rows = await db.select().from(raReviewReportsTable).where(eq(raReviewReportsTable.assessmentId, params.data.id)).orderBy(desc(raReviewReportsTable.createdAt));
  res.json(ListRaReviewReportsResponse.parse({ data: rows }));
});

router.post("/risk-assessments/:id/review-reports", async (req, res): Promise<void> => {
  const params = CreateRaReviewReportParams.safeParse({ id: parseInt(req.params.id, 10) });
  const body = CreateRaReviewReportBody.safeParse(req.body);
  if (!params.success || !body.success) { res.status(400).json({ error: "Invalid input" }); return; }

  const rarrNumber = await generateRarrNumber(params.data.id);
  const { status: bodyStatus, ...restBody } = body.data;
  const [row] = await db.insert(raReviewReportsTable).values({
    ...restBody,
    assessmentId: params.data.id,
    rarrNumber,
    status: bodyStatus ?? "Draft",
  }).returning();

  if (body.data.newReviewDate) {
    await db.update(riskAssessmentsTable).set({ nextReviewDate: body.data.newReviewDate, updatedAt: new Date() }).where(eq(riskAssessmentsTable.id, params.data.id));
  }

  res.status(201).json(row);
});

router.put("/risk-assessments/:id/review-reports/:rarrId", async (req, res): Promise<void> => {
  const params = UpdateRaReviewReportParams.safeParse({ id: parseInt(req.params.id, 10), rarrId: parseInt(req.params.rarrId, 10) });
  const body = UpdateRaReviewReportBody.safeParse(req.body);
  if (!params.success || !body.success) { res.status(400).json({ error: "Invalid input" }); return; }

  const { status: updStatus, ...restUpdate } = body.data;
  const [row] = await db.update(raReviewReportsTable).set({
    ...restUpdate,
    ...(updStatus != null ? { status: updStatus } : {}),
    updatedAt: new Date(),
  }).where(and(eq(raReviewReportsTable.id, params.data.rarrId), eq(raReviewReportsTable.assessmentId, params.data.id))).returning();
  if (!row) { res.status(404).json({ error: "Review report not found" }); return; }
  res.json(row);
});

// ─── Cross-Module Links ───────────────────────────────────────────────────────
router.get("/risk-assessments/:id/links", async (req, res): Promise<void> => {
  const params = ListRaLinksParams.safeParse({ id: parseInt(req.params.id, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid ID" }); return; }

  const rows = await db.select().from(raModuleLinksTable).where(eq(raModuleLinksTable.assessmentId, params.data.id)).orderBy(desc(raModuleLinksTable.createdAt));
  res.json(ListRaLinksResponse.parse({ data: rows }));
});

router.post("/risk-assessments/:id/links", async (req, res): Promise<void> => {
  const params = AddRaLinkParams.safeParse({ id: parseInt(req.params.id, 10) });
  const body = AddRaLinkBody.safeParse(req.body);
  if (!params.success || !body.success) { res.status(400).json({ error: "Invalid input" }); return; }

  const [row] = await db.insert(raModuleLinksTable).values({ ...body.data, assessmentId: params.data.id, linkedBy: req.session.userName ?? "" }).returning();
  res.status(201).json(row);
});

router.delete("/risk-assessments/:id/links/:linkId", async (req, res): Promise<void> => {
  const params = DeleteRaLinkParams.safeParse({ id: parseInt(req.params.id, 10), linkId: parseInt(req.params.linkId, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid params" }); return; }

  await db.delete(raModuleLinksTable).where(and(eq(raModuleLinksTable.id, params.data.linkId), eq(raModuleLinksTable.assessmentId, params.data.id)));
  res.status(204).send();
});

export default router;
