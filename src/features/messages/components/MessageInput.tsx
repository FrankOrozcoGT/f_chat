// Message input component - Task 5: Send messages
// Mobile-first design with touch-friendly button
// Enter to send, Shift+Enter for new line

import { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import { Send, Image, Paperclip, Mic, X, Reply } from 'lucide-react';
import { InfoBanner } from '@/shared/ui/InfoBanner';
import { useMessageSend } from '@/features/messages/hooks/useMessageSend';
import { useAudioRecorder } from '@/features/messages/hooks/useAudioRecorder';
import { useFileAttachment } from '@/features/messages/hooks/useFileAttachment';
import { RecordingInput } from '@/features/messages/components/RecordingInput';
import { AudioPreviewInput } from '@/features/messages/components/AudioPreviewInput';
import { FilePreviewInput } from '@/features/messages/components/FilePreviewInput';
import type { Message } from '@/features/messages/types';

const MAX_MESSAGE_LENGTH = 4096;

interface MessageInputProps {
  conversationId: string;
  disabled?: boolean;
  quotedMessage?: Message | null;
  onCancelQuote?: () => void;
}

export const MessageInput = ({ conversationId, disabled, quotedMessage, onCancelQuote }: MessageInputProps) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { sendText, sendAudio, sendFile, isPending } = useMessageSend(conversationId);
  const {
    isRecording,
    recordingTime,
    recordedAudio,
    toggleRecording,
    stopRecording,
    cancelRecording,
    clearAudioRecording,
  } = useAudioRecorder();
  const {
    selectedFile,
    filePreviewUrl,
    fileInputRef,
    clearFileSelection,
    handleFileSelect,
    openImagePicker,
    openFilePicker,
  } = useFileAttachment();

  const handleSend = () => {
    const trimmedMessage = message.trim();

    // Validation: not empty (text or file required)
    if (!trimmedMessage && !selectedFile && !recordedAudio) return;

    if (recordedAudio) {
      if (!sendAudio({ file: recordedAudio, caption: trimmedMessage })) return;
      setMessage('');
      clearAudioRecording();
      onCancelQuote?.();
      return;
    }

    if (selectedFile) {
      if (!sendFile({ file: selectedFile, caption: trimmedMessage })) return;
      setMessage('');
      clearFileSelection();
      onCancelQuote?.();
      return;
    }

    if (!sendText({ content: trimmedMessage, quotedMessageId: quotedMessage?.id ?? undefined })) return;
    setMessage('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    onCancelQuote?.();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [message]);

  const isDisabled = disabled || isPending;

  // AI mode: show info banner instead of input
  if (disabled) {
    return (
      <div className="p-3 md:p-4 border-t border-border-primary bg-bg-secondary">
        <InfoBanner variant="ai">
          Esta conversación está siendo atendida por IA. El envío de mensajes está deshabilitado.
        </InfoBanner>
      </div>
    );
  }

  if (isRecording) {
    return <RecordingInput recordingTime={recordingTime} onCancel={cancelRecording} onStop={stopRecording} />;
  }

  if (recordedAudio) {
    return (
      <AudioPreviewInput
        audio={recordedAudio}
        message={message}
        onMessageChange={setMessage}
        onClear={clearAudioRecording}
        onSend={handleSend}
        disabled={isDisabled}
      />
    );
  }

  if (selectedFile) {
    return (
      <FilePreviewInput
        file={selectedFile}
        previewUrl={filePreviewUrl}
        message={message}
        onMessageChange={setMessage}
        onClear={clearFileSelection}
        onSend={handleSend}
        disabled={isDisabled}
      />
    );
  }

  // Default mode: text input with attachment buttons
  return (
    <div className="w-full p-2 md:p-3 border-t border-border-primary bg-bg-secondary">
      {/* Quoted message preview */}
      {quotedMessage && (
        <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-lg bg-bg-tertiary border-l-2 border-accent-blue">
          <Reply className="w-4 h-4 text-accent-blue shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-accent-blue">
              {quotedMessage.direction === 'incoming' ? 'Cliente' : 'Tú'}
            </p>
            <p className="text-xs text-text-secondary truncate">
              {quotedMessage.content || '📎 Archivo'}
            </p>
          </div>
          <button
            onClick={onCancelQuote}
            className="shrink-0 text-text-tertiary hover:text-text-primary transition-colors"
            title="Cancelar respuesta"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex gap-1 md:gap-2 items-center w-full">
        {/* Attachment buttons - compact on mobile */}
        <div className="flex gap-0.5 md:gap-1">
          <button
            onClick={openImagePicker}
            disabled={isDisabled}
            className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full hover:bg-bg-tertiary transition-colors disabled:opacity-50"
            title="Enviar imagen"
          >
            <Image className="w-5 h-5 md:w-5 md:h-5 text-text-secondary" />
          </button>
          <button
            onClick={openFilePicker}
            disabled={isDisabled}
            className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full hover:bg-bg-tertiary transition-colors disabled:opacity-50"
            title="Enviar archivo"
          >
            <Paperclip className="w-5 h-5 md:w-5 md:h-5 text-text-secondary" />
          </button>
          <button
            onClick={toggleRecording}
            disabled={isDisabled}
            className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full hover:bg-bg-tertiary transition-colors disabled:opacity-50"
            title="Grabar audio"
          >
            <Mic className="w-5 h-5 md:w-5 md:h-5 text-text-secondary" />
          </button>
        </div>

        {/* Text input - auto-resize textarea, Enter sends, Shift+Enter newline */}
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isDisabled}
          placeholder="Escribe un mensaje..."
          rows={1}
          className="
            flex-1 px-3 md:px-4 py-2 rounded-lg
            bg-bg-primary border border-border-primary
            text-base placeholder:text-text-tertiary
            resize-none overflow-y-auto
            min-h-9 md:min-h-10
            leading-snug
            focus:border-accent-blue focus:outline-2 focus:outline-accent-blue
            disabled:opacity-60 disabled:cursor-not-allowed
            transition-colors
          "
          maxLength={MAX_MESSAGE_LENGTH}
          style={{ maxHeight: '120px' }}
        />

        {/* Send button - compact on mobile */}
        <button
          onClick={handleSend}
          disabled={isDisabled || !message.trim()}
          className="w-9 h-9 md:w-10 md:h-10 shrink-0 flex items-center justify-center rounded-full bg-accent-blue hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          title="Enviar"
        >
          <Send className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};
