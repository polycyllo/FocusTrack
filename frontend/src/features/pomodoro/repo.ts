import { desc, eq } from "drizzle-orm";

import { db } from "../../db/db";
import { pomodoro } from "../../db/schemas/Pomodoro";

export type PomodoroConfigRecord = {
  focus: number;
  shortBreak: number;
  longBreak: number;
  cicle: number;
};

export async function getPomodoroConfigBySubject(subjectId: number) {
  const rows = await db
    .select()
    .from(pomodoro)
    .where(eq(pomodoro.subjectId, subjectId))
    .limit(1);

  if (!rows.length) return null;

  const record = rows[0];
  return {
    focus: record.focus ?? 25,
    shortBreak: record.shortBreak ?? 5,
    longBreak: record.longBreak ?? 20,
    cicle: record.cicle ?? 4,
  };
}

export async function upsertPomodoroConfigForSubject(
  subjectId: number,
  data: PomodoroConfigRecord
) {
  const existing = await db
    .select({ pomodoroId: pomodoro.pomodoroID })
    .from(pomodoro)
    .where(eq(pomodoro.subjectId, subjectId))
    .limit(1);

  if (existing.length) {
    await db
      .update(pomodoro)
      .set({
        focus: data.focus,
        shortBreak: data.shortBreak,
        longBreak: data.longBreak,
        cicle: data.cicle,
      })
      .where(eq(pomodoro.subjectId, subjectId));
    return existing[0].pomodoroId;
  }

  await db.insert(pomodoro).values({
    focus: data.focus,
    shortBreak: data.shortBreak,
    longBreak: data.longBreak,
    cicle: data.cicle,
    subjectId,
  } as any);

  const [lastInserted] = await db
    .select({ pomodoroId: pomodoro.pomodoroID })
    .from(pomodoro)
    .where(eq(pomodoro.subjectId, subjectId))
    .orderBy(desc(pomodoro.pomodoroID))
    .limit(1);

  return lastInserted?.pomodoroId ?? null;
}
