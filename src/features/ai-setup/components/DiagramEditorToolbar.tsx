import { Save, X, Undo2, Eye } from 'lucide-react';

type SelectionMode = 'none' | 'select-origin' | 'select-destination';

interface DiagramEditorToolbarProps {
  mode: 'move' | 'edit';
  onToggleMode: () => void;
  onUndo: () => void;
  onOpenRawEditor: () => void;
  selectMode: SelectionMode;
  onCancelSelectMode: () => void;
  hasSidebarToggle: boolean;
  showSidebar: boolean;
  onToggleSidebar: () => void;
  analysesCount: number;
  onSave: () => void;
  isSaving?: boolean;
  onCancel: () => void;
}

/** Barra superior del editor de diagramas: modo mover/editar, deshacer, editor raw, toggle de sidebar de conversaciones, guardar/cerrar. */
export const DiagramEditorToolbar = ({
  mode,
  onToggleMode,
  onUndo,
  onOpenRawEditor,
  selectMode,
  onCancelSelectMode,
  hasSidebarToggle,
  showSidebar,
  onToggleSidebar,
  analysesCount,
  onSave,
  isSaving,
  onCancel,
}: DiagramEditorToolbarProps) => (
  <div className="flex items-center justify-between px-4 py-2.5 bg-bg-secondary border-b border-border-primary shrink-0">
    <div className="flex items-center gap-2">
      <button
        onClick={onToggleMode}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border rounded transition-colors ${
          mode === 'edit'
            ? 'bg-accent-yellow/15 text-accent-yellow border-accent-yellow/30'
            : 'bg-accent-blue/15 text-accent-blue border-accent-blue/30'
        }`}
        title="Tab para cambiar"
      >
        {mode === 'move' ? '🖐 Mover' : '✏️ Editar'}
      </button>
      <button
        onClick={onUndo}
        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-bg-primary border border-border-primary rounded text-text-secondary hover:text-text-primary transition-colors disabled:opacity-30"
        title="Deshacer (Ctrl+Z)"
      >
        <Undo2 size={13} />
        Deshacer
      </button>
      <button
        onClick={onOpenRawEditor}
        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-bg-primary border border-border-primary rounded text-text-secondary hover:text-text-primary transition-colors"
        title="Editar código mermaid"
      >
        {'</>'}
      </button>
      {selectMode !== 'none' && (
        <span className="text-xs text-accent-yellow bg-accent-yellow/10 border border-accent-yellow/30 px-2.5 py-1 rounded">
          Haz click en un nodo para seleccionar {selectMode === 'select-origin' ? 'nuevo origen' : 'nuevo destino'}
          <button onClick={onCancelSelectMode} className="ml-2 text-text-tertiary hover:text-text-primary">
            <X size={11} />
          </button>
        </span>
      )}
    </div>
    <div className="flex items-center gap-2">
      {hasSidebarToggle && (
        <button
          onClick={onToggleSidebar}
          className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium border rounded transition-colors ${
            showSidebar
              ? 'bg-accent-blue/15 text-accent-blue border-accent-blue/30'
              : 'bg-bg-primary text-text-secondary border-border-primary hover:text-text-primary'
          }`}
        >
          <Eye size={13} />
          Conversaciones ({analysesCount})
        </button>
      )}
      <button
        onClick={onSave}
        disabled={isSaving}
        className="flex items-center gap-1.5 px-4 py-1.5 bg-accent-blue text-white rounded text-xs font-medium hover:opacity-90 disabled:opacity-50"
      >
        <Save size={13} />
        {isSaving ? 'Guardando...' : 'Guardar'}
      </button>
      <button
        onClick={onCancel}
        className="flex items-center gap-1.5 px-4 py-1.5 border border-border-primary text-text-secondary rounded text-xs font-medium hover:bg-bg-tertiary"
      >
        <X size={13} />
        Cerrar
      </button>
    </div>
  </div>
);
