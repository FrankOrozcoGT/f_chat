import { useEffect, useRef, useState } from 'react';

/**
 * Gestiona el comportamiento de auto-scroll de un contenedor de mensajes:
 * baja al final al cargar/llegar mensajes nuevos (si el usuario ya estaba
 * cerca del final), resetea al cambiar de conversación, y expone si mostrar
 * el botón "ir al final".
 */
export function useAutoScroll(
  scrollContainerRef: React.RefObject<HTMLDivElement | null>,
  messagesEndRef: React.RefObject<HTMLDivElement | null>,
  displayMessages: unknown[],
  resetKey: unknown,
) {
  const [showScrollButton, setShowScrollButton] = useState(false);
  const isInitialLoad = useRef(true);
  const lastResetKey = useRef(resetKey);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const isNearBottom = () => {
    const el = scrollContainerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 200;
  };

  // Auto-scroll to bottom when messages change (always on initial load, then only if near bottom).
  // El reset de isInitialLoad se resuelve aquí mismo (comparando resetKey) para que quede
  // aplicado antes de decidir el tipo de scroll, sin depender del orden entre dos efectos separados.
  useEffect(() => {
    if (resetKey !== lastResetKey.current) {
      lastResetKey.current = resetKey;
      isInitialLoad.current = true;
    }
    if (displayMessages.length === 0) return;
    if (isInitialLoad.current) {
      scrollToBottom('instant');
      isInitialLoad.current = false;
    } else if (isNearBottom()) {
      scrollToBottom();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayMessages, resetKey]);

  // Track scroll position to show/hide the scroll-to-bottom button
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const handleScroll = () => {
      setShowScrollButton(!isNearBottom());
    };
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-scroll when images load and expand the container (if near bottom)
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      if (isNearBottom()) scrollToBottom('instant');
    });
    const images = el.querySelectorAll('img');
    images.forEach((img) => observer.observe(img));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayMessages]);

  return { showScrollButton, scrollToBottom };
}
