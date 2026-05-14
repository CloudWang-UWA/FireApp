import { useEffect, useState } from 'react'

import {
  approveUser,
  deleteUser,
  fetchPendingUsers,
  fetchUsers,
  resetUserPassword,
} from '../../api/admin'
import type { AuthUser } from '../../types/auth'

export function AdminPage({
  authToken,
  onBack,
}: {
  authToken: string
  onBack: () => void
}) {
  const [pendingUsers, setPendingUsers] = useState<AuthUser[]>([])
  const [users, setUsers] = useState<AuthUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionUserId, setActionUserId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState<'pending' | 'reset'>('pending')

  async function loadUsers() {
    setIsLoading(true)
    setError('')

    try {
      const [pending, allUsers] = await Promise.all([
        fetchPendingUsers(authToken),
        fetchUsers(authToken),
      ])
      setPendingUsers(pending)
      setUsers(allUsers)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load users')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadUsers()
  }, [authToken])

  async function handleApprove(userId: number) {
    setActionUserId(userId)
    setError('')
    setMessage('')

    try {
      await approveUser(authToken, userId)
      setPendingUsers((users) => users.filter((user) => user.id !== userId))
      setUsers((users) =>
        users.map((user) => (user.id === userId ? { ...user, role: 'viewer' } : user)),
      )
      setMessage('User approved')
    } catch (approveError) {
      setError(
        approveError instanceof Error ? approveError.message : 'Unable to approve user',
      )
    } finally {
      setActionUserId(null)
    }
  }

  async function handleDelete(userId: number) {
    setActionUserId(userId)
    setError('')
    setMessage('')

    try {
      await deleteUser(authToken, userId)
      setPendingUsers((users) => users.filter((user) => user.id !== userId))
      setUsers((users) => users.filter((user) => user.id !== userId))
      setMessage('User deleted')
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete user')
    } finally {
      setActionUserId(null)
    }
  }

  async function handleResetPassword(userId: number) {
    const newPassword = window.prompt('Enter a new password with at least 8 characters')
    if (newPassword == null) return

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      setMessage('')
      return
    }

    setActionUserId(userId)
    setError('')
    setMessage('')

    try {
      await resetUserPassword(authToken, userId, newPassword)
      setMessage('Password reset')
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : 'Unable to reset password')
    } finally {
      setActionUserId(null)
    }
  }

  return (
    <section className="profile-view">
      <div className="profile-card admin-card">
        <header className="profile-header">
          <div className="profile-avatar" aria-hidden="true">
            A
          </div>
          <div>
            <p className="eyebrow">Administration</p>
            <h1>Admin Tools</h1>
            <p className="intro">Approve new accounts and manage user passwords.</p>
          </div>
        </header>

        <section className="profile-details-card admin-section">
          <div className="admin-section-header">
            <div>
              <h2>{activeTab === 'pending' ? 'Waiting for approval' : 'Reset password'}</h2>
              <div className="admin-tabs" role="tablist" aria-label="Admin tools">
                <button
                  className={activeTab === 'pending' ? 'admin-tab is-active' : 'admin-tab'}
                  onClick={() => setActiveTab('pending')}
                  type="button"
                >
                  Pending users
                </button>
                <button
                  className={activeTab === 'reset' ? 'admin-tab is-active' : 'admin-tab'}
                  onClick={() => setActiveTab('reset')}
                  type="button"
                >
                  Reset password
                </button>
              </div>
            </div>
            <button
              className="secondary-button admin-green-button"
              disabled={isLoading}
              onClick={() => void loadUsers()}
              type="button"
            >
              Refresh
            </button>
          </div>

          {isLoading ? <p className="intro">Loading users...</p> : null}

          {!isLoading && activeTab === 'pending' && pendingUsers.length === 0 ? (
            <p className="intro">No pending users.</p>
          ) : null}

          {!isLoading && activeTab === 'pending' && pendingUsers.length > 0 ? (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Username</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingUsers.map((user) => (
                    <tr key={user.id}>
                      <td>{user.displayName}</td>
                      <td>{user.email}</td>
                      <td>@{user.username}</td>
                      <td>{new Date(user.createdAt).toLocaleString()}</td>
                      <td>
                        <div className="admin-actions">
                          <button
                            className="primary-button admin-green-button"
                            disabled={actionUserId === user.id}
                            onClick={() => void handleApprove(user.id)}
                            type="button"
                          >
                            Approve
                          </button>
                          <button
                            className="secondary-button danger-outline-button"
                            disabled={actionUserId === user.id}
                            onClick={() => void handleDelete(user.id)}
                            type="button"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {!isLoading && activeTab === 'reset' && users.length > 0 ? (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.displayName}</td>
                      <td>{user.email}</td>
                      <td>{user.role}</td>
                      <td>{user.isActive ? 'Active' : 'Inactive'}</td>
                      <td>
                        <div className="admin-actions">
                          <button
                            className="secondary-button admin-green-button"
                            disabled={actionUserId === user.id || user.role === 'admin'}
                            onClick={() => void handleResetPassword(user.id)}
                            type="button"
                          >
                            {user.role === 'admin' ? 'Protected' : 'Reset password'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {message ? <p className="feedback success">{message}</p> : null}
          {error ? <p className="feedback error">{error}</p> : null}
        </section>

        <div className="profile-actions">
          <button className="secondary-button" onClick={onBack} type="button">
            Back to map
          </button>
        </div>
      </div>
    </section>
  )
}
