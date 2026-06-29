import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";

export const auditLogsTable = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  userName: text("user_name").notNull(),
  action: text("action").notNull(),
  module: text("module").notNull(),
  recordId: integer("record_id"),
  recordNumber: text("record_number"),
  details: text("details"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AuditLog = typeof auditLogsTable.$inferSelect;
