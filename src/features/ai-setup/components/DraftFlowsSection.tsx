import { CheckCircle, Trash2, GitBranch, Loader2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGetFlows } from '@/features/flows/api/useGetFlows';
import { usePromoteFlow } from '@/features/flows/api/usePromoteFlow';
import { useDeleteFlow } from '@/features/flows/api/useDeleteFlow';

export const DraftFlowsSection = () => {
  const navigate = useNavigate();
  const { data: flows, isLoading } = useGetFlows();
  const { mutate: promote, isPending: isPromoting, variables: promotingId } = usePromoteFlow();
  const { mutate: discard, isPending: isDiscarding, variables: discardingId } = useDeleteFlow();

  const drafts = flows?.filter((f) => f.status === 'draft') ?? [];

  if (isLoading) {
    return (
      <div className="bg-bg-secondary border border-border-primary rounded-lg p-4 md:p-6 shadow-sm">
        <div className="flex items-center gap-2 text-text-secondary">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-sm">Cargando flujos...</span>
        </div>
      </div>
    );
  }

  if (drafts.length === 0) {
    return (
      <div className="bg-bg-secondary border border-border-primary rounded-lg p-4 md:p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-base md:text-lg font-semibold text-text-primary mb-1">
            Flujos pendientes de aprobación
          </h2>
          <p className="text-sm text-text-secondary">
            Los flujos generados por el análisis aparecerán aquí para revisión
          </p>
        </div>
        <p className="text-sm text-text-secondary italic">No hay flujos en borrador</p>
      </div>
    );
  }

  return (
    <div className="bg-bg-secondary border border-border-primary rounded-lg p-4 md:p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base md:text-lg font-semibold text-text-primary mb-1">
          Flujos pendientes de aprobación
        </h2>
        <p className="text-sm text-text-secondary">
          {drafts.length} flujo{drafts.length !== 1 ? 's' : ''} generado{drafts.length !== 1 ? 's' : ''} por el análisis — revisalos y apruébalos o descártalos
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {drafts.map((flow) => {
          const isBeingPromoted = isPromoting && promotingId === flow.id;
          const isBeingDiscarded = isDiscarding && discardingId === flow.id;
          const isBusy = isBeingPromoted || isBeingDiscarded;

          return (
            <div
              key={flow.id}
              className="flex items-center gap-3 p-3 bg-bg-primary border border-border-primary rounded-md"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-accent-blue/10 text-accent-blue shrink-0">
                <GitBranch size={16} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{flow.name}</p>
                <p className="text-xs text-text-secondary">
                  {flow.nodes.length} nodo{flow.nodes.length !== 1 ? 's' : ''}
                  {' · '}
                  {flow.transitions.length} transición{flow.transitions.length !== 1 ? 'es' : ''}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => discard(flow.id)}
                  disabled={isBusy}
                  title="Descartar"
                  className="p-2 text-text-secondary hover:text-accent-red hover:bg-accent-red/10 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isBeingDiscarded ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>

                <button
                  onClick={() => navigate(`/ai-setup/flows/${flow.id}`)}
                  disabled={isBusy}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-border-primary text-text-secondary rounded-md text-xs font-medium hover:border-accent-blue hover:text-accent-blue transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Eye size={14} />
                  Revisar
                </button>

                <button
                  onClick={() => promote(flow.id)}
                  disabled={isBusy}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-green text-white rounded-md text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isBeingPromoted ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <CheckCircle size={14} />
                  )}
                  Aprobar
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
