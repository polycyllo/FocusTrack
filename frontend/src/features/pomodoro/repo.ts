import { db } from "../../db/db";
import { pomodoro } from "../../db/schemas/Pomodoro";
import { sum } from "drizzle-orm";

export type SavePomodoroInput = {
  focus: number;
  shortBreak: number;
  longBreak: number;
  cicle: number;
  subjectId: number;
};

/**
 * Guarda un registro de pomodoro completado en la base de datos
 */
export async function savePomodoroSession(data: SavePomodoroInput) {
  await db.insert(pomodoro).values({
    focus: data.focus,
    shortBreak: data.shortBreak,
    longBreak: data.longBreak,
    cicle: data.cicle,
    subjectId: data.subjectId,
  } as any);
}

/**
 * Obtiene el tiempo total de pomodoro usado sumando todos los valores de focus
 * de la tabla pomodoro (que son los minutos de configuración de cada sesión)
 */
export async function getTotalPomodoroMinutes() {
  const result = await db
    .select({
      total: sum(pomodoro.focus),
    })
    .from(pomodoro);

  return Number(result[0]?.total ?? 0);
}

export async function getAllPomodoros() {
  const rows = await db.select().from(pomodoro);
  return rows;
}
