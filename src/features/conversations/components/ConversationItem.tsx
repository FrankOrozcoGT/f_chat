// Individual conversation item component
// Shows avatar, name, preview, timestamp, and unread badge

import { Bot } from 'lucide-react';
import type { Conversation } from '../types';
import { useConversationsStore } from '../store';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface ConversationItemProps {
  conversation: Conversation;
}

export const ConversationItem = ({ conversation }: ConversationItemProps) => {
  const { selectedConversationId, setSelectedConversationId } =
    useConversationsStore();

  const isSelected = selectedConversationId === conversation.id;

  const handleClick = () => {
    setSelectedConversationId(conversation.id);
  };

  // Format timestamp relative to now
  const formattedTime = conversation.lastMessageAt
    ? formatDistanceToNow(new Date(conversation.lastMessageAt), {
        addSuffix: true,
        locale: es,
      })
    : '';

  // Get initials for avatar fallback
  const initials = conversation.clientName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Clean phone number (remove WhatsApp group suffix @g.us)
  const cleanPhone = conversation.clientPhone.replace(/@g\.us$/, '');
  const isGroup = conversation.clientPhone.includes('@g.us');

  return (
    <button
      onClick={handleClick}
      className={`
        w-full flex items-start gap-3 p-3 text-left transition-colors
        hover:bg-gray-50 dark:hover:bg-gray-800
        ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' : 'border-l-4 border-transparent'}
      `}
    >
      {/* Avatar */}
      <div className="shrink-0">
        {conversation.clientAvatar ? (
          <img
            src={conversation.clientAvatar}
            alt={conversation.clientName}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
            {initials}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Name - Full width, no truncate on single line */}
        <h3 className="font-semibold text-gray-900 dark:text-white text-base leading-tight mb-0.5">
          {conversation.clientName}
        </h3>

        {/* Last message preview */}
        {conversation.lastMessage && (
          <p className="text-sm text-gray-600 dark:text-gray-300 truncate mb-1">
            {conversation.lastMessage}
          </p>
        )}

        {/* Bottom row: phone + timestamp */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-gray-400 dark:text-gray-500 truncate">
            {isGroup ? `Grupo · ${cleanPhone}` : cleanPhone}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {conversation.mode === 'AI' && (
              <span title="Modo IA"><Bot className="w-3.5 h-3.5 text-accent-purple" /></span>
            )}
            {formattedTime && (
              <span className="text-gray-400 dark:text-gray-500">
                {formattedTime}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Unread badge */}
      {conversation.unreadCount > 0 && (
        <div className="shrink-0">
          <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-blue-500 rounded-full">
            {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
          </span>
        </div>
      )}
    </button>
  );
};
