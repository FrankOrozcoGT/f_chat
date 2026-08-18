import { useState, useRef } from 'react';
import { Bot, Hand, Pencil, Check, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import type { Conversation } from '@/features/conversations/types';
import { useConversationsStore } from '@/features/conversations/store';
import { conversationKeys } from '@/features/conversations/api/conversationKeys';
import { useUpdateContactName } from '@/features/contacts/api/useUpdateContactName';
import { useToast } from '@/shared/hooks/useToast';
import { formatRelativeTime } from '@/shared/lib/date';

interface ConversationItemProps {
  conversation: Conversation;
}

export const ConversationItem = ({ conversation }: ConversationItemProps) => {
  const { selectedConversationId, setSelectedConversation } =
    useConversationsStore();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { mutate: updateName, isPending } = useUpdateContactName();

  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const isSelected = selectedConversationId === conversation.id;
  const hasUnread = conversation.unreadCount > 0 || conversation.lastMessageDirection === 'inbound';

  const handleClick = () => {
    setSelectedConversation(conversation.id, conversation.type);
  };

  const formattedTime = conversation.lastMessageAt
    ? formatRelativeTime(conversation.lastMessageAt)
    : '';

  const initials = conversation.clientName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

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

  const cleanPhone = conversation.clientPhone.replace(/@g\.us$/, '');

  const startEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInputValue(conversation.clientName);
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const cancelEditing = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsEditing(false);
    setInputValue('');
  };

  const save = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const trimmed = inputValue.trim();
    if (!trimmed || trimmed === conversation.clientName || !conversation.clientId) {
      cancelEditing();
      return;
    }
    updateName(
      { contactId: conversation.clientId, name: trimmed },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
          setIsEditing(false);
          showToast('Nombre actualizado', 'success');
        },
        onError: () => {
          showToast('Error al actualizar el nombre', 'error');
        },
      }
    );
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.key === 'Enter') save();
    if (e.key === 'Escape') cancelEditing();
  };

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
          {isEditing ? (
            <div className="flex items-center gap-1 flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
              <input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleInputKeyDown}
                disabled={isPending}
                className="flex-1 min-w-0 text-base font-semibold bg-transparent border-b border-blue-500 outline-none text-gray-900 dark:text-white"
              />
              <button onClick={save} disabled={isPending} className="shrink-0 text-blue-500 hover:opacity-70 transition-opacity">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={cancelEditing} disabled={isPending} className="shrink-0 text-gray-400 hover:opacity-70 transition-opacity">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <h3 className={`text-base leading-tight truncate ${hasUnread ? 'font-bold text-gray-900 dark:text-white' : 'font-semibold text-gray-900 dark:text-white'}`}>
                {conversation.clientName}
              </h3>
              {conversation.type === 'individual' && conversation.clientId && (
                <button
                  onClick={startEditing}
                  className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
          {!isEditing && conversation.unreadCount > 0 && (
            <span className="shrink-0 min-w-4.5 h-4.5 px-1 rounded-full bg-amber-400 text-white text-[10px] font-bold flex items-center justify-center">
              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
            </span>
          )}
        </div>

        {/* Last message preview */}
        {!isEditing && conversation.lastMessage && (
          <p className={`text-sm truncate mb-1 ${hasUnread ? 'text-gray-800 dark:text-gray-200 font-medium' : 'text-gray-600 dark:text-gray-300'}`}>
            {conversation.lastMessage}
          </p>
        )}

        {/* Bottom row: phone + timestamp */}
        {!isEditing && (
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
        )}
      </div>
    </button>
  );
};
