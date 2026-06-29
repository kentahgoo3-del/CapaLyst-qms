import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, userRoleDefinitionsTable } from "@workspace/db";
import { sql, eq, or, ilike } from "drizzle-orm";
import bcrypt from "bcryptjs";
import {
  ListUsersQueryParams,
  ListUsersResponse,
  CreateUserBody,
  UpdateUserParams,
  UpdateUserBody,
  UpdateUserResponse,
  ListUserRoleDefinitionsResponse,
  CreateUserRoleDefinitionBody,
} from "@workspace/api-zod";
import { logAudit } from "./audit";

const router: IRouter = Router();

const serUser = (r: typeof usersTable.$inferSelect) => ({
  id: r.id,
  name: r.name,
  email: r.email,
  roles: r.roles ?? [],
  department: r.department ?? null,
  status: r.status ?? "active",
  mustChangePassword: r.mustChangePassword ?? false,
});

// ── List users ──────────────────────────────────────────────────────────────
router.get("/users", async (req, res): Promise<void> => {
  const params = ListUsersQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { page = 1, pageSize = 20, search } = params.data;
  const offset = ((page ?? 1) - 1) * (pageSize ?? 20);
  const limit = pageSize ?? 20;

  const where = search
    ? or(ilike(usersTable.name, `%${search}%`), ilike(usersTable.email, `%${search}%`))
    : undefined;

  const [countResult] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(usersTable)
    .where(where);
  const rows = await db
    .select()
    .from(usersTable)
    .where(where)
    .orderBy(sql`created_at DESC`)
    .limit(limit)
    .offset(offset);

  res.json(
    ListUsersResponse.parse({
      data: rows.map(serUser),
      total: countResult?.count ?? 0,
      page: page ?? 1,
      pageSize: limit,
    })
  );
});

// ── Create user ───────────────────────────────────────────────────────────────
router.post("/users", async (req, res): Promise<void> => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, parsed.data.email));
  if (existing) {
    res.status(409).json({ error: "User with this email already exists" });
    return;
  }

  const passwordHash = parsed.data.password
    ? await bcrypt.hash(parsed.data.password, 10)
    : null;

  const [row] = await db
    .insert(usersTable)
    .values({
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      roles: parsed.data.roles ?? ["User"],
      department: parsed.data.department ?? null,
    })
    .returning();

  await logAudit({
    req,
    action: "User Created",
    module: "Users",
    recordId: row.id,
    recordNumber: row.email,
    details: `Created user ${row.name} (${row.email}) with roles: ${(row.roles ?? []).join(", ")}`,
  });

  res.status(201).json(serUser(row));
});

// ── Update user ───────────────────────────────────────────────────────────────
router.patch("/users/:id", async (req, res): Promise<void> => {
  const isAdmin = req.session?.userRoles?.some((r) => r === "Admin") ?? false;
  if (!isAdmin) {
    res.status(403).json({ error: "Admin access required" });
    return;
  }

  const params = UpdateUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Partial<typeof usersTable.$inferInsert> = {};

  if (parsed.data.roles !== undefined) updates.roles = parsed.data.roles;
  if (parsed.data.department !== undefined) updates.department = parsed.data.department ?? null;
  if (parsed.data.name != null) updates.name = parsed.data.name;
  if (parsed.data.status != null) updates.status = parsed.data.status;
  if (parsed.data.mustChangePassword != null) updates.mustChangePassword = parsed.data.mustChangePassword;

  if (parsed.data.email != null) {
    const [conflict] = await db.select().from(usersTable).where(eq(usersTable.email, parsed.data.email));
    if (conflict && conflict.id !== params.data.id) {
      res.status(409).json({ error: "Email already in use by another user" });
      return;
    }
    updates.email = parsed.data.email;
  }

  if (parsed.data.password != null && parsed.data.password.length >= 6) {
    updates.passwordHash = await bcrypt.hash(parsed.data.password, 10);
  }

  const [row] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, params.data.id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const changes: string[] = [];
  if (parsed.data.name) changes.push(`name → ${parsed.data.name}`);
  if (parsed.data.email) changes.push(`email → ${parsed.data.email}`);
  if (parsed.data.roles) changes.push(`roles → ${parsed.data.roles.join(", ")}`);
  if (parsed.data.department !== undefined) changes.push(`dept → ${parsed.data.department ?? "none"}`);
  if (parsed.data.status) changes.push(`status → ${parsed.data.status}`);
  if (parsed.data.password) changes.push("password reset");
  if (parsed.data.mustChangePassword != null) changes.push(`mustChangePassword → ${parsed.data.mustChangePassword}`);

  await logAudit({
    req,
    action: "User Updated",
    module: "Users",
    recordId: row.id,
    recordNumber: row.email,
    details: `Updated ${row.name}: ${changes.join("; ")}`,
  });

  res.json(UpdateUserResponse.parse(serUser(row)));
});

// ── Delete user ───────────────────────────────────────────────────────────────
router.delete("/users/:id", async (req, res): Promise<void> => {
  const isAdmin = req.session?.userRoles?.some((r) => r === "Admin") ?? false;
  if (!isAdmin) {
    res.status(403).json({ error: "Admin access required" });
    return;
  }

  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid user id" });
    return;
  }

  if (req.session?.userId === id) {
    res.status(400).json({ error: "You cannot delete your own account" });
    return;
  }

  const [deleted] = await db.delete(usersTable).where(eq(usersTable.id, id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  await logAudit({
    req,
    action: "User Deleted",
    module: "Users",
    recordId: deleted.id,
    recordNumber: deleted.email,
    details: `Permanently removed user ${deleted.name} (${deleted.email}), roles: ${(deleted.roles ?? []).join(", ")}`,
  });

  res.status(204).send();
});

// ── Role definitions ──────────────────────────────────────────────────────────
router.get("/user-role-definitions", async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(userRoleDefinitionsTable)
    .orderBy(userRoleDefinitionsTable.id);

  res.json(
    ListUserRoleDefinitionsResponse.parse(
      rows.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description ?? null,
        createdAt: r.createdAt.toISOString(),
      }))
    )
  );
});

router.post("/user-role-definitions", async (req, res): Promise<void> => {
  const parsed = CreateUserRoleDefinitionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(userRoleDefinitionsTable)
    .where(eq(userRoleDefinitionsTable.name, parsed.data.name));
  if (existing) {
    res.status(409).json({ error: "A role with this name already exists" });
    return;
  }

  const [row] = await db
    .insert(userRoleDefinitionsTable)
    .values({
      name: parsed.data.name,
      description: parsed.data.description ?? null,
    })
    .returning();

  res.status(201).json({
    id: row.id,
    name: row.name,
    description: row.description ?? null,
    createdAt: row.createdAt.toISOString(),
  });
});

export default router;
