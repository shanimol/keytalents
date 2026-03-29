import { Navigate, Outlet } from "react-router-dom"
import { useAppSelector } from "@/store/hooks"
import { selectCurrentUser, selectIsAuthenticated, type UserRole } from "@/features/auth/authSlice"

interface Props {
  allowedRoles?: UserRole[]
}

export default function ProtectedRoute({ allowedRoles }: Props) {
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const user = useAppSelector(selectCurrentUser)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
