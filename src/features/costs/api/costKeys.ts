import type { Period } from '@/features/costs/types';

export const costKeys = {
  all: ['costs'] as const,
  byPeriod: (period: Period) => [...costKeys.all, period] as const,
};
