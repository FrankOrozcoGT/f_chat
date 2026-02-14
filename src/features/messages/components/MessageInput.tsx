// Message input component - Task 5: Send messages
// Mobile-first design with touch-friendly button
// Enter to send, Shift+Enter for new line
// Validations: not empty, max 4096 chars
// Support: text, image, video, audio, document

import { useState, useRef } from 'react';
import type { KeyboardEvent, ChangeEvent } from 'react';
import { Send, Image, Paperclip, Mic, X, Trash2, Square } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { InfoBanner } from '@/shared/ui/InfoBanner';
import { useToast } from '@/shared/hooks/useToast';
import { useSendMessage } from '../api/useSendMessage';
import { useSendMessageWithFile } from '../api/useSendMessageWithFile';
import type { BackendMessageType } from '../types';

interface MessageInputProps {
  conversationId: string;
  disabled?: boolean;
}

export const MessageInput = ({ conversationId, disabled }: MessageInputProps) => {
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isCancelledRef = useRef(false);
  const { showToast } = useToast();
  const sendMessageMutation = useSendMessage(conversationId, {
    onError: () => {
      showToast('Error al enviar el mensaje. Intenta nuevamente.', 'error');
    },
  });
  const sendMessageWithFileMutation = useSendMessageWithFile(conversationId, {
    onError: () => {
      showToast('Error al enviar el archivo. Intenta nuevamente.', 'error');
    },
  });

  const handleSend = async () => {
    const trimmedMessage = message.trim();

    // Validation: not empty (text or file required)
    if (!trimmedMessage && !selectedFile && !recordedAudio) return;

    // Validation: max 4096 characters for text
    if (trimmedMessage.length > 4096) {
      showToast('El mensaje no puede exceder 4096 caracteres', 'error');
      return;
    }

    // Handle recorded audio (use send-with-file endpoint)
    if (recordedAudio) {
      // Validate file size (max 16MB for backend)
      if (recordedAudio.size > 16 * 1024 * 1024) {
        showToast('El audio no puede exceder 16MB', 'error');
        return;
      }

      sendMessageWithFileMutation.mutate({
        file: recordedAudio,
        conversationId,
        tipo: 'audio',
        contenido: trimmedMessage || undefined,
      });

      // Clear inputs
      setMessage('');
      clearAudioRecording();
      return;
    }

    // Handle selected file (use send-with-file endpoint)
    if (selectedFile) {
      // Validate MIME type (backend only accepts specific types)
      const allowedMimes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/mpeg',
        'audio/mpeg', 'audio/ogg', 'audio/wav',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      if (!allowedMimes.includes(selectedFile.type)) {
        showToast('Tipo de archivo no permitido', 'error');
        return;
      }

      // Validate file size (max 16MB for backend)
      if (selectedFile.size > 16 * 1024 * 1024) {
        showToast('El archivo no puede exceder 16MB', 'error');
        return;
      }

      // Determine type from file MIME type
      // NOTE: Backend expects "image" for both images AND videos
      let tipo: Exclude<BackendMessageType, 'text'> = 'document';
      if (selectedFile.type.startsWith('image/')) {
        tipo = 'image';
      } else if (selectedFile.type.startsWith('video/')) {
        tipo = 'image'; // Videos use "image" type in backend
      } else if (selectedFile.type.startsWith('audio/')) {
        tipo = 'audio';
      } else if (
        selectedFile.type === 'application/pdf' ||
        selectedFile.type === 'application/msword' ||
        selectedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        tipo = 'document';
      }

      sendMessageWithFileMutation.mutate({
        file: selectedFile,
        conversationId,
        tipo,
        contenido: trimmedMessage || undefined,
      });

      // Clear inputs
      setMessage('');
      clearFileSelection();
      return;
    }

    // Handle text-only message (use send endpoint)
    sendMessageMutation.mutate({
      conversationId,
      contenido: trimmedMessage,
      tipo: 'text',
      mediaUrl: null,
    });

    // Clear inputs
    setMessage('');
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

  const clearAudioRecording = () => {
    setRecordedAudio(null);
    setRecordingTime(0);
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
      audioPreviewRef.current = null;
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

  const handleVoiceClick = async () => {
    if (isRecording) {
      // Stop recording
      stopRecording();
    } else {
      // Start recording
      await startRecording();
    }
  };

  const startRecording = async () => {
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      isCancelledRef.current = false;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Only save audio if NOT cancelled and we have chunks
        if (!isCancelledRef.current && audioChunksRef.current.length > 0) {
          // Create audio blob FIRST (before stopping tracks)
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

          // Store recorded audio for preview
          setRecordedAudio(audioBlob);
        }

        // THEN stop all tracks (after blob is created)
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        setIsRecording(false);

        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
          recordingIntervalRef.current = null;
        }
      };

      // Start recording (no timeslice = single chunk on stop)
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          // Auto-stop after 60 seconds
          if (prev >= 60) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      showToast('No se pudo acceder al micrófono', 'error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };


  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Enter to send, Shift+Enter for new line (not applicable in input, but keep for textarea upgrade)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isDisabled = disabled || sendMessageMutation.isPending || sendMessageWithFileMutation.isPending;

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
            onClick={() => {
              // Set cancellation flag BEFORE stopping
              isCancelledRef.current = true;

              // Stop recording (onstop will check the flag and NOT save)
              stopRecording();
            }}
            className="min-h-11 min-w-11 flex items-center justify-center rounded-full bg-bg-tertiary hover:bg-accent-red hover:bg-opacity-10 transition-colors"
            title="Cancelar grabación"
          >
            <Trash2 className="w-5 h-5 text-text-secondary" />
          </button>

          {/* Recording indicator */}
          <div className="flex-1 flex items-center gap-2">
            <div className="w-2 h-2 bg-accent-red rounded-full animate-pulse" />
            <span className="text-sm font-medium text-text-primary">
              {formatTime(recordingTime)}
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
            maxLength={4096}
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
            onKeyDown={handleKeyDown}
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
            maxLength={4096}
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
            onClick={handleVoiceClick}
            disabled={isDisabled}
            className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full hover:bg-bg-tertiary transition-colors disabled:opacity-50"
            title="Grabar audio"
          >
            <Mic className="w-5 h-5 md:w-5 md:h-5 text-text-secondary" />
          </button>
        </div>

        {/* Text input - more compact on mobile */}
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isDisabled}
          placeholder="Escribe un mensaje..."
          className="
            flex-1 h-9 md:h-10 px-3 md:px-4 rounded-full md:rounded-lg
            bg-bg-primary border border-border-primary
            text-sm md:text-base placeholder:text-text-tertiary
            focus:border-accent-blue focus:outline-2 focus:outline-accent-blue
            disabled:opacity-60 disabled:cursor-not-allowed
            transition-colors
          "
          maxLength={4096}
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
