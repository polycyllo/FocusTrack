import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { subject } from "./Subject";

export const schedule = sqliteTable("schedule", {
  scheduleId: integer("schedule_id").primaryKey({ autoIncrement: true }),
  startTime: text("start_time"),
  endTime: text("end_time"),
  day: integer("day"),
  date: text("date"),
  status: integer("status").$type<0 | 1>().notNull().default(1),
  subjectId: integer("subject_id")
    .notNull()
    .references(() => subject.subjectId),
});
