import { Navigate, Route, Routes } from 'react-router-dom'
import type { ReactNode } from 'react'

export function AppRoutes({
  currentUser,
  isAuthLoading,
  loginPage,
  mapPage,
  profilePage,
  siteUploadPage,
}: {
  currentUser: boolean
  isAuthLoading: boolean
  loginPage: ReactNode
  mapPage: ReactNode
  profilePage: ReactNode
  siteUploadPage: ReactNode
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
