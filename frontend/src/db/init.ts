
import { sqlite } from "./db";

function ensureColumn(table: string, column: string, definition: string) {
  try {
    const rows = sqlite.getAllSync<{ name: string }>(
      `PRAGMA table_info('${table}')`
    );
    const hasColumn = rows.some((row) => row.name === column);
    if (!hasColumn) {
      sqlite.execSync(`ALTER TABLE ${table} ADD COLUMN ${definition}`);
    }
  } catch (error) {
    console.warn(
      `[ensureSchema] No se pudo verificar columna ${column} en ${table}:`,
      error
    );
  }
}

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
  date TEXT NOT NULL,
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
`;

  sqlite.execSync(sql);

  ensureColumn("schedule", "day", "day INTEGER");
  ensureColumn("schedule", "date", "date TEXT DEFAULT ''");
  ensureColumn("schedule", "status", "status INTEGER DEFAULT 1");
  try {
    sqlite.execSync("UPDATE schedule SET status = 1 WHERE status IS NULL");
  } catch (error) {
    console.warn("[ensureSchema] No se pudo normalizar schedule.status:", error);
  }
  try {
    sqlite.execSync(
      "UPDATE schedule SET date = COALESCE(date, '') WHERE date IS NULL"
    );
  } catch (error) {
    console.warn("[ensureSchema] No se pudo normalizar schedule.date:", error);
  }
}
