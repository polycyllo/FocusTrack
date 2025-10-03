import * as SQLite from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";

const sqlite = SQLite.openDatabaseSync("focustrack.db");
export const db = drizzle(sqlite);
export { sqlite };
