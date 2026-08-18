import { Card, CardHeader, CardTitle, CardBody } from '@/shared/ui/Card';
import { formatRelativeTime } from '@/shared/lib/date';
import type { ApiHealth } from '../types';

interface HealthCardProps {
  health: ApiHealth;
}

const API_DISPLAY_NAMES: Record<string, string> = {
  evolution: 'Evolution API',
  qwen_stt: 'Qwen STT',
  qwen_tts: 'Qwen TTS',
  kimi_llm: 'Kimi LLM',
  kimi: 'Kimi K2.5',
};

const formatTimeSince = (isoTimestamp: string | null): string =>
  isoTimestamp ? formatRelativeTime(isoTimestamp) : 'Nunca';

export const HealthCard = ({ health }: HealthCardProps) => {
  const isUp = health.status === 'up';
  const displayName = API_DISPLAY_NAMES[health.apiName] || health.apiName;

  return (
    <Card variant="bordered" className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{displayName}</CardTitle>
          <div
            className={`px-3 py-1 rounded-full text-xs md:text-sm font-semibold ${
              isUp
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
            }`}
          >
            {isUp ? '🟢 UP' : '🔴 DOWN'}
          </div>
        </div>
      </CardHeader>

      <CardBody>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-text-secondary">Latencia:</span>
            <span className="font-mono text-text-primary">
              {health.responseTimeMs != null ? `${health.responseTimeMs}ms` : '—'}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-text-secondary">Última verificación:</span>
            <span className="text-text-primary">
              {formatTimeSince(health.lastCheckAt)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-text-secondary">Monitoreo:</span>
            <span className="text-text-primary">
              {health.monitoringActive ? '✓ Activo' : '✗ Inactivo'}
            </span>
          </div>

          {!isUp && health.errorMessage && (
            <div className="mt-3 pt-3 border-t border-border-primary">
              <span className="text-text-secondary block mb-1">Error:</span>
              <p className="text-red-600 dark:text-red-400 text-xs font-mono wrap-break-words">
                {health.errorMessage}
              </p>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};
