import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core'
import { student } from './Student'

export const subject = sqliteTable('subject', {
  subjectId: integer("subject_id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),
  color: text("color"),
  icon: text("icon"),
  studentId: integer("student_id").references(() => student.studentId)
})