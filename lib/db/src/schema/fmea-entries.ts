import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const fmeaEntriesTable = pgTable("fmea_entries", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  processStep: text("process_step").notNull(),
  failureMode: text("failure_mode").notNull(),
  potentialEffects: text("potential_effects"),
  severity: integer("severity").notNull().default(1),
  potentialCauses: text("potential_causes"),
  occurrence: integer("occurrence").notNull().default(1),
  currentControlsPrevention: text("current_controls_prevention"),
  currentControlsDetection: text("current_controls_detection"),
  detection: integer("detection").notNull().default(1),
  rpn: integer("rpn").notNull().default(1),
  riskLevel: text("risk_level").notNull().default("Low"),
  recommendedAction: text("recommended_action"),
  responsiblePerson: text("responsible_person"),
  targetDate: text("target_date"),
  actionStatus: text("action_status").default("Open"),
  actionTaken: text("action_taken"),
  revisedSeverity: integer("revised_severity"),
  revisedOccurrence: integer("revised_occurrence"),
  revisedDetection: integer("revised_detection"),
  revisedRpn: integer("revised_rpn"),
  revisedRiskLevel: text("revised_risk_level"),
  residualRiskAcceptable: text("residual_risk_acceptable"),
  residualRiskJustification: text("residual_risk_justification"),
  res: integer("res").notNull().default(1),
  revisedRes: integer("revised_res"),
  processStepTemplate: text("process_step_template"),
  rowChangeLog: text("row_change_log"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertFmeaEntrySchema = createInsertSchema(fmeaEntriesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFmeaEntry = z.infer<typeof insertFmeaEntrySchema>;
export type FmeaEntry = typeof fmeaEntriesTable.$inferSelect;
