import type Database from "better-sqlite3";
import type { User } from "../../domain/user.js";
import type { UserRepository } from "../../users/userRepository.js";

interface UserRow {
  id: number;
  name: string;
  email: string;
}

export class SqliteUserRepository implements UserRepository {
  constructor(private readonly database: Database.Database) {}

  findById(id: number): User | null {
    const row = this.database
      .prepare("SELECT id, name, email FROM users WHERE id = ?")
      .get(id) as UserRow | undefined;

    return row ?? null;
  }
}
