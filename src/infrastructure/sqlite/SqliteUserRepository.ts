import type Database from "better-sqlite3";
import { UserEmailAlreadyInUseError } from "../../domain/errors/UserEmailAlreadyInUseError.js";
import type { NewUser, User, UserCredential, UserPage, UserUpdate } from "../../domain/user.js";
import type { UserRepository } from "../../users/userRepository.js";

interface UserRow {
  id: number;
  name: string;
  email: string;
  photosJson: string;
}

interface UserCredentialRow extends UserRow {
  passwordHash: string | null;
}

export class SqliteUserRepository implements UserRepository {
  constructor(private readonly database: Database.Database) {}

  findById(id: number): User | null {
    const row = this.database
      .prepare("SELECT id, name, email, photos_json AS photosJson FROM users WHERE id = ?")
      .get(id) as UserRow | undefined;

    return row ? mapUserRow(row) : null;
  }

  findByEmail(email: string): UserCredential | null {
    const row = this.database
      .prepare(`
        SELECT id, name, email, photos_json AS photosJson, password_hash AS passwordHash
        FROM users
        WHERE lower(email) = lower(?)
      `)
      .get(email) as UserCredentialRow | undefined;

    return row ? { ...mapUserRow(row), passwordHash: row.passwordHash } : null;
  }

  findPage(page: number, limit: number): UserPage {
    const offset = (page - 1) * limit;
    const users = this.database
      .prepare("SELECT id, name, email, photos_json AS photosJson FROM users ORDER BY id ASC LIMIT ? OFFSET ?")
      .all(limit, offset) as UserRow[];
    const { total } = this.database
      .prepare("SELECT COUNT(*) AS total FROM users")
      .get() as { total: number };

    return { users: users.map(mapUserRow), total };
  }

  searchPage(query: string, page: number, limit: number): UserPage {
    const pattern = `%${escapeLikePattern(query)}%`;
    const users = this.database
      .prepare(`
        SELECT id, name, email, photos_json AS photosJson
        FROM users
        WHERE normalize_for_search(name) LIKE normalize_for_search(?) ESCAPE '!'
          OR normalize_for_search(email) LIKE normalize_for_search(?) ESCAPE '!'
        ORDER BY id ASC
        LIMIT ? OFFSET ?
      `)
      .all(pattern, pattern, limit, (page - 1) * limit) as UserRow[];
    const { total } = this.database
      .prepare(`
        SELECT COUNT(*) AS total
        FROM users
        WHERE normalize_for_search(name) LIKE normalize_for_search(?) ESCAPE '!'
          OR normalize_for_search(email) LIKE normalize_for_search(?) ESCAPE '!'
      `)
      .get(pattern, pattern) as { total: number };

    return { users: users.map(mapUserRow), total };
  }

  create(user: NewUser): User {
    try {
      const result = this.database
        .prepare(`
          INSERT INTO users (name, first_name, last_name, email, password_hash, photos_json)
          VALUES (?, ?, ?, ?, ?, ?)
        `)
        .run(
          `${user.firstName} ${user.lastName}`,
          user.firstName,
          user.lastName,
          user.email,
          user.passwordHash,
          JSON.stringify(user.photos),
        );

      return {
        id: Number(result.lastInsertRowid),
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        photos: user.photos,
      };
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new UserEmailAlreadyInUseError();
      }

      throw error;
    }
  }

  updateById(id: number, user: UserUpdate): User | null {
    try {
      this.database
        .prepare(`
          UPDATE users
          SET name = ?, email = ?, first_name = ?, last_name = ?
          WHERE id = ?
        `)
        .run(user.name, user.email, user.firstName, user.lastName, id);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new UserEmailAlreadyInUseError();
      }

      throw error;
    }

    return this.findById(id);
  }

  deleteById(id: number): boolean {
    const result = this.database
      .prepare("DELETE FROM users WHERE id = ?")
      .run(id);

    return result.changes > 0;
  }
}

function mapUserRow(row: UserRow): User {
  let photos: unknown;
  try {
    photos = JSON.parse(row.photosJson);
  } catch {
    photos = [];
  }

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    photos: Array.isArray(photos) && photos.every((photo) => typeof photo === "string") ? photos : [],
  };
}

function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === "object"
    && error !== null
    && "code" in error
    && error.code === "SQLITE_CONSTRAINT_UNIQUE";
}

function escapeLikePattern(value: string): string {
  return value.replace(/[!%_]/g, (character) => `!${character}`);
}
