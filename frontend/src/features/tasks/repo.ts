import { desc, eq } from "drizzle-orm";

import { db } from "../../db/db";
import { task } from "../../db/schemas/Task";

export type CreateTaskInput = {
  title: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  subjectId: number;
};

export async function addTask(data: CreateTaskInput) {
  await db.insert(task).values({
    title: data.title,
    description: data.description ?? null,
    color: data.color ?? null,
    icon: data.icon ?? null,
    subjectId: data.subjectId,
  } as any);

  const rows: any[] = await db
    .select()
    .from(task)
    .where(eq(task.subjectId, data.subjectId))
    .orderBy(desc(task.taskId))
    .limit(1);

  const inserted = rows[0];
  return inserted?.taskId ?? inserted?.task_id ?? null;
}

export async function getTasksBySubject(subjectId: number) {
  const rows = await db
    .select()
    .from(task)
    .where(eq(task.subjectId, subjectId))
    .orderBy(desc(task.taskId));

  return rows;
}


export async function updateTaskStatus(taskId: number, status: 0 | 1) {
  const completedAt = status === 1 ? new Date().toISOString() : null;

  await db
    .update(task)
    .set({ status, completedAt } as any)
    .where(eq(task.taskId, taskId));
}

