import type { User, UserUpdate } from "../domain/user.js";

export interface UserRepository {
  findById(id: number): User | null;
  updateById(id: number, user: UserUpdate): User | null;
  deleteById(id: number): boolean;
}
