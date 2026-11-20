import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import Database from "better-sqlite3";

export function openDatabase(databasePath: string): Database.Database {
  const resolvedPath = databasePath === ":memory:" ? databasePath : resolve(databasePath);

  if (resolvedPath !== ":memory:") {
    mkdirSync(dirname(resolvedPath), { recursive: true });
  }

  const database = new Database(resolvedPath);
  database.function(
    "normalize_for_search",
    { deterministic: true },
    (value: string) => value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase(),
  );
  database.pragma("foreign_keys = ON");
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      first_name TEXT,
      last_name TEXT,
      password_hash TEXT
    );
  `);

  const columns = database.pragma("table_info(users)") as Array<{ name: string }>;
  const existingColumns = new Set(columns.map((column) => column.name));
  for (const column of ["first_name", "last_name", "password_hash"] as const) {
    if (!existingColumns.has(column)) {
      database.exec(`ALTER TABLE users ADD COLUMN ${column} TEXT`);
    }
  }

  return database;
}
