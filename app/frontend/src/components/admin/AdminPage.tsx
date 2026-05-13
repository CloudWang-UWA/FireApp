import { useEffect, useState } from 'react'

import { approveUser, deleteUser, fetchPendingUsers } from '../../api/admin'
import type { AuthUser } from '../../types/auth'

export function AdminPage({
  authToken,
  onBack,
}: {
  authToken: string
  onBack: () => void
}) {
  const [pendingUsers, setPendingUsers] = useState<AuthUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionUserId, setActionUserId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function loadPendingUsers() {
    setIsLoading(true)
    setError('')

    try {
      setPendingUsers(await fetchPendingUsers(authToken))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load users')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadPendingUsers()
  }, [authToken])

  async function handleApprove(userId: number) {
    setActionUserId(userId)
    setError('')
    setMessage('')

    try {
      await approveUser(authToken, userId)
      setPendingUsers((users) => users.filter((user) => user.id !== userId))
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
      setMessage('User deleted')
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete user')
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
            <h1>Pending Users</h1>
            <p className="intro">Approve new accounts before they access the map.</p>
          </div>
        </header>

        <section className="profile-details-card admin-section">
          <div className="admin-section-header">
            <h2>Waiting for approval</h2>
            <button
              className="secondary-button"
              disabled={isLoading}
              onClick={() => void loadPendingUsers()}
              type="button"
            >
              Refresh
            </button>
          </div>

          {isLoading ? <p className="intro">Loading pending users...</p> : null}

          {!isLoading && pendingUsers.length === 0 ? (
            <p className="intro">No pending users.</p>
          ) : null}

          {!isLoading && pendingUsers.length > 0 ? (
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
                            className="primary-button"
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
