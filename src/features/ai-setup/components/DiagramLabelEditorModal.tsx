export interface EditingLabelState {
  id: string;
  type: 'node' | 'edge';
  value: string;
}

interface DiagramLabelEditorModalProps {
  editingLabel: EditingLabelState;
  onChange: (value: string) => void;
  onSave: () => void;
  onClose: () => void;
}

/** Modal simple para editar el nombre de un nodo o la etiqueta de una transición. */
export const DiagramLabelEditorModal = ({ editingLabel, onChange, onSave, onClose }: DiagramLabelEditorModalProps) => {
  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-bg-secondary border border-border-primary rounded-lg shadow-xl p-4 w-80" onClick={(e) => e.stopPropagation()}>
        <p className="text-xs text-text-tertiary uppercase font-semibold mb-2">
          {editingLabel.type === 'node' ? 'Nombre del nodo' : 'Etiqueta de transición'}
        </p>
        <input
          autoFocus
          value={editingLabel.value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') onClose(); }}
          className="w-full px-3 py-2 bg-bg-primary border border-border-primary rounded-md text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-blue"
          placeholder={editingLabel.type === 'node' ? 'Nombre del paso...' : 'Etiqueta (opcional)...'}
        />
        <div className="flex items-center justify-end gap-2 mt-3">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-text-secondary border border-border-primary rounded hover:bg-bg-tertiary"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            className="px-3 py-1.5 text-xs bg-accent-blue text-white rounded hover:opacity-90"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};
