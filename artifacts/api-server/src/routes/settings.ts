import { Router } from "express";
import { db } from "@workspace/db";
import { settingOptionsTable, systemConfigTable } from "@workspace/db/schema";
import { eq, asc } from "drizzle-orm";
import {
  ListSettingOptionsQueryParams,
  CreateSettingOptionBody,
} from "@workspace/api-zod";
import { invalidateTimeoutCache } from "../app";

const router = Router();

/* ── System config ── */

router.get("/settings/config", async (req, res): Promise<void> => {
  const rows = await db.select().from(systemConfigTable);
  const config: Record<string, string> = {};
  for (const row of rows) config[row.key] = row.value;
  res.json(config);
});

router.put("/settings/config", async (req, res): Promise<void> => {
  if (!req.session?.userRoles?.includes("Admin")) {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  const { key, value } = req.body ?? {};
  if (!key || value === undefined) {
    res.status(400).json({ error: "key and value are required" });
    return;
  }
  await db
    .insert(systemConfigTable)
    .values({ key, value: String(value) })
    .onConflictDoUpdate({ target: systemConfigTable.key, set: { value: String(value) } });
  invalidateTimeoutCache();
  res.json({ key, value: String(value) });
});

/* ── Dropdown setting options ── */

router.get("/settings/options", async (req, res): Promise<void> => {
  const parsed = ListSettingOptionsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { category } = parsed.data;
  const rows = await db
    .select()
    .from(settingOptionsTable)
    .where(category ? eq(settingOptionsTable.category, category) : undefined)
    .orderBy(asc(settingOptionsTable.sortOrder), asc(settingOptionsTable.value));
  res.json(rows);
});

router.post("/settings/options", async (req, res): Promise<void> => {
  if (!req.session?.userRoles?.includes("Admin")) {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  const parsed = CreateSettingOptionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { category, value } = parsed.data;
  const maxOrder = await db
    .select({ sortOrder: settingOptionsTable.sortOrder })
    .from(settingOptionsTable)
    .where(eq(settingOptionsTable.category, category))
    .orderBy(asc(settingOptionsTable.sortOrder));
  const nextOrder = maxOrder.length > 0 ? maxOrder[maxOrder.length - 1].sortOrder + 1 : 0;
  const [created] = await db
    .insert(settingOptionsTable)
    .values({ category, value, sortOrder: nextOrder })
    .returning();
  res.status(201).json(created);
});

router.delete("/settings/options/:id", async (req, res): Promise<void> => {
  if (!req.session?.userRoles?.includes("Admin")) {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(settingOptionsTable).where(eq(settingOptionsTable.id, id));
  res.status(204).send();
});

export default router;
