import { pgTable, text, serial, timestamp, date, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const capaTable = pgTable("capa", {
  id: serial("id").primaryKey(),
  capaNumber: text("capa_number").notNull(),
  deviationId: integer("deviation_id"),
  title: text("title").notNull(),
  description: text("description"),
  capaType: text("capa_type").notNull(),
  status: text("status").notNull().default("Open"),
  creationDate: date("creation_date", { mode: "string" }).notNull(),
  initialPlannedDate: date("initial_planned_date", { mode: "string" }).notNull(),
  updatedPlannedDate: date("updated_planned_date", { mode: "string" }),
  extendComment: text("extend_comment"),
  implementationDate: date("implementation_date", { mode: "string" }),
  implementationLeader: text("implementation_leader").notNull(),
  implementationSummary: text("implementation_summary"),
  closeComment: text("close_comment"),
  location: text("location").notNull(),
  externalReferences: text("external_references"),
  specificAttribute: text("specific_attribute"),
  workflowStatus: text("workflow_status"),
  qaRejectReason: text("qa_reject_reason"),
  implRejectReason: text("impl_reject_reason"),
  extensionRequestedDate: date("extension_requested_date", { mode: "string" }),
  extensionRequestedReason: text("extension_requested_reason"),
  extensionRequestedBy: text("extension_requested_by"),
  sourceType: text("source_type"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCapaSchema = createInsertSchema(capaTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCapa = z.infer<typeof insertCapaSchema>;
export type Capa = typeof capaTable.$inferSelect;
