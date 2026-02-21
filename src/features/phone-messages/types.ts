export interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
}

// Backend raw message from GET /api/phones/:id/messages/:remoteJid
export interface RawPhoneMessage {
  id: string;
  key: {
    id: string;
    fromMe: boolean;
    remoteJid: string;
  };
  pushName?: string;
  messageType: string;
  message: Record<string, unknown>;
  messageTimestamp: number;
  instanceId: string;
  source: string;
  MessageUpdate?: { status: string }[];
}

const mapMessageType = (messageType: string): import('@/features/messages/types').MessageType => {
  if (messageType === 'audioMessage' || messageType === 'pttMessage') return 'voice';
  if (messageType === 'imageMessage') return 'image';
  if (messageType === 'videoMessage') return 'video';
  if (messageType === 'documentMessage') return 'document';
  // conversation, extendedTextMessage y cualquier otro → text
  return 'text';
};

const mapStatus = (updates?: { status: string }[]): import('@/features/messages/types').MessageStatus => {
  if (!updates || updates.length === 0) return 'sent';
  const last = updates[updates.length - 1].status;
  if (last === 'READ' || last === 'PLAYED') return 'read';
  if (last === 'DELIVERY_ACK') return 'delivered';
  if (last === 'SERVER_ACK') return 'sent';
  if (last === 'ERROR') return 'failed';
  return 'sent';
};

const extractContent = (message: Record<string, unknown>, messageType: string): string => {
  // Texto plano
  if (messageType === 'conversation') return (message.conversation as string) ?? '';
  // Texto extendido
  if (messageType === 'extendedTextMessage') {
    const payload = message.extendedTextMessage as Record<string, unknown> | undefined;
    return (payload?.text as string) ?? '';
  }
  // Mensajes con caption (imagen, video, documento)
  const payload = message[messageType] as Record<string, unknown> | undefined;
  return (payload?.caption as string) ?? '';
};

const extractMediaUrl = (message: Record<string, unknown>, messageType: string): string | null => {
  const payload = message[messageType] as Record<string, unknown> | undefined;
  return (payload?.url as string) ?? null;
};

export const mapRawPhoneMessage = (raw: RawPhoneMessage): import('@/features/messages/types').Message => ({
  id: raw.id,
  conversationId: raw.key.remoteJid,
  content: extractContent(raw.message, raw.messageType),
  mediaUrl: extractMediaUrl(raw.message, raw.messageType),
  type: mapMessageType(raw.messageType),
  direction: raw.key.fromMe ? 'outgoing' : 'incoming',
  senderType: raw.key.fromMe ? 'agent' : 'client',
  status: mapStatus(raw.MessageUpdate),
  timestamp: new Date(raw.messageTimestamp * 1000).toISOString(),
});
