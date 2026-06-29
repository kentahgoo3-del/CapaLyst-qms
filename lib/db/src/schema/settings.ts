import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const settingOptionsTable = pgTable("qms_setting_options", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(),
  value: text("value").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
