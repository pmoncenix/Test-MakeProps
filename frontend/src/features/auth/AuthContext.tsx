import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { apiRequest, AUTH_INVALID_EVENT, userApi } from '../../lib/api/client'
import type { AuthenticationResult, User } from '../../types/user'
import { AuthContext } from './AuthContextValue'

const TOKEN_KEY = 'makeprops.accessToken'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => window.localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(() => !window.localStorage.getItem(TOKEN_KEY))

  const logout = useCallback(() => {
    window.localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
    setReady(true)
  }, [])

  const storeSession = useCallback((result: AuthenticationResult) => {
    window.localStorage.setItem(TOKEN_KEY, result.accessToken)
    setToken(result.accessToken)
    setUser(result.user)
    setReady(true)
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await apiRequest<AuthenticationResult>('/user/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    storeSession(result)
  }, [storeSession])

  const register = useCallback(async (formData: FormData) => {
    const result = await apiRequest<AuthenticationResult>('/user/register', {
      method: 'POST',
      body: formData,
    })
    storeSession(result)
  }, [storeSession])

  const updateUser = useCallback((updatedUser: User) => setUser(updatedUser), [])

  useEffect(() => {
    const onInvalidToken = () => logout()
    window.addEventListener(AUTH_INVALID_EVENT, onInvalidToken)
    return () => window.removeEventListener(AUTH_INVALID_EVENT, onInvalidToken)
  }, [logout])

  useEffect(() => {
    if (!token) return

    const controller = new AbortController()
    userApi.current(token, controller.signal)
      .then((currentUser) => setUser(currentUser))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        logout()
      })
      .finally(() => setReady(true))

    return () => controller.abort()
  }, [token, logout])

  const value = useMemo(() => ({ token, user, ready, signIn, register, updateUser, logout }), [
    token,
    user,
    ready,
    signIn,
    register,
    updateUser,
    logout,
  ])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
