import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";

export const attachmentsTable = pgTable("attachments", {
  id: serial("id").primaryKey(),
  module: text("module").notNull(),
  recordId: integer("record_id").notNull(),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  fileData: text("file_data").notNull(),
  uploadedBy: text("uploaded_by").notNull(),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Attachment = typeof attachmentsTable.$inferSelect;
