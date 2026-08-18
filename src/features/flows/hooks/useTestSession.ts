import { useCallback, useEffect, useRef, useState } from 'react';
import { useStartTest } from '@/features/flows/api/useStartTest';
import { useTestSend } from '@/features/flows/api/useTestSend';
import { useTestStepBack } from '@/features/flows/api/useTestStepBack';
import { useTestStop } from '@/features/flows/api/useTestStop';
import { TestIntent, SideEffectAction } from '@/features/flows/types';
import type { TestMessage, ConversationTestMessage } from '@/features/flows/types';
import { useToast } from '@/shared/hooks/useToast';
import { getErrorMessage } from '@/shared/lib/errors';

const TERMINAL_INTENTS = new Set<TestIntent>([
  TestIntent.CloseSession,
  TestIntent.SwitchToHitl,
  TestIntent.MaxIterations,
  TestIntent.ReportHacking,
]);

type SendResult = 'continue' | 'wait' | 'stop';

/**
 * Máquina de estados de una sesión de test de flow: arranque, envío paso a
 * paso o en auto-play, retroceso y detención. Usada por TestPanel una vez
 * que el usuario eligió la conversación a testear.
 */
export function useTestSession(flowId: string | undefined, onNodeHighlight: (nodeId: string | null) => void) {
  const { showToast } = useToast();
  const [phase, setPhase] = useState<'search' | 'testing'>('search');
  const [testId, setTestId] = useState<string | null>(null);
  const [messages, setMessages] = useState<TestMessage[]>([]);
  const [conversationMessages, setConversationMessages] = useState<ConversationTestMessage[]>([]);
  const [currentMsgIndex, setCurrentMsgIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startTest = useStartTest();
  const testSend = useTestSend();
  const testStepBack = useTestStepBack();
  const testStop = useTestStop();

  const isPlayingRef = useRef(false);
  const currentMsgIndexRef = useRef(0);
  const isSendingRef = useRef(false);

  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { currentMsgIndexRef.current = currentMsgIndex; }, [currentMsgIndex]);

  const handleSendMessage = useCallback(async (msg: ConversationTestMessage): Promise<SendResult> => {
    if (!testId || isSendingRef.current) return 'stop';
    isSendingRef.current = true;

    const userMsg: TestMessage = {
      id: `user-${Date.now()}`,
      content: msg.content,
      role: 'user',
      type: msg.type,
      mediaUrl: msg.mediaUrl,
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const result = await testSend.mutateAsync({
        testId,
        message: msg.content,
        mediaUrl: msg.mediaUrl,
      });

      const assistantMsg: TestMessage = {
        id: `assistant-${Date.now()}`,
        content: result.response,
        role: 'assistant',
        nodeId: result.currentNodeId,
        intent: result.intent,
        sideEffects: result.sideEffects,
        preCodeContext: result.preCodeContext,
        nodeTransitions: result.nodeTransitions,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      const lastTransition = result.nodeTransitions?.slice().reverse().find((t: { to: string | null }) => t.to !== null);
      onNodeHighlight(lastTransition?.to ?? result.currentNodeId);
      isSendingRef.current = false;

      if (TERMINAL_INTENTS.has(result.intent)) {
        setIsPlaying(false);
        return 'stop';
      }

      const hasSendMessage = result.sideEffects?.some(
        (se: { action: string }) => se.action === SideEffectAction.SendMessage
      );
      return hasSendMessage ? 'continue' : 'wait';
    } catch {
      const errorMsg: TestMessage = {
        id: `error-${Date.now()}`,
        content: 'Error al procesar el mensaje',
        role: 'assistant',
      };
      setMessages((prev) => [...prev, errorMsg]);
      setIsPlaying(false);
      isSendingRef.current = false;
      return 'stop';
    }
  }, [testId, testSend, onNodeHighlight]);

  useEffect(() => {
    if (!isPlaying || !testId) return;

    const playNext = async () => {
      const idx = currentMsgIndexRef.current;
      if (idx >= conversationMessages.length || !isPlayingRef.current) {
        setIsPlaying(false);
        return;
      }

      const result = await handleSendMessage(conversationMessages[idx]);
      if (result === 'stop' || !isPlayingRef.current) return;

      setCurrentMsgIndex((prev) => prev + 1);

      if (result === 'continue') {
        timeoutRef.current = setTimeout(playNext, 2000);
      } else {
        setIsPlaying(false);
      }
    };

    timeoutRef.current = setTimeout(playNext, 500);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isPlaying, testId, conversationMessages, handleSendMessage]);

  const filterIncoming = (convMessages: { direction: string; content: string; type: string; mediaUrl?: string | null }[] | undefined): ConversationTestMessage[] =>
    convMessages
      ?.filter((m) => m.direction === 'incoming')
      .map((m) => ({
        content: m.content,
        type: (m.type === 'image' ? 'image' : 'text') as 'text' | 'image',
        mediaUrl: m.mediaUrl ?? undefined,
      })) || [];

  const start = async (conversationId: string, testPhone: string, convMessages: { direction: string; content: string; type: string; mediaUrl?: string | null }[] | undefined) => {
    const incomingMessages = filterIncoming(convMessages);
    if (incomingMessages.length === 0) return;

    try {
      const result = await startTest.mutateAsync({ conversationId, flowId, clientPhone: testPhone.trim() });
      setTestId(result.testId);
      setPhase('testing');
      setMessages([]);
      setCurrentMsgIndex(0);
      setConversationMessages(incomingMessages);
    } catch (error) {
      showToast(getErrorMessage(error, 'No se pudo iniciar el test'), 'error');
    }
  };

  const stepBack = async () => {
    if (!testId) return;
    try {
      const result = await testStepBack.mutateAsync({ testId });
      setMessages((prev) => {
        const lastUserIdx = prev.map((m) => m.role).lastIndexOf('user');
        return lastUserIdx === -1 ? prev : prev.slice(0, lastUserIdx);
      });
      setCurrentMsgIndex((prev) => Math.max(0, prev - 1));
      onNodeHighlight(result.currentNodeId);
    } catch (error) {
      showToast(getErrorMessage(error, 'No se pudo retroceder el test'), 'error');
    }
  };

  const stop = async () => {
    setIsPlaying(false);
    try {
      if (testId) {
        await testStop.mutateAsync({ testId });
      }
    } catch (error) {
      showToast(getErrorMessage(error, 'No se pudo detener el test correctamente'), 'error');
    }
    setTestId(null);
    setPhase('search');
    setMessages([]);
    setConversationMessages([]);
    setCurrentMsgIndex(0);
    onNodeHighlight(null);
  };

  const restart = async (conversationId: string, testPhone: string, convMessages: { direction: string; content: string; type: string; mediaUrl?: string | null }[] | undefined) => {
    setIsPlaying(false);
    try {
      if (testId) {
        await testStop.mutateAsync({ testId });
      }
      setMessages([]);
      setCurrentMsgIndex(0);
      onNodeHighlight(null);

      const incomingMessages = filterIncoming(convMessages);
      if (incomingMessages.length === 0) return;

      const result = await startTest.mutateAsync({ conversationId, flowId, clientPhone: testPhone.trim() });
      setTestId(result.testId);
      setConversationMessages(incomingMessages);
      setIsPlaying(true);
    } catch (error) {
      showToast(getErrorMessage(error, 'No se pudo reiniciar el test'), 'error');
    }
  };

  const togglePlay = () => setIsPlaying((prev) => !prev);

  return {
    phase,
    testId,
    messages,
    conversationMessages,
    currentMsgIndex,
    isPlaying,
    isSending: testSend.isPending,
    isStarting: startTest.isPending,
    isSteppingBack: testStepBack.isPending,
    start,
    stepBack,
    stop,
    restart,
    togglePlay,
  };
}
