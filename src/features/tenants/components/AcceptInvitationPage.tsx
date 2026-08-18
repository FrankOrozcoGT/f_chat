import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { AuthLayout } from '@/layouts/AuthLayout';
import { Button } from '@/shared/ui/Button';
import { useGetMe } from '@/features/auth/api/useGetMe';
import { useSwitchTenant } from '@/features/auth/api/useSwitchTenant';
import { useAcceptInvitation } from '@/features/tenants/api/useAcceptInvitation';
import { useRejectInvitation } from '@/features/tenants/api/useRejectInvitation';

const ERROR_MESSAGES: Record<string, string> = {
  '404': 'El enlace de invitación no existe o ya fue usado.',
  '400': 'Esta invitación ya fue aceptada o ha expirado.',
  '401': 'Tu cuenta no coincide con el email de la invitación.',
};

export const AcceptInvitationPage = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState('');

  const { data: me, isLoading: isLoadingMe } = useGetMe();
  const { mutate: acceptInvitation, isPending: isAccepting } = useAcceptInvitation();
  const { mutate: rejectInvitation, isPending: isRejecting } = useRejectInvitation();
  const { mutate: switchTenant, isPending: isSwitching } = useSwitchTenant();

  // Si no está autenticado, guardar token y mandar directo a Google OAuth
  useEffect(() => {
    if (!isLoadingMe && !me) {
      if (token) sessionStorage.setItem('pending_invitation_token', token);
      const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      window.location.href = `${backendUrl}/auth/google-login`;
    }
  }, [isLoadingMe, me, navigate, token]);

  const handleAccept = () => {
    if (!token) return;

    acceptInvitation(token, {
      onSuccess: (data) => {
        switchTenant(data.tenantId, {
          onSuccess: () => {
            // useSwitchTenant ya hace queryClient.clear() + redirect /
          },
          onError: () => {
            setErrorMsg('Invitación aceptada pero no se pudo cambiar de organización. Intenta desde el menú de usuario.');
          },
        });
      },
      onError: (error: unknown) => {
        const status = String((error as { response?: { status?: number } })?.response?.status ?? '');
        setErrorMsg(ERROR_MESSAGES[status] ?? 'Ocurrió un error al aceptar la invitación.');
      },
    });
  };

  if (isLoadingMe) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center gap-3 py-8">
          <Loader2 size={32} className="animate-spin text-accent-blue" />
          <p className="text-text-secondary text-sm">Verificando sesión...</p>
        </div>
      </AuthLayout>
    );
  }

  if (!me) return null;

  const isPending = isAccepting || isSwitching || isRejecting;

  const handleReject = () => {
    if (!token) return;
    rejectInvitation(token, {
      onSuccess: () => navigate('/'),
      onError: () => setErrorMsg('No se pudo rechazar la invitación.'),
    });
  };

  return (
    <AuthLayout>
      <div className="bg-bg-secondary border border-border-primary rounded-lg p-6 md:p-8 text-center">
        {errorMsg ? (
          <>
            <XCircle size={48} className="text-accent-red mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              No se pudo aceptar la invitación
            </h2>
            <p className="text-text-secondary text-sm mb-6">{errorMsg}</p>
            <Button variant="secondary" onClick={() => navigate('/')}>
              Ir al inicio
            </Button>
          </>
        ) : (
          <>
            <CheckCircle size={48} className="text-accent-blue mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              Tienes una invitación
            </h2>
            <p className="text-text-secondary text-sm mb-6">
              Hola <span className="font-medium text-text-primary">{me.user.name}</span>,
              fuiste invitado a unirte a una organización. Acepta para continuar.
            </p>
            <div className="flex flex-col gap-2">
              <Button onClick={handleAccept} disabled={isPending} className="w-full">
                {isAccepting || isSwitching ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Aceptando...
                  </span>
                ) : (
                  'Aceptar invitación'
                )}
              </Button>
              <Button variant="ghost" onClick={handleReject} disabled={isPending} className="w-full">
                {isRejecting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Rechazando...
                  </span>
                ) : (
                  'Rechazar'
                )}
              </Button>
              <button
                onClick={() => navigate('/')}
                disabled={isPending}
                className="text-sm text-text-tertiary hover:text-text-secondary transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed py-1"
              >
                Omitir por ahora
              </button>
            </div>
          </>
        )}
      </div>
    </AuthLayout>
  );
};
