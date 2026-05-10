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
        <header className="profile-header">
          <div className="profile-avatar" aria-hidden="true">
            {currentUser.displayName.trim().charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="eyebrow">User details</p>
            <h1>{currentUser.displayName}</h1>
            <p className="intro">
              Account information, role details, and profile status.
            </p>
          </div>
        </header>

        <div className="profile-grid">
          <section className="profile-details-card">
            <h2>Account</h2>
            <dl className="profile-detail-list">
              <div>
                <dt>Name</dt>
                <dd>{currentUser.displayName}</dd>
              </div>
              <div>
                <dt>Username</dt>
                <dd>@{currentUser.username}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{currentUser.email}</dd>
              </div>
              <div>
                <dt>Role</dt>
                <dd>{currentUser.role}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>
                  <span
                    className={
                      currentUser.isActive
                        ? 'profile-status is-active'
                        : 'profile-status'
                    }
                  >
                    {currentUser.isActive ? 'Active' : 'Inactive'}
                  </span>
                </dd>
              </div>
              <div>
                <dt>Bio</dt>
                <dd>{currentUser.bio || 'No bio added yet'}</dd>
              </div>
              <div>
                <dt>Created</dt>
                <dd>{new Date(currentUser.createdAt).toLocaleString()}</dd>
              </div>
            </dl>
          </section>
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
