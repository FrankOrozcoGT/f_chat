import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useGetMe } from '@/features/auth/api';
import { ComingSoonPage } from '@/features/dashboard/components/ComingSoonPage';
import { ForbiddenPage } from '@/features/dashboard/components/ForbiddenPage';

type AppAccess = 'free' | 'full' | 'admin';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredAccess?: AppAccess;
}

export const ProtectedRoute = ({ children, requiredAccess = 'free' }: ProtectedRouteProps) => {
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

  // Check access based on plan and role
  const hasAccess = (() => {
    // Admin always has access
    if (user.role === 'admin') return true;

    // For admin-only routes
    if (requiredAccess === 'admin') return false;

    // For plan-based routes (free, full)
    if (requiredAccess === 'free') return true; // Everyone with account can access free
    if (requiredAccess === 'full') return user.plan === 'full'; // Only full plan

    return false;
  })();

  if (!hasAccess) {
    return requiredAccess === 'admin' ? <ForbiddenPage /> : <ComingSoonPage />;
  }

  return <>{children}</>;
};
