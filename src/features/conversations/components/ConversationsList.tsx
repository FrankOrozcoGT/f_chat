// Conversations list component with infinite scroll
// Left column (280px) showing all conversations

import { useState, useRef, useCallback } from 'react';
import { useGetConversations } from '../api/useGetConversations';
import { ConversationItem } from './ConversationItem';
import { useDebounce } from '@/shared/hooks/useDebounce';

export const ConversationsList = () => {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useGetConversations({ search: debouncedSearch });

  // Debug: log error
  if (isError) {
    console.error('[ConversationsList] Error:', error);
  }

  // Infinite scroll: observe last item
  const lastConversationRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingNextPage) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage]
  );

  // Flatten all pages into single array
  const conversations = data?.pages?.flatMap((page) => page.conversations) ?? [];

  return (
    <div className="w-70 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header with search */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
          Conversaciones
        </h2>
        <input
          type="text"
          placeholder="Buscar por nombre o teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white text-sm"
        />
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}

        {isError && (
          <div className="p-4 text-center text-red-500">
            Error al cargar conversaciones
          </div>
        )}

        {!isLoading && !isError && conversations.length === 0 && (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            {search
              ? 'No se encontraron conversaciones'
              : 'No hay conversaciones activas'}
          </div>
        )}

        {conversations.map((conversation, index) => {
          const isLast = index === conversations.length - 1;
          return (
            <div
              key={conversation.id}
              ref={isLast ? lastConversationRef : null}
            >
              <ConversationItem conversation={conversation} />
            </div>
          );
        })}

        {isFetchingNextPage && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>
    </div>
  );
};
