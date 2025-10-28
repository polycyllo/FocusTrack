import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core'
import { task } from './Task'

export const reminder = sqliteTable('reminder',{
    reminderId: integer("reminder_id").primaryKey({autoIncrement:true}),
    dueAt: text("due_at").notNull(),
    status: integer("status").$type<0|1>().notNull().default(0),
    taskId: integer("task_id").notNull().references(() => task.taskId)
})