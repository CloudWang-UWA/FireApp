import { API_BASE_URL } from '../config/map'
import type { AuthUser } from '../types/auth'

type AdminUserPayload = {
  error?: string
  message?: string
  user?: AuthUser
  users?: AuthUser[]
}

async function parseAdminResponse(response: Response) {
  const payload = (await response.json().catch(() => ({}))) as AdminUserPayload

  if (!response.ok) {
    throw new Error(payload.error ?? payload.message ?? 'Admin request failed')
  }

  return payload
}

export async function fetchPendingUsers(token: string) {
  const response = await fetch(`${API_BASE_URL}/api/admin/pending-users`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const payload = await parseAdminResponse(response)
  return payload.users ?? []
}

export async function approveUser(token: string, userId: number) {
  const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/approve`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const payload = await parseAdminResponse(response)
  return payload.user
}

export async function deleteUser(token: string, userId: number) {
  const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  return parseAdminResponse(response)
}
