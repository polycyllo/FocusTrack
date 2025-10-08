import { db } from "../../db/db";
import { subject } from "../../db/schemas/Subject";
import { schedule } from "../../db/schemas/Schedule";
import { eq, desc } from "drizzle-orm";

export type CreateSubjectInput = {
  title: string;
  description?: string | null;
  color?: string | null;
  schedules?: { day: number; start: string; end: string }[];
};

export async function addSubjectWithSchedules(data: CreateSubjectInput) {
  // insert subject then insert schedules referencing subjectId
    // Insert subject and get the last inserted id via SQLite's lastInsertRowid
    await db.insert(subject).values({
      title: data.title,
      description: data.description ?? null,
      color: data.color ?? null,
    } as any);

    // Drizzle with expo-sqlite doesn't always return an inserted id shape, so
    // query the last row ordered by primary key descending as a reliable fallback.
    const rows: any[] = await db.select().from(subject).orderBy(desc(subject.subjectId)).limit(1);
    const subjectId = rows.length ? rows[0].subjectId || rows[0].subject_id : null;

  if (subjectId && data.schedules && data.schedules.length) {
    const values = data.schedules.map((s) => ({
      startTime: s.start,
      endTime: s.end,
      day: s.day,
      status: 1,
      subjectId,
    }));
      // Drizzle accepts an array of values for batch insert
      await db.insert(schedule).values(values as any[]);
  }

  return subjectId;
}

export async function getAllSubjectsWithSchedules() {
  // get subjects
    const subs: any[] = await db.select().from(subject).orderBy(desc(subject.subjectId));
  const result = await Promise.all(
    subs.map(async (s) => {
        const sch = await db.select().from(schedule).where(eq(schedule.subjectId, s.subjectId));
      return {
        subject: s,
        schedules: sch,
      };
    })
  );
  return result;
}

export async function printAllSubjectsWithSchedules() {
  const all = await getAllSubjectsWithSchedules()
  // Print details: subject then its schedules
  console.log('--- Subjects and schedules dump ---')
  for (const r of all) {
    const subj = r.subject
    console.log(`Subject: ${subj.title} (id=${subj.subjectId ?? subj.subject_id})`)
    if (!r.schedules || r.schedules.length === 0) {
      console.log('  (no schedules)')
    } else {
      for (const s of r.schedules) {
        console.log(`  - day=${s.day} start=${s.startTime} end=${s.endTime}`)
      }
    }
  }
  console.log('--- end dump ---')
}
