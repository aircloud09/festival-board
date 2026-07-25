import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Spinner from './Spinner'

export default function ProtectedRoute({ requireAdmin = false, children }) {
  const { user, profile, loading } = useAuth()

  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  if (requireAdmin && !profile?.is_admin) return <Navigate to="/" replace />

  return children
}
