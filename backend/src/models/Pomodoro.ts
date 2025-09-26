import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core'
import { subject } from './Subject'

export const pomodoro = sqliteTable('pomodoro',{
    pomodoroID: integer("pomodoro_id").primaryKey({ autoIncrement: true }),
    focus: integer("focus"),
    shortBreak: integer("short_break"),
    longBreak: integer("long_break"),
    cicle: integer("cicle"),
    description: text("description"), //creo que tenemos que borrar
    subjectId: integer("subject_id").notNull().references(() => subject.subjectId)
})