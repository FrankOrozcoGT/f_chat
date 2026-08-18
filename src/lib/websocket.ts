import { useEffect } from 'react';
import { io } from 'socket.io-client';

// Event payload types
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
  keyId: string;
  conversationId: string;
  mediaUrl: string;
}

export interface PhoneSyncingPayload {
  phoneId: string;
  contactsCount: number;
}

export interface PhoneSyncProgressPayload {
  phoneId: string;
  contactsCount: number;
}

export interface PhoneSyncCompletePayload {
  phoneId: string;
  contactsCount: number;
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

/**
 * Suscribe un handler a un evento del socket global durante la vida del componente.
 * Encapsula el patrón socket.on/socket.off en useEffect, repetido antes en cada
 * componente que escucha eventos en tiempo real.
 */
export function useSocketEvent<T>(event: string, handler: EventCallback<T>): void {
  useEffect(() => {
    socket.on(event, handler);
    return () => {
      socket.off(event, handler);
    };
  }, [event, handler]);
}
