import { useQuery } from '@tanstack/react-query';
import { apiClient, type User } from '@/lib/api';

// Query keys siguiendo patrón jerárquico de la arquitectura
export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
};

/**
 * Hook para obtener el usuario autenticado actual.
 *
 * Usa TanStack Query para:
 * - Cache automático (usuario se consulta una vez)
 * - Refetch en window focus deshabilitado (evita requests innecesarios)
 * - Manejo de errores 401 (redirige a login automáticamente vía interceptor)
 *
 * @returns Query con data del usuario o null si no está autenticado
 */
export const useGetMe = () => {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: async (): Promise<User> => {
      const response = await apiClient.get<{ user: User }>('/auth/me');
      return response.data.user; // Backend devuelve { user: {...} }
    },
    retry: false, // No reintentar si falla (401 = no autenticado)
    staleTime: 5 * 60 * 1000, // 5 minutos - datos frescos
    gcTime: 10 * 60 * 1000, // 10 minutos - garbage collection
    refetchOnWindowFocus: false, // No refetch en focus (evitar requests innecesarios)
  });
};
