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
          This placeholder page is ready for future account settings, password
          updates, and profile management.
        </p>

        <div className="profile-grid">
          <div className="status-card">
            <h2>Account</h2>
            <p>
              <strong>Name:</strong> {currentUser.displayName}
            </p>
            <p>
              <strong>Email:</strong> {currentUser.email}
            </p>
            <p>
              <strong>Status:</strong>{' '}
              {currentUser.isActive ? 'Active' : 'Inactive'}
            </p>
            <p>
              <strong>Created:</strong> {new Date(currentUser.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="profile-actions">
          <button className="secondary-button" onClick={onBack} type="button">
            Back to workspace
          </button>
          <button className="primary-button danger-button" onClick={onLogout} type="button">
            {isAuthLoading ? 'Working...' : 'Log out'}
          </button>
        </div>
      </div>
    </section>
  )
}
