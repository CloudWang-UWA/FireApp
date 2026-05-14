import { API_BASE_URL, TOKEN_STORAGE_KEY } from '../config/map'
import type { AuthFormState, AuthUser } from '../types/auth'

const USER_STORAGE_KEY = 'auth_user'
const SESSION_CHECK_TIMEOUT_MS = 10000

type AuthPayload = {
  error?: string
  message?: string
  token?: string
  user?: AuthUser
}

async function parseResponse(response: Response) {
  const payload = (await response.json().catch(() => ({}))) as AuthPayload

  if (!response.ok) {
    if (response.status === 401) {
      clearStoredAuth()
    }

    throw new Error(payload.error ?? payload.message ?? 'Request failed')
  }

  return payload
}

export function getStoredToken() {
  return window.localStorage.getItem(TOKEN_STORAGE_KEY) ?? ''
}

export function storeToken(token: string) {
  if (token) {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token)
  } else {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY)
  }
}

export function storeUser(user: AuthUser | null) {
  if (user) {
    window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
  } else {
    window.localStorage.removeItem(USER_STORAGE_KEY)
  }
}

export function getStoredUser(): AuthUser | null {
  const data = window.localStorage.getItem(USER_STORAGE_KEY)

  if (!data) {
    return null
  }

  try {
    return JSON.parse(data) as AuthUser
  } catch {
    window.localStorage.removeItem(USER_STORAGE_KEY)
    return null
  }
}

export function clearStoredAuth() {
  storeToken('')
  storeUser(null)
}

export function isAdmin(user: AuthUser | null) {
  return user?.role === 'admin'
}

export function hasRole(user: AuthUser | null, roles: string[]) {
  return !!user && roles.includes(user.role)
}

export async function register(form: AuthFormState) {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: form.email,
      password: form.password,
      displayName: form.displayName,
      username: form.username,
      bio: form.bio,
    }),
  })

  const payload = await parseResponse(response)

  if (payload.token && payload.user) {
    storeToken(payload.token)
    storeUser(payload.user)
  }

  return payload
}

export async function login(form: AuthFormState) {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: form.email,
      password: form.password,
    }),
  })

  const payload = await parseResponse(response)

  if (payload.token && payload.user) {
    storeToken(payload.token)
    storeUser(payload.user)
  }

  return payload
}

export async function getCurrentUser(token: string, signal?: AbortSignal) {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    signal,
  })

  const payload = await parseResponse(response)

  if (payload.user) {
    storeUser(payload.user)
  }

  return payload
}

export async function bootstrapSession() {
  const token = getStoredToken()

  if (!token) {
    clearStoredAuth()
    return null
  }

  const controller = new AbortController()
  const timeoutId = window.setTimeout(
    () => controller.abort(),
    SESSION_CHECK_TIMEOUT_MS,
  )

  try {
    const payload = await getCurrentUser(token, controller.signal)
    return payload.user ?? null
  } catch {
    clearStoredAuth()
    return null
  } finally {
    window.clearTimeout(timeoutId)
  }
}

export async function logout(token: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return await parseResponse(response)
  } finally {
    clearStoredAuth()
  }
}
