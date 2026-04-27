import { Navigate, Route, Routes } from 'react-router-dom'
import type { ReactNode } from 'react'
import type { AuthUser } from '../types/auth'

export function AppRoutes({
  currentUser,
  isAuthLoading,
  loginPage,
  mapPage,
  profilePage,
<<<<<<< DataExport-Sainath
  adminPage,
}: {
  currentUser: AuthUser | null
  loginPage: ReactNode
  mapPage: ReactNode
  profilePage: ReactNode
  adminPage?: ReactNode
=======
  siteUploadPage,
}: {
  currentUser: boolean
  isAuthLoading: boolean
  loginPage: ReactNode
  mapPage: ReactNode
  profilePage: ReactNode
  siteUploadPage: ReactNode
>>>>>>> main
}) {
  if (isAuthLoading) {
    return null
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={currentUser ? <Navigate replace to="/app" /> : loginPage}
      />

      <Route
        path="/app"
        element={currentUser ? mapPage : <Navigate replace to="/login" />}
      />

      <Route
        path="/profile"
        element={currentUser ? profilePage : <Navigate replace to="/login" />}
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
        path="/site-upload"
        element={currentUser ? siteUploadPage : <Navigate replace to="/login" />}
      />
      <Route
        path="*"
        element={<Navigate replace to={currentUser ? '/app' : '/login'} />}
      />
    </Routes>
  )
}