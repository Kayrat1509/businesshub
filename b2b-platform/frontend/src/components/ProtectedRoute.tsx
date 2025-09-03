import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'ROLE_SEEKER' | 'ROLE_SUPPLIER' | 'ROLE_ADMIN'
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const location = useLocation();
  const { isAuthenticated, user } = useAppSelector(state => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    // If user doesn't have required role, redirect based on their actual role
    if (user?.role === 'ROLE_ADMIN') {
      return <Navigate to="/admin" replace />;
    } else if (user?.role === 'ROLE_SUPPLIER') {
      return <Navigate to="/dashboard" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;