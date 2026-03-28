import { X, User, Bot } from 'lucide-react';
import { useGetConversationMessages } from '../api/useGetConversationMessages';

interface Props {
  conversationId: string;
  title: string;
  subtitle?: string;
  onClose: () => void;
}

export const ConversationDrawer = ({ conversationId, title, subtitle, onClose }: Props) => {
  const { data: messages, isLoading } = useGetConversationMessages(conversationId);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-bg-secondary border-l border-border-primary flex flex-col h-full shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-border-primary shrink-0">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-primary truncate">{title}</p>
            {subtitle && (
              <p className="text-[11px] text-text-tertiary font-mono mt-0.5 truncate">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-3 shrink-0 p-1.5 rounded-md hover:bg-bg-tertiary transition-colors"
          >
            <X size={16} className="text-text-secondary" />
          </button>
        </div>

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
                  {msg.content || (msg.type !== 'text' ? `[${msg.type}]` : '')}
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
