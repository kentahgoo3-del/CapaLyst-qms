import { pgTable, text, serial, timestamp, date, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const changeControlTable = pgTable("change_control", {
  id: serial("id").primaryKey(),
  changeControlNumber: text("change_control_number").notNull(),
  title: text("title").notNull(),
  changeType: text("change_type").notNull(),
  status: text("status").notNull().default("Draft"),
  riskClassification: text("risk_classification"),
  plannedImplementationDate: date("planned_implementation_date", { mode: "string" }).notNull(),
  currentSituation: text("current_situation").notNull(),
  proposedSituation: text("proposed_situation").notNull(),
  location: text("location").notNull(),
  hierarchicResponsible: text("hierarchic_responsible").notNull(),
  siteCoordinator: text("site_coordinator").notNull(),
  justification: text("justification"),
  justificationType: text("justification_type"),
  equipment: text("equipment"),
  products: text("products"),
  externalReference: text("external_reference"),
  validationImpact: text("validation_impact"),
  validationRequired: boolean("validation_required").notNull().default(false),
  regulatoryImpact: text("regulatory_impact"),
  regulatoryFilingRequired: boolean("regulatory_filing_required").notNull().default(false),
  hrComment: text("hr_comment"),
  scComment: text("sc_comment"),
  hrRejectionReason: text("hr_rejection_reason"),
  scRejectionReason: text("sc_rejection_reason"),
  pirComment: text("pir_comment"),
  pirDate: date("pir_date", { mode: "string" }),
  pirOutcome: text("pir_outcome"),
  closeComment: text("close_comment"),
  capaId: integer("capa_id"),
  capaNumber: text("capa_number_ref"),
  deviationId: integer("deviation_id"),
  deviationNumber: text("deviation_number_ref"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertChangeControlSchema = createInsertSchema(changeControlTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertChangeControl = z.infer<typeof insertChangeControlSchema>;
export type ChangeControl = typeof changeControlTable.$inferSelect;
