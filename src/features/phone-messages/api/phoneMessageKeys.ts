export const phoneMessageKeys = {
  all: ['phone-messages'] as const,
  contacts: (phoneId: string) => [...phoneMessageKeys.all, phoneId, 'contacts'] as const,
  messages: (phoneId: string, remoteJid: string) => [...phoneMessageKeys.all, phoneId, remoteJid, 'messages'] as const,
};
