export const phoneMessageKeys = {
  all: ['phone-messages'] as const,
  contacts: (phoneId: string) => [...phoneMessageKeys.all, phoneId, 'contacts'] as const,
};
