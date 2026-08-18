import { ArrowLeft, Bot, Hand, Info, MoreVertical, X as XCircle } from 'lucide-react';
import { Avatar } from '@/shared/ui/Avatar';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import type { Client } from '@/features/messages/types';
import type { useGetConversationDetail } from '@/features/messages/api/useGetConversationDetail';

function getInitials(name?: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

interface MessagesPanelHeaderProps {
  client: Client | null | undefined;
  conversationDetail: ReturnType<typeof useGetConversationDetail>['data'];
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onBack: () => void;
  onOpenInfo: () => void;
  onTakeControl: () => void;
  isTakingControl: boolean;
  onReturnToAi: () => void;
  isReturningToAi: boolean;
  onCloseConversation: () => void;
  isClosingConversation: boolean;
}

export const MessagesPanelHeader = ({
  client,
  conversationDetail,
  isMenuOpen,
  onToggleMenu,
  onCloseMenu,
  onBack,
  onOpenInfo,
  onTakeControl,
  isTakingControl,
  onReturnToAi,
  isReturningToAi,
  onCloseConversation,
  isClosingConversation,
}: MessagesPanelHeaderProps) => {
  const conversationMode = conversationDetail?.conversation?.mode;

  return (
    <header className="flex items-center gap-3 p-4 border-b border-border-primary bg-bg-secondary shrink-0">
      {/* Back button (mobile + medium screens when conversations list is hidden) */}
      <button
        onClick={onBack}
        className="xl:hidden min-h-11 min-w-11 flex items-center justify-center rounded-lg hover:bg-bg-tertiary transition-colors"
        aria-label="Volver a lista"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      {/* Avatar */}
      <Avatar alt={client?.name} initials={getInitials(client?.name)} size="md" />

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
        <Button variant="primary" size="sm" isLoading={isTakingControl} onClick={onTakeControl}>
          <Hand className="w-4 h-4" />
          <span className="hidden sm:inline">Tomar Control</span>
        </Button>
      ) : conversationMode === 'HITL' ? (
        <Button variant="secondary" size="sm" isLoading={isReturningToAi} onClick={onReturnToAi}>
          <Bot className="w-4 h-4" />
          <span className="hidden sm:inline">Devolver a IA</span>
        </Button>
      ) : null}

      {/* Status badge (based on conversation isActive) */}
      {conversationDetail?.conversation && (
        <Badge variant={conversationDetail.conversation.isActive ? 'success' : 'default'} size="sm">
          {conversationDetail.conversation.isActive ? 'Activa' : 'Cerrada'}
        </Badge>
      )}

      {/* Info button (mobile only) - opens bottom sheet */}
      <button
        onClick={onOpenInfo}
        className="lg:hidden min-h-11 min-w-11 flex items-center justify-center rounded-lg bg-accent-blue/10 hover:bg-accent-blue/20 transition-colors"
        aria-label="Ver información del cliente"
      >
        <Info className="w-5 h-5 text-accent-blue" />
      </button>

      {/* Kebab menu */}
      <div className="relative">
        <button
          onClick={onToggleMenu}
          className="min-h-11 min-w-11 flex items-center justify-center rounded-lg hover:bg-bg-tertiary transition-colors"
          aria-label="Más opciones"
        >
          <MoreVertical className="w-5 h-5 text-text-secondary" />
        </button>

        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-10" onClick={onCloseMenu} />
            {/* Dropdown */}
            <div className="absolute right-0 top-full mt-1 w-52 bg-bg-secondary border border-border-primary rounded-lg shadow-lg z-20 py-1">
              <button
                onClick={onCloseConversation}
                disabled={isClosingConversation}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-text-primary hover:bg-bg-tertiary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <XCircle className="w-4 h-4 text-accent-red" />
                {isClosingConversation ? 'Cerrando...' : 'Cerrar Conversación'}
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
};
