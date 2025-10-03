import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core'

export const phrases = sqliteTable("phrases",{
    pharses: text("phrases")
})