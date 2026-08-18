import { useState } from 'react';
import { X, Search, Play, Pause, SkipBack, Square, RotateCcw, MessageSquare, Phone, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { useGetMessages } from '@/features/messages';
import { TestChat } from './TestChat';
import { useContactSearch } from '../hooks/useContactSearch';
import { useTestSession } from '../hooks/useTestSession';
import { formatDate } from '@/shared/lib/date';

const TEST_PHONE_KEY = 'flowTest_testPhone';

interface TestPanelProps {
  flowId?: string;
  onClose: () => void;
  onNodeHighlight: (nodeId: string | null) => void;
}

export const TestPanel = ({ flowId, onClose, onNodeHighlight }: TestPanelProps) => {
  const [testPhone, setTestPhone] = useState(() => localStorage.getItem(TEST_PHONE_KEY) || '');

  const {
    searchQuery,
    setSearchQuery,
    debouncedQuery,
    expandedContactId,
    setExpandedContactId,
    contacts,
    isSearching,
    selectedContact,
    selectedConversation,
    selectConversation,
    reset: resetSearch,
  } = useContactSearch();

  const {
    phase,
    messages,
    conversationMessages,
    currentMsgIndex,
    isPlaying,
    isSending,
    isStarting,
    isSteppingBack,
    start,
    stepBack,
    stop,
    restart,
    togglePlay,
  } = useTestSession(flowId, onNodeHighlight);

  const { data: convMessages } = useGetMessages(selectedConversation?.id || '');

  const handleTestPhoneChange = (value: string) => {
    setTestPhone(value);
    localStorage.setItem(TEST_PHONE_KEY, value);
  };

  const handleStartTest = async () => {
    if (!selectedConversation || !testPhone.trim()) return;
    await start(selectedConversation.id, testPhone, convMessages);
  };

  const handleRestart = async () => {
    if (!selectedConversation || !testPhone.trim()) return;
    await restart(selectedConversation.id, testPhone, convMessages);
  };

  const handleStop = async () => {
    await stop();
    resetSearch();
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
                      onClick={() => selectConversation(contact, conv)}
                      className={`w-full text-left pl-9 pr-4 py-2.5 text-sm hover:bg-bg-tertiary transition-colors ${
                        selectedConversation?.id === conv.id ? 'bg-bg-tertiary' : ''
                      }`}
                    >
                      <div className="text-text-secondary truncate">
                        {conv.summary || conv.lastMessage || 'Sin mensajes'}
                      </div>
                      <div className="text-xs text-text-tertiary mt-0.5">
                        {formatDate(conv.updatedAt)}
                      </div>
                    </button>
                  ))}
                </div>
              );
            })}

            {debouncedQuery.length >= 2 && !isSearching && contacts?.length === 0 && (
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
                isLoading={isStarting}
                disabled={!canStart}
                className="w-full"
              >
                Iniciar Test
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Chat area */}
          <TestChat messages={messages} isLoading={isSending} />

          {/* Controls */}
          <div className="shrink-0 p-3 border-t border-border-primary">
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
                onClick={stepBack}
                disabled={messages.length === 0 || isSteppingBack}
                title="Retroceder un paso"
              >
                <SkipBack size={16} />
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={togglePlay}
                disabled={currentMsgIndex >= conversationMessages.length}
                className="flex-1"
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                <span className="ml-1">{isPlaying ? 'Pausar' : 'Reproducir'}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRestart}
                title="Reiniciar test"
              >
                <RotateCcw size={16} />
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
        </div>
      )}
    </div>
  );
};
