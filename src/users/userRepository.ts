import type { User, UserPage, UserUpdate } from "../domain/user.js";

export interface UserRepository {
  findById(id: number): User | null;
  findPage(page: number, limit: number): UserPage;
  searchPage(query: string, page: number, limit: number): UserPage;
  updateById(id: number, user: UserUpdate): User | null;
  deleteById(id: number): boolean;
}
