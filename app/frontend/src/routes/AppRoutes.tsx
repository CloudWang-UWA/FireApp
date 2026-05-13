import { Navigate, Route, Routes } from 'react-router-dom'
import type { ReactNode } from 'react'
import type { AuthUser } from '../types/auth'

export function AppRoutes({
  currentUser,
  isAuthLoading,
  loginPage,
  pendingPage,
  mapPage,
  profilePage,
  aboutPage,
  adminPage,
  siteUploadPage,
  heritageSiteInsightsPage,
}: {
  currentUser: AuthUser | null
  isAuthLoading: boolean
  loginPage: ReactNode
  pendingPage: ReactNode
  mapPage: ReactNode
  profilePage: ReactNode
  aboutPage: ReactNode
  adminPage?: ReactNode
  siteUploadPage: ReactNode
  heritageSiteInsightsPage: ReactNode
}) {
  if (isAuthLoading) {
    return null
  }

  const canAccessApp =
    currentUser?.role === 'viewer' || currentUser?.role === 'admin'

  return (
    <Routes>
      <Route
        path="/login"
        element={currentUser ? <Navigate replace to="/app" /> : loginPage}
      />

      <Route
        path="/app"
        element={
          currentUser
            ? canAccessApp
              ? mapPage
              : pendingPage
            : <Navigate replace to="/login" />
        }
      />

      <Route
        path="/profile"
        element={
          currentUser
            ? canAccessApp
              ? profilePage
              : pendingPage
            : <Navigate replace to="/login" />
        }
      />

      <Route
        path="/admin"
        element={
          currentUser?.role === 'admin'
            ? adminPage ?? <div>Admin panel</div>
            : <Navigate replace to={currentUser ? '/app' : '/login'} />
        }
      />

      <Route
        path="/about"
        element={
          currentUser
            ? canAccessApp
              ? aboutPage
              : pendingPage
            : <Navigate replace to="/login" />
        }
      />

      <Route
        path="/site-upload"
        element={
          currentUser
            ? canAccessApp
              ? siteUploadPage
              : pendingPage
            : <Navigate replace to="/login" />
        }
      />

      <Route
        path="/resources/heritage-site-insights"
        element={
          currentUser
            ? canAccessApp
              ? heritageSiteInsightsPage
              : pendingPage
            : <Navigate replace to="/login" />
        }
      />

      <Route
        path="*"
        element={<Navigate replace to={currentUser ? '/app' : '/login'} />}
      />
    </Routes>
  )
}
