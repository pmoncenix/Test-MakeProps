import { AppError } from "../errors/AppError.js";
import { UserEmailAlreadyInUseError } from "../domain/errors/UserEmailAlreadyInUseError.js";
import type { User, UserUpdate } from "../domain/user.js";
import type { UserRepository } from "./userRepository.js";

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  getById(rawId: unknown): User {
    const id = parseId(rawId);

    const user = this.userRepository.findById(id);
    if (!user) throw userNotFoundError(id);

    return user;
  }

  list(rawPage: unknown, rawLimit: unknown): {
    users: User[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  } {
    const page = parsePaginationParameter(rawPage, 1, "page");
    const limit = parsePaginationParameter(rawLimit, 10, "limit", 100);
    const offset = (page - 1) * limit;

    if (!Number.isSafeInteger(offset)) {
      throw invalidPaginationError();
    }

    return toPaginatedResponse(this.userRepository.findPage(page, limit), page, limit);
  }

  search(rawQuery: unknown, rawPage: unknown, rawLimit: unknown): {
    users: User[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  } {
    const query = parseSearchQuery(rawQuery);
    const page = parsePaginationParameter(rawPage, 1, "page");
    const limit = parsePaginationParameter(rawLimit, 10, "limit", 100);
    const offset = (page - 1) * limit;

    if (!Number.isSafeInteger(offset)) {
      throw invalidPaginationError();
    }

    return toPaginatedResponse(this.userRepository.searchPage(query, page, limit), page, limit);
  }

  updateById(rawId: unknown, rawInput: unknown): User {
    const id = parseId(rawId);
    const update = parseUserUpdate(rawInput);

    try {
      const user = this.userRepository.updateById(id, update);
      if (!user) throw userNotFoundError(id);
      return user;
    } catch (error) {
      if (error instanceof UserEmailAlreadyInUseError) {
        throw new AppError(409, "EMAIL_ALREADY_IN_USE", error.message);
      }

      throw error;
    }
  }

  deleteById(rawId: unknown): void {
    const id = parseId(rawId);
    const deleted = this.userRepository.deleteById(id);
    if (!deleted) throw userNotFoundError(id);
  }
}

function parseId(rawId: unknown): number {
  if (typeof rawId !== "string" || !/^[1-9]\d*$/.test(rawId)) {
    throw new AppError(400, "INVALID_USER_ID", "L’identifiant doit être un entier positif.");
  }

  const id = Number(rawId);
  if (!Number.isSafeInteger(id)) {
    throw new AppError(400, "INVALID_USER_ID", "L’identifiant doit être un entier positif.");
  }

  return id;
}

function parsePaginationParameter(
  rawValue: unknown,
  defaultValue: number,
  parameterName: "page" | "limit",
  maximum?: number,
): number {
  if (rawValue === undefined) return defaultValue;

  if (typeof rawValue !== "string" || !/^[1-9]\d*$/.test(rawValue)) {
    throw invalidPaginationError();
  }

  const value = Number(rawValue);
  if (!Number.isSafeInteger(value) || (maximum !== undefined && value > maximum)) {
    throw invalidPaginationError();
  }

  if (parameterName === "limit" && value < 1) {
    throw invalidPaginationError();
  }

  return value;
}

function parseSearchQuery(rawQuery: unknown): string {
  if (typeof rawQuery !== "string") {
    throw invalidSearchQueryError();
  }

  const query = rawQuery.trim();
  if (query.length === 0 || query.length > 100) {
    throw invalidSearchQueryError();
  }

  return query;
}

function invalidSearchQueryError(): AppError {
  return new AppError(
    400,
    "INVALID_SEARCH_QUERY",
    "Le paramètre q est obligatoire et doit contenir entre 1 et 100 caractères.",
  );
}

function toPaginatedResponse(
  result: { users: User[]; total: number },
  page: number,
  limit: number,
): {
  users: User[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
} {
  return {
    users: result.users,
    pagination: {
      page,
      limit,
      total: result.total,
      totalPages: Math.ceil(result.total / limit),
    },
  };
}

function invalidPaginationError(): AppError {
  return new AppError(
    400,
    "INVALID_PAGINATION",
    "Les paramètres page et limit doivent être des entiers positifs; limit ne peut pas dépasser 100.",
  );
}

function parseUserUpdate(rawInput: unknown): UserUpdate {
  if (typeof rawInput !== "object" || rawInput === null || Array.isArray(rawInput)) {
    throw invalidUserInputError();
  }

  const input = rawInput as Record<string, unknown>;
  if (typeof input.name !== "string" || input.name.trim().length === 0) {
    throw invalidUserInputError();
  }

  if (typeof input.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
    throw invalidUserInputError();
  }

  return {
    name: input.name.trim(),
    email: input.email.trim(),
  };
}

function invalidUserInputError(): AppError {
  return new AppError(
    400,
    "INVALID_USER_INPUT",
    "Le corps doit contenir un nom non vide et une adresse email valide.",
  );
}

function userNotFoundError(id: number): AppError {
  return new AppError(404, "USER_NOT_FOUND", `Aucun utilisateur trouvé avec l’identifiant ${id}.`);
}
