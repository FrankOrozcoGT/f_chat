import { useState } from 'react';
import { Merge, GitBranch, Loader2, Tag } from 'lucide-react';
import { useGenerateDiagrams } from '../api/useGenerateDiagrams';
import { useGetIntents } from '../api/useGetIntents';
import { useMergeAnalyses } from '../api/useMergeAnalyses';

export const IntentReviewSection = () => {
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
