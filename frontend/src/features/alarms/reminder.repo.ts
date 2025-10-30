import { db } from "../../db/db";
import { reminder } from "../../db/schemas/Reminder";
import { eq } from "drizzle-orm";

type AlarmLike = {
  id?: string;
  title?: string;
  type?: string;
  linkedId?: string | null;

  repeatType?: string;
  date?: string | null;
  time?: string | null;
  times?: string[] | null;
  repeatDays?: string[] | null;
  customByDay?: Record<string, string[]> | null;

  tone?: string;
  vibration?: boolean | number;
  active?: boolean | number;

  createdAt?: string;
};

function boolToInt(v?: boolean | number) {
  if (typeof v === "number") return v ? 1 : 0;
  return v ? 1 : 0;
}

export async function insertAlarm(a: AlarmLike) {
  const row = {
    id: a.id,
    title: a.title,
    type: a.type,
    linkedId: a.linkedId ?? null,

    repeatType: a.repeatType ?? null,
    date: a.date ?? null,
    time: a.time ?? null,
    times: a.times ? JSON.stringify(a.times) : null,
    repeatDays: a.repeatDays ? JSON.stringify(a.repeatDays) : null,
    customByDay: a.customByDay ? JSON.stringify(a.customByDay) : null,

    tone: a.tone ?? null,
    vibration: boolToInt(a.vibration),
    active: boolToInt(a.active),

    createdAt: a.createdAt ?? new Date().toISOString(),

    // legacy placeholders: usar valores por defecto para evitar errores
    dueAt: new Date().toISOString(),
    status: 0 as 0 | 1,
    taskId: null, // Opcional para alarmas
  };

  return db.insert(reminder).values(row);
}

export async function updateAlarmById(alarmId: string, patch: Partial<AlarmLike>) {
  const row: any = {};
  if (patch.title !== undefined) row.title = patch.title;
  if (patch.type !== undefined) row.type = patch.type;
  if (patch.linkedId !== undefined) row.linkedId = patch.linkedId;

  if (patch.repeatType !== undefined) row.repeatType = patch.repeatType;
  if (patch.date !== undefined) row.date = patch.date;
  if (patch.time !== undefined) row.time = patch.time;
  if (patch.times !== undefined) row.times = patch.times ? JSON.stringify(patch.times) : null;
  if (patch.repeatDays !== undefined) row.repeatDays = patch.repeatDays ? JSON.stringify(patch.repeatDays) : null;
  if (patch.customByDay !== undefined) row.customByDay = patch.customByDay ? JSON.stringify(patch.customByDay) : null;

  if (patch.tone !== undefined) row.tone = patch.tone;
  if (patch.vibration !== undefined) row.vibration = boolToInt(patch.vibration);
  if (patch.active !== undefined) row.active = boolToInt(patch.active);

  if (patch.createdAt !== undefined) row.createdAt = patch.createdAt;

  return db.update(reminder).set(row).where(eq(reminder.id, alarmId));
}

export async function findByAlarmId(alarmId: string) {
  return db.select().from(reminder).where(eq(reminder.id, alarmId));
}

export async function deleteAlarmById(alarmId: string) {
  return db.delete(reminder).where(eq(reminder.id, alarmId));
}

export async function getAllAlarms() {
  return db.select().from(reminder);
}
