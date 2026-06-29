import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const router: IRouter = Router();

declare module "express-session" {
  interface SessionData {
    userId: number;
    userName: string;
    userEmail: string;
    userRoles: string[];
    lastActivity: number;
  }
}

router.post("/auth/login", async (req, res): Promise<void> => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));

  if (!user || !user.passwordHash) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  if (user.status === "retired" || user.status === "archived") {
    res.status(403).json({ error: "This account has been deactivated. Please contact your administrator." });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  req.session.userId = user.id;
  req.session.userName = user.name;
  req.session.userEmail = user.email;
  req.session.userRoles = user.roles ?? [];

  res.json({ id: user.id, name: user.name, email: user.email, roles: user.roles ?? [], mustChangePassword: user.mustChangePassword });
});

router.post("/auth/logout", (req, res): void => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

router.post("/auth/verify", async (req, res): Promise<void> => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const { password } = req.body ?? {};
  if (!password) {
    res.status(400).json({ error: "Password required" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId));
  if (!user || !user.passwordHash) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Incorrect password" });
    return;
  }
  res.json({ ok: true });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId));
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  req.session.userName = user.name;
  req.session.userEmail = user.email;
  req.session.userRoles = user.roles ?? [];
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    roles: user.roles ?? [],
    mustChangePassword: user.mustChangePassword,
  });
});

router.post("/auth/change-password", async (req, res): Promise<void> => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const { newPassword } = req.body ?? {};
  if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
    res.status(400).json({ error: "New password must be at least 6 characters" });
    return;
  }
  const passwordHash = await bcrypt.hash(newPassword, 10);
  const [updated] = await db
    .update(usersTable)
    .set({ passwordHash, mustChangePassword: false })
    .where(eq(usersTable.id, req.session.userId))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ ok: true });
});

export default router;
