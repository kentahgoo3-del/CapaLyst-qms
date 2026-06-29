import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const raReviewReportsTable = pgTable("ra_review_reports", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").notNull(),
  rarrNumber: text("rarr_number").notNull(),
  reviewedBy: text("reviewed_by").notNull(),
  reviewDate: text("review_date").notNull(),
  outcome: text("outcome").notNull(),
  newReviewDate: text("new_review_date"),
  deviationsReviewed: text("deviations_reviewed"),
  changesReviewed: text("changes_reviewed"),
  newRisksIdentified: text("new_risks_identified"),
  mitigationsAdhered: text("mitigations_adhered"),
  recommendReassessment: text("recommend_reassessment"),
  notes: text("notes"),
  status: text("status").notNull().default("Draft"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertRaReviewReportSchema = createInsertSchema(raReviewReportsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertRaReviewReport = z.infer<typeof insertRaReviewReportSchema>;
export type RaReviewReport = typeof raReviewReportsTable.$inferSelect;
