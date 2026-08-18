// Messages panel component - center column with chat
// Header + Messages body + Input footer
// WebSocket integration for real-time updates

import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, AlertTriangle, Search, Loader2, ChevronDown } from 'lucide-react';
import { useConversationsStore } from '@/features/conversations/store';
import { useGetMessages } from '../api/useGetMessages';
import { useGetConversationDetail } from '../api/useGetConversationDetail';
import { messageKeys } from '../api/messageKeys';
import { useAnalyzeConversation } from '../api/useAnalyzeConversation';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { MessagesPanelHeader } from './MessagesPanelHeader';
import { ClientInfo } from './ClientInfo';
import { ProductsPromotions } from './ProductsPromotions';
import { BottomSheet } from '@/shared/ui/BottomSheet';
import { useTakeControl } from '../api/useTakeControl';
import { useReturnToAi } from '../api/useReturnToAi';
import { useCloseConversation } from '../api/useCloseConversation';
import { useToast } from '@/shared/hooks/useToast';
import { getErrorMessage } from '@/shared/lib/errors';
import { useMessagesRealtimeSync } from '../hooks/useMessagesRealtimeSync';
import { useAutoScroll } from '../hooks/useAutoScroll';
import type { Message } from '../types';
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
      onError: (error) => {
        showToast(getErrorMessage(error, 'Error al analizar la conversación'), 'error');
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
      showToast(getErrorMessage(error, 'Error al tomar control'), 'error');
    },
  });
  const returnToAi = useReturnToAi({
    onError: (error) => {
      showToast(getErrorMessage(error, 'Error al devolver a IA'), 'error');
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
      showToast(getErrorMessage(error, 'Error al cerrar la conversación'), 'error');
    },
  });

  const { showScrollButton, scrollToBottom } = useAutoScroll(
    scrollContainerRef,
    messagesEndRef,
    displayMessages,
    `${conversationId}:${historicalConversationId ?? ''}`,
  );

  useMessagesRealtimeSync(conversationId);

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

  return (
    <div className="flex-1 min-w-0 flex flex-col h-full bg-bg-primary">
      <MessagesPanelHeader
        client={client}
        conversationDetail={conversationDetail}
        isMenuOpen={isMenuOpen}
        onToggleMenu={() => setIsMenuOpen((v) => !v)}
        onCloseMenu={() => setIsMenuOpen(false)}
        onBack={handleBack}
        onOpenInfo={() => setIsBottomSheetOpen(true)}
        onTakeControl={() => takeControl.mutate({ conversationId })}
        isTakingControl={takeControl.isPending}
        onReturnToAi={() => returnToAi.mutate({ conversationId })}
        isReturningToAi={returnToAi.isPending}
        onCloseConversation={() => closeConversation.mutate(conversationId)}
        isClosingConversation={closeConversation.isPending}
      />

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
            <ClientInfo client={client} conversationId={conversationId} />
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
