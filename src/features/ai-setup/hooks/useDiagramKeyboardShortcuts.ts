import { useEffect } from 'react';

interface UseDiagramKeyboardShortcutsParams {
  hasEditingLabel: boolean;
  hasContextMenu: boolean;
  isSelectingEndpoint: boolean;
  onUndo: () => void;
  onEscape: () => void;
  onDeleteSelection: () => void;
  onToggleMode: () => void;
}

/**
 * Atajos de teclado globales del editor: Ctrl/Cmd+Z deshace, Escape cierra
 * en cascada (label editor > context menu > modo selección > salir del
 * editor), Delete borra la selección actual, Tab alterna modo mover/editar.
 */
export function useDiagramKeyboardShortcuts({
  hasEditingLabel,
  hasContextMenu,
  isSelectingEndpoint,
  onUndo,
  onEscape,
  onDeleteSelection,
  onToggleMode,
}: UseDiagramKeyboardShortcutsParams) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        onUndo();
      }
      if (e.key === 'Escape') {
        onEscape();
      }
      if (e.key === 'Delete' && !hasEditingLabel) {
        onDeleteSelection();
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        onToggleMode();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [hasEditingLabel, hasContextMenu, isSelectingEndpoint, onUndo, onEscape, onDeleteSelection, onToggleMode]);
}
