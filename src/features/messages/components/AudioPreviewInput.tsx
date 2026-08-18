import { useMemo } from 'react';
import { Trash2, Send } from 'lucide-react';
import { Button } from '@/shared/ui/Button';

const MAX_MESSAGE_LENGTH = 4096;

interface AudioPreviewInputProps {
  audio: Blob;
  message: string;
  onMessageChange: (value: string) => void;
  onClear: () => void;
  onSend: () => void;
  disabled: boolean;
}

/** Preview del audio grabado con caption opcional antes de enviarlo. */
export const AudioPreviewInput = ({ audio, message, onMessageChange, onClear, onSend, disabled }: AudioPreviewInputProps) => {
  const audioUrl = useMemo(() => URL.createObjectURL(audio), [audio]);

  return (
    <div className="p-3 md:p-4 border-t border-border-primary bg-bg-secondary space-y-2">
      <div className="flex items-center gap-2">
        <button
          onClick={onClear}
          className="shrink-0 text-text-tertiary hover:text-accent-red transition-colors"
          title="Eliminar audio"
        >
          <Trash2 className="w-5 h-5" />
        </button>

        <audio
          src={audioUrl}
          controls
          className="flex-1 max-w-full"
          style={{ height: '40px' }}
        />
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          placeholder="Agregar un mensaje..."
          className="
            flex-1 min-h-11 px-3 py-2 rounded-lg
            bg-bg-primary border border-border-primary
            text-sm text-text-primary placeholder:text-text-tertiary
            focus:border-accent-blue focus:outline-2 focus:outline-accent-blue
            transition-colors
          "
          maxLength={MAX_MESSAGE_LENGTH}
        />
        <Button
          onClick={onSend}
          disabled={disabled}
          variant="primary"
          size="md"
          className="min-h-11 min-w-11 px-3 shrink-0"
          title="Enviar audio"
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};
