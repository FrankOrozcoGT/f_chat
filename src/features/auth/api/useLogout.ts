import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { authKeys } from './useGetMe';

/**
 * Hook para hacer logout del usuario.
 *
 * Usa TanStack Query Mutation para:
 * - Llamar al endpoint de logout (limpia cookie HttpOnly en backend)
 * - Invalidar cache de usuario (limpia datos locales)
 * - Redirigir a login
 */
export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await apiClient.post('/auth/logout');
    },
    onSuccess: () => {
      // Invalidar toda la cache de auth (elimina usuario de memoria)
      queryClient.invalidateQueries({ queryKey: authKeys.all });

      // Redirigir a login
      window.location.href = '/login';
    },
  });
};
