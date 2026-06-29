import { pgTable, text, serial, timestamp, date, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ccExpertReviewsTable = pgTable("cc_expert_reviews", {
  id: serial("id").primaryKey(),
  changeControlId: integer("change_control_id").notNull(),
  departmentName: text("department_name").notNull(),
  managerName: text("manager_name").notNull(),
  expectedDate: date("expected_date", { mode: "string" }).notNull(),
  hasImpact: boolean("has_impact"),
  hasQualityImpact: boolean("has_quality_impact"),
  comment: text("comment"),
  actualDate: date("actual_date", { mode: "string" }),
  notApplicable: boolean("not_applicable").notNull().default(false),
  naReason: text("na_reason"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCcExpertReviewSchema = createInsertSchema(ccExpertReviewsTable).omit({ id: true, createdAt: true });
export type InsertCcExpertReview = z.infer<typeof insertCcExpertReviewSchema>;
export type CcExpertReview = typeof ccExpertReviewsTable.$inferSelect;
