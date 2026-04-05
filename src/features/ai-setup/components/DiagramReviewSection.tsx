import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Pencil, Layers, Trash2, GitBranch, Loader2, Rocket, Merge, Eye, Tag } from 'lucide-react';
import { useGetFlows } from '@/features/flows/api/useGetFlows';
import { usePromoteFlow } from '@/features/flows/api/usePromoteFlow';
import { useDeleteFlow } from '@/features/flows/api/useDeleteFlow';
import { useGetFlowDiagram } from '../api/useGetFlowDiagram';
import { useGetFlowAnalyses } from '../api/useGetFlowAnalyses';
import { useUpdateFlowDiagram } from '../api/useUpdateFlowDiagram';
import { useApproveDiagram } from '../api/useApproveDiagram';
import { useGenerateDiagrams } from '../api/useGenerateDiagrams';
import { useGetIntents } from '../api/useGetIntents';
import { useMergeAnalyses } from '../api/useMergeAnalyses';
import { useMergeIntents } from '../api/useMergeIntents';
import { useGenerateFlows } from '../api/useGenerateFlows';
import { DiagramEditor } from './DiagramEditor';
import type { Flow } from '@/features/flows/types';

/* ── Intent Review Section ── */

const IntentReviewSection = () => {
  const { data: intents, isLoading } = useGetIntents();
  const mergeAnalyses = useMergeAnalyses();
  const { mutate: generateDiagrams, isPending: isGeneratingDiagrams } = useGenerateDiagrams();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [targetIntent, setTargetIntent] = useState('');
  const [showMergeForm, setShowMergeForm] = useState(false);

  const toggleSelect = (intent: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(intent)) next.delete(intent);
      else next.add(intent);
      return next;
    });
  };

  const handleMerge = () => {
    if (selected.size < 2 || !targetIntent.trim()) return;
    const sourceIntents = [...selected].filter((i) => i !== targetIntent.trim());
    mergeAnalyses.mutate(
      { sourceIntents, targetIntent: targetIntent.trim() },
      {
        onSuccess: () => {
          setSelected(new Set());
          setTargetIntent('');
          setShowMergeForm(false);
        },
      },
    );
  };

  const cancelMerge = () => {
    setSelected(new Set());
    setTargetIntent('');
    setShowMergeForm(false);
  };

  if (isLoading) {
    return (
      <div className="bg-bg-secondary border border-border-primary rounded-lg p-4 md:p-6 shadow-sm">
        <div className="flex items-center gap-2 text-text-secondary">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-sm">Cargando intents...</span>
        </div>
      </div>
    );
  }

  if (!intents || intents.length === 0) return null;

  const totalAnalyses = intents.reduce((sum, i) => sum + i.count, 0);

  return (
    <div className="bg-bg-secondary border border-border-primary rounded-lg p-4 md:p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-base md:text-lg font-semibold text-text-primary mb-1">
            Intents detectados
          </h2>
          <p className="text-sm text-text-secondary">
            {intents.length} intent{intents.length !== 1 ? 's' : ''} — {totalAnalyses} análisis total — selecciona similares para fusionar antes de generar diagramas
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {selected.size >= 2 && !showMergeForm && (
            <button
              onClick={() => setShowMergeForm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500 text-white rounded-md text-xs font-medium hover:opacity-90 transition-opacity"
            >
              <Merge size={14} />
              Fusionar ({selected.size})
            </button>
          )}
          {selected.size > 0 && (
            <button
              onClick={cancelMerge}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-border-primary text-text-secondary rounded-md text-xs font-medium hover:bg-bg-tertiary"
            >
              Cancelar
            </button>
          )}
          <button
            onClick={() => generateDiagrams()}
            disabled={isGeneratingDiagrams}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-blue text-white rounded-md text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isGeneratingDiagrams ? <Loader2 size={14} className="animate-spin" /> : <GitBranch size={14} />}
            Generar diagramas
          </button>
        </div>
      </div>

      {/* Merge form */}
      {showMergeForm && (
        <div className="flex items-center gap-3 p-3 bg-purple-400/10 border border-purple-400/30 rounded-md mb-4">
          <p className="text-xs text-purple-400 shrink-0">Nombre del intent destino:</p>
          <input
            type="text"
            value={targetIntent}
            onChange={(e) => setTargetIntent(e.target.value)}
            placeholder="ej: cotizacion"
            className="flex-1 px-2.5 py-1.5 bg-bg-primary border border-border-primary rounded text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-purple-400"
          />
          <button
            onClick={handleMerge}
            disabled={mergeAnalyses.isPending || !targetIntent.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500 text-white rounded-md text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {mergeAnalyses.isPending ? <Loader2 size={12} className="animate-spin" /> : <Merge size={12} />}
            {mergeAnalyses.isPending ? 'Fusionando...' : 'Confirmar'}
          </button>
        </div>
      )}

      {/* Merge success */}
      {mergeAnalyses.isSuccess && mergeAnalyses.data && (
        <div className="flex items-center justify-between p-3 bg-purple-400/10 border border-purple-400/30 rounded-md mb-4">
          <p className="text-xs text-purple-400">
            Fusionado: {mergeAnalyses.data.totalRenamed} análisis renombrados a <span className="font-medium">{mergeAnalyses.data.targetIntent}</span>
          </p>
          <button onClick={() => mergeAnalyses.reset()} className="text-[10px] text-purple-400 hover:text-purple-300">✕</button>
        </div>
      )}

      {/* Intent list */}
      <div className="flex flex-wrap gap-2">
        {intents.map((item) => {
          const isSelected = selected.has(item.intent);
          return (
            <button
              key={item.intent}
              onClick={() => toggleSelect(item.intent)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs border transition-colors ${
                isSelected
                  ? 'bg-purple-500/15 border-purple-400/50 text-purple-400'
                  : 'bg-bg-primary border-border-primary text-text-secondary hover:border-text-tertiary'
              }`}
            >
              <Tag size={12} />
              <span className="font-medium">{item.intent}</span>
              <span className={`text-[10px] ${isSelected ? 'text-purple-400/70' : 'text-text-tertiary'}`}>
                {item.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* ── Flow Card ── */

const FlowCard = ({ flow, selected, onToggleSelect, mergeMode }: { flow: Flow; selected: boolean; onToggleSelect: (id: string) => void; mergeMode: boolean }) => {
  const navigate = useNavigate();
  const updateDiagram = useUpdateFlowDiagram();
  const approveDiagram = useApproveDiagram();
  const { mutate: promote, isPending: isPromoting } = usePromoteFlow();
  const { mutate: discard, isPending: isDiscarding } = useDeleteFlow();

  const [editing, setEditing] = useState(false);

  const { data: diagram, isLoading: diagramLoading } = useGetFlowDiagram(flow.id);
  const { data: analyses } = useGetFlowAnalyses(editing ? flow.id : null);

  const isApproved = diagram?.diagramApproved;
  const isBusy = isPromoting || isDiscarding;
  const hasNodes = flow.nodes.length > 0;

  const handleSave = (newMermaid: string) => {
    updateDiagram.mutate({ flowId: flow.id, diagram: newMermaid }, {
      onSuccess: () => setEditing(false),
    });
  };

  return (
    <div className="border border-border-primary rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-bg-primary border-b border-border-primary">
        <div className="flex items-center gap-2 min-w-0">
          {mergeMode && (
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onToggleSelect(flow.id)}
              className="w-3.5 h-3.5 shrink-0 accent-purple-500"
            />
          )}
          <Layers size={14} className="text-accent-blue shrink-0" />
          <span className="text-sm font-medium text-text-primary truncate">{flow.name}</span>
          {flow.analysisCount > 0 && (
            <span className="text-[10px] text-accent-blue font-medium">{flow.analysisCount} conv.</span>
          )}
          {isApproved && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border bg-accent-green/15 text-accent-green border-accent-green/30">
              Diagrama aprobado
            </span>
          )}
          {diagram?.diagramModified && !isApproved && (
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
          <button
            onClick={() => setEditing(true)}
            className="p-1.5 rounded hover:bg-bg-tertiary text-text-tertiary hover:text-text-secondary transition-colors"
            title="Editar diagrama"
          >
            <Pencil size={14} />
          </button>
          {!isApproved && (
            <button
              onClick={() => approveDiagram.mutate(flow.id)}
              disabled={approveDiagram.isPending}
              className="flex items-center gap-1 px-2.5 py-1 bg-accent-green text-white rounded text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              title="Aprobar diagrama"
            >
              {approveDiagram.isPending ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
              {approveDiagram.isPending ? 'Aprobando...' : 'Aprobar diagrama'}
            </button>
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

      {editing && (
        diagramLoading ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary">
            <Loader2 size={24} className="animate-spin text-text-tertiary" />
          </div>
        ) : diagram ? (
          <DiagramEditor
            mermaidChart={diagram.consolidatedDiagram}
            nodeMapping={diagram.nodeMapping}
            internalQueues={diagram.internalQueues}
            nodeCategories={diagram.nodeCategories}
            analyses={analyses}
            onSave={handleSave}
            onCancel={() => setEditing(false)}
            isSaving={updateDiagram.isPending}
          />
        ) : null
      )}
    </div>
  );
};

/* ── Main Section ── */

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
