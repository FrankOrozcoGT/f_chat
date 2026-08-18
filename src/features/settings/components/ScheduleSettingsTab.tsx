import { useEffect, useState } from 'react';
import { Button } from '@/shared/ui/Button';
import { useToast } from '@/shared/hooks/useToast';
import { useGetSettings } from '../api/useGetSettings';
import { useUpdateSettings } from '../api/useUpdateSettings';
import type { WorkSchedule } from '../types';

const DAY_NAMES: Record<string, string> = {
  '1': 'Lunes',
  '2': 'Martes',
  '3': 'Miércoles',
  '4': 'Jueves',
  '5': 'Viernes',
  '6': 'Sábado',
  '7': 'Domingo',
};

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => ({
  value: String(i),
  label: `${String(i).padStart(2, '0')}:00`,
}));

const DAY_KEYS = ['1', '2', '3', '4', '5', '6', '7'] as const;

export const ScheduleSettingsTab = () => {
  const { data: settings } = useGetSettings();
  const updateSettings = useUpdateSettings();
  const { showToast } = useToast();

  const [workSchedule, setWorkSchedule] = useState<WorkSchedule>({});

  useEffect(() => {
    if (settings) {
      setWorkSchedule(settings.workSchedule ?? {});
    }
  }, [settings]);

  const toggleDay = (day: string) => {
    setWorkSchedule((prev) => {
      const next = { ...prev };
      if (next[day as keyof WorkSchedule]) {
        delete next[day as keyof WorkSchedule];
      } else {
        next[day as keyof WorkSchedule] = { start: 8, end: 18 };
      }
      return next;
    });
  };

  const updateDayHour = (day: string, field: 'start' | 'end', value: number) => {
    setWorkSchedule((prev) => ({
      ...prev,
      [day]: { ...(prev[day as keyof WorkSchedule] ?? { start: 8, end: 18 }), [field]: value },
    }));
  };

  const handleSaveSchedule = () => {
    updateSettings.mutate(
      { workSchedule },
      {
        onSuccess: () => showToast('Horarios guardados', 'success'),
        onError: () => showToast('Error al guardar horarios', 'error'),
      }
    );
  };

  return (
    <div className="bg-bg-secondary border border-border-primary rounded-lg p-4 md:p-6">
      <div className="mb-6">
        <h2 className="text-base font-semibold text-text-primary mb-1">Horarios de trabajo</h2>
        <p className="text-sm text-text-secondary">
          Define el horario de atención por día. Los días sin horario no reciben atención automatizada.
        </p>
      </div>

      <div className="space-y-1">
        {DAY_KEYS.map((day) => {
          const active = !!workSchedule[day as keyof WorkSchedule];
          const schedule = workSchedule[day as keyof WorkSchedule];
          return (
            <div
              key={day}
              className="flex items-center gap-4 py-4 border-b border-border-primary last:border-0"
            >
              {/* Toggle */}
              <button
                role="switch"
                aria-checked={active}
                onClick={() => toggleDay(day)}
                className={`relative inline-flex items-center w-11 h-6 rounded-full transition-colors shrink-0 ${
                  active ? 'bg-accent-blue' : 'bg-bg-tertiary'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    active ? 'translate-x-5.5' : 'translate-x-0.5'
                  }`}
                />
              </button>

              {/* Día */}
              <span className="text-sm font-medium text-text-primary w-24 shrink-0">{DAY_NAMES[day]}</span>

              {/* Horas */}
              {active && schedule ? (
                <div className="flex items-center gap-6 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-text-secondary whitespace-nowrap">Desde</span>
                    <select
                      value={String(schedule.start)}
                      onChange={(e) => updateDayHour(day, 'start', Number(e.target.value))}
                      className="px-3 py-2 text-sm bg-bg-primary border border-border-primary rounded-md text-text-primary focus:outline-2 focus:outline-accent-blue w-28"
                    >
                      {HOUR_OPTIONS.map((h) => (
                        <option key={h.value} value={h.value}>{h.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-text-secondary whitespace-nowrap">Hasta</span>
                    <select
                      value={String(schedule.end)}
                      onChange={(e) => updateDayHour(day, 'end', Number(e.target.value))}
                      className="px-3 py-2 text-sm bg-bg-primary border border-border-primary rounded-md text-text-primary focus:outline-2 focus:outline-accent-blue w-28"
                    >
                      {HOUR_OPTIONS.map((h) => (
                        <option key={h.value} value={h.value}>{h.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <span className="text-sm text-text-tertiary flex-1">Sin horario</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="pt-4 border-t border-border-primary flex justify-end mt-4">
        <Button onClick={handleSaveSchedule} isLoading={updateSettings.isPending}>
          Guardar horarios
        </Button>
      </div>
    </div>
  );
};
