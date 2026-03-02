// Main conversations page with 3-column layout
// Left: ConversationsList, Center: MessagesPanel, Right: HITLPanel
// Includes WebSocket integration for real-time updates

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Header } from '@/layouts/components/Header';
import { Sidebar } from '@/layouts/components/Sidebar';
import { useSidebarStore } from '@/stores/useSidebarStore';
import { ConversationsList } from './ConversationsList';
import { conversationKeys } from '../api/conversationKeys';
import { useConversationsStore } from '../store';
import { socket } from '@/lib/websocket';
import { messageKeys } from '@/features/messages/api/messageKeys';
import { MessagesPanel } from '@/features/messages/components/MessagesPanel';
import { HITLPanel } from '@/features/messages/components/HITLPanel';

export const ConversationsPage = () => {
  const queryClient = useQueryClient();
  const isCollapsed = useSidebarStore((state) => state.isCollapsed);
  const { selectedConversationId } = useConversationsStore();
  const [historicalConversationId, setHistoricalConversationId] = useState<string | null>(null);

  // Reset historical view when switching conversations
  useEffect(() => {
    setHistoricalConversationId(null);
  }, [selectedConversationId]);

  // WebSocket integration for real-time updates
  useEffect(() => {
    // Listen for incoming messages - invalidate to refresh conversation list
    const handleMessageIncoming = () => {
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
    };

    // Listen for new conversations created
    const handleConversationCreated = () => {
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
    };

    // Listen for messages sent from backend/bot
    const handleMessageNew = () => {
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
    };

    // conversation:hitl — refrescar lista para mostrar indicador
    const handleHitl = () => {
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
    };

    const handleConversationTaken = () => {
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
      if (selectedConversationId) {
        queryClient.invalidateQueries({ queryKey: messageKeys.detail(selectedConversationId) });
      }
    };

    const handleConversationReturned = () => {
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
      if (selectedConversationId) {
        queryClient.invalidateQueries({ queryKey: messageKeys.detail(selectedConversationId) });
      }
    };

    const handleCreditsExhausted = () => {
      // Refresh conversation list to show updated mode (HITL)
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
    };

    socket.on('message:incoming', handleMessageIncoming);
    socket.on('message:new', handleMessageNew);
    socket.on('conversation:created', handleConversationCreated);
    socket.on('conversation:hitl', handleHitl);
    socket.on('conversation:taken', handleConversationTaken);
    socket.on('conversation:returned', handleConversationReturned);
    socket.on('credits:exhausted', handleCreditsExhausted);

    return () => {
      socket.off('message:incoming', handleMessageIncoming);
      socket.off('message:new', handleMessageNew);
      socket.off('conversation:created', handleConversationCreated);
      socket.off('conversation:hitl', handleHitl);
      socket.off('conversation:taken', handleConversationTaken);
      socket.off('conversation:returned', handleConversationReturned);
      socket.off('credits:exhausted', handleCreditsExhausted);
    };
  }, [queryClient, selectedConversationId]);

  return (
    <div className="min-h-screen bg-bg-primary">
      <Sidebar />
      {/* Adjust for sidebar: ml-60 expanded, ml-16 collapsed */}
      <div className={`transition-all duration-300 ${isCollapsed ? 'md:ml-16' : 'md:ml-60'}`}>
        <Header />
        {/* Main content: full height, no padding, starts after header (pt-16 for fixed header) */}
        <main className="pt-16 h-screen overflow-hidden">
          <div className="flex h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-900">
            {/* Left column: Conversations list (280px fixed) - Hidden on mobile when conversation selected */}
            <div className={selectedConversationId ? 'hidden md:block' : 'block'}>
              <ConversationsList />
            </div>

            {/* Center column: Messages panel or placeholder */}
            {selectedConversationId ? (
              <MessagesPanel
                conversationId={selectedConversationId}
                historicalConversationId={historicalConversationId}
                onExitHistorical={() => setHistoricalConversationId(null)}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-800">
                <div className="text-center text-gray-400 dark:text-gray-500">
                  <svg
                    className="w-24 h-24 mx-auto mb-4 text-gray-300 dark:text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <h2 className="text-xl font-semibold mb-2">
                    Selecciona una conversación
                  </h2>
                  <p className="text-sm">
                    Elige una conversación de la lista para ver los mensajes
                  </p>
                </div>
              </div>
            )}

            {/* Right column: HITL Panel (only desktop ≥1024px) */}
            <div className="hidden lg:block w-[320px] border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              {selectedConversationId ? (
                <HITLPanel
                  conversationId={selectedConversationId}
                />
              ) : null}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
