import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const subject = sqliteTable("subject", {
  subjectId: integer("subject_id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),
  color: text("color"),
});
