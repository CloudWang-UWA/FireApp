import { Navigate, Route, Routes } from 'react-router-dom'
import type { ReactNode } from 'react'

export function AppRoutes({
  currentUser,
  loginPage,
  mapPage,
  profilePage,
}: {
  currentUser: boolean
  loginPage: ReactNode
  mapPage: ReactNode
  profilePage: ReactNode
}) {
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
        path="*"
        element={<Navigate replace to={currentUser ? '/app' : '/login'} />}
      />
    </Routes>
  )
}
