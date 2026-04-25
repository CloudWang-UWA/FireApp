import type { AuthUser } from '../../types/auth'

export function Profile({
  currentUser,
  onBack,
  onLogout,
  isAuthLoading,
}: {
  currentUser: AuthUser
  onBack: () => void
  onLogout: () => void
  isAuthLoading: boolean
}) {
  return (
    <section className="profile-view">
      <div className="profile-card">
        <p className="eyebrow">User details</p>
        <h1>{currentUser.displayName}</h1>
        <p className="intro">
          This profile page gives users access to their account information and
          role details, with room for future account settings and profile updates.
        </p>

        <div className="profile-grid">
          <div className="status-card">
            <h2>Account</h2>

            <p>
              <strong>Name:</strong> {currentUser.displayName}
            </p>

            <p>
              <strong>Username:</strong> @{currentUser.username}
            </p>

            <p>
              <strong>Email:</strong> {currentUser.email}
            </p>

            <p>
              <strong>Role:</strong> {currentUser.role}
            </p>

            <p>
              <strong>Status:</strong>{' '}
              {currentUser.isActive ? 'Active' : 'Inactive'}
            </p>

            <p>
              <strong>Bio:</strong> {currentUser.bio || 'No bio added yet'}
            </p>

            <p>
              <strong>Created:</strong>{' '}
              {new Date(currentUser.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="profile-actions">
          <button className="secondary-button" onClick={onBack} type="button">
            Back to map
          </button>

          <button
            className="primary-button danger-button"
            onClick={onLogout}
            type="button"
          >
            {isAuthLoading ? 'Working...' : 'Log out'}
          </button>
        </div>
      </div>
    </section>
  )
}