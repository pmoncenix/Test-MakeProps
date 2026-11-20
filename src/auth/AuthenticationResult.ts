import type { User } from "../domain/user.js";

export interface AuthenticationResult {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  user: User;
}
