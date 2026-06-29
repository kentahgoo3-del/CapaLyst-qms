import { pgTable, text, serial, timestamp, date, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const efficacyReviewsTable = pgTable("efficacy_reviews", {
  id: serial("id").primaryKey(),
  capaId: integer("capa_id").notNull(),
  status: text("status").notNull().default("Pending"),
  reviewer: text("reviewer").notNull(),
  expectedDate: date("expected_date", { mode: "string" }).notNull(),
  reviewDate: date("review_date", { mode: "string" }),
  instruction: text("instruction"),
  criteria: text("criteria"),
  review: text("review"),
  outcome: text("outcome"),
  round: integer("round").notNull().default(1),
  followUpErId: integer("follow_up_er_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertEfficacyReviewSchema = createInsertSchema(efficacyReviewsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEfficacyReview = z.infer<typeof insertEfficacyReviewSchema>;
export type EfficacyReview = typeof efficacyReviewsTable.$inferSelect;
