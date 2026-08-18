import { useState } from 'react';
import { Building2, Check, Plus } from 'lucide-react';
import { MainLayout } from '@/layouts/MainLayout';
import { useGetMe } from '@/features/auth/api/useGetMe';
import { useSwitchTenant } from '@/features/auth/api/useSwitchTenant';
import { useCreateTenant } from '@/features/tenants/api/useCreateTenant';
import { PendingInvitationsSection } from '@/features/tenants/components/PendingInvitationsSection';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';

const roleLabel: Record<string, string> = {
  owner: 'Owner',
  user: 'Usuario',
  tecnico: 'Técnico',
};

export const OrganizationsPage = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');

  const { data: me } = useGetMe();
  const { mutate: switchTenant, isPending: isSwitching } = useSwitchTenant();
  const { mutate: createTenant, isPending: isCreating } = useCreateTenant();

  if (!me) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newOrgName.trim();
    if (!trimmed) return;
    createTenant(trimmed);
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-text-primary mb-1">Organizaciones</h1>
          <p className="text-sm text-text-secondary">Gestiona tus organizaciones e invitaciones</p>
        </div>

        {/* Mis organizaciones */}
        <div className="bg-bg-secondary border border-border-primary rounded-lg p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base md:text-lg font-semibold text-text-primary">Mis organizaciones</h2>
            <Button size="sm" onClick={() => { setNewOrgName(''); setIsCreateOpen(true); }}>
              <Plus size={14} className="mr-1.5" />
              Nueva
            </Button>
          </div>

          <div className="space-y-2">
            {me.availableTenants.map((t) => {
              const isActive = t.id === me.tenant.id;
              return (
                <div
                  key={t.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    isActive
                      ? 'border-accent-blue/40 bg-accent-blue/5'
                      : 'border-border-primary bg-bg-primary hover:bg-bg-secondary'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${isActive ? 'bg-accent-blue/15' : 'bg-bg-tertiary'}`}>
                    <Building2 size={16} className={isActive ? 'text-accent-blue' : 'text-text-tertiary'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isActive ? 'text-accent-blue' : 'text-text-primary'}`}>
                      {t.name}
                    </p>
                    <p className="text-xs text-text-secondary">{roleLabel[t.role] ?? t.role}</p>
                  </div>
                  {isActive ? (
                    <Check size={16} className="text-accent-blue shrink-0" />
                  ) : (
                    <button
                      onClick={() => switchTenant(t.id)}
                      disabled={isSwitching}
                      className="text-xs text-accent-blue hover:underline disabled:opacity-50 shrink-0 min-h-11 md:min-h-10 px-2 cursor-pointer disabled:cursor-not-allowed"
                    >
                      Cambiar
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Invitaciones pendientes */}
        <div className="bg-bg-secondary border border-border-primary rounded-lg p-4 md:p-6">
          <h2 className="text-base md:text-lg font-semibold text-text-primary mb-1">Invitaciones pendientes</h2>
          <p className="text-sm text-text-secondary mb-4">Organizaciones que te han invitado a unirte.</p>
          <PendingInvitationsSection />
        </div>
      </div>

      {/* Modal crear organización */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} size="sm">
        <form onSubmit={handleCreate}>
          <ModalHeader onClose={() => setIsCreateOpen(false)}>
            <ModalTitle>Nueva organización</ModalTitle>
          </ModalHeader>
          <ModalBody>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Nombre de la organización
            </label>
            <input
              type="text"
              value={newOrgName}
              onChange={(e) => setNewOrgName(e.target.value)}
              placeholder="Mi empresa"
              className="w-full px-3 py-2.5 md:py-2 min-h-11 md:min-h-10 text-base bg-bg-secondary border border-border-primary rounded-md text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent"
              maxLength={80}
              autoFocus
            />
            <p className="mt-1.5 text-xs text-text-tertiary">
              Se creará la organización y cambiarás a ella automáticamente.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!newOrgName.trim() || isCreating}>
              {isCreating ? 'Creando...' : 'Crear organización'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </MainLayout>
  );
};
