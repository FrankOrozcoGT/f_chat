import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Pencil, Eye, Layers, ChevronDown, ChevronRight, AlertCircle, Trash2, GitBranch, Loader2, Rocket, MessageSquare } from 'lucide-react';
import { useGetFlows } from '@/features/flows/api/useGetFlows';
import { usePromoteFlow } from '@/features/flows/api/usePromoteFlow';
import { useDeleteFlow } from '@/features/flows/api/useDeleteFlow';
import { useGetFlowDiagram } from '../api/useGetFlowDiagram';
import { useGetFlowAnalyses } from '../api/useGetFlowAnalyses';
import { useUpdateFlowDiagram } from '../api/useUpdateFlowDiagram';
import { useApproveDiagram } from '../api/useApproveDiagram';
import { useGenerateFlows } from '../api/useGenerateFlows';
import { MermaidDiagram } from '@/shared/components/MermaidDiagram';
import { DiagramEditor } from './DiagramEditor';
import { ConversationDrawer } from './ConversationDrawer';
import type { Flow } from '@/features/flows/types';

const FlowCard = ({ flow }: { flow: Flow }) => {
  const navigate = useNavigate();
  const { data: diagram, isLoading: diagramLoading } = useGetFlowDiagram(flow.id);
  const { data: analyses } = useGetFlowAnalyses(flow.id);
  const updateDiagram = useUpdateFlowDiagram();
  const approveDiagram = useApproveDiagram();
  const { mutate: promote, isPending: isPromoting } = usePromoteFlow();
  const { mutate: discard, isPending: isDiscarding } = useDeleteFlow();

  const [editing, setEditing] = useState(false);
  const [showIndividuals, setShowIndividuals] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [viewingConversationId, setViewingConversationId] = useState<string | null>(null);

  const isBusy = isPromoting || isDiscarding;
  const hasNodes = flow.nodes.length > 0;

  // Find nodes without coverage
  const uncoveredNodes = useMemo(() => {
    if (!diagram?.nodeMapping) return [];
    return Object.entries(diagram.nodeMapping)
      .filter(([, sources]) => sources.length === 0)
      .map(([nodeId]) => nodeId);
  }, [diagram?.nodeMapping]);

  const handleSave = (newMermaid: string) => {
    updateDiagram.mutate({ flowId: flow.id, diagram: newMermaid }, {
      onSuccess: () => setEditing(false),
    });
  };

  const handleSelectAnalysis = (conversationId: string) => {
    setSelectedConversationId(selectedConversationId === conversationId ? null : conversationId);
  };

  // Build highlighted mermaid: inject style classes for coverage
  const highlightedChart = useMemo(() => {
    if (!diagram?.consolidatedDiagram || !diagram?.nodeMapping || !selectedConversationId) {
      return diagram?.consolidatedDiagram ?? '';
    }

    let chart = diagram.consolidatedDiagram;
    const styleLines: string[] = [];

    Object.entries(diagram.nodeMapping).forEach(([nodeId, sources]) => {
      const isInConv = sources.some((s) => s.conversationId === selectedConversationId);
      if (isInConv) {
        styleLines.push(`    style ${nodeId} fill:#fbbf24,stroke:#f59e0b,color:#1a1a2e`);
      } else if (sources.length === 0) {
        styleLines.push(`    style ${nodeId} fill:#334155,stroke:#64748b,stroke-dasharray: 5 5`);
      }
    });

    if (styleLines.length > 0) {
      chart += '\n' + styleLines.join('\n');
    }

    return chart;
  }, [diagram, selectedConversationId]);

  // Coverage chart (no selection)
  const coverageChart = useMemo(() => {
    if (!diagram?.consolidatedDiagram || !diagram?.nodeMapping || selectedConversationId) return null;

    let chart = diagram.consolidatedDiagram;
    const styleLines: string[] = [];

    Object.entries(diagram.nodeMapping).forEach(([nodeId, sources]) => {
      if (sources.length === 0) {
        styleLines.push(`    style ${nodeId} fill:#334155,stroke:#64748b,stroke-dasharray: 5 5`);
      } else if (sources.length >= 3) {
        styleLines.push(`    style ${nodeId} fill:#166534,stroke:#22c55e,color:#e2e8f0`);
      } else {
        styleLines.push(`    style ${nodeId} fill:#1e3a5f,stroke:#3b82f6,color:#e2e8f0`);
      }
    });

    if (styleLines.length > 0) {
      chart += '\n' + styleLines.join('\n');
    }

    return chart;
  }, [diagram, selectedConversationId]);

  const displayChart = selectedConversationId ? highlightedChart : (coverageChart ?? diagram?.consolidatedDiagram ?? '');

  return (
    <div className="border border-border-primary rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-bg-primary border-b border-border-primary">
        <div className="flex items-center gap-2 min-w-0">
          <Layers size={14} className="text-accent-blue shrink-0" />
          <span className="text-sm font-medium text-text-primary truncate">{flow.name}</span>
          {flow.analysisCount > 0 && (
            <span className="text-[10px] text-accent-blue font-medium">{flow.analysisCount} conv.</span>
          )}
          {diagram?.diagramApproved && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border bg-accent-green/15 text-accent-green border-accent-green/30">
              Diagrama aprobado
            </span>
          )}
          {diagram?.diagramModified && !diagram?.diagramApproved && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border bg-accent-yellow/15 text-accent-yellow border-accent-yellow/30">
              Modificado
            </span>
          )}
          {hasNodes && (
            <span className="text-[10px] text-text-tertiary">
              {flow.nodes.length} nodo{flow.nodes.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {diagram && !diagram.diagramApproved && (
            <>
              <button
                onClick={() => setEditing(true)}
                disabled={editing}
                className="p-1.5 rounded hover:bg-bg-tertiary text-text-tertiary hover:text-text-secondary transition-colors disabled:opacity-40"
                title="Editar diagrama"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => approveDiagram.mutate(flow.id)}
                disabled={approveDiagram.isPending}
                className="flex items-center gap-1 px-2.5 py-1 bg-accent-green text-white rounded text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                title="Aprobar diagrama"
              >
                <CheckCircle size={12} />
                Aprobar diagrama
              </button>
            </>
          )}
          {hasNodes && (
            <>
              <button
                onClick={() => navigate(`/ai-setup/flows/${flow.id}`)}
                disabled={isBusy}
                className="flex items-center gap-1 px-2.5 py-1 border border-border-primary text-text-secondary rounded text-xs font-medium hover:border-accent-blue hover:text-accent-blue transition-colors disabled:opacity-50"
              >
                <Eye size={12} />
                Revisar
              </button>
              <button
                onClick={() => promote(flow.id)}
                disabled={isBusy}
                className="flex items-center gap-1 px-2.5 py-1 bg-accent-blue text-white rounded text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isPromoting ? <Loader2 size={12} className="animate-spin" /> : <Rocket size={12} />}
                Promover
              </button>
            </>
          )}
          <button
            onClick={() => discard(flow.id)}
            disabled={isBusy}
            title="Descartar"
            className="p-1.5 rounded text-text-tertiary hover:text-accent-red hover:bg-accent-red/10 transition-colors disabled:opacity-40"
          >
            {isDiscarding ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={14} />}
          </button>
        </div>
      </div>

      {/* Uncovered nodes alert */}
      {uncoveredNodes.length > 0 && !editing && (
        <div className="flex items-center gap-2 px-4 py-2 bg-accent-yellow/5 border-b border-accent-yellow/20">
          <AlertCircle size={13} className="text-accent-yellow shrink-0" />
          <p className="text-[11px] text-accent-yellow">
            {uncoveredNodes.length} nodo{uncoveredNodes.length !== 1 ? 's' : ''} sugerido{uncoveredNodes.length !== 1 ? 's' : ''} por IA sin cobertura de conversaciones: {uncoveredNodes.join(', ')}
          </p>
        </div>
      )}

      {/* Diagram / Editor */}
      <div className="p-3">
        {diagramLoading && (
          <div className="text-xs text-text-tertiary">Cargando diagrama...</div>
        )}
        {diagram && !editing && (
          <MermaidDiagram chart={displayChart} />
        )}
        {diagram && editing && (
          <DiagramEditor
            mermaidChart={diagram.consolidatedDiagram}
            nodeMapping={diagram.nodeMapping}
            analyses={analyses}
            selectedConversationId={selectedConversationId}
            onSave={handleSave}
            onCancel={() => setEditing(false)}
            isSaving={updateDiagram.isPending}
          />
        )}
        {!diagram && !diagramLoading && (
          <div className="text-xs text-text-tertiary italic">Sin diagrama generado</div>
        )}
      </div>

      {/* Legend */}
      {diagram?.nodeMapping && !editing && (
        <div className="flex items-center gap-4 px-4 py-1.5 border-t border-border-primary text-[10px] text-text-tertiary">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded border-2 border-accent-green bg-accent-green/20" />
            Alta cobertura (3+)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded border-2 border-accent-blue bg-accent-blue/15" />
            Baja cobertura
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded border-2 border-dashed border-text-tertiary" />
            Sugerido por IA
          </span>
          {selectedConversationId && (
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded border-2 border-accent-yellow bg-accent-yellow/20" />
              En conversación seleccionada
            </span>
          )}
        </div>
      )}

      {/* Individual analyses */}
      {analyses && analyses.length > 0 && (
        <div className="border-t border-border-primary">
          <button
            onClick={() => setShowIndividuals((v) => !v)}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-text-secondary hover:bg-bg-tertiary transition-colors"
          >
            {showIndividuals ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            <Eye size={12} />
            Conversaciones individuales ({analyses.length})
          </button>

          {showIndividuals && (
            <div className="px-4 pb-3 flex flex-col gap-2">
              <div className="flex flex-wrap gap-1.5">
                {analyses.map((a) => {
                  const isSelected = selectedConversationId === a.conversationId;
                  return (
                    <div key={a.analysisId} className="flex items-center gap-0.5">
                      <button
                        onClick={() => handleSelectAnalysis(a.conversationId)}
                        className={`px-2 py-1 rounded-l text-[11px] border border-r-0 transition-colors ${
                          isSelected
                            ? 'bg-accent-yellow/15 text-accent-yellow border-accent-yellow/30'
                            : 'bg-bg-primary text-text-secondary border-border-primary hover:border-accent-blue/50'
                        }`}
                      >
                        {a.intent}
                        <span className="text-text-tertiary ml-1 text-[10px]">
                          {new Date(a.analyzedAt).toLocaleDateString()}
                        </span>
                      </button>
                      <button
                        onClick={() => setViewingConversationId(a.conversationId)}
                        className={`px-1.5 py-1 rounded-r text-[11px] border transition-colors ${
                          isSelected
                            ? 'bg-accent-yellow/15 text-accent-yellow border-accent-yellow/30'
                            : 'bg-bg-primary text-text-tertiary border-border-primary hover:text-accent-blue hover:border-accent-blue/50'
                        }`}
                        title="Ver conversación"
                      >
                        <MessageSquare size={11} />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Show selected individual diagram */}
              {selectedConversationId && (() => {
                const selected = analyses.find((a) => a.conversationId === selectedConversationId);
                if (!selected) return null;
                return (
                  <div className="mt-2 border border-border-primary rounded-md p-3 bg-bg-primary">
                    <p className="text-xs text-text-secondary mb-2">{selected.flowSummary}</p>
                    {selected.flowDiagram && (
                      <MermaidDiagram chart={selected.flowDiagram} />
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* Conversation drawer */}
      {viewingConversationId && (() => {
        const analysis = analyses?.find((a) => a.conversationId === viewingConversationId);
        return (
          <ConversationDrawer
            conversationId={viewingConversationId}
            title={analysis?.intent ?? 'Conversación'}
            subtitle={analysis?.flowSummary}
            onClose={() => setViewingConversationId(null)}
          />
        );
      })()}
    </div>
  );
};

export const DiagramReviewSection = () => {
  const { data: flows, isLoading } = useGetFlows();
  const { mutate: generateFlows, isPending: isGeneratingFlows } = useGenerateFlows();
  const drafts = (flows?.filter((f) => f.status === 'draft') ?? [])
    .sort((a, b) => (b.analysisCount ?? 0) - (a.analysisCount ?? 0));

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

  return (
    <div className="bg-bg-secondary border border-border-primary rounded-lg p-4 md:p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-base md:text-lg font-semibold text-text-primary mb-1">
            Revisión de flujos
          </h2>
          <p className="text-sm text-text-secondary">
            {drafts.length > 0
              ? `${drafts.length} flujo${drafts.length !== 1 ? 's' : ''} en borrador — revisa diagramas, edita y aprueba`
              : 'Los flujos generados aparecerán aquí para revisión'}
          </p>
        </div>
        <button
          onClick={() => generateFlows()}
          disabled={isGeneratingFlows}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-accent-blue text-white rounded-md text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isGeneratingFlows ? <Loader2 size={14} className="animate-spin" /> : <GitBranch size={14} />}
          Generar nodos
        </button>
      </div>

      {drafts.length === 0 ? (
        <p className="text-sm text-text-secondary italic">No hay flujos en borrador</p>
      ) : (
        <div className="flex flex-col gap-4">
          {drafts.map((f) => (
            <FlowCard key={f.id} flow={f} />
          ))}
        </div>
      )}
    </div>
  );
};
