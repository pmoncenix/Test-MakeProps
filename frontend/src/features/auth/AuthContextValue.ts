import { createContext } from 'react'
import type { User } from '../../types/user'

export interface AuthContextValue {
  token: string | null
  user: User | null
  ready: boolean
  signIn(email: string, password: string): Promise<void>
  register(formData: FormData): Promise<void>
  updateUser(user: User): void
  logout(): void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
