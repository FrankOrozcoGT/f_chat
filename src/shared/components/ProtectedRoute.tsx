import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useGetMe } from '@/features/auth';
import { ComingSoonPage } from '@/features/dashboard/components/ComingSoonPage';
import { ForbiddenPage } from '@/features/dashboard/components/ForbiddenPage';

export type AppAccess = 'authenticated' | 'full-plan' | 'conversations' | 'flows' | 'ai-setup' | 'super-admin' | 'tenant-owner';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredAccess?: AppAccess;
}

export const ProtectedRoute = ({ children, requiredAccess = 'authenticated' }: ProtectedRouteProps) => {
  const { data: me, isLoading, isError } = useGetMe();

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

  if (isError || !me) {
    return <Navigate to="/login" replace />;
  }

  const hasAccess = (() => {
    if (requiredAccess === 'authenticated') return true;
    if (requiredAccess === 'super-admin') return me.systemRole === 'super_admin';
    if (requiredAccess === 'full-plan') return me.tenant.plan === 'full';
    if (requiredAccess === 'conversations')
      return me.tenant.plan === 'full' && (me.tenantRole === 'owner' || me.tenantRole === 'user');
    if (requiredAccess === 'flows')
      return me.tenant.plan === 'full' && (me.tenantRole === 'owner' || me.tenantRole === 'tecnico');
    if (requiredAccess === 'ai-setup')
      return me.tenant.plan === 'full' && (me.tenantRole === 'owner' || me.tenantRole === 'tecnico');
    if (requiredAccess === 'tenant-owner') return me.tenantRole === 'owner';
    return false;
  })();

  if (!hasAccess) {
    return requiredAccess === 'super-admin' || requiredAccess === 'tenant-owner'
      ? <ForbiddenPage />
      : <ComingSoonPage />;
  }

  return <>{children}</>;
};
