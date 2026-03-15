// Individual conversation item component
// Shows avatar, name, preview, timestamp, and unread badge

import { Bot, Hand } from 'lucide-react';
import type { Conversation } from '../types';
import { useConversationsStore } from '../store';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface ConversationItemProps {
  conversation: Conversation;
}

export const ConversationItem = ({ conversation }: ConversationItemProps) => {
  const { selectedConversationId, setSelectedConversation } =
    useConversationsStore();

  const isSelected = selectedConversationId === conversation.id;
  const hasUnread = conversation.unreadCount > 0 || conversation.lastMessageDirection === 'inbound';

  const handleClick = () => {
    setSelectedConversation(conversation.id, conversation.type);
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

  // Consistent gradient per contact based on phone number (djb2 hash)
  const AVATAR_GRADIENTS: [string, string][] = [
    ['#FF6B6B', '#FF8E53'],
    ['#FFC107', '#FF8E53'],
    ['#4CAF50', '#26C6DA'],
    ['#42A5F5', '#7E57C2'],
    ['#EC407A', '#AB47BC'],
    ['#26A69A', '#42A5F5'],
    ['#EF5350', '#EC407A'],
    ['#5C6BC0', '#26C6DA'],
    ['#FF8E53', '#FFC107'],
    ['#AB47BC', '#5C6BC0'],
    ['#26C6DA', '#4CAF50'],
    ['#7E57C2', '#EC407A'],
  ];
  let hash = 0;
  for (let i = 0; i < conversation.clientPhone.length; i++) {
    hash = conversation.clientPhone.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  const [gradientFrom, gradientTo] = AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];

  // Clean phone number (remove WhatsApp group suffix @g.us)
  const cleanPhone = conversation.clientPhone.replace(/@g\.us$/, '');

  return (
    <button
      onClick={handleClick}
      className={`
        w-full flex items-start gap-3 p-3 text-left transition-colors
        hover:bg-gray-50 dark:hover:bg-gray-800
        ${isSelected
          ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500'
          : hasUnread
          ? 'bg-amber-50 dark:bg-amber-900/10 border-l-4 border-amber-400'
          : 'border-l-4 border-transparent'}
      `}
    >
      {/* Avatar */}
      <div className="shrink-0 w-12 h-12 relative">
        {conversation.type === 'group' ? (
          // Group avatar: stack of participant photos (WhatsApp style)
          (() => {
            const pics = (conversation.participants ?? []).slice(0, 4);
            if (pics.length === 0) {
              return (
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                  style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}
                >
                  {initials}
                </div>
              );
            }
            // 2x2 grid for 3+ participants, side-by-side for 2, single for 1
            const count = pics.length;
            const gridClass = count >= 3
              ? 'grid grid-cols-2 gap-[2px]'
              : count === 2
              ? 'flex gap-[2px]'
              : '';
            return (
              <div className={`w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 ${count > 1 ? gridClass : ''}`}>
                {pics.map((p) => {
                  const pInitials = p.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 1);
                  let ph = 0;
                  for (let ci = 0; ci < p.phoneNumber.length; ci++) {
                    ph = p.phoneNumber.charCodeAt(ci) + ((ph << 5) - ph);
                    ph = ph & ph;
                  }
                  const [pFrom, pTo] = AVATAR_GRADIENTS[Math.abs(ph) % AVATAR_GRADIENTS.length];
                  const sizeClass = count === 1 ? 'w-full h-full' : count === 2 ? 'w-[22px] h-12' : 'w-[22px] h-[22px]';
                  return p.profilePicUrl ? (
                    <img
                      key={p.id}
                      src={p.profilePicUrl}
                      alt={p.name}
                      className={`${sizeClass} object-cover`}
                    />
                  ) : (
                    <div
                      key={p.id}
                      className={`${sizeClass} flex items-center justify-center text-white font-semibold`}
                      style={{ background: `linear-gradient(135deg, ${pFrom}, ${pTo})`, fontSize: count === 1 ? '14px' : '10px' }}
                    >
                      {pInitials}
                    </div>
                  );
                })}
              </div>
            );
          })()
        ) : conversation.clientAvatar ? (
          <img
            src={conversation.clientAvatar}
            alt={conversation.clientName}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm"
            style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}
          >
            {initials}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Name row */}
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <h3 className={`text-base leading-tight truncate ${hasUnread ? 'font-bold text-gray-900 dark:text-white' : 'font-semibold text-gray-900 dark:text-white'}`}>
            {conversation.clientName}
          </h3>
          {conversation.unreadCount > 0 && (
            <span className="shrink-0 min-w-4.5 h-4.5 px-1 rounded-full bg-amber-400 text-white text-[10px] font-bold flex items-center justify-center">
              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
            </span>
          )}
        </div>

        {/* Last message preview */}
        {conversation.lastMessage && (
          <p className={`text-sm truncate mb-1 ${hasUnread ? 'text-gray-800 dark:text-gray-200 font-medium' : 'text-gray-600 dark:text-gray-300'}`}>
            {conversation.lastMessage}
          </p>
        )}

        {/* Bottom row: phone + timestamp */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-gray-400 dark:text-gray-500 truncate">
            {conversation.type === 'group'
              ? `Grupo · ${(conversation.participants ?? []).length} participantes`
              : cleanPhone}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {conversation.mode === 'AI' ? (
              <span title="Modo IA"><Bot className="w-3.5 h-3.5 text-accent-purple" /></span>
            ) : conversation.mode === 'HITL' ? (
              <span title="Modo HITL - Atendido por humano"><Hand className="w-3.5 h-3.5 text-accent-orange" /></span>
            ) : null}
            {formattedTime && (
              <span className={hasUnread ? 'text-amber-500 font-medium' : 'text-gray-400 dark:text-gray-500'}>
                {formattedTime}
              </span>
            )}
          </div>
        </div>
      </div>

    </button>
  );
};
