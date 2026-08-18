import { Building2, AlertCircle, Loader2, Calendar } from 'lucide-react';
import { MainLayout } from '@/layouts/MainLayout';
import { useGetAdminTenants } from '../api/useGetUsers';
import { useToast } from '@/shared/hooks/useToast';
import { Toast } from '@/shared/ui/Toast';
import { Table, type TableColumn } from '@/shared/ui/Table';
import { PlanSelector } from './PlanSelector';
import { LimitsCell } from './LimitsCell';
import type { AdminTenant } from '../types';
import { formatDate as formatDateBase } from '@/shared/lib/date';

export const UsersPage = () => {
  const { data: tenants, isLoading, isError, error } = useGetAdminTenants();
  const { toasts, showToast, removeToast } = useToast();

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return formatDateBase(dateString, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const columns: TableColumn<AdminTenant>[] = [
    {
      key: 'name',
      header: 'Organización',
      render: (tenant) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-bg-tertiary flex items-center justify-center shrink-0">
            <Building2 size={16} className="text-text-secondary" />
          </div>
          <div>
            <div className="font-medium text-text-primary">{tenant.name}</div>
            <div className="text-xs text-text-tertiary">{tenant.id.slice(0, 8)}...</div>
          </div>
        </div>
      ),
    },
    {
      key: 'plan',
      header: 'Plan',
      render: (tenant) => (
        <PlanSelector
          tenant={tenant}
          onSuccess={(msg) => showToast(msg, 'success')}
          onError={(msg) => showToast(msg, 'error')}
        />
      ),
    },
    {
      key: 'limits',
      header: 'Límites',
      render: (tenant) => (
        <LimitsCell
          tenant={tenant}
          onSuccess={(msg) => showToast(msg, 'success')}
          onError={(msg) => showToast(msg, 'error')}
        />
      ),
    },
    {
      key: 'creditsUsed',
      header: 'Créditos usados',
      render: (tenant) => {
        const { creditsUsed, creditsLimit } = tenant.settings;
        const pct = creditsLimit > 0 ? Math.round((creditsUsed / creditsLimit) * 100) : 0;
        return (
          <div className="text-sm">
            <span className="text-text-primary font-medium">{creditsUsed.toLocaleString()}</span>
            <span className="text-text-tertiary"> / {creditsLimit.toLocaleString()}</span>
            <span className="text-xs text-text-tertiary ml-1">({pct}%)</span>
          </div>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Creado',
      render: (tenant) => (
        <div className="flex items-center gap-1 text-sm text-text-primary">
          <Calendar size={14} className="text-text-tertiary" />
          {formatDate(tenant.createdAt)}
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-100">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={32} className="text-accent-blue animate-spin" />
            <p className="text-text-secondary">Cargando organizaciones...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (isError) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-100">
          <div className="flex flex-col items-center gap-3 text-center">
            <AlertCircle size={48} className="text-accent-red" />
            <h2 className="text-xl font-semibold text-text-primary">Error al cargar organizaciones</h2>
            <p className="text-text-secondary max-w-md">
              {error instanceof Error ? error.message : 'No se pudieron cargar las organizaciones.'}
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const emptyState = (
    <div className="bg-bg-secondary rounded-lg border border-border-primary p-12 text-center">
      <Building2 size={48} className="text-text-tertiary mx-auto mb-4" />
      <h3 className="text-lg font-medium text-text-primary mb-2">No hay organizaciones</h3>
      <p className="text-text-secondary">No se encontraron organizaciones en el sistema.</p>
    </div>
  );

  return (
    <MainLayout>
      {toasts.map((toast) => (
        <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
      ))}
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Building2 size={28} className="text-accent-blue" />
          <div>
            <h1 className="text-3xl font-semibold text-text-primary">Organizaciones</h1>
            <p className="text-text-secondary mt-1">
              {tenants?.length || 0} organización{tenants?.length !== 1 ? 'es' : ''} registrada{tenants?.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <Table
          data={tenants || []}
          columns={columns}
          getRowKey={(tenant) => tenant.id}
          emptyState={emptyState}
        />
      </div>
    </MainLayout>
  );
};
