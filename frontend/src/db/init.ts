
import { sqlite } from './db'

export function ensureSchema() {
  const sql = `PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS student (
  student_id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  password TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS subject (
  subject_id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  color TEXT,
  student_id INTEGER
);

CREATE TABLE IF NOT EXISTS task (
  task_id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  status INTEGER NOT NULL DEFAULT 0,
  due_at TEXT,
  priority TEXT DEFAULT 'medium',
  subject_id INTEGER,
  task_type_id INTEGER
);

CREATE TABLE IF NOT EXISTS schedule (
  schedule_id INTEGER PRIMARY KEY AUTOINCREMENT,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  day INTEGER NOT NULL,
  status INTEGER NOT NULL DEFAULT 1,
  subject_id INTEGER
);

CREATE TABLE IF NOT EXISTS pomodoro (
  pomodoro_id INTEGER PRIMARY KEY AUTOINCREMENT,
  focus INTEGER NOT NULL,
  short_break INTEGER NOT NULL,
  long_break INTEGER NOT NULL,
  cicle INTEGER NOT NULL,
  description TEXT,
  subject_id INTEGER
);

CREATE TABLE IF NOT EXISTS reminder (
  reminder_id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Alarm fields (stored as TEXT/JSON when needed)
  id TEXT,
  title TEXT,
  type TEXT,
  linked_id TEXT,

  repeat_type TEXT,
  date TEXT,
  time TEXT,
  times TEXT,
  repeat_days TEXT,
  custom_by_day TEXT,

  tone TEXT,
  vibration INTEGER NOT NULL DEFAULT 1,
  active INTEGER NOT NULL DEFAULT 1,

  created_at TEXT,

  -- legacy fields
  due_at TEXT NOT NULL,
  status INTEGER NOT NULL DEFAULT 0,
  task_id INTEGER
);

CREATE TABLE IF NOT EXISTS phrases (
  phrases_id INTEGER PRIMARY KEY AUTOINCREMENT,
  phrase TEXT NOT NULL,
  lang TEXT DEFAULT 'es',
  active INTEGER DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_task_status_due ON task (status, due_at);
CREATE INDEX IF NOT EXISTS idx_reminder_due ON reminder (status, due_at);
`

  sqlite.execSync(sql)
  
  // Migrar tabla reminder si existe pero le faltan columnas para alarmas
  migrateReminderTable()
}

function migrateReminderTable() {
  try {
    // Verificar si existe la columna 'id'
    const checkColumnSql = `PRAGMA table_info(reminder);`
    const columns = sqlite.getAllSync(checkColumnSql) as any[]
    
    const hasAlarmColumns = columns.some(col => col.name === 'id')
    
    if (!hasAlarmColumns) {
      console.log('📦 Migrando tabla reminder para agregar columnas de alarmas...')
      
      // Agregar las columnas de alarmas a la tabla existente
      const migrationSql = `
        ALTER TABLE reminder ADD COLUMN id TEXT;
        ALTER TABLE reminder ADD COLUMN title TEXT;
        ALTER TABLE reminder ADD COLUMN type TEXT;
        ALTER TABLE reminder ADD COLUMN linked_id TEXT;
        ALTER TABLE reminder ADD COLUMN repeat_type TEXT;
        ALTER TABLE reminder ADD COLUMN date TEXT;
        ALTER TABLE reminder ADD COLUMN time TEXT;
        ALTER TABLE reminder ADD COLUMN times TEXT;
        ALTER TABLE reminder ADD COLUMN repeat_days TEXT;
        ALTER TABLE reminder ADD COLUMN custom_by_day TEXT;
        ALTER TABLE reminder ADD COLUMN tone TEXT;
        ALTER TABLE reminder ADD COLUMN vibration INTEGER DEFAULT 1;
        ALTER TABLE reminder ADD COLUMN active INTEGER DEFAULT 1;
        ALTER TABLE reminder ADD COLUMN created_at TEXT;
      `
      
      // Ejecutar cada ALTER TABLE por separado
      const alterStatements = migrationSql.split(';').filter(s => s.trim())
      for (const statement of alterStatements) {
        try {
          sqlite.execSync(statement.trim() + ';')
        } catch (e: any) {
          // Ignorar errores de columnas que ya existen
          if (!e.message?.includes('duplicate column name')) {
            console.warn('Error en migración:', e.message)
          }
        }
      }
      
      console.log('✅ Migración de tabla reminder completada')
    }
  } catch (e: any) {
    console.warn('Error durante migración de reminder:', e.message)
  }
}
