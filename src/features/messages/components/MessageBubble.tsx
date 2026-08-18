// Message bubble component with support for text, voice, and image
// Different styles for incoming (client) vs outgoing (agent) messages

import { useState } from 'react';
import { Check, CheckCheck, Clock, XCircle, Bot, Cog, User, Reply } from 'lucide-react';
import { Avatar } from '@/shared/ui/Avatar';
import { ImageModal } from '@/shared/ui/ImageModal';
import type { Message } from '../types';
import { cn } from '@/shared/lib/utils';
import { formatRelativeTime } from '@/shared/lib/date';

interface MessageBubbleProps {
  message: Message;
  clientName?: string;
  isGroup?: boolean;
  onReply?: (message: Message) => void;
  onScrollToMessage?: (messageId: string) => void;
}

export const MessageBubble = ({ message, clientName, isGroup, onReply, onScrollToMessage }: MessageBubbleProps) => {
  const isIncoming = message.direction === 'incoming';
  const isBot = message.senderType === 'bot';
  const isSystem = message.senderType === 'system';
  const [showImageModal, setShowImageModal] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Format timestamp
  const formattedTime = formatRelativeTime(message.timestamp);

  // Get initials for avatar fallback
  const initials = clientName
    ? clientName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  // Consistent color per group participant (based on senderJid, same palette as ConversationItem)
  const SENDER_COLORS = ['#FF6B6B', '#4CAF50', '#42A5F5', '#EC407A', '#26A69A', '#EF5350', '#5C6BC0', '#FF8E53', '#AB47BC', '#26C6DA', '#7E57C2', '#FFC107'];
  let senderHash = 0;
  const senderKey = message.senderJid ?? message.senderName ?? '';
  for (let i = 0; i < senderKey.length; i++) {
    senderHash = senderKey.charCodeAt(i) + ((senderHash << 5) - senderHash);
    senderHash = senderHash & senderHash;
  }
  const gradientFrom = SENDER_COLORS[Math.abs(senderHash) % SENDER_COLORS.length];

  // Status icon for outgoing messages
  const StatusIcon = () => {
    if (!isIncoming) {
      switch (message.status) {
        case 'pending':
          return <Clock className="w-3 h-3 text-text-tertiary" />;
        case 'sent':
          return <Check className="w-3 h-3 text-text-tertiary" />;
        case 'delivered':
          return <CheckCheck className="w-3 h-3 text-text-tertiary" />;
        case 'read':
          return <CheckCheck className="w-3 h-3 text-accent-blue" />;
        case 'failed':
          return <XCircle className="w-3 h-3 text-accent-red" />;
        default:
          return null;
      }
    }
    return null;
  };

  return (
    <div
      id={`msg-${message.id}`}
      className={cn(
        'flex gap-2 items-end group',
        isIncoming ? 'justify-start' : 'justify-end'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Avatar for incoming messages */}
      {isIncoming && (
        isBot ? (
          <div className="w-8 h-8 rounded-full bg-accent-purple/20 flex items-center justify-center shrink-0">
            <Bot className="w-4 h-4 text-accent-purple" />
          </div>
        ) : isSystem ? (
          <div className="w-8 h-8 rounded-full bg-accent-orange/20 flex items-center justify-center shrink-0">
            <Cog className="w-4 h-4 text-accent-orange" />
          </div>
        ) : isGroup && message.senderName ? (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs shrink-0"
            style={{ background: gradientFrom }}
          >
            {message.senderName.replace(/^~/, '').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
        ) : (
          <Avatar
            alt={clientName}
            initials={initials}
            size="sm"
            className="shrink-0"
          />
        )
      )}

      {/* Reply button - visible on hover (incoming: left side, outgoing: right side) */}
      {onReply && isIncoming && (
        <button
          onClick={() => onReply(message)}
          className={cn(
            'shrink-0 w-8 h-8 flex items-center justify-center rounded-full',
            'bg-bg-secondary border border-border-primary text-text-secondary',
            'hover:bg-bg-tertiary hover:text-text-primary transition-all',
            isHovered ? 'opacity-100' : 'opacity-0'
          )}
          title="Responder"
        >
          <Reply className="w-4 h-4" />
        </button>
      )}

      <div
        className={cn(
          'flex flex-col gap-1 max-w-[70%]',
          isIncoming ? 'items-start' : 'items-end'
        )}
      >
        {/* Message content bubble */}
        <div
          className={cn(
            'px-3 py-2 rounded-2xl wrap-break-word',
            isIncoming
              ? isBot
                ? 'bg-accent-purple/10 text-text-primary rounded-bl-sm border border-accent-purple/30'
                : isSystem
                ? 'bg-accent-orange/10 text-text-primary rounded-bl-sm border border-accent-orange/30'
                : 'bg-bg-secondary text-text-primary rounded-bl-sm'
              : isBot
              ? 'bg-accent-purple text-white rounded-br-sm'
              : isSystem
              ? 'bg-accent-orange text-white rounded-br-sm'
              : message.status === 'pending'
              ? 'bg-bg-tertiary text-text-secondary rounded-br-sm opacity-70'
              : message.status === 'failed'
              ? 'bg-toast-error-bg text-accent-red rounded-br-sm border border-accent-red'
              : 'bg-accent-blue text-white rounded-br-sm'
          )}
        >
          {/* Group sender name (WhatsApp style: shown above message content, only for incoming group messages) */}
          {isGroup && isIncoming && !isBot && !isSystem && message.senderName && (
            <p className="text-xs font-semibold mb-1" style={{ color: gradientFrom }}>
              {message.senderName.replace(/^~/, '')}
            </p>
          )}

          {/* Quoted message preview (cited bubble) */}
          {message.quotedMessage && (() => {
            const q = message.quotedMessage;
            const qAuthor = q.direction === 'incoming' ? clientName || 'Cliente' : 'Tú';
            const qIsMedia = q.type !== 'text';
            const qPreviewText = q.type === 'voice'
              ? '🎤 Audio'
              : q.type === 'video'
              ? '🎥 Video'
              : q.type === 'document'
              ? `📄 ${q.fileName || 'Documento'}`
              : q.content || '';
            return (
              <button
                type="button"
                onClick={() => onScrollToMessage?.(q.id)}
                className={cn(
                  'mb-2 w-full text-left rounded-lg overflow-hidden border-l-4 flex items-stretch gap-0',
                  'transition-opacity hover:opacity-80',
                  onScrollToMessage ? 'cursor-pointer' : 'cursor-default',
                  isIncoming
                    ? 'bg-black/10 border-text-secondary/60'
                    : 'bg-white/15 border-white/60'
                )}
              >
                {/* Image thumbnail if quoted is image */}
                {q.type === 'image' && q.mediaUrl && (
                  <img
                    src={q.mediaUrl}
                    alt=""
                    className="w-12 h-12 object-cover shrink-0"
                  />
                )}

                <div className="px-2 py-1.5 min-w-0 flex-1">
                  <p className={cn(
                    'text-xs font-semibold truncate mb-0.5',
                    isIncoming ? 'text-text-primary' : 'text-white'
                  )}>
                    {qAuthor}
                  </p>
                  <p className={cn(
                    'text-xs truncate',
                    isIncoming ? 'text-text-secondary' : 'text-white/80'
                  )}>
                    {qIsMedia && q.type !== 'document' && !qPreviewText
                      ? q.type === 'image' ? '📷 Imagen' : qPreviewText
                      : qPreviewText || '📎 Archivo'}
                  </p>
                </div>
              </button>
            );
          })()}

          {/* Text message */}
          {message.type === 'text' && (
            <p className="text-sm md:text-base whitespace-pre-wrap">{message.content}</p>
          )}

          {/* Media loading skeleton */}
          {message.mediaLoading && !message.mediaUrl && (
            <div className="flex items-center gap-2 min-w-40">
              <div className="w-8 h-8 rounded-full bg-current opacity-20 animate-pulse shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-2 rounded bg-current opacity-20 animate-pulse" />
                <div className="h-2 rounded bg-current opacity-20 animate-pulse w-3/4" />
              </div>
            </div>
          )}

          {/* Voice message */}
          {message.type === 'voice' && message.mediaUrl && (
            <div className="flex flex-col gap-2 min-w-62.5">
              {message.fileName && (
                <p className="text-xs text-current opacity-80">{message.fileName}</p>
              )}
              <audio
                src={message.mediaUrl}
                controls
                className="w-full"
                style={{ height: '40px' }}
              />
            </div>
          )}

          {/* Image message */}
          {message.type === 'image' && message.mediaUrl && (
            <>
              <div className="space-y-2">
                <img
                  src={message.mediaUrl}
                  alt="Imagen"
                  className="rounded-lg w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setShowImageModal(true)}
                />
                {message.content && (
                  <p className="text-sm md:text-base whitespace-pre-wrap">{message.content}</p>
                )}
              </div>

              {/* Image modal */}
              {showImageModal && (
                <ImageModal
                  src={message.mediaUrl}
                  alt={message.content || 'Imagen'}
                  onClose={() => setShowImageModal(false)}
                />
              )}
            </>
          )}

          {/* Video message */}
          {message.type === 'video' && message.mediaUrl && (
            <div className="space-y-2">
              <video
                src={message.mediaUrl}
                controls
                className="rounded-lg w-full h-auto"
              />
              {message.content && (
                <p className="text-sm md:text-base whitespace-pre-wrap">{message.content}</p>
              )}
            </div>
          )}

          {/* Document */}
          {message.type === 'document' && message.mediaUrl && (
            <div className="space-y-2">
              {message.content && (
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              )}
              <a
                href={message.mediaUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm underline hover:no-underline inline-flex items-center gap-1"
              >
                📄 {message.fileName || 'Documento'}
              </a>
            </div>
          )}
        </div>

        {/* Timestamp + Status */}
        <div className="flex items-center gap-1 px-2">
          <span className="text-xs text-text-secondary">{formattedTime}</span>
          <StatusIcon />
        </div>
      </div>

      {/* Reply button - for outgoing messages (right side) */}
      {onReply && !isIncoming && (
        <button
          onClick={() => onReply(message)}
          className={cn(
            'shrink-0 w-8 h-8 flex items-center justify-center rounded-full',
            'bg-bg-secondary border border-border-primary text-text-secondary',
            'hover:bg-bg-tertiary hover:text-text-primary transition-all',
            isHovered ? 'opacity-100' : 'opacity-0'
          )}
          title="Responder"
        >
          <Reply className="w-4 h-4" />
        </button>
      )}

      {/* Avatar for outgoing messages */}
      {!isIncoming && (
        isBot ? (
          <div className="w-8 h-8 rounded-full bg-accent-purple/20 flex items-center justify-center shrink-0">
            <Bot className="w-4 h-4 text-accent-purple" />
          </div>
        ) : isSystem ? (
          <div className="w-8 h-8 rounded-full bg-accent-orange/20 flex items-center justify-center shrink-0">
            <Cog className="w-4 h-4 text-accent-orange" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-accent-blue/20 flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-accent-blue" />
          </div>
        )
      )}
    </div>
  );
};
