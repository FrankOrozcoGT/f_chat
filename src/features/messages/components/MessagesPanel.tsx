// Messages panel component - center column with chat
// Header + Messages body + Input footer
// WebSocket integration for real-time updates

import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Bot, Hand, Info, AlertTriangle, Search, Loader2, ChevronDown, MoreVertical, X as XCircle } from 'lucide-react';
import { useConversationsStore } from '@/features/conversations/store';
import { useGetMessages } from '../api/useGetMessages';
import { useGetConversationDetail } from '../api/useGetConversationDetail';
import { messageKeys } from '../api/messageKeys';
import { useAnalyzeConversation } from '../api/useAnalyzeConversation';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { ClientInfo } from './ClientInfo';
import { ProductsPromotions } from './ProductsPromotions';
import { Avatar } from '@/shared/ui/Avatar';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { BottomSheet } from '@/shared/ui/BottomSheet';
import { useTakeControl } from '../api/useTakeControl';
import { useReturnToAi } from '../api/useReturnToAi';
import { useCloseConversation } from '../api/useCloseConversation';
import { useToast } from '@/shared/hooks/useToast';
import { socket } from '@/lib/websocket';
import type { MessageIncomingPayload, MessageSentPayload, CreditsExhaustedPayload, MediaReadyPayload } from '@/lib/websocket';
import type { Message } from '../types';
import { authKeys } from '@/features/auth/api/useGetMe';
import { usePhoneReconnectStore } from '@/features/phones/store';
import { PhoneDisconnectedModal } from '@/features/phones/components/PhoneDisconnectedModal';

interface MessagesPanelProps {
  conversationId: string;
  historicalConversationId?: string | null;
  onExitHistorical?: () => void;
}

