import { useEffect, useState } from 'react';
import { Button } from '@/shared/ui/Button';
import { useToast } from '@/shared/hooks/useToast';
import { useGetFarewellTemplate } from '../api/useGetFarewellTemplate';
import { useUpdateFarewellTemplate } from '../api/useUpdateFarewellTemplate';

export const MessagesSettingsTab = () => {
  const { data: farewellTemplate } = useGetFarewellTemplate();
  const updateFarewell = useUpdateFarewellTemplate();
  const { showToast } = useToast();

  const [farewellContent, setFarewellContent] = useState('');
  const farewellHasChanges = farewellTemplate !== undefined && farewellContent !== farewellTemplate.content;

  useEffect(() => {
    if (farewellTemplate) {
      setFarewellContent(farewellTemplate.content);
    }
  }, [farewellTemplate]);

  return (
    <div className="bg-bg-secondary border border-border-primary rounded-lg p-4 md:p-6 space-y-6">
      <div>
        <h2 className="text-base font-semibold text-text-primary mb-1">Mensajes del sistema</h2>
        <p className="text-sm text-text-secondary">Personaliza los mensajes automáticos que envía el bot.</p>
      </div>

      <div className="border-t border-border-primary pt-6 space-y-2">
        <label className="block text-sm font-medium text-text-primary">
          Mensaje de despedida
        </label>
        <p className="text-xs text-text-tertiary">
          Se envía automáticamente al cerrar una conversación.
        </p>
        <textarea
          value={farewellContent}
          onChange={(e) => setFarewellContent(e.target.value)}
          rows={5}
          className="w-full px-3 py-2 text-sm bg-bg-primary border border-border-primary rounded-md text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent-blue resize-y"
          placeholder="Ej: ¡Hasta pronto! Si necesitas algo más, no dudes en contactarnos."
        />
      </div>

      <div className="pt-4 border-t border-border-primary flex justify-end">
        <Button
          onClick={() => {
            updateFarewell.mutate(farewellContent, {
              onSuccess: () => showToast('Mensaje de despedida guardado', 'success'),
              onError: () => showToast('Error al guardar el mensaje', 'error'),
            });
          }}
          disabled={!farewellHasChanges || updateFarewell.isPending}
          isLoading={updateFarewell.isPending}
        >
          Guardar cambios
        </Button>
      </div>
    </div>
  );
};
