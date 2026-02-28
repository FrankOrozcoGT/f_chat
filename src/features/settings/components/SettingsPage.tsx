import { useState, useEffect } from 'react';
import { MainLayout } from '@/layouts/MainLayout';
import { Select } from '@/shared/ui/Select';
import { Button } from '@/shared/ui/Button';
import { useToast } from '@/shared/hooks/useToast';
import { Toast } from '@/shared/ui/Toast';
import { useGetSettings } from '../api/useGetSettings';
import { useUpdateSettings } from '../api/useUpdateSettings';
import type { AnalysisMode } from '../types';

const analysisModeOptions = [
  { value: 'manual' as const, label: 'Manual' },
  { value: 'automatic' as const, label: 'Automático' },
];

export const SettingsPage = () => {
  const { data: settings, isLoading } = useGetSettings();
  const updateSettings = useUpdateSettings();
  const { toasts, showToast, removeToast } = useToast();

  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('manual');
  const [messageLimit, setMessageLimit] = useState<number | ''>(30);

  // Sync local state when settings load
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

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-75">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-border-primary border-t-accent-blue rounded-full animate-spin" />
            <p className="text-sm text-text-secondary">Cargando configuración...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <>
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-semibold text-text-primary mb-2">
          Configuración
        </h1>
        <p className="text-sm md:text-base text-text-secondary mb-6 md:mb-8">
          Ajustes de análisis de conversaciones
        </p>

        <div className="bg-bg-secondary border border-border-primary rounded-lg p-4 md:p-6 space-y-6">
          {/* Analysis Mode */}
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
            <p className="text-xs md:text-sm text-text-tertiary mt-2">
              En modo automático, las conversaciones se analizan al finalizar. En manual, debes iniciar el análisis tú mismo.
            </p>
          </div>

          {/* Message Limit */}
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
                if (e.target.value === '') {
                  setMessageLimit('');
                  return;
                }
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val >= 1) setMessageLimit(val);
              }}
              onBlur={() => {
                if (messageLimit === '' || messageLimit < 1) setMessageLimit(settings?.messageLimit ?? 1);
              }}
              className="w-full max-w-50 px-3 py-2 text-base bg-bg-primary border border-border-primary rounded-md text-text-primary focus:outline-2 focus:outline-accent-blue transition-colors"
            />
            <p className="text-xs md:text-sm text-text-tertiary mt-2">
              Cantidad máxima de mensajes a incluir en cada análisis.
            </p>
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t border-border-primary flex flex-col md:flex-row md:justify-end gap-2">
            <Button
              onClick={handleSave}
              disabled={!hasChanges || updateSettings.isPending}
              isLoading={updateSettings.isPending}
            >
              Guardar cambios
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>

    {toasts.map((toast) => (
      <Toast
        key={toast.id}
        message={toast.message}
        type={toast.type}
        onClose={() => removeToast(toast.id)}
      />
    ))}
    </>
  );
};
