// Message types for f_chat - Backend aligned

// Backend types (lowercase as returned by API)
export type BackendMessageType = 'text' | 'image' | 'video' | 'audio' | 'document';
export type BackendMessageDirection = 'incoming' | 'outgoing';
export type BackendSenderType = 'client' | 'agent' | 'bot';
export type BackendMessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

// Frontend types (mapped)
export type MessageType = 'text' | 'image' | 'video' | 'voice' | 'document';
export type MessageDirection = 'incoming' | 'outgoing';
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

// Backend message structure
export interface BackendMessage {
  id: string;
  conversationId: string;
  type: BackendMessageType;
  content: string;
  mediaUrl: string | null;
  direction: BackendMessageDirection;
  senderType: BackendSenderType;
  status: BackendMessageStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Frontend message structure (transformed)
export interface Message {
  id: string;
  conversationId: string;
  content: string;
  mediaUrl: string | null;
  type: MessageType;
  direction: MessageDirection;
  senderType: BackendSenderType;
  status: MessageStatus;
  timestamp: string;
}

// Backend client structure
export interface BackendClient {
  id: string;
  phoneNumber: string;
  name: string;
  metadata: any | null;
  firstContactAt: string;
  lastContactAt: string;
}

// Frontend client structure (transformed)
export interface Client {
  id: string;
  phone: string;
  name: string;
  lastContactAt: string;
  createdAt: string;
}

// Backend conversation detail response
export interface BackendConversationDetail {
  conversation: {
    id: string;
    phoneId: string;
    clientId: string;
    isActive: boolean;
    lastMessageAt: Date;
    lastMessagePreview: string;
    createdAt: Date;
    updatedAt: Date;
  };
  client: BackendClient | null;
  summary: {
    conversationId: string;
    clientName: string;
    clientPhone: string;
    lastMessageAt: Date;
    lastMessagePreview: string;
    isActive: boolean;
  };
}

// Type mappers
export const mapBackendMessageType = (type: BackendMessageType): MessageType => {
  // Backend returns 'audio' but frontend uses 'voice'
  if (type === 'audio') return 'voice';
  return type as MessageType;
};

export const mapBackendDirection = (direction: BackendMessageDirection): MessageDirection => {
  // Backend already returns 'incoming' | 'outgoing'
  return direction;
};

export const mapBackendStatus = (status: BackendMessageStatus): MessageStatus => {
  // Backend already returns lowercase
  return status;
};

export const mapBackendMessage = (msg: BackendMessage): Message => ({
  id: msg.id,
  conversationId: msg.conversationId,
  content: msg.content,
  mediaUrl: msg.mediaUrl,
  type: mapBackendMessageType(msg.type),
  direction: mapBackendDirection(msg.direction),
  senderType: msg.senderType,
  status: mapBackendStatus(msg.status),
  timestamp: new Date(msg.createdAt).toISOString(),
});

export const mapBackendClient = (client: BackendClient): Client => ({
  id: client.id,
  phone: client.phoneNumber,
  name: client.name,
  lastContactAt: client.lastContactAt,
  createdAt: client.firstContactAt,
});
