import { io } from 'socket.io-client';

// Event payload types
export interface MessageIncomingPayload {
  id: string;
  phoneId: string;
  conversationId: string;
  fromNumber: string;
  body: string;
  timestamp: string;
  isFromMe: boolean;
}

export interface MessageSentPayload {
  id: string;
  phoneId: string;
  conversationId: string;
  body: string;
  timestamp: string;
}

export interface MessageNewPayload {
  id: string;
  phoneId: string;
  conversationId: string;
  body: string;
  timestamp: string;
}

export interface MessageErrorPayload {
  phoneId: string;
  conversationId: string;
  error: string;
}

export interface PhoneStatusChangedPayload {
  phoneId: string;
  status: 'pending' | 'connected' | 'disconnected';
}

export interface PhoneQRUpdatedPayload {
  phoneId: string;
  qrCode: string;
}

export interface ConversationCreatedPayload {
  id: string;
  phoneId: string;
  contactNumber: string;
  contactName?: string;
}

export interface ConversationHitlPayload {
  conversationId: string;
  clientPhone: string;
  timestamp: string;
}

export interface ConversationTakenPayload {
  conversationId: string;
  userId: string;
  userName: string;
  timestamp: string;
}

export interface ConversationReturnedPayload {
  conversationId: string;
  timestamp: string;
}

export interface MediaReadyPayload {
  id: string;
  conversationId: string;
  mediaUrl: string;
}

export interface PhoneSyncProgressPayload {
  phoneId: string;
  progress: number;
  isLatest: boolean;
}

export interface CreditsExhaustedPayload {
  userId: string;
  conversationId: string;
  creditsUsed: number;
  creditsLimit: number;
  timestamp: string;
}

export const ApiName = {
  EVOLUTION: 'evolution',
  QWEN_STT: 'qwen_stt',
  QWEN_TTS: 'qwen_tts',
  KIMI: 'kimi',
} as const;

export type ApiName = typeof ApiName[keyof typeof ApiName];

export interface ApiDownPayload {
  apiName: ApiName;
  error: string;
  timestamp: string;
}

export interface ApiUpPayload {
  apiName: ApiName;
  timestamp: string;
}

// Patrón Socket.IO oficial: crear instancia a nivel de módulo
// Referencia: https://socket.io/how-to/use-with-react
const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

export const socket = io(WS_URL, {
  autoConnect: false, // No conectar automáticamente
  withCredentials: true, // Enviar cookies HttpOnly
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
});

// Helper types para listeners
export type EventCallback<T> = (data: T) => void;

// Helpers para rooms (agent:join_room / agent:leave_room)
export const joinPhoneRoom = (phoneId: string): void => {
  if (!socket.connected) {
    console.error('[WebSocket] Cannot join room, not connected');
    return;
  }
  socket.emit('agent:join_room', { phoneId });
  console.log(`[WebSocket] Joined room for phone: ${phoneId}`);
};

export const leavePhoneRoom = (phoneId: string): void => {
  if (!socket.connected) {
    console.error('[WebSocket] Cannot leave room, not connected');
    return;
  }
  socket.emit('agent:leave_room', { phoneId });
  console.log(`[WebSocket] Left room for phone: ${phoneId}`);
};
