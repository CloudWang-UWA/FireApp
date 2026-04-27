export type AuthMode = 'login' | 'register'

export type AuthUser = {
  id: number
  email: string
  displayName: string
  username: string
  bio?: string | null
  role: string
  isActive: boolean
  createdAt: string
}

export type AuthFormState = {
  displayName: string
  email: string
  password: string
  username?: string
  bio?: string
}