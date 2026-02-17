import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { phoneKeys } from '@/features/phones/api/phoneKeys';
import type { CreatePhoneResponse } from '@/features/phones/types';
import { AxiosError } from 'axios';

interface CreatePhoneParams {
  instanceName: string;
}

export const useCreatePhone = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ instanceName }: CreatePhoneParams) => {
      try {
        const response = await apiClient.post<CreatePhoneResponse>('/api/phones/create', {
          instanceName,
        });
        return response.data;
      } catch (error) {
        if (error instanceof AxiosError && error.response?.data?.message) {
          // Extraer mensaje del backend y traducir si es necesario
          const backendMessage = error.response.data.message;

          // Traducir mensaje de límite de WhatsApp
          if (backendMessage.includes('WhatsApp limit reached')) {
            const match = backendMessage.match(/Current: (\d+), Limit: (\d+)/);
            if (match) {
              const [, current, limit] = match;
              throw new Error(`Límite de instancias WhatsApp alcanzado. Actual: ${current}, Límite: ${limit}`);
            }
          }

          // Si no hay traducción específica, usar el mensaje del backend
          throw new Error(backendMessage);
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: phoneKeys.all });
    },
  });
};
