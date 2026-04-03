import { API_BASE_URL, TOKEN_STORAGE_KEY } from '../config/map'
import type { AuthFormState, AuthUser } from '../types/auth'

// Structure of authentication API response
type AuthPayload = {
  error?: string
  message?: string
  token?: string
  user?: AuthUser
}

// Parse server response and handle common errors
async function parseResponse(response: Response) {
  const payload = (await response.json()) as AuthPayload

  if (!response.ok) {
    throw new Error(payload.error ?? 'Request failed')
  }

  return payload
}

// Get token from localStorage (empty string if not found)
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

// Send registration request to backend
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
    }),
  })

  return parseResponse(response)
}

// Login user and return token + user info
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

  return parseResponse(response)
}

// Fetch current user info using token
export async function getCurrentUser(token: string) {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  return parseResponse(response)
}

// Logout user (invalidate token on server)
export async function logout(token: string) {
  const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  return parseResponse(response)
}
