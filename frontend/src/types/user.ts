export interface User {
  id: number
  name: string
  email: string
  photos: string[]
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface UserPage {
  users: User[]
  pagination: Pagination
}

export interface AuthenticationResult {
  accessToken: string
  tokenType: 'Bearer'
  expiresIn: number
  user: User
}

export interface ApiErrorBody {
  error?: {
    code?: string
    message?: string
  }
}
