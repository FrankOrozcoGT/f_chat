import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Plus } from 'lucide-react';
import { Button } from '@/shared/ui/Button';

interface LoadingStateProps {
  label: string;
}

export const CrudLoadingState = ({ label }: LoadingStateProps) => (
  <div className="flex items-center justify-center min-h-64">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-4 border-border-primary border-t-accent-blue rounded-full animate-spin" />
      <p className="text-sm text-text-secondary">{label}</p>
    </div>
  </div>
);

interface ErrorStateProps {
  message: string;
}

export const CrudErrorState = ({ message }: ErrorStateProps) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <p className="text-text-secondary mb-4">{message}</p>
    <Button variant="secondary" onClick={() => window.location.reload()}>Reintentar</Button>
  </div>
);

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  createLabel: string;
  onCreate: () => void;
}

export const CrudEmptyState = ({ icon: Icon, title, description, createLabel, onCreate }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-12 md:py-16 text-center">
    <Icon size={48} className="text-text-tertiary mb-4" />
    <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
    <p className="text-sm text-text-secondary mb-6 max-w-sm">{description}</p>
    <Button onClick={onCreate}>
      <Plus size={18} /> {createLabel}
    </Button>
  </div>
);

interface CrudPageStatesProps {
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  loadingLabel: string;
  errorMessage: string;
  emptyState: Omit<EmptyStateProps, 'onCreate'>;
  onCreate: () => void;
  children: ReactNode;
}

/** Orquesta los 4 estados que toda página CRUD del catálogo repite: loading, error, vacío, y datos. */
export const CrudPageStates = ({
  isLoading,
  isError,
  isEmpty,
  loadingLabel,
  errorMessage,
  emptyState,
  onCreate,
  children,
}: CrudPageStatesProps) => {
  if (isLoading) return <CrudLoadingState label={loadingLabel} />;
  if (isError) return <CrudErrorState message={errorMessage} />;
  if (isEmpty) return <CrudEmptyState {...emptyState} onCreate={onCreate} />;
  return <>{children}</>;
};
