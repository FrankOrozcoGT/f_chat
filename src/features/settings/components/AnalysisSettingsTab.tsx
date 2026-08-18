import { useEffect, useState } from 'react';
import { Select } from '@/shared/ui/Select';
import { Button } from '@/shared/ui/Button';
import { useToast } from '@/shared/hooks/useToast';
import { useGetSettings } from '@/features/settings/api/useGetSettings';
import { useUpdateSettings } from '@/features/settings/api/useUpdateSettings';
import type { AnalysisMode } from '@/features/settings/types';

const analysisModeOptions = [
  { value: 'manual' as const, label: 'Manual' },
  { value: 'automatic' as const, label: 'Automático' },
];

export const AnalysisSettingsTab = () => {
  const { data: settings } = useGetSettings();
  const updateSettings = useUpdateSettings();
  const { showToast } = useToast();

  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('manual');
  const [messageLimit, setMessageLimit] = useState<number | ''>(30);

  useEffect(() => {
    if (settings) {
      setAnalysisMode(settings.analysisMode);
      setMessageLimit(settings.messageLimit);
    }
  }, [settings]);

  const hasChanges =
    settings && messageLimit !== '' && (analysisMode !== settings.analysisMode || messageLimit !== settings.messageLimit);

  const handleSave = () => {
    updateSettings.mutate(
      { analysisMode, messageLimit: messageLimit as number },
      {
        onSuccess: () => showToast('Configuración guardada', 'success'),
        onError: () => showToast('Error al guardar configuración', 'error'),
      }
    );
  };

  return (
    <div className="bg-bg-secondary border border-border-primary rounded-lg p-4 md:p-6 space-y-6">
      <div>
        <h2 className="text-base font-semibold text-text-primary mb-1">Análisis de conversaciones</h2>
        <p className="text-sm text-text-secondary">Configura cómo se analizan las conversaciones.</p>
      </div>

      <div className="border-t border-border-primary pt-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Modo de análisis
          </label>
          <Select
            value={analysisMode}
            options={analysisModeOptions}
            onChange={setAnalysisMode}
            size="md"
          />
          <p className="text-xs text-text-tertiary mt-2">
            En modo automático, las conversaciones se analizan al finalizar. En manual, debes iniciar el análisis tú mismo.
          </p>
        </div>

        <div>
          <label htmlFor="messageLimit" className="block text-sm font-medium text-text-primary mb-2">
            Límite de mensajes
          </label>
          <input
            id="messageLimit"
            type="number"
            min={1}
            value={messageLimit}
            onChange={(e) => {
              if (e.target.value === '') { setMessageLimit(''); return; }
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val) && val >= 1) setMessageLimit(val);
            }}
            onBlur={() => {
              if (messageLimit === '' || messageLimit < 1) setMessageLimit(settings?.messageLimit ?? 1);
            }}
            className="w-full max-w-50 px-3 py-2 text-base bg-bg-primary border border-border-primary rounded-md text-text-primary focus:outline-2 focus:outline-accent-blue transition-colors"
          />
          <p className="text-xs text-text-tertiary mt-2">
            Cantidad máxima de mensajes a incluir en cada análisis.
          </p>
        </div>
      </div>

      <div className="pt-4 border-t border-border-primary flex justify-end">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || updateSettings.isPending}
          isLoading={updateSettings.isPending}
        >
          Guardar cambios
        </Button>
      </div>
    </div>
  );
};
