
import { sqlite } from "./db";

export function ensureSchema() {
  sqlite.execSync(`
    PRAGMA journal_mode = WAL;

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
      color TEXT
    );

    CREATE TABLE IF NOT EXISTS task (
      task_id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      status INTEGER NOT NULL DEFAULT 0,
      due_at TEXT,
      priority TEXT DEFAULT 'medium',
      subject_id INTEGER REFERENCES subject(subject_id),
      task_type_id INTEGER
    );

    CREATE TABLE IF NOT EXISTS schedule (
      schedule_id INTEGER PRIMARY KEY AUTOINCREMENT,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      date TEXT NOT NULL,
      subject_id INTEGER REFERENCES subject(subject_id)
    );

    CREATE TABLE IF NOT EXISTS pomodoro (
      pomodoro_id INTEGER PRIMARY KEY AUTOINCREMENT,
      focus INTEGER NOT NULL,
      short_break INTEGER NOT NULL,
      long_break INTEGER NOT NULL,
      cicle INTEGER NOT NULL,
      description TEXT,
      subject_id INTEGER REFERENCES subject(subject_id)
    );

    CREATE TABLE IF NOT EXISTS reminder (
      reminder_id INTEGER PRIMARY KEY AUTOINCREMENT,
      due_at TEXT NOT NULL,
      status INTEGER NOT NULL DEFAULT 0,
      task_id INTEGER REFERENCES task(task_id)
    );

    CREATE TABLE IF NOT EXISTS phrases (
      phrases_id INTEGER PRIMARY KEY AUTOINCREMENT,
      phrase TEXT NOT NULL,
      lang TEXT DEFAULT 'es',
      active INTEGER DEFAULT 1
    );

    -- índices útiles
    CREATE INDEX IF NOT EXISTS idx_task_status_due ON task (status, due_at);
    CREATE INDEX IF NOT EXISTS idx_reminder_due ON reminder (status, due_at);
  `);
}
