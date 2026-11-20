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
