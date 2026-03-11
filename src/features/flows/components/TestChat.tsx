import { useEffect, useRef } from 'react';
import { Bot, User, Zap } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { TestIntent, SideEffectAction } from '../types';
import type { TestMessage, TestSideEffect } from '../types';

const INTENT_CONFIG: Record<string, { label: string; color: string }> = {
  [TestIntent.Normal]: { label: 'normal', color: 'bg-bg-tertiary text-text-secondary' },
  [TestIntent.Responder]: { label: 'responder', color: 'bg-accent-blue/10 text-accent-blue' },
  [TestIntent.CloseSession]: { label: 'cerrar sesión', color: 'bg-accent-orange/10 text-accent-orange' },
  [TestIntent.SwitchToHitl]: { label: 'transferir a humano', color: 'bg-accent-purple/10 text-accent-purple' },
  [TestIntent.FindFlowForIntent]: { label: 'buscar flujo', color: 'bg-accent-blue/10 text-accent-blue' },
  [TestIntent.MoveToLastConversation]: { label: 'mover a conv. anterior', color: 'bg-bg-tertiary text-text-secondary' },
  [TestIntent.ReportHacking]: { label: 'reporte hacking', color: 'bg-toast-error-bg text-toast-error-text' },
  [TestIntent.MaxIterations]: { label: 'max iteraciones', color: 'bg-accent-orange/10 text-accent-orange' },
};

const DEFAULT_INTENT = { label: '', color: 'bg-bg-tertiary text-text-secondary' };

function getIntentConfig(intent: string) {
  return INTENT_CONFIG[intent] || { ...DEFAULT_INTENT, label: intent };
}

const SIDE_EFFECT_LABELS: Record<string, string> = {
  [SideEffectAction.SendMessage]: 'enviar mensaje',
  [SideEffectAction.SendFarewell]: 'enviar despedida',
  [SideEffectAction.CloseNodeSession]: 'cerrar sesión nodo',
  [SideEffectAction.CloseConversation]: 'cerrar conversación',
  [SideEffectAction.SwitchToHitl]: 'transferir a humano',
  [SideEffectAction.UpsertIntent]: 'registrar intención',
  [SideEffectAction.TransitionToFlow]: 'cambiar flujo',
  [SideEffectAction.MoveToLastConversation]: 'mover a conv. anterior',
  [SideEffectAction.ReportHacking]: 'reportar hacking',
};

function getSideEffectLabel(action: string): string {
  return SIDE_EFFECT_LABELS[action] || action;
}

function formatArgValue(value: unknown): string {
  if (typeof value === 'string') return value.length > 60 ? `${value.slice(0, 60)}...` : value;
  return String(value);
}

const SideEffectRow = ({ msg }: { msg: TestMessage }) => {
  const cfg = getIntentConfig(msg.intent!);

  return (
    <div className="ml-8 mt-1 flex flex-wrap items-center gap-1.5">
      {/* Intent badge */}
      <span className={cn(
        'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium',
        cfg.color
      )}>
        {cfg.label}
      </span>

      {/* Side effects: action badge + each arg as badge */}
      {msg.sideEffects && msg.sideEffects.length > 0 && msg.sideEffects.map((se, i) => (
        <span key={i} className="inline-flex flex-wrap items-center gap-1">
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-accent-orange/10 text-accent-orange">
            <Zap size={8} />
            {getSideEffectLabel(se.action)}
          </span>
          {Object.entries(se.args).map(([key, value]) => (
            <span
              key={key}
              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-bg-tertiary text-text-secondary"
            >
              {key}: {formatArgValue(value)}
            </span>
          ))}
        </span>
      ))}
    </div>
  );
};

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
        <div key={msg.id}>
          <div
            className={cn(
              'flex gap-2',
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-accent-purple/10 flex items-center justify-center shrink-0 mt-1">
                <Bot size={14} className="text-accent-purple" />
              </div>
            )}
            {(msg.role === 'user' || msg.content) && (
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
            )}
            {msg.role === 'user' && (
              <div className="w-6 h-6 rounded-full bg-accent-blue/10 flex items-center justify-center shrink-0 mt-1">
                <User size={14} className="text-accent-blue" />
              </div>
            )}
          </div>

          {/* Intent badge + side effects info */}
          {msg.role === 'assistant' && msg.intent && (
            <SideEffectRow msg={msg} />
          )}
        </div>
      ))}

      {isLoading && (
        <div className="flex gap-2 justify-start">
          <div className="w-6 h-6 rounded-full bg-accent-purple/10 flex items-center justify-center shrink-0 mt-1">
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
