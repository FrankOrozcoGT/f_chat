import { useState, useEffect } from 'react';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { Select } from '@/shared/ui/Select';
import { useToast } from '@/shared/hooks/useToast';
import { getErrorMessage } from '@/shared/lib/errors';
import { useInviteMember } from '../api';
import { roleOptions } from '../types';
import type { TenantRole } from '@/features/auth/types';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
}

export const InviteMemberModal = ({ isOpen, onClose, tenantId }: InviteMemberModalProps) => {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<TenantRole>('user');
  const [emailError, setEmailError] = useState('');

  const { mutate: invite, isPending } = useInviteMember(tenantId);

  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setRole('user');
      setEmailError('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');

    if (!email.trim()) {
      setEmailError('El email es requerido');
      return;
    }

    invite(
      { email: email.trim(), role },
      {
        onSuccess: (data) => {
          if (data.type === 'added') {
            showToast(`${email} fue agregado a la organización`, 'success');
          } else {
            showToast(`Se envió una invitación por email a ${email}`, 'success');
          }
          onClose();
        },
        onError: (error: unknown) => {
          showToast(getErrorMessage(error, 'Error al invitar al miembro'), 'error');
        },
      }
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <form onSubmit={handleSubmit}>
        <ModalHeader onClose={onClose}>
          <ModalTitle>Invitar miembro</ModalTitle>
        </ModalHeader>

        <ModalBody>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError('');
                }}
                placeholder="usuario@ejemplo.com"
                className="w-full px-3 py-2.5 md:py-2 min-h-11 md:min-h-10 text-base bg-bg-secondary border border-border-primary rounded-md text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent"
                autoFocus
              />
              {emailError && (
                <p className="mt-1.5 text-xs text-accent-red">{emailError}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Rol
              </label>
              <Select<TenantRole>
                value={role}
                options={roleOptions}
                onChange={setRole}
                className="w-full"
              />
              <p className="mt-1.5 text-xs text-text-tertiary">
                {role === 'owner' && 'Acceso completo: conversaciones, flows, gestión de miembros'}
                {role === 'user' && 'Acceso a conversaciones y mensajes'}
                {role === 'tecnico' && 'Acceso a flows y configuración, sin conversaciones de producción'}
              </p>
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Invitando...' : 'Invitar'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};
