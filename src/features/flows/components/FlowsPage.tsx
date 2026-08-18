import { AlertCircle, Loader2 } from 'lucide-react';
import { MainLayout } from '@/layouts/MainLayout';
import { useGetFlows } from '@/features/flows/api/useGetFlows';
import { useGetActiveSessions } from '@/features/flows/api/useGetActiveSessions';
import { UnifiedFlowCanvas } from '@/features/flows/components/UnifiedFlowCanvas';
import { getErrorMessage } from '@/shared/lib/errors';

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
              {getErrorMessage(error, 'No se pudieron cargar los flujos. Por favor, intenta de nuevo.')}
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <UnifiedFlowCanvas flows={flows || []} activeSessions={activeSessions || {}} />
    </MainLayout>
  );
};
