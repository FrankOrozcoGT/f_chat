import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { MainLayout } from '@/layouts/MainLayout';
import { Button } from '@/shared/ui/Button';
import { useGetMe } from '@/features/auth';
import { useGetTenantMembers } from '../api';
import { MembersTable } from './MembersTable';
import { InviteMemberModal } from './InviteMemberModal';
import { RenameTenantSection } from './RenameTenantSection';
import { PendingInvitationsSection } from './PendingInvitationsSection';

export const TenantPage = () => {
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const { data: me } = useGetMe();

  const tenantId = me?.tenant.id ?? '';
  const { data: members = [], isLoading, isError } = useGetTenantMembers(tenantId);

  if (!me) return null;

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-semibold text-text-primary mb-1">Mi Organización</h1>
          <p className="text-text-secondary">Gestiona tu organización y sus miembros</p>
        </div>

        {/* Sección: nombre del tenant */}
        <div className="bg-bg-secondary border border-border-primary rounded-lg p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-1">Nombre de la organización</h2>
          <p className="text-sm text-text-secondary mb-4">
            Este nombre es visible para todos los miembros de la organización.
          </p>
          <RenameTenantSection tenantId={tenantId} currentName={me.tenant.name} />
        </div>

        {/* Sección: miembros */}
        <div className="bg-bg-secondary border border-border-primary rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Miembros</h2>
              <p className="text-sm text-text-secondary mt-0.5">
                {members.length} {members.length === 1 ? 'miembro' : 'miembros'}
              </p>
            </div>
            <Button size="sm" onClick={() => setIsInviteOpen(true)}>
              <UserPlus size={16} className="mr-2" />
              Invitar miembro
            </Button>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {isError && (
            <p className="text-accent-red text-sm text-center py-8">
              Error al cargar los miembros
            </p>
          )}

          {!isLoading && !isError && (
            <MembersTable
              tenantId={tenantId}
              members={members}
              currentUserId={me.user.id}
            />
          )}
        </div>

        {/* Sección: invitaciones pendientes */}
        <div className="bg-bg-secondary border border-border-primary rounded-lg p-4 md:p-6">
          <h2 className="text-base md:text-lg font-semibold text-text-primary mb-1">Invitaciones pendientes</h2>
          <p className="text-sm text-text-secondary mb-4">
            Organizaciones que te han invitado a unirte.
          </p>
          <PendingInvitationsSection />
        </div>
      </div>

      <InviteMemberModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        tenantId={tenantId}
      />
    </MainLayout>
  );
};
