export interface User {
  id: number;
  name: string;
  email: string;
}

export type UserUpdate = Pick<User, "name" | "email">;
