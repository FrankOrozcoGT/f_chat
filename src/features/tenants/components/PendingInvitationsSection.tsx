import { useState } from 'react';
import { Building2, Check, X, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useGetPendingInvitations } from '../api/useGetPendingInvitations';
import { useAcceptInvitation } from '../api/useAcceptInvitation';
import { useRejectInvitation } from '../api/useRejectInvitation';
import { tenantKeys } from '../api/tenantKeys';
import { useSwitchTenant } from '@/features/auth/api/useSwitchTenant';
import { useToast } from '@/shared/hooks/useToast';

const roleLabel: Record<string, string> = {
  owner: 'Owner',
  user: 'Usuario',
  tecnico: 'Técnico',
};

export const PendingInvitationsSection = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [loadingToken, setLoadingToken] = useState<string | null>(null);

  const { data: invitations = [], isLoading } = useGetPendingInvitations();
  const { mutate: acceptInvitation } = useAcceptInvitation();
  const { mutate: rejectInvitation } = useRejectInvitation();
  const { mutate: switchTenant } = useSwitchTenant();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <p className="text-sm text-text-tertiary text-center py-6">
        No tienes invitaciones pendientes.
      </p>
    );
  }

  const handleAccept = (token: string) => {
    setLoadingToken(token);
    acceptInvitation(token, {
      onSuccess: (data) => {
        switchTenant(data.tenantId, {
          onError: () => {
            queryClient.invalidateQueries({ queryKey: tenantKeys.pendingInvitations() });
            showToast('Invitación aceptada. Cambia de organización desde el menú.', 'success');
            setLoadingToken(null);
          },
        });
      },
      onError: () => {
        showToast('No se pudo aceptar la invitación.', 'error');
        setLoadingToken(null);
      },
    });
  };

  const handleReject = (token: string) => {
    setLoadingToken(token);
    rejectInvitation(token, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: tenantKeys.pendingInvitations() });
        showToast('Invitación rechazada.', 'success');
        setLoadingToken(null);
      },
      onError: () => {
        showToast('No se pudo rechazar la invitación.', 'error');
        setLoadingToken(null);
      },
    });
  };

  return (
    <div className="space-y-3">
      {invitations.map((inv) => {
        const isThisLoading = loadingToken === inv.token;
        return (
          <div
            key={inv.id}
            className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between p-4 bg-bg-primary border border-border-primary rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-accent-blue/10 flex items-center justify-center shrink-0">
                <Building2 size={16} className="text-accent-blue" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{inv.tenant.name}</p>
                <p className="text-xs text-text-secondary">
                  Rol: {roleLabel[inv.role] ?? inv.role}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleAccept(inv.token)}
                disabled={isThisLoading}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 min-h-11 md:min-h-10 px-4 bg-accent-blue text-white text-sm font-medium rounded-md hover:bg-accent-blue/90 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                {isThisLoading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Check size={14} />
                )}
                Aceptar
              </button>
              <button
                onClick={() => handleReject(inv.token)}
                disabled={isThisLoading}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 min-h-11 md:min-h-10 px-4 border border-border-primary text-text-secondary text-sm font-medium rounded-md hover:bg-bg-secondary transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                <X size={14} />
                Rechazar
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
