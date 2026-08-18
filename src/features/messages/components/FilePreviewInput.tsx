import type { KeyboardEvent } from 'react';
import { X, Paperclip, Send } from 'lucide-react';
import { Button } from '@/shared/ui/Button';

const MAX_MESSAGE_LENGTH = 4096;

interface FilePreviewInputProps {
  file: File;
  previewUrl: string | null;
  message: string;
  onMessageChange: (value: string) => void;
  onClear: () => void;
  onSend: () => void;
  disabled: boolean;
}

/** Preview del archivo/imagen seleccionado con caption opcional antes de enviarlo. */
export const FilePreviewInput = ({ file, previewUrl, message, onMessageChange, onClear, onSend, disabled }: FilePreviewInputProps) => {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') onSend();
  };

  return (
    <div className="p-3 md:p-4 border-t border-border-primary bg-bg-secondary space-y-2">
      {previewUrl ? (
        <div className="relative w-full max-w-xs mx-auto md:mx-0">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-auto max-h-48 md:max-h-64 object-contain rounded-lg border border-border-primary bg-bg-primary"
          />
          <button
            onClick={onClear}
            className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-bg-primary bg-opacity-90 hover:bg-opacity-100 transition-colors shadow-lg"
            title="Eliminar"
          >
            <X className="w-4 h-4 text-text-secondary" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 p-2 bg-bg-primary rounded-lg border border-border-primary">
          <Paperclip className="w-5 h-5 text-text-tertiary shrink-0" />
          <span className="text-sm text-text-secondary flex-1 truncate">
            {file.name}
          </span>
          <button
            onClick={onClear}
            className="text-text-tertiary hover:text-accent-red transition-colors shrink-0"
            title="Eliminar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Agregar un mensaje..."
          className="
            flex-1 min-h-11 px-3 md:px-4 rounded-lg
            bg-bg-primary border border-border-primary
            text-sm md:text-base placeholder:text-text-tertiary
            focus:border-accent-blue focus:outline-2 focus:outline-accent-blue
            disabled:opacity-60 disabled:cursor-not-allowed
            transition-colors
          "
          maxLength={MAX_MESSAGE_LENGTH}
        />
        <Button
          onClick={onSend}
          disabled={disabled}
          size="md"
          className="min-h-11 min-w-11 px-3 shrink-0"
          title="Enviar"
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};
