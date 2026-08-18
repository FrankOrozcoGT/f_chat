import { useRef } from 'react';

const MAX_HISTORY = 50;

/**
 * Historial lineal de snapshots de un valor de tipo T (ej. el string de un
 * editor), sin conocer nada de la forma del valor. push() antes de mutar,
 * undo() para volver al snapshot anterior.
 */
export function useUndoHistory<T>() {
  const historyRef = useRef<T[]>([]);

  const push = (value: T) => {
    historyRef.current.push(value);
    if (historyRef.current.length > MAX_HISTORY) historyRef.current.shift();
  };

  const undo = (): T | undefined => historyRef.current.pop();

  return { push, undo };
}
