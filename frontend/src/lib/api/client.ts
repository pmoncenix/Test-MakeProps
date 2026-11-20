import type { ApiErrorBody, User, UserPage } from '../../types/user'

const apiBaseUrl = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/u, '')
export const AUTH_INVALID_EVENT = 'makeprops:auth-invalid'

export class ApiError extends Error {
  public readonly status: number
  public readonly code?: string

  constructor(
    message: string,
    status: number,
    code?: string,
  ) {
    super(message)
    this.status = status
    if (code !== undefined) this.code = code
    this.name = 'ApiError'
  }
}

interface RequestOptions extends Omit<RequestInit, 'headers'> {
  token?: string | null
  headers?: HeadersInit
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers: customHeaders, ...init } = options
  const headers = new Headers(customHeaders)

  if (typeof init.body === 'string') headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let response: Response
  try {
    response = await fetch(`${apiBaseUrl}${path}`, { ...init, headers })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError('Impossible de joindre l’API. Vérifiez que le serveur est démarré.', 0)
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as ApiErrorBody
    if (response.status === 401 && token) {
      window.dispatchEvent(new Event(AUTH_INVALID_EVENT))
    }
    throw new ApiError(
      body.error?.message ?? `La requête a échoué (${response.status}).`,
      response.status,
      body.error?.code,
    )
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export const userApi = {
  list(token: string, page: number, limit: number, signal?: AbortSignal) {
    const query = new URLSearchParams({ page: String(page), limit: String(limit) })
    return apiRequest<UserPage>(`/user/list?${query}`, { token, signal })
  },
  search(token: string, term: string, page: number, limit: number, signal?: AbortSignal) {
    const query = new URLSearchParams({ q: term, page: String(page), limit: String(limit) })
    return apiRequest<UserPage>(`/user/search?${query}`, { token, signal })
  },
  get(token: string, id: number, signal?: AbortSignal) {
    return apiRequest<User>(`/user/get?id=${id}`, { token, signal })
  },
  current(token: string, signal?: AbortSignal) {
    return apiRequest<User>('/user/me', { token, signal })
  },
  update(token: string, id: number, values: Pick<User, 'name' | 'email'>) {
    return apiRequest<User>(`/user/update?id=${id}`, {
      token,
      method: 'PUT',
      body: JSON.stringify(values),
    })
  },
  updateCurrent(token: string, values: Pick<User, 'name' | 'email'>) {
    return apiRequest<User>('/user/me', {
      token,
      method: 'PUT',
      body: JSON.stringify(values),
    })
  },
  remove(token: string, id: number) {
    return apiRequest<void>(`/user/delete?id=${id}`, { token, method: 'DELETE' })
  },
}

export function mediaUrl(path: string): string {
  return `${apiBaseUrl}${path}`
}

export async function checkApiHealth(signal?: AbortSignal): Promise<void> {
  await apiRequest<{ status: string }>('/health', { signal })
}
