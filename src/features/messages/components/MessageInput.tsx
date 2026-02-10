// Message input component (disabled for Task 4, enabled in Task 5)
// Mobile-first design with touch-friendly button

import { Send } from 'lucide-react';
import { Button } from '@/shared/ui/Button';

export const MessageInput = () => {
  return (
    <div className="p-3 md:p-4 border-t border-border-primary bg-bg-secondary">
      <div className="flex gap-2">
        <input
          disabled
          type="text"
          placeholder="Escribe un mensaje..."
          className="
            flex-1 min-h-11 px-4 rounded-lg
            bg-bg-primary border border-border-primary
            text-text-primary placeholder:text-text-tertiary
            focus:outline-none focus:ring-2 focus:ring-accent-blue
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        />
        <Button disabled size="md" className="min-h-11 min-w-11 px-3">
          <Send className="w-5 h-5" />
        </Button>
      </div>
      <p className="text-xs text-text-secondary mt-2 text-center">
        Función de envío disponible en próxima actualización
      </p>
    </div>
  );
};
