import { useState } from 'react';
import { Play, CheckCircle, AlertCircle, Layers, Tag, DollarSign, GitBranch } from 'lucide-react';
import { StatCard } from '@/shared/ui/StatCard';
import { useBatchAnalysis } from '../api/useBatchAnalysis';
import { useGenerateFlows } from '../api/useGenerateFlows';

export const BatchAnalysisSection = () => {
  const [channelCount, setChannelCount] = useState(10);
  const [messageLimit, setMessageLimit] = useState(75);

  const { mutate, data: result, isPending, isError, error } = useBatchAnalysis();
  const { mutate: generateFlows, data: flowsResult, isPending: isGenerating, isError: isFlowsError, error: flowsError } = useGenerateFlows();

  const handleRun = () => {
    mutate({ channelCount, messageLimit });
  };

  return (
    <div className="bg-bg-secondary border border-border-primary rounded-lg p-4 md:p-6 shadow-sm">
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <h2 className="text-base md:text-lg font-semibold text-text-primary mb-1">
          Análisis de Conversaciones
        </h2>
        <p className="text-sm text-text-secondary">
          Analiza canales recientes para detectar patrones internos y generar borradores de flujos
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4 md:mb-6">
        <div className="flex-1">
          <label className="block text-xs text-text-secondary mb-1.5">
            Canales a analizar
          </label>
          <input
            type="number"
            min={1}
            max={50}
            value={channelCount}
            onChange={(e) => setChannelCount(Number(e.target.value))}
            className="w-full px-3 py-2 bg-bg-primary border border-border-primary rounded-md text-sm text-text-primary focus:outline-2 focus:outline-accent-blue"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-text-secondary mb-1.5">
            Límite de mensajes por canal
          </label>
          <input
            type="number"
            min={1}
            max={200}
            value={messageLimit}
            onChange={(e) => setMessageLimit(Number(e.target.value))}
            className="w-full px-3 py-2 bg-bg-primary border border-border-primary rounded-md text-sm text-text-primary focus:outline-2 focus:outline-accent-blue"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={handleRun}
            disabled={isPending}
            className="min-h-11 md:min-h-10 px-5 py-2.5 bg-accent-blue text-white rounded-md text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Analizando...
              </>
            ) : (
              <>
                <Play size={16} />
                Ejecutar análisis
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {isError && (
        <div className="flex items-center gap-2 p-3 bg-accent-red/10 border border-accent-red/30 rounded-md mb-4">
          <AlertCircle size={16} className="text-accent-red shrink-0" />
          <p className="text-sm text-accent-red">
            {(error as Error)?.message ?? 'Error al ejecutar el análisis'}
          </p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={16} className="text-accent-green" />
            <p className="text-sm text-accent-green font-medium">Análisis completado</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            <StatCard
              label="Canales analizados"
              value={result.analyzed}
              icon={<Layers size={18} />}
            />
            <StatCard
              label="Internos detectados"
              value={result.internalsDetected}
              subtext="borradores de flujo creados"
              icon={<Tag size={18} />}
            />
            <StatCard
              label="Costo total"
              value={`$${result.totalCostUsd.toFixed(4)}`}
              subtext="USD"
              icon={<DollarSign size={18} />}
            />
          </div>

          {/* Intents */}
          {result.intents && result.intents.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-text-tertiary uppercase mb-2">Intents detectados</p>
              <div className="flex flex-wrap gap-2">
                {result.intents.map(({ intent, count }) => (
                  <span key={intent} className="flex items-center gap-1.5 px-2.5 py-1 bg-bg-primary border border-border-primary rounded-md text-xs text-text-secondary">
                    <span className="font-medium text-text-primary">{intent}</span>
                    <span className="text-text-tertiary">{count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Generate Flows */}
          {result.internalsDetected > 0 && (
            <div className="border-t border-border-primary pt-4">
              {isFlowsError && (
                <div className="flex items-center gap-2 p-3 bg-accent-red/10 border border-accent-red/30 rounded-md mb-3">
                  <AlertCircle size={16} className="text-accent-red shrink-0" />
                  <p className="text-sm text-accent-red">
                    {(flowsError as Error)?.message ?? 'Error al generar flujos'}
                  </p>
                </div>
              )}
              {flowsResult ? (
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-accent-green" />
                  <p className="text-sm text-accent-green font-medium">
                    {flowsResult.flowsGenerated} flujo{flowsResult.flowsGenerated !== 1 ? 's' : ''} generado{flowsResult.flowsGenerated !== 1 ? 's' : ''}
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => generateFlows()}
                  disabled={isGenerating}
                  className="min-h-11 md:min-h-10 px-5 py-2.5 bg-accent-green text-white rounded-md text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generando flujos...
                    </>
                  ) : (
                    <>
                      <GitBranch size={16} />
                      Generar flujos ({result.internalsDetected})
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
