import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { useGetMe } from '@/features/auth/api';

const roleLabel: Record<string, string> = {
  owner: 'Owner',
  user: 'Usuario',
  tecnico: 'Técnico',
};

export const DashboardPage = () => {
  const { data: me } = useGetMe();
  const navigate = useNavigate();

  useEffect(() => {
    const pendingToken = sessionStorage.getItem('pending_invitation_token');
    if (pendingToken) {
      sessionStorage.removeItem('pending_invitation_token');
      navigate(`/invitations/accept/${pendingToken}`, { replace: true });
    }
  }, [navigate]);

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-semibold text-text-primary mb-2">
          Dashboard
        </h1>
        <p className="text-text-secondary mb-8">
          Bienvenido de nuevo, {me?.user.name}
        </p>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-bg-secondary border border-border-primary rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Plan Actual
            </h3>
            <p className="text-2xl font-bold text-accent-blue capitalize">
              {me?.tenant.plan || 'Free'}
            </p>
            <p className="text-sm text-text-tertiary mt-1">
              Rol: {me?.tenantRole ? (roleLabel[me.tenantRole] ?? me.tenantRole) : '—'}
            </p>
          </div>

          <div className="bg-bg-secondary border border-border-primary rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Estado
            </h3>
            <p className="text-accent-green font-medium">Activo</p>
            <p className="text-sm text-text-tertiary mt-1">
              Sesión verificada
            </p>
          </div>

          <div className="bg-bg-secondary border border-border-primary rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Organización
            </h3>
            <p className="text-text-primary font-medium truncate">
              {me?.tenant.name ?? '—'}
            </p>
            <p className="text-sm text-text-tertiary mt-1">
              {me?.systemRole === 'super_admin' ? 'Super Admin' : 'Miembro'}
            </p>
          </div>
        </div>

        {/* Info Message */}
        <div className="mt-8 bg-accent-blue/10 border border-accent-blue/20 rounded-lg p-4">
          <p className="text-sm text-text-primary">
            <span className="font-semibold">Funcionalidad en desarrollo:</span> El dashboard completo estará disponible próximamente.
          </p>
        </div>
      </div>
    </MainLayout>
  );
};
