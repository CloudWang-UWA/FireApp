import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import type { AuthFormState, AuthMode, AuthUser } from '../../types/auth'

export function Auth({
  authMode,
  setAuthMode,
  currentUser,
  isAuthLoading,
  authError,
  authMessage,
  authForm,
  setAuthForm,
  onSubmit,
  onLogout,
}: {
  authMode: AuthMode
  setAuthMode: (mode: AuthMode) => void
  currentUser: AuthUser | null
  isAuthLoading: boolean
  authError: string
  authMessage: string
  authForm: AuthFormState
  setAuthForm: (updater: (current: AuthFormState) => AuthFormState) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onLogout: () => void
}) {
  const navigate = useNavigate()

  return (
    <div className="status-card">
      <h2>Account</h2>

      {currentUser ? (
        <div className="auth-stack">
          <p className="auth-user-name">{currentUser.displayName}</p>
          <p className="auth-user-email">{currentUser.email}</p>
          <p className="auth-user-username">@{currentUser.username}</p>
          <p className="auth-user-bio">{currentUser.bio || 'No bio added yet'}</p>

          <p className="auth-user-role">
            Role: <strong>{currentUser.role}</strong>
          </p>

          <button
            className="primary-button"
            type="button"
            onClick={() => navigate('/profile')}
          >
            View Profile
          </button>

          {currentUser.role === 'admin' && (
            <button
              className="primary-button"
              type="button"
              onClick={() => navigate('/admin')}
            >
              Go to Admin Panel 👑
            </button>
          )}

          <button
            className="primary-button danger-button"
            type="button"
            onClick={onLogout}
          >
            {isAuthLoading ? 'Working...' : 'Log out'}
          </button>
        </div>
      ) : (
        <>
          <div className="segmented-control">
            <button
              className={
                authMode === 'login'
                  ? 'segment is-active segment-login'
                  : 'segment'
              }
              onClick={() => setAuthMode('login')}
              type="button"
            >
              Login
            </button>

            <button
              className={
                authMode === 'register'
                  ? 'segment is-active segment-register'
                  : 'segment'
              }
              onClick={() => setAuthMode('register')}
              type="button"
            >
              Register
            </button>
          </div>

          <form className="auth-form" onSubmit={onSubmit}>
            {authMode === 'register' && (
              <label className="field">
                <span>Display name</span>
                <input
                  value={authForm.displayName}
                  onChange={(event) =>
                    setAuthForm((current) => ({
                      ...current,
                      displayName: event.target.value,
                    }))
                  }
                  placeholder="Your name"
                  required
                />
              </label>
            )}

            {authMode === 'register' && (
              <label className="field">
                <span>Username</span>
                <input
                  value={authForm.username || ''}
                  onChange={(event) =>
                    setAuthForm((current) => ({
                      ...current,
                      username: event.target.value,
                    }))
                  }
                  placeholder="unique username"
                  required
                />
              </label>
            )}

            {authMode === 'register' && (
              <label className="field">
                <span>Bio</span>
                <input
                  value={authForm.bio || ''}
                  onChange={(event) =>
                    setAuthForm((current) => ({
                      ...current,
                      bio: event.target.value,
                    }))
                  }
                  placeholder="short bio"
                />
              </label>
            )}

            <label className="field">
              <span>Email</span>
              <input
                type="email"
                value={authForm.email}
                onChange={(event) =>
                  setAuthForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                placeholder="name@example.com"
                required
              />
            </label>

            <label className="field">
              <span>Password</span>
              <input
                type="password"
                value={authForm.password}
                onChange={(event) =>
                  setAuthForm((current) => ({
                    ...current,
                    password: event.target.value,
                  }))
                }
                placeholder="At least 8 characters"
                required
              />
            </label>

            <button
              className={
                authMode === 'login'
                  ? 'primary-button login-button'
                  : 'primary-button register-button'
              }
              disabled={isAuthLoading}
              type="submit"
            >
              {isAuthLoading
                ? 'Working...'
                : authMode === 'login'
                ? 'Log in'
                : 'Create account'}
            </button>
          </form>
        </>
      )}

      {authMessage && <p className="feedback success">{authMessage}</p>}
      {authError && <p className="feedback error">{authError}</p>}
    </div>
  )
}