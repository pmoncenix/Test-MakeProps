export interface User {
  id: number;
  name: string;
  email: string;
  photos: string[];
}

export interface UserUpdate extends Pick<User, "name" | "email"> {
  firstName: string;
  lastName: string;
}

export interface UserPage {
  users: User[];
  total: number;
}

export interface NewUser {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  photos: string[];
}

export interface UserCredential extends User {
  passwordHash: string | null;
}
