import { CheckCircle, AlertCircle, GitBranch } from 'lucide-react';
import { useGenerateDiagrams } from '../api/useGenerateDiagrams';

export const GenerateDiagramsSection = () => {
  const { mutate: generateDiagrams, data: result, isPending, isError, error } = useGenerateDiagrams();

  return (
    <div className="bg-bg-secondary border border-border-primary rounded-lg p-4 md:p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base md:text-lg font-semibold text-text-primary mb-1">
          Generar diagramas
        </h2>
        <p className="text-sm text-text-secondary">
          Consolida los intents detectados en diagramas de flujo para revisión
        </p>
      </div>

      {isError && (
        <div className="flex items-center gap-2 p-3 bg-accent-red/10 border border-accent-red/30 rounded-md mb-3">
          <AlertCircle size={16} className="text-accent-red shrink-0" />
          <p className="text-sm text-accent-red">
            {(error as Error)?.message ?? 'Error al generar diagramas'}
          </p>
        </div>
      )}

      {result ? (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={16} className="text-accent-green" />
            <p className="text-sm text-accent-green font-medium">
              {result.diagramsGenerated} diagrama{result.diagramsGenerated !== 1 ? 's' : ''} generado{result.diagramsGenerated !== 1 ? 's' : ''}
              {result.totalCostUsd > 0 && (
                <span className="text-text-tertiary font-normal"> · ${result.totalCostUsd.toFixed(4)}</span>
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {result.flows.map((f) => (
              <span key={f.flowId} className="flex items-center gap-1.5 px-2.5 py-1 bg-bg-primary border border-border-primary rounded-md text-xs text-text-secondary">
                <GitBranch size={11} />
                {f.intentName}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <button
          onClick={() => generateDiagrams()}
          disabled={isPending}
          className="min-h-11 md:min-h-10 px-5 py-2.5 bg-accent-green text-white rounded-md text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generando diagramas...
            </>
          ) : (
            <>
              <GitBranch size={16} />
              Generar diagramas
            </>
          )}
        </button>
      )}
    </div>
  );
};
