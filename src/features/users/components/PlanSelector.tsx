import { Loader2 } from 'lucide-react';
import { Select } from '@/shared/ui/Select';
import { useUpdatePlan } from '@/features/users/api/useUpdatePlan';
import type { AdminTenant } from '@/features/users/types';
import type { SelectOption } from '@/shared/ui/Select';
import { getErrorMessage } from '@/shared/lib/errors';

interface PlanSelectorProps {
  tenant: AdminTenant;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

const planOptions: SelectOption<'free' | 'full'>[] = [
  { value: 'free', label: 'Free' },
  { value: 'full', label: 'Full' },
];

export const PlanSelector = ({ tenant, onSuccess, onError }: PlanSelectorProps) => {
  const { mutate, isPending } = useUpdatePlan();

  const handlePlanChange = (newPlan: 'free' | 'full') => {
    if (newPlan === tenant.settings.plan || isPending) return;

    mutate(
      { tenantId: tenant.id, plan: newPlan },
      {
        onSuccess: () => {
          onSuccess?.(`Plan actualizado a ${newPlan === 'free' ? 'Free' : 'Full'}`);
        },
        onError: (error) => {
          onError?.(getErrorMessage(error, 'Error de conexión', {
            400: 'Plan inválido',
            403: 'No autorizado',
            404: 'Organización no encontrada',
          }));
        },
      }
    );
  };

  const getPlanStyles = (plan: 'free' | 'full') => {
    if (plan === 'free') return 'bg-bg-secondary text-text-secondary border-border-primary';
    return 'bg-accent-blue/10 text-accent-blue border-accent-blue/30';
  };

  if (isPending) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border bg-bg-secondary text-text-secondary border-border-primary opacity-50">
        <Loader2 size={14} className="animate-spin" />
        <span className="text-sm">Actualizando...</span>
      </div>
    );
  }

  return (
    <Select
      value={tenant.settings.plan}
      options={planOptions}
      onChange={handlePlanChange}
      disabled={isPending}
      variant="badge"
      size="sm"
      getOptionStyles={getPlanStyles}
    />
  );
};
