import { Workflow, AlertCircle, Loader2 } from 'lucide-react';
import { MainLayout } from '@/layouts/MainLayout';
import { useGetFlows } from '../api/useGetFlows';
import { useGetActiveSessions } from '../api/useGetActiveSessions';
import { UnifiedFlowCanvas } from './UnifiedFlowCanvas';

export const FlowsPage = () => {
  const { data: flows, isLoading, isError, error } = useGetFlows();
  const { data: activeSessions } = useGetActiveSessions();

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-100">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={32} className="text-accent-blue animate-spin" />
            <p className="text-text-secondary">Cargando flujos...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (isError) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-100">
          <div className="flex flex-col items-center gap-3 text-center">
            <AlertCircle size={48} className="text-accent-red" />
            <h2 className="text-xl font-semibold text-text-primary">Error al cargar flujos</h2>
            <p className="text-text-secondary max-w-md">
              {error instanceof Error ? error.message : 'No se pudieron cargar los flujos. Por favor, intenta de nuevo.'}
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!flows || flows.length === 0) {
    return (
      <MainLayout>
        <div className="max-w-full mx-auto space-y-4">
          <div className="flex items-center gap-3">
            <Workflow size={28} className="text-accent-blue" />
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-text-primary">Automatizacion</h1>
              <p className="text-text-secondary text-sm md:text-base mt-1">Flujos y nodos de procesamiento</p>
            </div>
          </div>
          <div className="bg-bg-secondary rounded-lg border border-border-primary p-12 text-center">
            <Workflow size={48} className="text-text-tertiary mx-auto mb-4" />
            <h3 className="text-lg font-medium text-text-primary mb-2">No hay flujos</h3>
            <p className="text-text-secondary">No se encontraron flujos configurados.</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-full mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Workflow size={28} className="text-accent-blue" />
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-text-primary">Automatizacion</h1>
            <p className="text-text-secondary text-sm md:text-base mt-1">Flujos y nodos de procesamiento</p>
          </div>
        </div>
        <UnifiedFlowCanvas flows={flows} activeSessions={activeSessions || {}} />
      </div>
    </MainLayout>
  );
};
