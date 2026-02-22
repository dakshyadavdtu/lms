import React from 'react'
import { Navigate } from 'react-router-dom'
import { ClipLoader } from 'react-spinners'

/**
 * Waits for auth bootstrap, then allows access only when user is logged in and (optionally) has requiredRole.
 * - authLoading true → full-page loader (no premature redirect)
 * - !userData → redirect to /login
 * - requiredRole set and userData.role !== requiredRole → redirect to /
 * - else render children (e.g. Dashboard)
 */
function FullPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50" role="status" aria-label="Loading">
      <ClipLoader size={48} color="#000" />
    </div>
  )
}

export default function ProtectedRoute({ authLoading, userData, requiredRole, children }) {
  if (authLoading) {
    return <FullPageLoader />
  }
  if (!userData) {
    return <Navigate to="/login" replace />
  }
  if (requiredRole && userData.role !== requiredRole) {
    return <Navigate to="/" replace />
  }
  return children
}

export { FullPageLoader }
