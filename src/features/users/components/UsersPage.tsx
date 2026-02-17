import { Users as UsersIcon, AlertCircle, Loader2, User, Mail, Calendar, Clock } from 'lucide-react';
import { MainLayout } from '@/layouts/MainLayout';
import { useGetUsers } from '../api/useGetUsers';
import { useToast } from '@/shared/hooks/useToast';
import { Toast } from '@/shared/ui/Toast';
import { Table, type TableColumn } from '@/shared/ui/Table';
import { PlanSelector } from './PlanSelector';
import { LimitsCell } from './LimitsCell';
import type { User as UserType } from '../types';

export const UsersPage = () => {
  const { data: users, isLoading, isError, error } = useGetUsers();
  const { toasts, showToast, removeToast } = useToast();

  const getBadgeColor = (value: string) => {
    if (value === 'admin') return 'bg-accent-purple/10 text-accent-purple border-accent-purple/20';
    if (value === 'full') return 'bg-accent-green/10 text-accent-green border-accent-green/20';
    return 'bg-bg-tertiary text-text-secondary border-border-primary';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const columns: TableColumn<UserType>[] = [
    {
      key: 'user',
      header: 'Usuario',
      render: (user) => (
        <div className="flex items-center gap-3">
          {user.picture ? (
            <img
              src={user.picture}
              alt={user.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-bg-tertiary flex items-center justify-center">
              <User size={20} className="text-text-secondary" />
            </div>
          )}
          <div>
            <div className="font-medium text-text-primary">{user.name}</div>
            <div className="text-sm text-text-secondary flex items-center gap-1">
              <Mail size={12} />
              {user.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'plan',
      header: 'Plan',
      render: (user) => (
        <PlanSelector
          user={user}
          onSuccess={(msg) => showToast(msg, 'success')}
          onError={(msg) => showToast(msg, 'error')}
        />
      ),
    },
    {
      key: 'limits',
      header: 'Límites',
      render: (user) => (
        <LimitsCell
          user={user}
          onSuccess={(msg) => showToast(msg, 'success')}
          onError={(msg) => showToast(msg, 'error')}
        />
      ),
    },
    {
      key: 'role',
      header: 'Rol',
      render: (user) => (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getBadgeColor(user.role)}`}>
          {user.role === 'admin' ? 'Admin' : user.role === 'full' ? 'Full' : 'Free'}
        </span>
      ),
    },
    {
      key: 'lastLogin',
      header: 'Último Login',
      render: (user) => (
        <div className="flex items-center gap-1 text-sm text-text-primary">
          <Clock size={14} className="text-text-tertiary" />
          {formatDate(user.lastLogin)}
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Creado',
      render: (user) => (
        <div className="flex items-center gap-1 text-sm text-text-primary">
          <Calendar size={14} className="text-text-tertiary" />
          {formatDate(user.createdAt)}
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
            <p className="text-text-secondary">Cargando usuarios...</p>
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
            <h2 className="text-xl font-semibold text-text-primary">Error al cargar usuarios</h2>
            <p className="text-text-secondary max-w-md">
              {error instanceof Error ? error.message : 'No se pudieron cargar los usuarios. Por favor, intenta de nuevo.'}
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const emptyState = (
    <div className="bg-bg-secondary rounded-lg border border-border-primary p-12 text-center">
      <UsersIcon size={48} className="text-text-tertiary mx-auto mb-4" />
      <h3 className="text-lg font-medium text-text-primary mb-2">No hay usuarios</h3>
      <p className="text-text-secondary">No se encontraron usuarios en el sistema.</p>
    </div>
  );

  return (
    <MainLayout>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UsersIcon size={28} className="text-accent-blue" />
            <div>
              <h1 className="text-3xl font-semibold text-text-primary">Gestión de Usuarios</h1>
              <p className="text-text-secondary mt-1">
                {users?.length || 0} usuario{users?.length !== 1 ? 's' : ''} registrado{users?.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        <Table
          data={users || []}
          columns={columns}
          getRowKey={(user) => user.id}
          emptyState={emptyState}
        />
      </div>
    </MainLayout>
  );
};
