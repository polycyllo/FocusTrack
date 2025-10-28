import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core'
import { task } from './Task'

// La tabla `reminder` también se usa para almacenar alarmas.
// Arrays/objetos (times, repeatDays, customByDay) se guardan como JSON en text.
export const reminder = sqliteTable('reminder',{
    reminderId: integer("reminder_id").primaryKey({autoIncrement:true}),

    // Campos para alarmas (opcional para compatibilidad)
    id: text("id"),
    title: text("title"),
    type: text("type"),
    linkedId: text("linked_id"),

    repeatType: text("repeat_type"),
    date: text("date"),
    time: text("time"),
    times: text("times"), // JSON array
    repeatDays: text("repeat_days"), // JSON array
    customByDay: text("custom_by_day"), // JSON map as JSON

    tone: text("tone"),
    vibration: integer("vibration").notNull().default(1),
    active: integer("active").notNull().default(1),

    createdAt: text("created_at"),

    // Campos legacy / existentes
    dueAt: text("due_at").notNull(),
    status: integer("status").$type<0|1>().notNull().default(0),
    taskId: integer("task_id") // Opcional (sin .notNull() ni referencia para alarmas)
})