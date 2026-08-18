import { Trash2, Square } from 'lucide-react';

function formatRecordingTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

interface RecordingInputProps {
  recordingTime: number;
  onCancel: () => void;
  onStop: () => void;
}

/** Barra de grabación de audio en curso: cancelar, indicador de tiempo, detener. */
export const RecordingInput = ({ recordingTime, onCancel, onStop }: RecordingInputProps) => (
  <div className="p-3 md:p-4 border-t border-border-primary bg-bg-secondary">
    <div className="flex items-center gap-3">
      <button
        onClick={onCancel}
        className="min-h-11 min-w-11 flex items-center justify-center rounded-full bg-bg-tertiary hover:bg-accent-red hover:bg-opacity-10 transition-colors"
        title="Cancelar grabación"
      >
        <Trash2 className="w-5 h-5 text-text-secondary" />
      </button>

      <div className="flex-1 flex items-center gap-2">
        <div className="w-2 h-2 bg-accent-red rounded-full animate-pulse" />
        <span className="text-sm font-medium text-text-primary">
          {formatRecordingTime(recordingTime)}
        </span>
        <div className="flex-1 h-1 bg-bg-tertiary rounded-full overflow-hidden">
          <div
            className="h-full bg-accent-red transition-all duration-300"
            style={{ width: `${(recordingTime / 60) * 100}%` }}
          />
        </div>
      </div>

      <button
        onClick={onStop}
        className="min-h-11 min-w-11 flex items-center justify-center rounded-full bg-accent-blue hover:bg-opacity-90 transition-colors"
        title="Detener grabación"
      >
        <Square className="w-5 h-5 text-white fill-white" />
      </button>
    </div>
  </div>
);
