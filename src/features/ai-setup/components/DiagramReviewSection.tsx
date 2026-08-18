import { useState } from 'react';
import { Layers, Merge, GitBranch, Loader2 } from 'lucide-react';
import { useGetFlows } from '@/features/flows/api/useGetFlows';
import { useMergeIntents } from '@/features/ai-setup/api/useMergeIntents';
import { useGenerateFlows } from '@/features/ai-setup/api/useGenerateFlows';
import { IntentReviewSection } from '@/features/ai-setup/components/IntentReviewSection';
import { FlowCard } from '@/features/ai-setup/components/FlowCard';

export const DiagramReviewSection = () => {
  const { data: flows, isLoading } = useGetFlows();
  const { mutate: mergeIntents, isPending: isMerging, isSuccess: mergeSuccess, data: mergeResult, reset: resetMerge } = useMergeIntents();
  const { mutate: generateFlows, isPending: isGeneratingFlows } = useGenerateFlows();
  const drafts = (flows?.filter((f) => f.status === 'draft') ?? [])
    .sort((a, b) => (b.analysisCount ?? 0) - (a.analysisCount ?? 0));

  const [mergeMode, setMergeMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showTargetModal, setShowTargetModal] = useState(false);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleStartMerge = () => {
    if (selectedIds.size < 2) return;
    setShowTargetModal(true);
  };

  const handleMerge = (targetFlowId: string) => {
    const targetFlow = drafts.find((d) => d.id === targetFlowId);
    const targetIntentId = targetFlow?.intents?.[0]?.id;
    if (!targetIntentId) return;

    const sourceIntentIds = drafts
      .filter((d) => selectedIds.has(d.id) && d.id !== targetFlowId)
      .map((d) => d.intents?.[0]?.id)
      .filter(Boolean) as string[];

    if (sourceIntentIds.length === 0) return;

    mergeIntents({ targetIntentId, sourceIntentIds }, {
      onSuccess: () => {
        setShowTargetModal(false);
        setSelectedIds(new Set());
        setMergeMode(false);
      },
    });
  };

  const cancelMergeMode = () => {
    setMergeMode(false);
    setSelectedIds(new Set());
    setShowTargetModal(false);
  };

  const selectedDrafts = drafts.filter((d) => selectedIds.has(d.id));

  return (
    <div className="flex flex-col gap-6">
      {/* Step 1: Intent review & merge */}
      <IntentReviewSection />

      {/* Step 2: Flow diagrams */}
      <div className="bg-bg-secondary border border-border-primary rounded-lg p-4 md:p-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-base md:text-lg font-semibold text-text-primary mb-1">
              Revisión de flujos
            </h2>
            <p className="text-sm text-text-secondary">
              {isLoading
                ? 'Cargando...'
                : drafts.length > 0
                  ? `${drafts.length} flujo${drafts.length !== 1 ? 's' : ''} en borrador — revisa diagramas, edita y aprueba`
                  : 'Los flujos generados aparecerán aquí para revisión'}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {mergeMode ? (
              <>
                <button
                  onClick={handleStartMerge}
                  disabled={selectedIds.size < 2}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500 text-white rounded-md text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <Merge size={14} />
                  Fusionar ({selectedIds.size})
                </button>
                <button
                  onClick={cancelMergeMode}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-border-primary text-text-secondary rounded-md text-xs font-medium hover:bg-bg-tertiary"
                >
                  Cancelar
                </button>
              </>
            ) : (
              <>
                {drafts.length >= 2 && (
                  <button
                    onClick={() => setMergeMode(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-purple-400/30 text-purple-400 rounded-md text-xs font-medium hover:bg-purple-400/10 transition-colors"
                  >
                    <Merge size={14} />
                    Fusionar
                  </button>
                )}
                <button
                  onClick={() => generateFlows()}
                  disabled={isGeneratingFlows}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-blue text-white rounded-md text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isGeneratingFlows ? <Loader2 size={14} className="animate-spin" /> : <GitBranch size={14} />}
                  Generar nodos
                </button>
              </>
            )}
          </div>
        </div>

        {mergeSuccess && mergeResult && (
          <div className="flex items-center justify-between p-3 bg-purple-400/10 border border-purple-400/30 rounded-md mb-4">
            <p className="text-xs text-purple-400">
              Fusionado: {mergeResult.mergedAnalyses} análisis movidos
              {mergeResult.refinement && (
                <> → <span className="font-medium">{mergeResult.refinement.intentName}</span> (${mergeResult.refinement.costUsd.toFixed(4)})</>
              )}
            </p>
            <button onClick={() => resetMerge()} className="text-[10px] text-purple-400 hover:text-purple-300">✕</button>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center gap-2 text-text-secondary">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm">Cargando flujos...</span>
          </div>
        ) : drafts.length === 0 ? (
          <p className="text-sm text-text-secondary italic">No hay flujos en borrador</p>
        ) : (
          <div className="flex flex-col gap-4">
            {drafts.map((f) => (
              <FlowCard key={f.id} flow={f} selected={selectedIds.has(f.id)} onToggleSelect={toggleSelect} mergeMode={mergeMode} />
            ))}
          </div>
        )}

        {/* Target selection modal */}
        {showTargetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowTargetModal(false)}>
            <div className="bg-bg-secondary border border-border-primary rounded-lg shadow-xl p-4 w-96" onClick={(e) => e.stopPropagation()}>
              <p className="text-sm font-semibold text-text-primary mb-1">¿Cuál es el destino?</p>
              <p className="text-[11px] text-text-tertiary mb-3">
                Los demás flujos seleccionados se fusionarán en el que elijas. Sus conversaciones se moverán y el diagrama se refinará.
              </p>
              <div className="flex flex-col gap-1.5 mb-3 max-h-48 overflow-y-auto">
                {selectedDrafts.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => handleMerge(d.id)}
                    disabled={isMerging}
                    className="flex items-center gap-2 px-3 py-2.5 rounded text-xs text-left border bg-bg-primary text-text-secondary border-border-primary hover:border-purple-400 hover:text-purple-400 transition-colors disabled:opacity-50"
                  >
                    <Layers size={12} />
                    <span className="truncate flex-1">{d.name}</span>
                    {d.analysisCount > 0 && (
                      <span className="text-text-tertiary text-[10px]">{d.analysisCount} conv.</span>
                    )}
                  </button>
                ))}
              </div>
              {isMerging && (
                <div className="flex items-center gap-2 text-xs text-purple-400">
                  <Loader2 size={12} className="animate-spin" />
                  Fusionando...
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
