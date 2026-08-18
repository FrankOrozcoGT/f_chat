import { useToast } from '@/shared/hooks/useToast';
import { usePhoneReconnectStore } from '@/features/phones/store';
import { useSendMessage } from '../api/useSendMessage';
import { useSendMessageWithFile } from '../api/useSendMessageWithFile';
import type { SendErrorType } from '../api/optimisticSend';
import type { BackendMessageType } from '../types';

const MAX_MESSAGE_LENGTH = 4096;
const MAX_FILE_SIZE_BYTES = 16 * 1024 * 1024;

const ALLOWED_FILE_MIMES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'video/mp4', 'video/mpeg',
  'audio/mpeg', 'audio/ogg', 'audio/wav',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

function resolveFileType(mimeType: string): Exclude<BackendMessageType, 'text'> {
  if (mimeType.startsWith('image/')) return 'image';
  // NOTE: Backend expects "image" for both images AND videos
  if (mimeType.startsWith('video/')) return 'image';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'document';
}

interface SendTextParams {
  content: string;
  quotedMessageId?: string;
}

interface SendFileParams {
  file: File | Blob;
  caption: string;
}

/**
 * Orquesta el envío de mensajes (texto, archivo, audio grabado) incluyendo
 * validación de longitud/tamaño/mime y el manejo unificado de errores
 * (créditos agotados, teléfono desconectado, genérico).
 */
export function useMessageSend(conversationId: string) {
  const { showToast } = useToast();
  const { openModal: openDisconnectedModal, isDismissed } = usePhoneReconnectStore();

  const handleSendError = (errorType: SendErrorType | undefined, isFile: boolean) => {
    if (errorType === 'phone_disconnected') {
      if (!isDismissed()) {
        openDisconnectedModal();
      } else {
        showToast('El teléfono está desconectado.', 'error');
      }
    } else if (errorType === 'credits_limit') {
      showToast('Sin créditos disponibles. Has alcanzado el límite de tu plan.', 'error');
    } else {
      showToast(isFile ? 'Error al enviar el archivo. Intenta nuevamente.' : 'Error al enviar el mensaje. Intenta nuevamente.', 'error');
    }
  };

  const sendMessageMutation = useSendMessage(conversationId, {
    onError: (_error, errorType) => handleSendError(errorType, false),
  });
  const sendMessageWithFileMutation = useSendMessageWithFile(conversationId, {
    onError: (_error, errorType) => handleSendError(errorType, true),
  });

  const isPending = sendMessageMutation.isPending || sendMessageWithFileMutation.isPending;

  const sendText = ({ content, quotedMessageId }: SendTextParams): boolean => {
    if (content.length > MAX_MESSAGE_LENGTH) {
      showToast(`El mensaje no puede exceder ${MAX_MESSAGE_LENGTH} caracteres`, 'error');
      return false;
    }
    sendMessageMutation.mutate({
      conversationId,
      contenido: content,
      tipo: 'text',
      mediaUrl: null,
      quotedMessageId,
    });
    return true;
  };

  const sendAudio = ({ file, caption }: SendFileParams): boolean => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      showToast('El audio no puede exceder 16MB', 'error');
      return false;
    }
    sendMessageWithFileMutation.mutate({
      file,
      conversationId,
      tipo: 'audio',
      contenido: caption || undefined,
    });
    return true;
  };

  const sendFile = ({ file, caption }: SendFileParams): boolean => {
    if (file instanceof File && !ALLOWED_FILE_MIMES.includes(file.type)) {
      showToast('Tipo de archivo no permitido', 'error');
      return false;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      showToast('El archivo no puede exceder 16MB', 'error');
      return false;
    }
    const tipo = file instanceof File ? resolveFileType(file.type) : 'document';
    sendMessageWithFileMutation.mutate({
      file,
      conversationId,
      tipo,
      contenido: caption || undefined,
    });
    return true;
  };

  return { sendText, sendAudio, sendFile, isPending };
}
