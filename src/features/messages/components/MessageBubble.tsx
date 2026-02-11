// Message bubble component with support for text, voice, and image
// Different styles for incoming (client) vs outgoing (agent) messages

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Check, CheckCheck, Clock, XCircle } from 'lucide-react';
import { Avatar } from '@/shared/ui/Avatar';
import { ImageModal } from '@/shared/ui/ImageModal';
import type { Message } from '../types';
import { cn } from '@/shared/lib/utils';

interface MessageBubbleProps {
  message: Message;
  clientName?: string;
}

export const MessageBubble = ({ message, clientName }: MessageBubbleProps) => {
  const isIncoming = message.direction === 'incoming';
  const [showImageModal, setShowImageModal] = useState(false);

  // Format timestamp
  const formattedTime = formatDistanceToNow(new Date(message.timestamp), {
    addSuffix: true,
    locale: es,
  });

  // Get initials for avatar fallback
  const initials = clientName
    ? clientName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

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
      className={cn(
        'flex gap-2 items-end',
        isIncoming ? 'justify-start' : 'justify-end'
      )}
    >
      {/* Avatar for incoming messages */}
      {isIncoming && (
        <Avatar
          alt={clientName}
          initials={initials}
          size="sm"
          className="shrink-0"
        />
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
            'px-3 py-2 rounded-2xl break-words',
            isIncoming
              ? 'bg-bg-secondary text-text-primary rounded-bl-sm'
              : message.status === 'pending'
              ? 'bg-bg-tertiary text-text-secondary rounded-br-sm opacity-70'
              : message.status === 'failed'
              ? 'bg-toast-error-bg text-accent-red rounded-br-sm border border-accent-red'
              : 'bg-accent-blue text-white rounded-br-sm'
          )}
        >
          {/* Text message */}
          {message.type === 'text' && (
            <p className="text-sm md:text-base whitespace-pre-wrap">{message.content}</p>
          )}

          {/* Voice message */}
          {message.type === 'voice' && message.mediaUrl && (
            <div className="flex flex-col gap-2 min-w-62.5">
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
                  className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
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
                className="rounded-lg max-w-full h-auto"
              />
              {message.content && (
                <p className="text-sm md:text-base whitespace-pre-wrap">{message.content}</p>
              )}
            </div>
          )}

          {/* Document */}
          {message.type === 'document' && message.mediaUrl && (
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {message.content || 'Documento'}
              </p>
              <a
                href={message.mediaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs underline hover:no-underline"
              >
                Descargar
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
    </div>
  );
};
