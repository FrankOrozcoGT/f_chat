import { Loader2 } from 'lucide-react';
import { Select } from '@/shared/ui/Select';
import { useUpdatePlan } from '../api/useUpdatePlan';
import type { User } from '../types';
import type { SelectOption } from '@/shared/ui/Select';

interface PlanSelectorProps {
  user: User;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

const planOptions: SelectOption<'free' | 'full'>[] = [
  { value: 'free', label: 'Free' },
  { value: 'full', label: 'Full' },
];

export const PlanSelector = ({ user, onSuccess, onError }: PlanSelectorProps) => {
  const { mutate, isPending } = useUpdatePlan();

  const handlePlanChange = (newPlan: 'free' | 'full') => {
    if (newPlan === user.plan || isPending) return;

    mutate(
      { userId: user.id, plan: newPlan },
      {
        onSuccess: () => {
          onSuccess?.(`Plan actualizado a ${newPlan === 'free' ? 'Free' : 'Full'}`);
        },
        onError: (error: any) => {
          const status = error?.response?.status;
          let message = 'Error de conexión';

          if (status === 400) message = 'Plan inválido';
          else if (status === 403) message = 'No autorizado';
          else if (status === 404) message = 'Usuario no encontrado';

          onError?.(message);
        },
      }
    );
  };

  const getPlanStyles = (plan: 'free' | 'full') => {
    if (plan === 'free') {
      return 'bg-bg-secondary text-text-secondary border-border-primary';
    }
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
      value={user.plan}
      options={planOptions}
      onChange={handlePlanChange}
      disabled={isPending}
      variant="badge"
      size="sm"
      getOptionStyles={getPlanStyles}
    />
  );
};
