import { AxiosError } from 'axios';

interface BackendErrorBody {
  message?: string;
}

/**
 * Extrae un mensaje legible de cualquier error (axios, Error nativo del
 * navegador, o desconocido) — punto único de manejo de errores del frontend.
 * statusMessages permite mapear códigos HTTP a mensajes custom (evaluados antes del mensaje del backend).
 * translateMessage permite reescribir el mensaje crudo del backend (ej. traducirlo) antes de devolverlo.
 */
export function getErrorMessage(
  error: unknown,
  fallback: string,
  statusMessages?: Record<number, string>,
  translateMessage?: (backendMessage: string) => string | null,
): string {
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    if (status && statusMessages?.[status]) {
      return statusMessages[status];
    }
    const backendMessage = (error.response?.data as BackendErrorBody | undefined)?.message;
    if (typeof backendMessage === 'string') {
      const translated = translateMessage?.(backendMessage);
      return translated ?? backendMessage;
    }
    return fallback;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}
