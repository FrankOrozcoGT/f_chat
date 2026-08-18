import type { ReactNode } from 'react';
import { Plus } from 'lucide-react';
import { CrmLayout } from '@/layouts/CrmLayout';
import { Button } from '@/shared/ui/Button';
import { CrudPageStates } from './CrudPageStates';
import type { LucideIcon } from 'lucide-react';

interface CatalogPageLayoutProps {
  title: string;
  subtitle: string;
  createLabel: string;
  onCreate: () => void;
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  loadingLabel: string;
  errorMessage: string;
  emptyState: { icon: LucideIcon; title: string; description: string; createLabel: string };
  /** Tabla/cards mostrados cuando hay datos (contenido de CrudPageStates) */
  children: ReactNode;
  /** Modales y otros elementos que deben quedar fuera del área de estados pero dentro de CrmLayout */
  modals?: ReactNode;
}

/** Envoltorio de página compartido por las páginas CRUD de catálogo (products/promotions/shipping): header con título/contador/botón "nuevo" + los 4 estados de CrudPageStates. */
export const CatalogPageLayout = ({
  title,
  subtitle,
  createLabel,
  onCreate,
  isLoading,
  isError,
  isEmpty,
  loadingLabel,
  errorMessage,
  emptyState,
  children,
  modals,
}: CatalogPageLayoutProps) => (
  <CrmLayout>
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary">{title}</h1>
          <p className="text-sm text-text-secondary mt-1">{subtitle}</p>
        </div>
        <Button onClick={onCreate} size="md">
          <Plus size={18} />
          <span className="hidden sm:inline">{createLabel}</span>
        </Button>
      </div>

      <CrudPageStates
        isLoading={isLoading}
        isError={isError}
        isEmpty={isEmpty}
        loadingLabel={loadingLabel}
        errorMessage={errorMessage}
        emptyState={emptyState}
        onCreate={onCreate}
      >
        {children}
      </CrudPageStates>
    </div>

    {modals}
  </CrmLayout>
);
