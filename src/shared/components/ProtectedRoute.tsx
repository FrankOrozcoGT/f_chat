import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useGetMe } from '@/features/auth/api';
import { ComingSoonPage } from '@/features/dashboard/components/ComingSoonPage';
import { ForbiddenPage } from '@/features/dashboard/components/ForbiddenPage';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'full' | 'free';
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { data: user, isLoading, isError } = useGetMe();

  // Mientras carga, mostrar loading (evita flicker a login)
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-accent-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Si hay error o no hay usuario, redirigir a login
  if (isError || !user) {
    return <Navigate to="/login" replace />;
  }

  // Si es usuario free, mostrar página "Próximamente"
  if (user.role === 'free' && requiredRole !== 'free') {
    return <ComingSoonPage />;
  }

  // Si requiere rol admin pero el usuario es full, mostrar 403
  if (requiredRole === 'admin' && user.role !== 'admin') {
    return <ForbiddenPage />;
  }

  // Usuario tiene el rol necesario, permitir acceso
  return <>{children}</>;
};
