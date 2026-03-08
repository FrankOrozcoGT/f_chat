import { useEffect, useRef } from 'react';
import { Bot, User } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { TestMessage } from '../types';

interface TestChatProps {
  messages: TestMessage[];
  isLoading?: boolean;
}

export const TestChat = ({ messages, isLoading }: TestChatProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-tertiary text-sm">
        Selecciona una conversación para iniciar el test
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={cn(
            'flex gap-2',
            msg.role === 'user' ? 'justify-end' : 'justify-start'
          )}
        >
          {msg.role === 'assistant' && (
            <div className="w-6 h-6 rounded-full bg-accent-purple/10 flex items-center justify-center flex-shrink-0 mt-1">
              <Bot size={14} className="text-accent-purple" />
            </div>
          )}
          <div
            className={cn(
              'max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap',
              msg.role === 'user'
                ? 'bg-accent-blue text-white'
                : 'bg-bg-tertiary text-text-primary'
            )}
          >
            {msg.content}
          </div>
          {msg.role === 'user' && (
            <div className="w-6 h-6 rounded-full bg-accent-blue/10 flex items-center justify-center flex-shrink-0 mt-1">
              <User size={14} className="text-accent-blue" />
            </div>
          )}
        </div>
      ))}

      {isLoading && (
        <div className="flex gap-2 justify-start">
          <div className="w-6 h-6 rounded-full bg-accent-purple/10 flex items-center justify-center flex-shrink-0 mt-1">
            <Bot size={14} className="text-accent-purple" />
          </div>
          <div className="bg-bg-tertiary rounded-lg px-3 py-2 text-sm text-text-tertiary">
            <span className="animate-pulse">Procesando...</span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};
