import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { deviationsTable, capaTable, changeControlTable, efficacyReviewsTable } from "@workspace/db";
import { sql, and, gte, lt, eq, or, type SQL } from "drizzle-orm";
import {
  GetDashboardSummaryResponse,
  GetDashboardMetricsResponse,
  GetDashboardRecentActivityResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

/* ── helpers ────────────────────────────────────────────────── */

function isPrivileged(req: Parameters<Parameters<IRouter["get"]>[1]>[0]): boolean {
  return req.session?.userRoles?.some((r) => r === "QA" || r === "Admin") ?? false;
}

function devUserFilter(userName: string) {
  return or(
    eq(deviationsTable.qaExpert, userName),
    eq(deviationsTable.areaResponsible, userName),
    eq(deviationsTable.investigationLeader, userName),
    eq(deviationsTable.assignedExpert, userName),
  );
}

function capaUserFilter(userName: string) {
  return eq(capaTable.implementationLeader, userName);
}

function ccUserFilter(userName: string) {
  return or(
    eq(changeControlTable.siteCoordinator, userName),
    eq(changeControlTable.hierarchicResponsible, userName),
  );
}

function combine(...conds: (SQL | undefined)[]): SQL | undefined {
  const valid = conds.filter((c): c is SQL => c !== undefined);
  if (valid.length === 0) return undefined;
  if (valid.length === 1) return valid[0];
  return and(...valid);
}

/* ── /dashboard/summary ─────────────────────────────────────── */

router.get("/dashboard/summary", async (req, res): Promise<void> => {
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const monthLabel = now.toLocaleString("default", { month: "long", year: "numeric" });

  const privileged = isPrivileged(req);
  const userName = req.session?.userName ?? "";

  const dFilter = privileged ? undefined : devUserFilter(userName);
  const cFilter = privileged ? undefined : capaUserFilter(userName);
  const ccFilter = privileged ? undefined : ccUserFilter(userName);

  const [totalDeviations] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(deviationsTable)
    .where(dFilter);

  const [newDeviations] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(deviationsTable)
    .where(combine(dFilter, gte(deviationsTable.detectionDate, firstOfMonth)));

  const [closedDeviations] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(deviationsTable)
    .where(combine(dFilter, eq(deviationsTable.status, "Closed")));

  const [openCapa] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(capaTable)
    .where(combine(cFilter, sql`status NOT IN ('Closed')`));

  const due30Date = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const [capaDue30] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(capaTable)
    .where(combine(cFilter, sql`status NOT IN ('Closed')`, lt(capaTable.initialPlannedDate, due30Date)));

  const [changeControlsInReview] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(changeControlTable)
    .where(combine(ccFilter, sql`status IN ('HR Review', 'SC Review', 'Expert Review', 'Submitted')`));

  const [overdueDeviations] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(deviationsTable)
    .where(combine(dFilter, sql`status NOT IN ('Closed')`, lt(deviationsTable.dueDate, todayStr)));

  const [overdueErs] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(efficacyReviewsTable)
    .where(sql`status = 'Pending' AND expected_date < ${todayStr}`);

  res.json(GetDashboardSummaryResponse.parse({
    monthLabel,
    totalDeviations: totalDeviations?.count ?? 0,
    newDeviations: newDeviations?.count ?? 0,
    closedDeviations: closedDeviations?.count ?? 0,
    openCapa: openCapa?.count ?? 0,
    capaDue30: capaDue30?.count ?? 0,
    changeControlsInReview: changeControlsInReview?.count ?? 0,
    overdueDeviations: overdueDeviations?.count ?? 0,
    overdueErs: overdueErs?.count ?? 0,
  }));
});

/* ── /dashboard/metrics ─────────────────────────────────────── */

router.get("/dashboard/metrics", async (req, res): Promise<void> => {
  const now = new Date();
  const labels: string[] = [];
  const deviationCounts: number[] = [];
  const trendLabels: string[] = [];
  const trendNew: number[] = [];
  const trendClosed: number[] = [];

  const privileged = isPrivileged(req);
  const userName = req.session?.userName ?? "";
  const dFilter = privileged ? undefined : devUserFilter(userName);

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString("default", { month: "short" });
    const startStr = d.toISOString().split("T")[0];
    const endDate = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const endStr = endDate.toISOString().split("T")[0];

    labels.push(label);
    trendLabels.push(label);

    const [total] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(deviationsTable)
      .where(combine(dFilter, gte(deviationsTable.eventDate, startStr), lt(deviationsTable.eventDate, endStr)));

    const [newCount] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(deviationsTable)
      .where(combine(dFilter, gte(deviationsTable.detectionDate, startStr), lt(deviationsTable.detectionDate, endStr)));

    const [closedCount] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(deviationsTable)
      .where(combine(dFilter, eq(deviationsTable.status, "Closed"), gte(deviationsTable.updatedAt, new Date(startStr)), lt(deviationsTable.updatedAt, new Date(endStr))));

    deviationCounts.push(total?.count ?? 0);
    trendNew.push(newCount?.count ?? 0);
    trendClosed.push(closedCount?.count ?? 0);
  }

  res.json(GetDashboardMetricsResponse.parse({ labels, deviations: deviationCounts, trendLabels, trendNew, trendClosed }));
});

/* ── /dashboard/recent-activity ─────────────────────────────── */

router.get("/dashboard/recent-activity", async (req, res): Promise<void> => {
  const privileged = isPrivileged(req);
  const userName = req.session?.userName ?? "";
  const dFilter = privileged ? undefined : devUserFilter(userName);
  const cFilter = privileged ? undefined : capaUserFilter(userName);
  const ccFilter = privileged ? undefined : ccUserFilter(userName);

  const deviations = await db
    .select()
    .from(deviationsTable)
    .where(dFilter)
    .orderBy(sql`updated_at DESC`)
    .limit(5);

  const capas = await db
    .select()
    .from(capaTable)
    .where(cFilter)
    .orderBy(sql`updated_at DESC`)
    .limit(5);

  const changes = await db
    .select()
    .from(changeControlTable)
    .where(ccFilter)
    .orderBy(sql`updated_at DESC`)
    .limit(5);

  const activity = [
    ...deviations.map(d => ({
      id: d.id,
      type: "deviation" as const,
      title: d.title,
      number: d.deviationNumber,
      action: "updated",
      user: d.qaExpert,
      timestamp: d.updatedAt.toISOString(),
      status: d.status,
    })),
    ...capas.map(c => ({
      id: c.id,
      type: "capa" as const,
      title: c.title,
      number: c.capaNumber,
      action: "updated",
      user: c.implementationLeader,
      timestamp: c.updatedAt.toISOString(),
      status: c.status,
    })),
    ...changes.map(c => ({
      id: c.id,
      type: "changecontrol" as const,
      title: c.title,
      number: c.changeControlNumber,
      action: "updated",
      user: c.siteCoordinator,
      timestamp: c.updatedAt.toISOString(),
      status: c.status,
    })),
  ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

  res.json(GetDashboardRecentActivityResponse.parse(activity));
});

export default router;
