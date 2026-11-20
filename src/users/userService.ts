import { AppError } from "../errors/AppError.js";
import type { User } from "../domain/user.js";
import type { UserRepository } from "./userRepository.js";

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  getById(rawId: unknown): User {
    if (typeof rawId !== "string" || !/^[1-9]\d*$/.test(rawId)) {
      throw new AppError(400, "INVALID_USER_ID", "L’identifiant doit être un entier positif.");
    }

    const id = Number(rawId);
    if (!Number.isSafeInteger(id)) {
      throw new AppError(400, "INVALID_USER_ID", "L’identifiant doit être un entier positif.");
    }

    const user = this.userRepository.findById(id);
    if (!user) {
      throw new AppError(404, "USER_NOT_FOUND", `Aucun utilisateur trouvé avec l’identifiant ${id}.`);
    }

    return user;
  }
}
