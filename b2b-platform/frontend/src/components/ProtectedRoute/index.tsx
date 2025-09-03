import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'ROLE_ADMIN' | 'ROLE_SUPPLIER' | 'ROLE_SEEKER'
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { isAuthenticated, user } = useAppSelector(state => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;