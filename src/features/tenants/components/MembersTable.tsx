import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Avatar } from '@/shared/ui/Avatar';
import { Select } from '@/shared/ui/Select';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { useToast } from '@/shared/hooks/useToast';
import { useChangeMemberRole } from '@/features/tenants/api/useChangeMemberRole';
import { useRemoveMember } from '@/features/tenants/api/useRemoveMember';
import { roleOptions } from '@/features/tenants/types';
import type { TenantMember } from '@/features/tenants/types';
import type { TenantRole } from '@/features/auth/types';

const getRoleStyles = (role: string) => {
  if (role === 'owner') return 'bg-accent-blue/10 text-accent-blue border-accent-blue/30';
  if (role === 'tecnico') return 'bg-accent-green/10 text-accent-green border-accent-green/30';
  return 'bg-bg-tertiary text-text-secondary border-border-primary';
};

interface MembersTableProps {
  tenantId: string;
  members: TenantMember[];
  currentUserId: string;
}

export const MembersTable = ({ tenantId, members, currentUserId }: MembersTableProps) => {
  const { showToast } = useToast();
  const [memberToRemove, setMemberToRemove] = useState<TenantMember | null>(null);

  const { mutate: changeRole, isPending: isChangingRole } = useChangeMemberRole(tenantId);
  const { mutate: removeMember, isPending: isRemoving } = useRemoveMember(tenantId);

  const handleRoleChange = (member: TenantMember, newRole: TenantRole) => {
    changeRole(
      { userId: member.userId, role: newRole },
      {
        onSuccess: () => showToast(`Rol de ${member.name} actualizado`, 'success'),
        onError: () => showToast('Error al cambiar el rol', 'error'),
      }
    );
  };

  const handleRemoveConfirm = () => {
    if (!memberToRemove) return;
    removeMember(memberToRemove.userId, {
      onSuccess: () => {
        showToast(`${memberToRemove.name} fue removido`, 'success');
        setMemberToRemove(null);
      },
      onError: () => showToast('Error al remover el miembro', 'error'),
    });
  };

  if (members.length === 0) {
    return (
      <p className="text-text-secondary text-sm text-center py-8">
        No hay miembros en esta organización
      </p>
    );
  }

  return (
    <>
      {/* Mobile: card view */}
      <div className="md:hidden space-y-3">
        {members.map((member) => (
          <div key={member.id} className="border border-border-primary rounded-lg p-4 bg-bg-secondary">
            <div className="flex items-start gap-3">
              <Avatar src={member.picture} initials={member.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)} size="md" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{member.name}</p>
                <p className="text-xs text-text-secondary truncate">{member.email}</p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-primary">
              <Select<TenantRole>
                value={member.role}
                options={roleOptions}
                onChange={(newRole) => handleRoleChange(member, newRole)}
                disabled={member.userId === currentUserId || isChangingRole}
                variant="badge"
                size="sm"
                getOptionStyles={getRoleStyles}
              />
              {member.userId !== currentUserId && (
                <button
                  onClick={() => setMemberToRemove(member)}
                  className="min-h-11 min-w-11 flex items-center justify-center rounded-md text-text-tertiary hover:text-accent-red hover:bg-accent-red/10 transition-colors"
                  title="Remover miembro"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table view */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-bg-tertiary border-b border-border-primary">
              <th className="p-3 text-left text-sm font-semibold text-text-secondary">Usuario</th>
              <th className="p-3 text-left text-sm font-semibold text-text-secondary">Rol</th>
              <th className="p-3 w-12" />
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id} className="border-b border-border-primary hover:bg-bg-tertiary transition-colors">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <Avatar src={member.picture} initials={member.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{member.name}</p>
                      <p className="text-xs text-text-secondary truncate">{member.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <Select<TenantRole>
                    value={member.role}
                    options={roleOptions}
                    onChange={(newRole) => handleRoleChange(member, newRole)}
                    disabled={member.userId === currentUserId || isChangingRole}
                    variant="badge"
                    size="sm"
                    getOptionStyles={getRoleStyles}
                  />
                </td>
                <td className="p-3">
                  {member.userId !== currentUserId && (
                    <button
                      onClick={() => setMemberToRemove(member)}
                      className="p-1.5 rounded-md text-text-tertiary hover:text-accent-red hover:bg-accent-red/10 transition-colors"
                      title="Remover miembro"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Confirm remove modal */}
      <Modal isOpen={!!memberToRemove} onClose={() => setMemberToRemove(null)} size="sm">
        <ModalHeader onClose={() => setMemberToRemove(null)}>
          <ModalTitle>Remover miembro</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <p className="text-text-secondary text-sm">
            ¿Estás seguro que deseas remover a{' '}
            <span className="font-semibold text-text-primary">{memberToRemove?.name}</span>{' '}
            de la organización?
          </p>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setMemberToRemove(null)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleRemoveConfirm} disabled={isRemoving}>
            {isRemoving ? 'Removiendo...' : 'Remover'}
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};
