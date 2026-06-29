import { pgTable, text, serial, timestamp, date, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ccWorkPlansTable = pgTable("cc_work_plans", {
  id: serial("id").primaryKey(),
  changeControlId: integer("change_control_id").notNull(),
  title: text("title").notNull(),
  responsiblePerson: text("responsible_person").notNull(),
  allocatedWorks: text("allocated_works").notNull(),
  expectedDate: date("expected_date", { mode: "string" }).notNull(),
  actualDate: date("actual_date", { mode: "string" }),
  worksComment: text("works_comment"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCcWorkPlanSchema = createInsertSchema(ccWorkPlansTable).omit({ id: true, createdAt: true });
export type InsertCcWorkPlan = z.infer<typeof insertCcWorkPlanSchema>;
export type CcWorkPlan = typeof ccWorkPlansTable.$inferSelect;
