import { useState } from 'react';
import { X, User, Bot, ChevronLeft, ChevronRight } from 'lucide-react';
import { useGetConversationMessages } from '../api/useGetConversationMessages';
import type { InternalReview } from '../api/useGetInternals';

interface Props {
  internal: InternalReview;
  onClose: () => void;
}

export const InternalConversationDrawer = ({ internal, onClose }: Props) => {
  const [convIndex, setConvIndex] = useState(0);
  const conversationId = internal.conversationIds[convIndex];
  const { data: messages, isLoading } = useGetConversationMessages(conversationId);

  const label = internal.groupJid
    ? `Grupo: ${internal.groupJid}`
    : internal.clientId
    ? `Cliente: ${internal.clientId}`
    : 'Sin identificador';

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-bg-secondary border-l border-border-primary flex flex-col h-full shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-border-primary shrink-0">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-primary truncate">
              {internal.internalPurpose}
            </p>
            <p className="text-[11px] text-text-tertiary font-mono mt-0.5 truncate">{label}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-3 shrink-0 p-1.5 rounded-md hover:bg-bg-tertiary transition-colors"
          >
            <X size={16} className="text-text-secondary" />
          </button>
        </div>

        {/* Conversation selector */}
        {internal.conversationIds.length > 1 && (
          <div className="flex items-center justify-between px-4 py-2 border-b border-border-primary shrink-0 bg-bg-primary">
            <button
              onClick={() => setConvIndex((i) => Math.max(0, i - 1))}
              disabled={convIndex === 0}
              className="p-1 rounded hover:bg-bg-tertiary disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={16} className="text-text-secondary" />
            </button>
            <span className="text-xs text-text-tertiary font-mono truncate mx-2">
              {convIndex + 1} / {internal.conversationIds.length} · {conversationId}
            </span>
            <button
              onClick={() => setConvIndex((i) => Math.min(internal.conversationIds.length - 1, i + 1))}
              disabled={convIndex === internal.conversationIds.length - 1}
              className="p-1 rounded hover:bg-bg-tertiary disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={16} className="text-text-secondary" />
            </button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          {isLoading && (
            <p className="text-center text-sm text-text-tertiary mt-8">Cargando mensajes...</p>
          )}
          {!isLoading && (!messages || messages.length === 0) && (
            <p className="text-center text-sm text-text-tertiary mt-8">Sin mensajes</p>
          )}
          {messages?.map((msg) => {
            const isIncoming = msg.direction === 'incoming';
            return (
              <div key={msg.id} className={`flex gap-2 ${isIncoming ? 'justify-start' : 'justify-end'}`}>
                {isIncoming && (
                  <div className="shrink-0 w-6 h-6 rounded-full bg-bg-tertiary flex items-center justify-center mt-0.5">
                    <User size={12} className="text-text-tertiary" />
                  </div>
                )}
                <div className={`max-w-[75%] px-3 py-2 rounded-lg text-sm leading-snug ${
                  isIncoming
                    ? 'bg-bg-tertiary text-text-primary rounded-tl-none'
                    : 'bg-accent-blue/20 text-text-primary rounded-tr-none'
                }`}>
                  {msg.content || msg.transcription || (msg.type !== 'text' ? `[${msg.type}]` : '')}
                  {msg.type === 'voice' && msg.transcription && !msg.content && (
                    <span className="text-[10px] text-text-tertiary italic block mt-0.5">🎤 transcripción</span>
                  )}
                  <p className="text-[10px] text-text-tertiary mt-1 text-right">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {!isIncoming && (
                  <div className="shrink-0 w-6 h-6 rounded-full bg-accent-blue/20 flex items-center justify-center mt-0.5">
                    <Bot size={12} className="text-accent-blue" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
