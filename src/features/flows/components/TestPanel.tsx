import { useState, useCallback, useRef, useEffect } from 'react';
import { X, Search, Play, Pause, SkipBack, Square, MessageSquare, Phone, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { useSearchContacts } from '../api/useSearchContacts';
import { useStartTest } from '../api/useStartTest';
import { useTestSend } from '../api/useTestSend';
import { useTestStepBack } from '../api/useTestStepBack';
import { useTestStop } from '../api/useTestStop';
import { useGetMessages } from '@/features/messages/api/useGetMessages';
import { TestChat } from './TestChat';
import { TestIntent } from '../types';
import type { TestMessage, Contact, ContactConversation } from '../types';

const TERMINAL_INTENTS = new Set([
  TestIntent.CloseSession,
  TestIntent.SwitchToHitl,
  TestIntent.MaxIterations,
  TestIntent.ReportHacking,
]);

const TEST_PHONE_KEY = 'flowTest_testPhone';

interface TestPanelProps {
  flowId: string;
  onClose: () => void;
  onNodeHighlight: (nodeId: string | null) => void;
}

type Phase = 'search' | 'testing';

export const TestPanel = ({ flowId, onClose, onNodeHighlight }: TestPanelProps) => {
  // Search phase
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<ContactConversation | null>(null);
  const [testPhone, setTestPhone] = useState(() => localStorage.getItem(TEST_PHONE_KEY) || '');
  const [expandedContactId, setExpandedContactId] = useState<string | null>(null);

  // Test phase
  const [phase, setPhase] = useState<Phase>('search');
  const [testId, setTestId] = useState<string | null>(null);
  const [messages, setMessages] = useState<TestMessage[]>([]);
  const [conversationMessages, setConversationMessages] = useState<string[]>([]);
  const [currentMsgIndex, setCurrentMsgIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // API hooks
  const { data: contacts, isLoading: isSearching } = useSearchContacts(searchQuery);
  const { data: convMessages } = useGetMessages(selectedConversation?.id || '');
  const startTest = useStartTest();
  const testSend = useTestSend();
  const testStepBack = useTestStepBack();
  const testStop = useTestStop();

  const handleSendMessage = useCallback(async (content: string) => {
    if (!testId) return;

    const userMsg: TestMessage = {
      id: `user-${Date.now()}`,
      content,
      role: 'user',
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const result = await testSend.mutateAsync({
        testId,
        message: content,
      });

      const assistantMsg: TestMessage = {
        id: `assistant-${Date.now()}`,
        content: result.response,
        role: 'assistant',
        nodeId: result.currentNodeId,
        intent: result.intent,
        sideEffects: result.sideEffects,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      onNodeHighlight(result.currentNodeId);

      if (TERMINAL_INTENTS.has(result.intent)) {
        setIsPlaying(false);
      }
    } catch {
      const errorMsg: TestMessage = {
        id: `error-${Date.now()}`,
        content: 'Error al procesar el mensaje',
        role: 'assistant',
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  }, [testId, testSend, onNodeHighlight]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Auto-play logic
  useEffect(() => {
    if (isPlaying && testId && currentMsgIndex < conversationMessages.length) {
      intervalRef.current = setInterval(() => {
        setCurrentMsgIndex((prev) => {
          if (prev >= conversationMessages.length) {
            setIsPlaying(false);
            return prev;
          }
          handleSendMessage(conversationMessages[prev]);
          return prev + 1;
        });
      }, 2000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, testId, currentMsgIndex, conversationMessages, handleSendMessage]);

  const handleTestPhoneChange = (value: string) => {
    setTestPhone(value);
    localStorage.setItem(TEST_PHONE_KEY, value);
  };

  const handleSelectConversation = (contact: Contact, conversation: ContactConversation) => {
    setSelectedContact(contact);
    setSelectedConversation(conversation);
  };

  const handleStartTest = async () => {
    if (!selectedConversation || !testPhone.trim()) return;

    // Filtrar solo mensajes incoming (del cliente) para enviar al test
    const incomingMessages = convMessages
      ?.filter((m) => m.direction === 'incoming')
      .map((m) => m.content) || [];

    if (incomingMessages.length === 0) return;

    try {
      const result = await startTest.mutateAsync({
        conversationId: selectedConversation.id,
        flowId,
        clientPhone: testPhone.trim(),
      });

      setTestId(result.testId);
      setPhase('testing');
      setMessages([]);
      setCurrentMsgIndex(0);
      setConversationMessages(incomingMessages);
    } catch {
      // Error manejado por tanstack query
    }
  };

  const handleStepBack = async () => {
    if (!testId) return;

    try {
      const result = await testStepBack.mutateAsync({ testId });
      setMessages((prev) => prev.slice(0, -2));
      setCurrentMsgIndex((prev) => Math.max(0, prev - 1));
      onNodeHighlight(result.currentNodeId);
    } catch {
      // Error manejado por tanstack query
    }
  };

  const handleStop = async () => {
    setIsPlaying(false);
    if (testId) {
      await testStop.mutateAsync({ testId });
    }
    setTestId(null);
    setPhase('search');
    setMessages([]);
    setConversationMessages([]);
    setCurrentMsgIndex(0);
    setSelectedContact(null);
    setSelectedConversation(null);
    onNodeHighlight(null);
  };

  const handleTogglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  const canStart = selectedConversation && testPhone.trim() && convMessages && convMessages.some((m) => m.direction === 'incoming');

  return (
    <div className="absolute right-0 top-0 h-full w-96 bg-bg-secondary border-l border-border-primary z-10 flex flex-col shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border-primary">
        <div className="flex items-center gap-2">
          <MessageSquare size={18} className="text-accent-green" />
          <h3 className="text-base font-semibold text-text-primary">Testing</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md hover:bg-bg-tertiary transition-colors"
        >
          <X size={18} className="text-text-secondary" />
        </button>
      </div>

      {phase === 'search' ? (
        <>
          {/* Test phone input */}
          <div className="p-3 border-b border-border-primary">
            <label className="text-xs font-medium text-text-tertiary mb-1.5 block">
              Teléfono de pruebas
            </label>
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                type="text"
                value={testPhone}
                onChange={(e) => handleTestPhoneChange(e.target.value)}
                placeholder="5491155551234"
                className="w-full pl-9 pr-3 py-2 bg-bg-tertiary border border-border-primary rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent-blue"
              />
            </div>
          </div>

          {/* Search input */}
          <div className="p-3 border-b border-border-primary">
            <label className="text-xs font-medium text-text-tertiary mb-1.5 block">
              Buscar conversación
            </label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar contacto..."
                className="w-full pl-9 pr-3 py-2 bg-bg-tertiary border border-border-primary rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent-blue"
              />
            </div>
          </div>

          {/* Contact results */}
          <div className="flex-1 overflow-y-auto">
            {isSearching && (
              <div className="p-4 text-center text-text-tertiary text-sm">Buscando...</div>
            )}

            {contacts?.map((contact) => {
              const isExpanded = expandedContactId === contact.id;
              return (
                <div key={contact.id} className="border-b border-border-primary">
                  <button
                    onClick={() => setExpandedContactId(isExpanded ? null : contact.id)}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-text-primary bg-bg-primary/50 hover:bg-bg-tertiary transition-colors"
                  >
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    <span className="truncate">{contact.name}</span>
                    <span className="text-text-tertiary font-normal ml-auto text-xs">{contact.phone}</span>
                  </button>
                  {isExpanded && contact.conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectConversation(contact, conv)}
                      className={`w-full text-left pl-9 pr-4 py-2.5 text-sm hover:bg-bg-tertiary transition-colors ${
                        selectedConversation?.id === conv.id ? 'bg-bg-tertiary' : ''
                      }`}
                    >
                      <div className="text-text-secondary truncate">
                        {conv.lastMessage || 'Sin mensajes'}
                      </div>
                      <div className="text-xs text-text-tertiary mt-0.5">
                        {new Date(conv.updatedAt).toLocaleDateString()}
                      </div>
                    </button>
                  ))}
                </div>
              );
            })}

            {searchQuery.length >= 2 && !isSearching && contacts?.length === 0 && (
              <div className="p-4 text-center text-text-tertiary text-sm">
                No se encontraron contactos
              </div>
            )}
          </div>

          {/* Start button */}
          {selectedConversation && (
            <div className="p-3 border-t border-border-primary">
              <div className="text-xs text-text-tertiary mb-2">
                Contacto: <span className="text-text-secondary">{selectedContact?.name}</span>
                {convMessages && (
                  <span className="ml-2">
                    · {convMessages.filter((m) => m.direction === 'incoming').length} mensajes incoming
                  </span>
                )}
              </div>
              <Button
                variant="primary"
                size="md"
                onClick={handleStartTest}
                isLoading={startTest.isPending}
                disabled={!canStart}
                className="w-full"
              >
                Iniciar Test
              </Button>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Chat area */}
          <TestChat messages={messages} isLoading={testSend.isPending} />

          {/* Controls */}
          <div className="p-3 border-t border-border-primary">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-text-tertiary">
                Mensaje {currentMsgIndex}/{conversationMessages.length}
              </span>
              <span className="text-xs text-text-tertiary">
                {selectedContact?.name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleStepBack}
                disabled={messages.length === 0 || testStepBack.isPending}
                title="Retroceder un paso"
              >
                <SkipBack size={16} />
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleTogglePlay}
                disabled={currentMsgIndex >= conversationMessages.length}
                className="flex-1"
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                <span className="ml-1">{isPlaying ? 'Pausar' : 'Reproducir'}</span>
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleStop}
                title="Detener test"
              >
                <Square size={16} />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