export const MessagesPanel = ({ conversationId, historicalConversationId, onExitHistorical }: MessagesPanelProps) => {
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const isInitialLoad = useRef(true);
  const { setSelectedConversationId, selectedConversationType } = useConversationsStore();
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [quotedMessage, setQuotedMessage] = useState<Message | null>(null);
  const { showToast } = useToast();
  const { showModal: showDisconnectedModal, closeModal: closeDisconnectedModal } = usePhoneReconnectStore();
  const { mutate: analyze, isPending: isAnalyzing } = useAnalyzeConversation();

  const handleAnalyze = () => {
    analyze(conversationId, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: messageKeys.detail(conversationId) });
      },
      onError: (error: any) => {
        const msg = error?.response?.data?.message || 'Error al analizar la conversación';
        showToast(msg, 'error');
      },
    });
  };

  // Fetch messages and conversation detail (includes client data)
  const { data: messages = [], isLoading: isLoadingMessages } = useGetMessages(conversationId);
  const { data: conversationDetail } = useGetConversationDetail(conversationId);

  // Historical conversation messages (when viewing a sub-conversation)
  const isViewingHistorical = !!historicalConversationId;
  const { data: historicalMessages = [], isLoading: isLoadingHistorical } = useGetMessages(
    historicalConversationId || ''
  );

  // Choose which messages to display
  const displayMessages = isViewingHistorical ? historicalMessages : messages;
  const isLoadingDisplay = isViewingHistorical ? isLoadingHistorical : isLoadingMessages;

  const client = conversationDetail?.client;
  const conversationMode = conversationDetail?.conversation?.mode;
  const isGroup = selectedConversationType === 'group';

  // HITL mutation hooks
  const takeControl = useTakeControl({
    onError: (error) => {
      const msg = (error as any)?.response?.data?.message || 'Error al tomar control';
      showToast(msg, 'error');
    },
  });
  const returnToAi = useReturnToAi({
    onError: (error) => {
      const msg = (error as any)?.response?.data?.message || 'Error al devolver a IA';
      showToast(msg, 'error');
    },
  });
  const closeConversation = useCloseConversation({
    onSuccess: (data) => {
      setIsMenuOpen(false);
      const msg = data.movedMessages > 0
        ? `Conversación cerrada. ${data.movedMessages} mensajes archivados.`
        : 'Conversación cerrada.';
      showToast(msg, 'success');
    },
    onError: (error) => {
      const msg = (error as any)?.response?.data?.message || 'Error al cerrar la conversación';
      showToast(msg, 'error');
    },
  });

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const isNearBottom = () => {
    const el = scrollContainerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 200;
  };

  // Auto-scroll to bottom when messages change (always on initial load, then only if near bottom)
  useEffect(() => {
    if (displayMessages.length === 0) return;
    if (isInitialLoad.current) {
      scrollToBottom('instant');
      isInitialLoad.current = false;
    } else if (isNearBottom()) {
      scrollToBottom();
    }
  }, [displayMessages]);

  // Reset initial load flag when conversation changes
  useEffect(() => {
    isInitialLoad.current = true;
  }, [conversationId, historicalConversationId]);

  // Track scroll position to show/hide the scroll-to-bottom button
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const handleScroll = () => {
      setShowScrollButton(!isNearBottom());
    };
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  // Re-scroll when images load and expand the container (if near bottom)
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      if (isNearBottom()) scrollToBottom('instant');
    });
    // Observe all images inside the container
    const images = el.querySelectorAll('img');
    images.forEach((img) => observer.observe(img));
    return () => observer.disconnect();
  }, [displayMessages]);

  // WebSocket integration for real-time message updates
  useEffect(() => {
    // message:incoming — mensaje entrante del cliente WhatsApp (broadcast)
    const handleMessageIncoming = (data: MessageIncomingPayload) => {
      if (data.conversationId === conversationId) {
        queryClient.invalidateQueries({ queryKey: messageKeys.list(conversationId) });
      }
    };

    // message:new — mensaje enviado desde el backend/bot (broadcast)
    const handleMessageNew = (data: { conversationId: string }) => {
      if (data.conversationId === conversationId) {
        queryClient.invalidateQueries({ queryKey: messageKeys.list(conversationId) });
      }
    };

    // message:sent — mensaje enviado desde WhatsApp Web, no desde el sistema (broadcast)
    const handleMessageSent = (data: MessageSentPayload) => {
      if (data.conversationId === conversationId) {
        queryClient.invalidateQueries({ queryKey: messageKeys.list(conversationId) });
      }
    };

    const handleMessageStatusUpdated = (data: { messageId: string; conversationId: string; status: string }) => {
      // Only update if message belongs to current conversation
      if (data.conversationId === conversationId) {
        // Update message status in cache
        queryClient.setQueryData<Message[]>(
          messageKeys.list(conversationId),
          (oldMessages = []) => {
            return oldMessages.map((msg) =>
              msg.id === data.messageId
                ? { ...msg, status: data.status as Message['status'] }
                : msg
            );
          }
        );
      }
    };

    const handleMessageError = (data: { conversationId: string; error: string; tempId?: string }) => {
      // Only handle if error belongs to current conversation
      if (data.conversationId === conversationId) {
        // Show error toast
        showToast(data.error || 'Error al enviar el mensaje', 'error');

        // If we have a tempId, mark that message as failed
        if (data.tempId) {
          queryClient.setQueryData<Message[]>(
            messageKeys.list(conversationId),
            (oldMessages = []) => {
              return oldMessages.map((msg) =>
                msg.id === data.tempId
                  ? { ...msg, status: 'failed' as Message['status'] }
                  : msg
              );
            }
          );
        }
      }
    };

    // conversation:hitl — cliente solicita hablar con humano, refetch detail para actualizar mode
    const handleHitl = (data: { conversationId: string }) => {
      if (data.conversationId === conversationId) {
        queryClient.invalidateQueries({ queryKey: messageKeys.detail(conversationId) });
      }
    };

    // conversation:taken — agente toma la conversación
    const handleTaken = (data: { conversationId: string }) => {
      if (data.conversationId === conversationId) {
        queryClient.invalidateQueries({ queryKey: messageKeys.detail(conversationId) });
      }
    };

    // conversation:returned — conversación devuelta a IA
    const handleReturned = (data: { conversationId: string }) => {
      if (data.conversationId === conversationId) {
        queryClient.invalidateQueries({ queryKey: messageKeys.detail(conversationId) });
      }
    };

    // message:media_ready — media procesada, actualizar mediaUrl del mensaje en cache
    const handleMediaReady = (data: MediaReadyPayload) => {
      if (data.conversationId === conversationId) {
        queryClient.setQueryData<Message[]>(
          messageKeys.list(conversationId),
          (oldMessages = []) =>
            oldMessages.map((msg) =>
              msg.keyId === data.keyId
                ? { ...msg, mediaUrl: data.mediaUrl, mediaLoading: false }
                : msg
            )
        );
      }
    };

    // credits:exhausted — créditos agotados, conversación movida a HITL
    const handleCreditsExhausted = (data: CreditsExhaustedPayload) => {
      if (data.conversationId === conversationId) {
        // Show toast notification
        const usedFormatted = data.creditsUsed.toFixed(2);
        const limitFormatted = data.creditsLimit.toFixed(0);
        showToast(
          `⚠️ Créditos agotados. Usado: ${usedFormatted} / ${limitFormatted}. La conversación se movió a modo manual (HITL).`,
          'error'
        );

        // Refresh conversation detail to update mode to HITL
        queryClient.invalidateQueries({ queryKey: messageKeys.detail(conversationId) });

        // Refresh user data to update creditsUsed
        queryClient.invalidateQueries({ queryKey: authKeys.me() });
      }
    };

    socket.on('message:media_ready', handleMediaReady);
    socket.on('message:incoming', handleMessageIncoming);
    socket.on('message:new', handleMessageNew);
    socket.on('message:sent', handleMessageSent);
    socket.on('message:status_updated', handleMessageStatusUpdated);
    socket.on('message:error', handleMessageError);
    socket.on('conversation:hitl', handleHitl);
    socket.on('conversation:taken', handleTaken);
    socket.on('conversation:returned', handleReturned);
    socket.on('credits:exhausted', handleCreditsExhausted);

    return () => {
      socket.off('message:media_ready', handleMediaReady);
      socket.off('message:incoming', handleMessageIncoming);
      socket.off('message:new', handleMessageNew);
      socket.off('message:sent', handleMessageSent);
      socket.off('message:status_updated', handleMessageStatusUpdated);
      socket.off('message:error', handleMessageError);
      socket.off('conversation:hitl', handleHitl);
      socket.off('conversation:taken', handleTaken);
      socket.off('conversation:returned', handleReturned);
      socket.off('credits:exhausted', handleCreditsExhausted);
    };
  }, [conversationId, queryClient, showToast]);

  // Back button handler (mobile)
  const handleBack = () => {
    setSelectedConversationId(null);
  };

  // Reply handler
  const handleReply = (message: Message) => {
    setQuotedMessage(message);
  };

  // Scroll to quoted message handler
  const handleScrollToMessage = (messageId: string) => {
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Brief highlight flash
      el.classList.add('opacity-60');
      setTimeout(() => el.classList.remove('opacity-60'), 600);
    }
  };

  // Get initials for avatar fallback
  const initials = client?.name
    ? client.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  return (
    <div className="flex-1 min-w-0 flex flex-col h-full bg-bg-primary">
      {/* Header */}
      <header className="flex items-center gap-3 p-4 border-b border-border-primary bg-bg-secondary shrink-0">
        {/* Back button (mobile + medium screens when conversations list is hidden) */}
        <button
          onClick={handleBack}
          className="xl:hidden min-h-11 min-w-11 flex items-center justify-center rounded-lg hover:bg-bg-tertiary transition-colors"
          aria-label="Volver a lista"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Avatar */}
        <Avatar
          alt={client?.name}
          initials={initials}
          size="md"
        />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-base text-text-primary truncate">
            {client?.name || 'Cargando...'}
          </h2>
          <p className="text-xs text-text-secondary truncate">
            {client?.phone || ''}
          </p>
        </div>

        {/* HITL action button */}
        {conversationMode === 'AI' ? (
          <Button
            variant="primary"
            size="sm"
            isLoading={takeControl.isPending}
            onClick={() => takeControl.mutate({ conversationId })}
          >
            <Hand className="w-4 h-4" />
            <span className="hidden sm:inline">Tomar Control</span>
          </Button>
        ) : conversationMode === 'HITL' ? (
          <Button
            variant="secondary"
            size="sm"
            isLoading={returnToAi.isPending}
            onClick={() => returnToAi.mutate({ conversationId })}
          >
            <Bot className="w-4 h-4" />
            <span className="hidden sm:inline">Devolver a IA</span>
          </Button>
        ) : null}

        {/* Status badge (based on conversation isActive) */}
        {conversationDetail?.conversation && (
          <Badge
            variant={conversationDetail.conversation.isActive ? 'success' : 'default'}
            size="sm"
          >
            {conversationDetail.conversation.isActive ? 'Activa' : 'Cerrada'}
          </Badge>
        )}

        {/* Info button (mobile only) - opens bottom sheet */}
        <button
          onClick={() => setIsBottomSheetOpen(true)}
          className="lg:hidden min-h-11 min-w-11 flex items-center justify-center rounded-lg bg-accent-blue/10 hover:bg-accent-blue/20 transition-colors"
          aria-label="Ver información del cliente"
        >
          <Info className="w-5 h-5 text-accent-blue" />
        </button>

        {/* Kebab menu */}
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen((v) => !v)}
            className="min-h-11 min-w-11 flex items-center justify-center rounded-lg hover:bg-bg-tertiary transition-colors"
            aria-label="Más opciones"
          >
            <MoreVertical className="w-5 h-5 text-text-secondary" />
          </button>

          {isMenuOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsMenuOpen(false)}
              />
              {/* Dropdown */}
              <div className="absolute right-0 top-full mt-1 w-52 bg-bg-secondary border border-border-primary rounded-lg shadow-lg z-20 py-1">
                <button
                  onClick={() => closeConversation.mutate(conversationId)}
                  disabled={closeConversation.isPending}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-text-primary hover:bg-bg-tertiary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <XCircle className="w-4 h-4 text-accent-red" />
                  {closeConversation.isPending ? 'Cerrando...' : 'Cerrar Conversación'}
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Historical conversation warning banner */}
      {isViewingHistorical && (
        <div className="flex items-center gap-2 px-4 py-2 bg-accent-orange/10 border-b border-accent-orange/30 shrink-0">
          <button
            onClick={onExitHistorical}
            className="min-h-11 min-w-11 flex items-center justify-center rounded-lg hover:bg-accent-orange/20 transition-colors"
            aria-label="Volver a conversación actual"
          >
            <ArrowLeft className="w-5 h-5 text-accent-orange" />
          </button>
          <AlertTriangle className="w-4 h-4 text-accent-orange shrink-0" />
          <span className="text-sm text-accent-orange font-medium">
            Conversación antigua — los mensajes no se pueden enviar aquí
          </span>
        </div>
      )}

      {/* Messages body */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 relative">
        {isLoadingDisplay && displayMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-border-primary border-t-accent-blue rounded-full animate-spin" />
              <p className="text-sm text-text-secondary">Cargando mensajes...</p>
            </div>
          </div>
        ) : displayMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-text-secondary">No hay mensajes aún</p>
          </div>
        ) : (
          <>
            {displayMessages.map((message) => {
              // Resolve quoted message from local list by DB id
              const quotedMessage = message.quotedKeyId
                ? displayMessages.find((m) => m.keyId === message.quotedKeyId) ?? null
                : null;
              return (
                <MessageBubble
                  key={message.id}
                  message={{ ...message, quotedMessage }}
                  clientName={client?.name}
                  isGroup={isGroup}
                  onReply={isViewingHistorical ? undefined : handleReply}
                  onScrollToMessage={handleScrollToMessage}
                />
              );
            })}
            {/* Auto-scroll anchor */}
            <div ref={messagesEndRef} />
          </>
        )}

        {/* Scroll-to-bottom button */}
        {showScrollButton && (
          <button
            onClick={() => scrollToBottom()}
            className="sticky bottom-4 left-full -translate-x-12 w-9 h-9 flex items-center justify-center rounded-full bg-bg-secondary border border-border-primary shadow-lg hover:bg-bg-tertiary transition-colors z-10"
            aria-label="Ir al final"
          >
            <ChevronDown size={18} className="text-text-primary" />
          </button>
        )}
      </div>

      {/* Footer with input (hidden when viewing historical) */}
      {!isViewingHistorical && (
        <MessageInput
          conversationId={conversationId}
          disabled={conversationMode === 'AI'}
          quotedMessage={quotedMessage}
          onCancelQuote={() => setQuotedMessage(null)}
        />
      )}

      {/* Bottom Sheet for mobile - shows client info + conversation summary */}
      <BottomSheet
        isOpen={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
        title="Información del Cliente"
      >
        {client && conversationDetail && (
          <div className="space-y-4">
            <ClientInfo client={client} />
            <ProductsPromotions
              products={conversationDetail.products}
              promotions={conversationDetail.promotions}
              clientDiscounts={conversationDetail.clientDiscounts}
              clientPromotionDiscounts={conversationDetail.clientPromotionDiscounts}
            />
            {!isGroup && (
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-accent-blue text-white text-sm font-medium hover:bg-accent-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analizando...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Analizar Conversación
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </BottomSheet>

      {/* Phone disconnected modal (triggered by 503 on send) */}
      <PhoneDisconnectedModal
        isOpen={showDisconnectedModal}
        onClose={closeDisconnectedModal}
      />
    </div>
  );
};
