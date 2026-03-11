import { useState, useCallback } from 'react';
import { Workflow, AlertCircle, Loader2, FlaskConical } from 'lucide-react';
import { MainLayout } from '@/layouts/MainLayout';
import { useGetFlows } from '../api/useGetFlows';
import { useGetActiveSessions } from '../api/useGetActiveSessions';
import { FlowOverviewCanvas } from './FlowOverviewCanvas';
import { FlowDetailCanvas } from './FlowDetailCanvas';
import { TestPanel } from './TestPanel';

export const FlowsPage = () => {
  const { data: flows, isLoading, isError, error } = useGetFlows();
  const { data: activeSessions } = useGetActiveSessions();
  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null);
  const [showTestPanel, setShowTestPanel] = useState(false);

  const handleSelectFlow = useCallback((flowId: string) => {
    setSelectedFlowId(flowId);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedFlowId(null);
  }, []);

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

  const emptyState = (
    <div className="bg-bg-secondary rounded-lg border border-border-primary p-12 text-center">
      <Workflow size={48} className="text-text-tertiary mx-auto mb-4" />
      <h3 className="text-lg font-medium text-text-primary mb-2">No hay flujos</h3>
      <p className="text-text-secondary">No se encontraron flujos configurados.</p>
    </div>
  );

  const selectedFlow = selectedFlowId ? flows?.find((f) => f.id === selectedFlowId) : null;
  const sessions = activeSessions || {};

  return (
    <MainLayout>
      <div className="max-w-full mx-auto space-y-4">
        {/* Header - solo en overview */}
        {!selectedFlow && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Workflow size={28} className="text-accent-blue" />
              <div>
                <h1 className="text-2xl md:text-3xl font-semibold text-text-primary">Automatizacion</h1>
                <p className="text-text-secondary text-sm md:text-base mt-1">
                  Flujos y nodos de procesamiento
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowTestPanel((prev) => !prev)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors text-sm ${
                showTestPanel
                  ? 'bg-accent-green/10 border-accent-green text-accent-green'
                  : 'bg-bg-secondary border-border-primary text-text-primary hover:bg-bg-tertiary'
              }`}
            >
              <FlaskConical size={16} />
              Testing
            </button>
          </div>
        )}

        {/* Content */}
        {selectedFlow ? (
          <FlowDetailCanvas flow={selectedFlow} activeSessions={sessions} onBack={handleBack} />
        ) : showTestPanel ? (
          <TestPanel
            onClose={() => setShowTestPanel(false)}
            onNodeHighlight={() => {}}
          />
        ) : flows && flows.length > 0 ? (
          <FlowOverviewCanvas flows={flows} activeSessions={sessions} onSelectFlow={handleSelectFlow} />
        ) : (
          emptyState
        )}
      </div>
    </MainLayout>
  );
};
