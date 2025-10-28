import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core'
import { subject } from './Subject'

export const task = sqliteTable('task',{
    taskId: integer("task_id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    status: integer("status").$type<0|1>().notNull().default(0),
    dueAt: text("due_at"),
    priority: text("priority").notNull(),
    subjectId: integer("subject_id").notNull().references( () => subject.subjectId)
})