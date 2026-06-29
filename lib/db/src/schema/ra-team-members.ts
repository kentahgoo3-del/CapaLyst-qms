import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const raTeamMembersTable = pgTable("ra_team_members", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").notNull(),
  name: text("name").notNull(),
  area: text("area").notNull(),
  designation: text("designation"),
  role: text("role").notNull().default("Member"),
  acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRaTeamMemberSchema = createInsertSchema(raTeamMembersTable).omit({ id: true, createdAt: true });
export type InsertRaTeamMember = z.infer<typeof insertRaTeamMemberSchema>;
export type RaTeamMember = typeof raTeamMembersTable.$inferSelect;
