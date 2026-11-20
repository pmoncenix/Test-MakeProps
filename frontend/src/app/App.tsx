import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider } from '../features/auth/AuthContext'
import { useAuth } from '../features/auth/useAuth'
import { LoginPage } from '../features/auth/LoginPage'
import { RegisterPage } from '../features/auth/RegisterPage'
import { ProfilePage } from '../features/users/ProfilePage'
import { UserDetailPage } from '../features/users/UserDetailPage'
import { UserListPage } from '../features/users/UserListPage'
import { AppShell } from './AppShell'

function RequireAuth() {
  const { token, ready } = useAuth()
  const location = useLocation()
  if (!ready) return <div className="full-page-loading"><span className="spinner" /> Chargement de votre espace…</div>
  if (!token) return <Navigate to="/login" replace state={{ from: location }} />
  return <Outlet />
}

function GuestOnly() {
  const { token, ready } = useAuth()
  if (!ready) return <div className="full-page-loading"><span className="spinner" /> Chargement…</div>
  return token ? <Navigate to="/users" replace /> : <Outlet />
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<GuestOnly />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      <Route element={<RequireAuth />}>
        <Route path="/users/new" element={<RegisterPage createOnly />} />
        <Route element={<AppShell />}>
          <Route path="/users" element={<UserListPage />} />
          <Route path="/users/:userId" element={<UserDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/users" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
