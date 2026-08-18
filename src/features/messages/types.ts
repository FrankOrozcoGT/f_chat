// Message types for f_chat - Backend aligned

// Backend enums (lowercase as returned by API)
export const MessageDirection = {
  Incoming: 'incoming',
  Outgoing: 'outgoing',
} as const;
export type MessageDirection = typeof MessageDirection[keyof typeof MessageDirection];

export const MessageSenderType = {
  Client: 'client',
  Agent: 'agent',
  Bot: 'bot',
  System: 'system',
} as const;
export type MessageSenderType = typeof MessageSenderType[keyof typeof MessageSenderType];

export const MessageType = {
  Text: 'text',
  Image: 'image',
  Video: 'video',
  Audio: 'audio',
  Voice: 'voice',
  Document: 'document',
} as const;
export type MessageType = typeof MessageType[keyof typeof MessageType];

export const MessageStatus = {
  Pending: 'pending',
  Sent: 'sent',
  Delivered: 'delivered',
  Read: 'read',
  Failed: 'failed',
} as const;
export type MessageStatus = typeof MessageStatus[keyof typeof MessageStatus];

// Legacy type aliases (keep for backwards compat)
export type BackendMessageType = 'text' | 'image' | 'video' | 'audio' | 'document';
export type BackendMessageDirection = MessageDirection;
export type BackendSenderType = MessageSenderType;
export type BackendMessageStatus = MessageStatus;

// Backend message structure
export interface BackendMessage {
  id: string;
  conversationId: string;
  type: BackendMessageType;
  content: string;
  mediaUrl: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  direction: BackendMessageDirection;
  senderType: BackendSenderType;
  status: BackendMessageStatus;
  metadata?: Record<string, unknown>;
  transcription?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Frontend message structure (transformed)
export interface Message {
  id: string;
  conversationId: string;
  content: string;
  mediaUrl: string | null;
  mediaLoading?: boolean;
  fileName?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  type: MessageType;
  direction: MessageDirection;
  senderType: BackendSenderType;
  status: MessageStatus;
  timestamp: string;
  // Evolution keyId (from metadata.keyId)
  keyId?: string | null;
  // DB id of the quoted message (from metadata.quotedMessageId)
  quotedKeyId?: string | null;
  // Resolved quoted message (populated in MessagesPanel, not in mapper)
  quotedMessage?: Message | null;
  // Group message sender info (from metadata, only for group conversations)
  senderName?: string | null;
  senderJid?: string | null;
  // Voice message transcription
  transcription?: string | null;
}

// Backend client structure
export interface BackendClient {
  id: string;
  phoneNumber: string;
  name: string;
  metadata: Record<string, unknown> | null;
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

// Product discount (per-client or general)
export interface ProductDiscount {
  id: string;
  discountPrice: number;
  clientId: string | null;
}

// Product from backend
export interface Product {
  id: string;
  userId: string;
  name: string;
  basePrice: number;
  discounts: ProductDiscount[];
}

// Client-specific discount (with product embedded)
export interface ClientDiscount {
  id: string;
  productId: string;
  discountPrice: number;
  product: Product;
}

// Promotion product entry
export interface PromotionProduct {
  product: { id: string; name: string };
}

// Promotion discount
export interface PromotionDiscount {
  id: string;
  discountPrice: number;
  clientId: string | null;
}

// Promotion from backend
export interface Promotion {
  id: string;
  name: string;
  specialPrice: number;
  promotionProducts: PromotionProduct[];
  promotionDiscounts: PromotionDiscount[];
}

// Client-specific promotion discount
export interface ClientPromotionDiscount {
  id: string;
  promotionId: string;
  discountPrice: number;
  promotion: Promotion;
}

// Analyzed sub-conversation from GET /api/conversations/:id
export interface AnalyzedConversation {
  id: string;
  summary: string | null;
  messageCount: number;
  createdAt: string;
}

// Backend conversation detail response
export interface BackendConversationDetail {
  conversation: {
    id: string;
    phoneId: string;
    isActive: boolean;
    mode: 'AI' | 'HITL';
    lastMessageAt: string;
    lastMessagePreview: string | null;
  };
  client: BackendClient | null;
  products: Product[];
  clientDiscounts: ClientDiscount[];
  promotions: Promotion[];
  clientPromotionDiscounts: ClientPromotionDiscount[];
  analyzedConversations: AnalyzedConversation[];
}

// Type mappers
export const mapBackendMessageType = (type: BackendMessageType): MessageType => {
  // Backend returns 'audio' but frontend uses 'voice'
  if (type === 'audio') return MessageType.Voice;
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

export const mapBackendMessage = (msg: BackendMessage): Message => {
  const meta = msg.metadata as { mediaLoading?: boolean; keyId?: string; quotedMessageId?: string; senderName?: string; senderJid?: string } | undefined;
  return {
    id: msg.id,
    conversationId: msg.conversationId,
    content: msg.content,
    mediaUrl: msg.mediaUrl,
    mediaLoading: meta?.mediaLoading ?? false,
    fileName: msg.fileName,
    fileSize: msg.fileSize,
    mimeType: msg.mimeType,
    type: mapBackendMessageType(msg.type),
    direction: mapBackendDirection(msg.direction),
    senderType: msg.senderType,
    status: mapBackendStatus(msg.status),
    timestamp: new Date(msg.createdAt).toISOString(),
    keyId: meta?.keyId ?? null,
    quotedKeyId: meta?.quotedMessageId ?? null,
    senderName: meta?.senderName ?? null,
    senderJid: meta?.senderJid ?? null,
    transcription: msg.transcription ?? null,
  };
};

export const mapBackendClient = (client: BackendClient): Client => ({
  id: client.id,
  phone: client.phoneNumber,
  name: client.name,
  lastContactAt: client.lastContactAt,
  createdAt: client.firstContactAt,
});
