import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const raModuleLinksTable = pgTable("ra_module_links", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").notNull(),
  moduleType: text("module_type").notNull(),
  moduleId: integer("module_id").notNull(),
  moduleNumber: text("module_number").notNull(),
  moduleTitle: text("module_title"),
  linkedBy: text("linked_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRaModuleLinkSchema = createInsertSchema(raModuleLinksTable).omit({ id: true, createdAt: true });
export type InsertRaModuleLink = z.infer<typeof insertRaModuleLinkSchema>;
export type RaModuleLink = typeof raModuleLinksTable.$inferSelect;
