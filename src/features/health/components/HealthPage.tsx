import { Activity, AlertCircle, Loader2 } from 'lucide-react';
import { MainLayout } from '@/layouts/MainLayout';
import { useGetHealth } from '../api/useGetHealth';
import { HealthGrid } from './HealthGrid';

export const HealthPage = () => {
  const { data: healthData, isLoading, isError, error } = useGetHealth();

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-100">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={32} className="text-accent-blue animate-spin" />
            <p className="text-text-secondary">Cargando estado de salud...</p>
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
            <h2 className="text-xl font-semibold text-text-primary">Error al cargar estado de salud</h2>
            <p className="text-text-secondary max-w-md">
              {error instanceof Error ? error.message : 'No se pudo cargar el estado de las APIs. Por favor, intenta de nuevo.'}
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const emptyState = (
    <div className="bg-bg-secondary rounded-lg border border-border-primary p-12 text-center">
      <Activity size={48} className="text-text-tertiary mx-auto mb-4" />
      <h3 className="text-lg font-medium text-text-primary mb-2">No hay datos disponibles</h3>
      <p className="text-text-secondary">No se encontró información de health status.</p>
    </div>
  );

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Activity size={28} className="text-accent-blue" />
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-text-primary">Health Status</h1>
            <p className="text-text-secondary text-sm md:text-base mt-1">
              Monitoreo en tiempo real de las APIs externas del sistema
            </p>
          </div>
        </div>

        {/* Grid de Health Cards */}
        {healthData && healthData.length > 0 ? (
          <HealthGrid healthData={healthData} />
        ) : (
          emptyState
        )}

        {/* Footer info */}
        {healthData && healthData.length > 0 && (
          <div className="text-center text-sm text-text-secondary pt-4">
            <p>Actualización automática cada 30 segundos</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};
