import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const systemConfigTable = pgTable("qms_system_config", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type SystemConfig = typeof systemConfigTable.$inferSelect;
