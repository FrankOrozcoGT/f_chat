import { AxiosError } from 'axios';

interface BackendErrorBody {
  message?: string;
}

/**
 * Extrae un mensaje legible de un error de axios.
 * statusMessages permite mapear códigos HTTP a mensajes custom (evaluados antes del mensaje del backend).
 */
export function getErrorMessage(
  error: unknown,
  fallback: string,
  statusMessages?: Record<number, string>,
): string {
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    if (status && statusMessages?.[status]) {
      return statusMessages[status];
    }
    const backendMessage = (error.response?.data as BackendErrorBody | undefined)?.message;
    if (typeof backendMessage === 'string') {
      return backendMessage;
    }
  }
  return fallback;
}
