import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { auditLogsTable } from "@workspace/db";
import { sql, eq, ilike, or, and } from "drizzle-orm";

const router: IRouter = Router();

router.get("/audit", async (req, res): Promise<void> => {
  const page = parseInt(String(req.query.page ?? "1"), 10) || 1;
  const pageSize = parseInt(String(req.query.pageSize ?? "50"), 10) || 50;
  const module = req.query.module as string | undefined;
  const recordId = req.query.recordId ? parseInt(String(req.query.recordId), 10) : undefined;
  const search = req.query.search as string | undefined;
  const offset = (page - 1) * pageSize;

  const conditions = [];
  if (module && module !== "all") {
    conditions.push(eq(auditLogsTable.module, module));
  }
  if (recordId) {
    conditions.push(eq(auditLogsTable.recordId, recordId));
  }
  if (search) {
    conditions.push(
      or(
        ilike(auditLogsTable.userName, `%${search}%`),
        ilike(auditLogsTable.action, `%${search}%`),
        ilike(auditLogsTable.recordNumber, `%${search}%`)
      )
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [countResult] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(auditLogsTable)
    .where(where);

  const rows = await db
    .select()
    .from(auditLogsTable)
    .where(where)
    .orderBy(sql`created_at DESC`)
    .limit(pageSize)
    .offset(offset);

  res.json({
    data: rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    })),
    total: countResult?.count ?? 0,
    page,
    pageSize,
  });
});

export { router as auditRouter };

export async function logAudit(opts: {
  req: import("express").Request;
  action: string;
  module: string;
  recordId?: number;
  recordNumber?: string;
  details?: string;
}) {
  const userId = opts.req.session?.userId ?? undefined;
  const userName = opts.req.session?.userName ?? "System";
  await db.insert(auditLogsTable).values({
    userId: userId ?? null,
    userName,
    action: opts.action,
    module: opts.module,
    recordId: opts.recordId ?? null,
    recordNumber: opts.recordNumber ?? null,
    details: opts.details ?? null,
  });
}

export default router;
