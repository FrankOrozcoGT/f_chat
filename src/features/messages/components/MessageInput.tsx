// Message input component - Task 5: Send messages
// Mobile-first design with touch-friendly button
// Enter to send, Shift+Enter for new line

import { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent, ChangeEvent } from 'react';
import { Send, Image, Paperclip, Mic, X, Trash2, Square, Reply } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { InfoBanner } from '@/shared/ui/InfoBanner';
import { useMessageSend } from '../hooks/useMessageSend';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import type { Message } from '../types';

const MAX_MESSAGE_LENGTH = 4096;

interface MessageInputProps {
  conversationId: string;
  disabled?: boolean;
  quotedMessage?: Message | null;
  onCancelQuote?: () => void;
}

function formatRecordingTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export const MessageInput = ({ conversationId, disabled, quotedMessage, onCancelQuote }: MessageInputProps) => {
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const clearFileSelection = () => {
    setSelectedFile(null);
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
      setFilePreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);

      // Create preview URL for images
      if (file.type.startsWith('image/')) {
        const previewUrl = URL.createObjectURL(file);
        setFilePreviewUrl(previewUrl);
      }
    }
  };

  const handleImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = 'image/*';
      fileInputRef.current.click();
    }
  };

  const handleFileClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = '*/*';
      fileInputRef.current.click();
    }
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

  // Recording mode: full width voice UI
  if (isRecording) {
    return (
      <div className="p-3 md:p-4 border-t border-border-primary bg-bg-secondary">
        <div className="flex items-center gap-3">
          {/* Cancel button */}
          <button
            onClick={cancelRecording}
            className="min-h-11 min-w-11 flex items-center justify-center rounded-full bg-bg-tertiary hover:bg-accent-red hover:bg-opacity-10 transition-colors"
            title="Cancelar grabación"
          >
            <Trash2 className="w-5 h-5 text-text-secondary" />
          </button>

          {/* Recording indicator */}
          <div className="flex-1 flex items-center gap-2">
            <div className="w-2 h-2 bg-accent-red rounded-full animate-pulse" />
            <span className="text-sm font-medium text-text-primary">
              {formatRecordingTime(recordingTime)}
            </span>
            <div className="flex-1 h-1 bg-bg-tertiary rounded-full overflow-hidden">
              <div
                className="h-full bg-accent-red transition-all duration-300"
                style={{ width: `${(recordingTime / 60) * 100}%` }}
              />
            </div>
          </div>

          {/* Stop button */}
          <button
            onClick={stopRecording}
            className="min-h-11 min-w-11 flex items-center justify-center rounded-full bg-accent-blue hover:bg-opacity-90 transition-colors"
            title="Detener grabación"
          >
            <Square className="w-5 h-5 text-white fill-white" />
          </button>
        </div>
      </div>
    );
  }

  // Audio preview mode
  if (recordedAudio) {
    const audioUrl = URL.createObjectURL(recordedAudio);

    return (
      <div className="p-3 md:p-4 border-t border-border-primary bg-bg-secondary space-y-2">
        {/* Audio player with delete button */}
        <div className="flex items-center gap-2">
          <button
            onClick={clearAudioRecording}
            className="shrink-0 text-text-tertiary hover:text-accent-red transition-colors"
            title="Eliminar audio"
          >
            <Trash2 className="w-5 h-5" />
          </button>

          {/* Native audio player */}
          <audio
            src={audioUrl}
            controls
            className="flex-1 max-w-full"
            style={{ height: '40px' }}
          />
        </div>

        {/* Caption input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Agregar un mensaje..."
            className="
              flex-1 min-h-11 px-3 py-2 rounded-lg
              bg-bg-primary border border-border-primary
              text-sm text-text-primary placeholder:text-text-tertiary
              focus:border-accent-blue focus:outline-2 focus:outline-accent-blue
              transition-colors
            "
            maxLength={MAX_MESSAGE_LENGTH}
          />
          <Button
            onClick={handleSend}
            disabled={isDisabled}
            variant="primary"
            size="md"
            className="min-h-11 min-w-11 px-3 shrink-0"
            title="Enviar audio"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    );
  }

  // File preview mode
  if (selectedFile) {
    return (
      <div className="p-3 md:p-4 border-t border-border-primary bg-bg-secondary space-y-2">
        {/* Image preview */}
        {filePreviewUrl && (
          <div className="relative w-full max-w-xs mx-auto md:mx-0">
            <img
              src={filePreviewUrl}
              alt="Preview"
              className="w-full h-auto max-h-48 md:max-h-64 object-contain rounded-lg border border-border-primary bg-bg-primary"
            />
            <button
              onClick={clearFileSelection}
              className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-bg-primary bg-opacity-90 hover:bg-opacity-100 transition-colors shadow-lg"
              title="Eliminar"
            >
              <X className="w-4 h-4 text-text-secondary" />
            </button>
          </div>
        )}

        {/* File info for non-images */}
        {!filePreviewUrl && (
          <div className="flex items-center gap-2 p-2 bg-bg-primary rounded-lg border border-border-primary">
            <Paperclip className="w-5 h-5 text-text-tertiary shrink-0" />
            <span className="text-sm text-text-secondary flex-1 truncate">
              {selectedFile.name}
            </span>
            <button
              onClick={clearFileSelection}
              className="text-text-tertiary hover:text-accent-red transition-colors shrink-0"
              title="Eliminar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Caption input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e as unknown as KeyboardEvent<HTMLTextAreaElement>)}
            disabled={isDisabled}
            placeholder="Agregar un mensaje..."
            className="
              flex-1 min-h-11 px-3 md:px-4 rounded-lg
              bg-bg-primary border border-border-primary
              text-sm md:text-base placeholder:text-text-tertiary
              focus:border-accent-blue focus:outline-2 focus:outline-accent-blue
              disabled:opacity-60 disabled:cursor-not-allowed
              transition-colors
            "
            maxLength={MAX_MESSAGE_LENGTH}
          />
          <Button
            onClick={handleSend}
            disabled={isDisabled}
            size="md"
            className="min-h-11 min-w-11 px-3 shrink-0"
            title="Enviar"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
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
            onClick={handleImageClick}
            disabled={isDisabled}
            className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full hover:bg-bg-tertiary transition-colors disabled:opacity-50"
            title="Enviar imagen"
          >
            <Image className="w-5 h-5 md:w-5 md:h-5 text-text-secondary" />
          </button>
          <button
            onClick={handleFileClick}
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
