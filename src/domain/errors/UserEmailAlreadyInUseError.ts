export class UserEmailAlreadyInUseError extends Error {
  constructor() {
    super("Cette adresse email est déjà utilisée par un autre utilisateur.");
    this.name = "UserEmailAlreadyInUseError";
  }
}
