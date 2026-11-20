import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import Database from "better-sqlite3";
import { openDatabase } from "../src/infrastructure/sqlite/database.js";

describe("migration de la table users", () => {
  it("ajoute les colonnes d’inscription sans perdre les utilisateurs existants", () => {
    const directory = mkdtempSync(join(tmpdir(), "makeprops-migration-"));
    const databasePath = join(directory, "legacy.sqlite");

    try {
      const legacyDatabase = new Database(databasePath);
      legacyDatabase.exec(`
        CREATE TABLE users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE
        );
      `);
      legacyDatabase.prepare("INSERT INTO users (id, name, email) VALUES (?, ?, ?)")
        .run(1, "Alex Martin", "alex@example.com");
      legacyDatabase.close();

      const database = openDatabase(databasePath);
      try {
        const columns = database.pragma("table_info(users)") as Array<{ name: string }>;
        const existingUser = database.prepare("SELECT id, name, email FROM users WHERE id = ?")
          .get(1) as { id: number; name: string; email: string } | undefined;

        assert.ok(columns.some((column) => column.name === "first_name"));
        assert.ok(columns.some((column) => column.name === "last_name"));
        assert.ok(columns.some((column) => column.name === "password_hash"));
        assert.deepEqual(existingUser, {
          id: 1,
          name: "Alex Martin",
          email: "alex@example.com",
        });
      } finally {
        database.close();
      }
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
