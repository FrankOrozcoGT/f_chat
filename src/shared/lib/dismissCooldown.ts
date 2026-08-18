/**
 * Persiste un timestamp de "descartado" en localStorage bajo `key` y permite
 * chequear si todavía está dentro del cooldown. Útil para banners/modales
 * que el usuario puede posponer por un tiempo determinado.
 */
export function dismiss(key: string): void {
  localStorage.setItem(key, Date.now().toString());
}

export function isDismissed(key: string, durationMs: number): boolean {
  const dismissedAt = localStorage.getItem(key);
  if (!dismissedAt) return false;
  return Date.now() - parseInt(dismissedAt, 10) < durationMs;
}
