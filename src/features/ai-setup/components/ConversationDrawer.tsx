import { useState } from 'react';
import { X, User, Bot, Shield, Loader2, Users } from 'lucide-react';
import { useGetConversationMessages } from '../api/useGetConversationMessages';
import { useMarkInternal } from '../api/useMarkInternal';
import type { FlowAnalysisParticipant } from '../api/useGetFlowAnalyses';

interface Props {
  conversationId: string;
  title: string;
  subtitle?: string;
  groupJid?: string | null;
  participants?: FlowAnalysisParticipant[];
  isInternal?: boolean;
  onClose: () => void;
}

export const ConversationDrawer = ({ conversationId, title, subtitle, groupJid, participants, isInternal, onClose }: Props) => {
  const { data: messages, isLoading } = useGetConversationMessages(conversationId);
  const markInternal = useMarkInternal();
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [channelName, setChannelName] = useState('');
  const [internalPurpose, setInternalPurpose] = useState('');

  const isGroup = !!groupJid;

  const handleMarkInternal = () => {
    if (!channelName.trim() || !internalPurpose.trim()) return;

    if (isGroup) {
      markInternal.mutate({
        type: 'group',
        groupJid: groupJid!,
        channelName: channelName.trim(),
        internalPurpose: internalPurpose.trim(),
      }, { onSuccess: () => { setShowMarkModal(false); setChannelName(''); setInternalPurpose(''); } });
    } else if (participants?.[0]) {
      markInternal.mutate({
        type: 'client',
        clientId: participants[0].clientId,
        channelName: channelName.trim(),
        internalPurpose: internalPurpose.trim(),
      }, { onSuccess: () => { setShowMarkModal(false); setChannelName(''); setInternalPurpose(''); } });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-bg-secondary border-l border-border-primary flex flex-col h-full shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-border-primary shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-text-primary truncate">{title}</p>
              {isInternal && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border bg-accent-yellow/15 text-accent-yellow border-accent-yellow/30">Interno</span>
              )}
              {isGroup && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border bg-accent-blue/15 text-accent-blue border-accent-blue/30">Grupo</span>
              )}
            </div>
            {subtitle && (
              <p className="text-[11px] text-text-tertiary mt-0.5 line-clamp-2">{subtitle}</p>
            )}
            {participants && participants.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {participants.map((p) => (
                  <span key={p.clientId} className="text-[10px] text-text-tertiary">
                    {p.name} ({p.phoneNumber})
                  </span>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-3 shrink-0 p-1.5 rounded-md hover:bg-bg-tertiary transition-colors"
          >
            <X size={16} className="text-text-secondary" />
          </button>
        </div>

        {/* Mark as internal button */}
        {!isInternal && (participants?.length ?? 0) > 0 && (
          <button
            onClick={() => setShowMarkModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 border-b border-border-primary text-xs text-accent-yellow hover:bg-accent-yellow/5 transition-colors"
          >
            <Shield size={13} />
            <span>
              {isGroup
                ? 'Este grupo parece ser interno — marcar como canal interno'
                : `${participants![0].name} parece ser interno — marcar como canal interno`}
            </span>
          </button>
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
                    {isGroup ? <Users size={11} className="text-text-tertiary" /> : <User size={12} className="text-text-tertiary" />}
                  </div>
                )}
                <div className={`max-w-[75%] px-3 py-2 rounded-lg text-sm leading-snug ${
                  isIncoming
                    ? 'bg-bg-tertiary text-text-primary rounded-tl-none'
                    : 'bg-accent-blue/20 text-text-primary rounded-tr-none'
                }`}>
                  {isGroup && isIncoming && msg.senderName && (
                    <p className="text-[10px] text-accent-blue font-medium mb-0.5">{msg.senderName}</p>
                  )}
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

      {/* Mark as internal modal */}
      {showMarkModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40" onClick={() => setShowMarkModal(false)}>
          <div className="bg-bg-secondary border border-border-primary rounded-lg shadow-xl p-4 w-80" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-semibold text-text-primary mb-1">Marcar como canal interno</p>
            <p className="text-[11px] text-text-tertiary mb-3">
              {isGroup
                ? `Grupo: ${groupJid}`
                : `Contacto: ${participants?.[0]?.name} (${participants?.[0]?.phoneNumber})`}
            </p>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-text-tertiary mb-1 block">Nombre del canal</label>
                <input
                  autoFocus
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  placeholder="ej: vendedor_luis"
                  className="w-full px-3 py-2 bg-bg-primary border border-border-primary rounded-md text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-blue"
                />
              </div>
              <div>
                <label className="text-xs text-text-tertiary mb-1 block">Propósito</label>
                <input
                  value={internalPurpose}
                  onChange={(e) => setInternalPurpose(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleMarkInternal()}
                  placeholder="ej: Vendedor de campo, consulta precios"
                  className="w-full px-3 py-2 bg-bg-primary border border-border-primary rounded-md text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-blue"
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setShowMarkModal(false)}
                  className="px-3 py-1.5 text-xs text-text-secondary border border-border-primary rounded hover:bg-bg-tertiary"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleMarkInternal}
                  disabled={markInternal.isPending || !channelName.trim() || !internalPurpose.trim()}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs bg-accent-yellow text-black rounded font-medium hover:opacity-90 disabled:opacity-50"
                >
                  {markInternal.isPending ? <Loader2 size={12} className="animate-spin" /> : <Shield size={12} />}
                  Marcar como interno
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
