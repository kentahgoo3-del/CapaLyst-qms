import { pgTable, serial, integer, timestamp } from "drizzle-orm/pg-core";

export const deviationLinksTable = pgTable("deviation_links", {
  id: serial("id").primaryKey(),
  deviationId: integer("deviation_id").notNull(),
  relatedDeviationId: integer("related_deviation_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type DeviationLink = typeof deviationLinksTable.$inferSelect;
