import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const raCommunicationLogTable = pgTable("ra_communication_log", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").notNull(),
  communicatedTo: text("communicated_to").notNull(),
  method: text("method").notNull(),
  communicationDate: text("communication_date").notNull(),
  summary: text("summary").notNull(),
  loggedBy: text("logged_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRaCommunicationLogSchema = createInsertSchema(raCommunicationLogTable).omit({ id: true, createdAt: true });
export type InsertRaCommunicationLog = z.infer<typeof insertRaCommunicationLogSchema>;
export type RaCommunicationLog = typeof raCommunicationLogTable.$inferSelect;
