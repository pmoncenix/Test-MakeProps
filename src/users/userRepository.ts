import type { NewUser, User, UserCredential, UserPage, UserUpdate } from "../domain/user.js";

export interface UserRepository {
  findById(id: number): User | null;
  findByEmail(email: string): UserCredential | null;
  findPage(page: number, limit: number): UserPage;
  searchPage(query: string, page: number, limit: number): UserPage;
  create(user: NewUser): User;
  updateById(id: number, user: UserUpdate): User | null;
  deleteById(id: number): boolean;
}
