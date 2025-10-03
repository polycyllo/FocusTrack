import { db } from "../../db/db";
import { student } from "../../db/schemas/Student";
import { eq } from "drizzle-orm";

export async function addStudent(data: { name: string; email: string; password: string }) {
  return db.insert(student).values(data);
}
export async function listStudents() {
  return db.select().from(student);
}