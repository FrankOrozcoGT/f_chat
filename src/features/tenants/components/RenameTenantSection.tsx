import { useState, useEffect } from 'react';
import { Button } from '@/shared/ui/Button';
import { useToast } from '@/shared/hooks/useToast';
import { useRenameTenant } from '../api/useRenameTenant';

interface RenameTenantSectionProps {
  tenantId: string;
  currentName: string;
}

export const RenameTenantSection = ({ tenantId, currentName }: RenameTenantSectionProps) => {
  const { showToast } = useToast();
  const [name, setName] = useState(currentName);

  const { mutate: rename, isPending } = useRenameTenant(tenantId);

  useEffect(() => {
    setName(currentName);
  }, [currentName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || trimmed === currentName) return;

    rename(trimmed, {
      onSuccess: () => showToast('Nombre actualizado', 'success'),
      onError: () => showToast('Error al actualizar el nombre', 'error'),
    });
  };

  const isDirty = name.trim() !== currentName && name.trim() !== '';

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="flex-1 px-3 py-2.5 md:py-2 min-h-11 md:min-h-10 text-base bg-bg-secondary border border-border-primary rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent"
        maxLength={80}
      />
      <Button type="submit" size="sm" disabled={!isDirty || isPending}>
        {isPending ? 'Guardando...' : 'Guardar'}
      </Button>
    </form>
  );
};
