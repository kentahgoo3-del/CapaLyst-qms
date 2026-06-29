import express, { type Express, type Request, type Response, type NextFunction } from "express";
  import cors from "cors";
  import pinoHttp from "pino-http";
  import session from "express-session";
  import ConnectPgSimple from "connect-pg-simple";
  import router from "./routes";
  import { logger } from "./lib/logger";
  import { db } from "@workspace/db";
  import { systemConfigTable } from "@workspace/db/schema";
  import { eq } from "drizzle-orm";

  const PgSession = ConnectPgSimple(session);

  const app: Express = express();

  // Render (and most cloud hosts) terminate TLS at a load balancer; Express
  // sees plain HTTP. "trust proxy" tells Express to honour the X-Forwarded-*
  // headers set by the LB, which is required for session cookies with
  // `secure: true` to be set correctly in production.
  if (process.env["NODE_ENV"] === "production") {
    app.set("trust proxy", 1);
  }

  app.use(
    pinoHttp({
      logger,
      serializers: {
        req(req) {
          return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
        },
        res(res) {
          return { statusCode: res.statusCode };
        },
      },
    }),
  );
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  const sessionSecret = process.env["SESSION_SECRET"] ?? "dev-secret-change-in-production";
  const pgConnectionString = process.env["DATABASE_URL"] ?? "";

  app.use(
    session({
      store: new PgSession({
        conString: pgConnectionString,
        tableName: "qms_sessions",
      }),
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: { secure: process.env["NODE_ENV"] === "production", httpOnly: true, maxAge: 8 * 60 * 60 * 1000 },
    }),
  );

  /* ── Session timeout middleware ── */
  // Cache the timeout value so we don't hit DB on every request
  let cachedTimeoutMs: number | null = null;
  let cacheExpiry = 0;

  async function getTimeoutMs(): Promise<number> {
    if (cachedTimeoutMs !== null && Date.now() < cacheExpiry) return cachedTimeoutMs;
    try {
      const [row] = await db.select().from(systemConfigTable).where(eq(systemConfigTable.key, "session_timeout_minutes"));
      const minutes = row ? parseInt(row.value, 10) : 0;
      cachedTimeoutMs = minutes > 0 ? minutes * 60 * 1000 : 0;
    } catch {
      cachedTimeoutMs = 0;
    }
    cacheExpiry = Date.now() + 60_000; // refresh cache every 60s
    return cachedTimeoutMs;
  }

  // Invalidate the timeout cache (called when admin saves a new value)
  export function invalidateTimeoutCache() { cacheExpiry = 0; }

  const SKIP_TIMEOUT_PATHS = new Set(["/api/auth/login", "/api/auth/logout", "/api/auth/me"]);

  app.use(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Only enforce for authenticated non-Admin sessions
    const userId = req.session?.userId;
    if (!userId || SKIP_TIMEOUT_PATHS.has(req.path)) { next(); return; }

    const roles: string[] = req.session.userRoles ?? [];
    if (roles.includes("Admin")) {
      // Admins are exempt — still update their lastActivity so their session stays warm
      req.session.lastActivity = Date.now();
      next(); return;
    }

    const timeoutMs = await getTimeoutMs();
    if (timeoutMs > 0) {
      const last = req.session.lastActivity;
      if (last && Date.now() - last > timeoutMs) {
        req.session.destroy(() => {});
        res.status(401).json({ error: "Session expired", code: "SESSION_EXPIRED" });
        return;
      }
    }

    req.session.lastActivity = Date.now();
    next();
  });

  app.use("/api", router);

  /* ── Startup schema migration (idempotent) ── */
  if (pgConnectionString) {
    import("pg").then(({ default: pg }) => {
      const client = new (pg.Client ?? pg)({ connectionString: pgConnectionString });
      client.connect()
        .then(() => client.query(`
          ALTER TABLE deviations
            ADD COLUMN IF NOT EXISTS workflow_status TEXT,
            ADD COLUMN IF NOT EXISTS area_reject_reason TEXT,
            ADD COLUMN IF NOT EXISTS qa_reject_reason TEXT;
          UPDATE deviations
            SET workflow_status = CASE
              WHEN status = 'Draft'  THEN 'Draft'
              WHEN status = 'Closed' THEN 'Completed'
              ELSE 'Submitted'
            END
          WHERE workflow_status IS NULL;
          ALTER TABLE capa
            ADD COLUMN IF NOT EXISTS workflow_status TEXT,
            ADD COLUMN IF NOT EXISTS qa_reject_reason TEXT;
          UPDATE capa
            SET workflow_status = CASE
              WHEN status = 'Draft'  THEN 'Draft'
              WHEN status = 'Closed' THEN 'Closed'
              ELSE 'Submitted'
            END
          WHERE workflow_status IS NULL;
          CREATE TABLE IF NOT EXISTS qms_system_config (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );
          INSERT INTO qms_system_config (key, value)
            VALUES ('session_timeout_minutes', '30')
            ON CONFLICT (key) DO NOTHING;
        `))
        .then(() => { logger.info("Startup migration applied"); client.end(); })
        .catch((err: Error) => { logger.warn({ err }, "Startup migration skipped"); client.end().catch(() => {}); });
    }).catch(() => {});
  }

  export default app;
