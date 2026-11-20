export interface User {
  id: number;
  name: string;
  email: string;
}

export type UserUpdate = Pick<User, "name" | "email">;

export interface UserPage {
  users: User[];
  total: number;
}
