import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useGetMe } from '@/features/auth/api';
import { ComingSoonPage } from '@/features/dashboard/components/ComingSoonPage';
import { ForbiddenPage } from '@/features/dashboard/components/ForbiddenPage';

type AppRole = 'free' | 'full' | 'admin';

const ROLE_LEVEL: Record<AppRole, number> = { free: 0, full: 1, admin: 2 };

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: AppRole;
}

export const ProtectedRoute = ({ children, requiredRole = 'free' }: ProtectedRouteProps) => {
  const { data: user, isLoading, isError } = useGetMe();

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

  if (isError || !user) {
    return <Navigate to="/login" replace />;
  }

  const userLevel = ROLE_LEVEL[user.role as AppRole] ?? 0;
  const requiredLevel = ROLE_LEVEL[requiredRole];

  if (userLevel < requiredLevel) {
    return requiredLevel === ROLE_LEVEL.admin ? <ForbiddenPage /> : <ComingSoonPage />;
  }

  return <>{children}</>;
};
