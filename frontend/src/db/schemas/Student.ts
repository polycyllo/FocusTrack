import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core'

export const student = sqliteTable('student',{
    studentId: integer("student_id").primaryKey({ autoIncrement: true }),
    name: text("name"),
    email: text("email"),
    password: text("password")
})