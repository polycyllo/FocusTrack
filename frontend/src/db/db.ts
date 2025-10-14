import * as SQLite from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";
import * as schema from "./schemas";

const sqlite = SQLite.openDatabaseSync("focustrack.db");
//export const db = drizzle(sqlite);

export const db = drizzle(sqlite, { schema });

export { sqlite };
