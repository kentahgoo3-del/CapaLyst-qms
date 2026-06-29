import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { deviationsTable, capaTable, changeControlTable, ccExpertReviewsTable } from "@workspace/db";
import { inArray, isNull, eq } from "drizzle-orm";

function parseTeamMembers(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try { return JSON.parse(raw) as string[]; } catch { return []; }
}

const router: IRouter = Router();

interface NotificationItem {
  id: string;
  type: "action_required" | "info";
  priority: "high" | "medium" | "low";
  module: "Deviation" | "CAPA" | "Change Control";
  recordId: number;
  recordNumber: string;
  message: string;
  url: string;
}

router.get("/notifications", async (req, res): Promise<void> => {
  if (!req.session.userId) { res.status(401).json({ error: "Not authenticated" }); return; }

  const userName = req.session.userName ?? "";
  const userRoles = req.session.userRoles ?? [];
  const isQA = userRoles.includes("QA");

  const items: NotificationItem[] = [];

  /* ─── Deviation workflow actions ─── */
  const deviations = await db.select({
    id: deviationsTable.id,
    deviationNumber: deviationsTable.deviationNumber,
    title: deviationsTable.title,
    workflowStatus: deviationsTable.workflowStatus,
    status: deviationsTable.status,
    areaResponsible: deviationsTable.areaResponsible,
    qaExpert: deviationsTable.qaExpert,
    investigationLeader: deviationsTable.investigationLeader,
    assignedExpert: deviationsTable.assignedExpert,
    riskManager: deviationsTable.riskManager,
    teamMembers: deviationsTable.teamMembers,
  }).from(deviationsTable).where(
    inArray(deviationsTable.workflowStatus, [
      "Submitted", "Area_Accepted", "QA_Accepted",
      "Roles_Assigned", "Investigation_Submitted",
      "Risk_Mgmt_Submitted", "Root_Cause_Submitted",
      "CAPA_ER_Submitted", "QA_Rejected", "Area_Rejected",
    ])
  ).limit(200);

  for (const dev of deviations) {
    const wf = dev.workflowStatus ?? dev.status;
    const url = `/deviations/${dev.id}`;
    const num = dev.deviationNumber;

    if (wf === "Submitted" && (dev.areaResponsible === userName || isQA)) {
      items.push({ id: `dev-${dev.id}-area`, type: "action_required", priority: "high", module: "Deviation", recordId: dev.id, recordNumber: num, message: `${num}: Pending your Area review`, url });
    }
    if (wf === "Area_Accepted" && (dev.qaExpert === userName || isQA)) {
      items.push({ id: `dev-${dev.id}-qa`, type: "action_required", priority: "high", module: "Deviation", recordId: dev.id, recordNumber: num, message: `${num}: Pending QA acceptance`, url });
    }
    if (wf === "QA_Accepted" && isQA) {
      items.push({ id: `dev-${dev.id}-roles`, type: "action_required", priority: "medium", module: "Deviation", recordId: dev.id, recordNumber: num, message: `${num}: Assign investigation roles`, url });
    }
    if (wf === "Roles_Assigned" && (dev.investigationLeader === userName || dev.assignedExpert === userName || isQA || parseTeamMembers(dev.teamMembers).includes(userName))) {
      items.push({ id: `dev-${dev.id}-inv`, type: "action_required", priority: "high", module: "Deviation", recordId: dev.id, recordNumber: num, message: `${num}: Submit investigation`, url });
    }
    if (wf === "Investigation_Submitted" && isQA) {
      items.push({ id: `dev-${dev.id}-rm`, type: "action_required", priority: "medium", module: "Deviation", recordId: dev.id, recordNumber: num, message: `${num}: Submit risk management`, url });
    }
    if (wf === "Risk_Mgmt_Submitted" && (dev.investigationLeader === userName || dev.assignedExpert === userName || isQA)) {
      items.push({ id: `dev-${dev.id}-rc`, type: "action_required", priority: "medium", module: "Deviation", recordId: dev.id, recordNumber: num, message: `${num}: Submit root cause analysis`, url });
    }
    if (wf === "Root_Cause_Submitted" && isQA) {
      items.push({ id: `dev-${dev.id}-capa`, type: "action_required", priority: "medium", module: "Deviation", recordId: dev.id, recordNumber: num, message: `${num}: Submit CAPA & ER section`, url });
    }
    if (wf === "CAPA_ER_Submitted" && isQA) {
      items.push({ id: `dev-${dev.id}-complete`, type: "action_required", priority: "medium", module: "Deviation", recordId: dev.id, recordNumber: num, message: `${num}: Ready to complete`, url });
    }
    if (wf === "Area_Rejected" && (dev.areaResponsible === userName || dev.qaExpert === userName)) {
      items.push({ id: `dev-${dev.id}-arej`, type: "info", priority: "high", module: "Deviation", recordId: dev.id, recordNumber: num, message: `${num}: Rejected by Area — needs resubmission`, url });
    }
    if (wf === "QA_Rejected" && (dev.areaResponsible === userName || dev.qaExpert === userName)) {
      items.push({ id: `dev-${dev.id}-qrej`, type: "info", priority: "high", module: "Deviation", recordId: dev.id, recordNumber: num, message: `${num}: Rejected by QA — see rejection reason`, url });
    }
  }

  /* ─── CAPA workflow actions ─── */
  const capas = await db.select({
    id: capaTable.id,
    capaNumber: capaTable.capaNumber,
    workflowStatus: capaTable.workflowStatus,
    status: capaTable.status,
    implementationLeader: capaTable.implementationLeader,
  }).from(capaTable).where(
    inArray(capaTable.workflowStatus, [
      "Draft", "QA_Rejected", "QA_Accepted",
      "Implementation_Submitted", "Implementation_Accepted", "Impl_Rejected",
    ])
  ).limit(100);

  for (const capa of capas) {
    const wf = capa.workflowStatus ?? capa.status;
    const url = `/capa/${capa.id}`;
    const num = capa.capaNumber;
    const isImplLeader = capa.implementationLeader === userName;

    if ((wf === "Draft" || wf === "QA_Rejected") && isQA) {
      items.push({ id: `capa-${capa.id}-submit`, type: "action_required", priority: wf === "QA_Rejected" ? "high" : "medium", module: "CAPA", recordId: capa.id, recordNumber: num, message: `${num}: ${wf === "QA_Rejected" ? "Rejected by QA — resubmission needed" : "Pending QA submission"}`, url });
    }
    if (wf === "QA_Accepted" && (isImplLeader || isQA)) {
      items.push({ id: `capa-${capa.id}-impl`, type: "action_required", priority: "high", module: "CAPA", recordId: capa.id, recordNumber: num, message: `${num}: Awaiting implementation`, url });
    }
    if (wf === "Implementation_Submitted" && isQA) {
      items.push({ id: `capa-${capa.id}-qa-impl`, type: "action_required", priority: "high", module: "CAPA", recordId: capa.id, recordNumber: num, message: `${num}: Implementation submitted — review required`, url });
    }
    if (wf === "Impl_Rejected" && (isImplLeader || isQA)) {
      items.push({ id: `capa-${capa.id}-impl-rej`, type: "action_required", priority: "high", module: "CAPA", recordId: capa.id, recordNumber: num, message: `${num}: Implementation rejected — corrections required`, url });
    }
    if (wf === "Implementation_Accepted" && isQA) {
      items.push({ id: `capa-${capa.id}-close`, type: "action_required", priority: "medium", module: "CAPA", recordId: capa.id, recordNumber: num, message: `${num}: Implementation accepted — ready to close`, url });
    }
  }

  /* ─── Change Control expert review actions ─── */
  const pendingReviews = await db.select({
    id: ccExpertReviewsTable.id,
    changeControlId: ccExpertReviewsTable.changeControlId,
    departmentName: ccExpertReviewsTable.departmentName,
    managerName: ccExpertReviewsTable.managerName,
    changeControlNumber: changeControlTable.changeControlNumber,
    ccStatus: changeControlTable.status,
  }).from(ccExpertReviewsTable)
    .innerJoin(changeControlTable, eq(ccExpertReviewsTable.changeControlId, changeControlTable.id))
    .where(isNull(ccExpertReviewsTable.submittedAt))
    .limit(200);

  for (const er of pendingReviews) {
    if (er.ccStatus !== "Expert Review") continue;
    if (er.managerName === userName || isQA) {
      items.push({
        id: `cc-er-${er.id}`,
        type: "action_required",
        priority: "high",
        module: "Change Control",
        recordId: er.changeControlId,
        recordNumber: er.changeControlNumber,
        message: `${er.changeControlNumber}: Expert review required — ${er.departmentName}`,
        url: `/change-control/${er.changeControlId}`,
      });
    }
  }

  items.sort((a, b) => {
    const p = { high: 0, medium: 1, low: 2 };
    return (p[a.priority] ?? 2) - (p[b.priority] ?? 2);
  });

  res.json({ items, count: items.length });
});

export default router;
