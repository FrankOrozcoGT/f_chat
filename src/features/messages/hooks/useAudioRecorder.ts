import { useRef, useState } from 'react';
import { useToast } from '@/shared/hooks/useToast';

const MAX_RECORDING_SECONDS = 60;

/**
 * Encapsula el ciclo de vida de grabación de audio vía MediaRecorder:
 * pedir permiso de micrófono, grabar, cancelar, y exponer el blob resultante
 * para preview/envío. Aislado del resto de MessageInput porque usa una API
 * del navegador completamente distinta (MediaRecorder) al resto del input.
 */
export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isCancelledRef = useRef(false);
  const { showToast } = useToast();

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const cancelRecording = () => {
    isCancelledRef.current = true;
    stopRecording();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

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

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= MAX_RECORDING_SECONDS) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch {
      showToast('No se pudo acceder al micrófono', 'error');
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      await startRecording();
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

  return {
    isRecording,
    recordingTime,
    recordedAudio,
    toggleRecording,
    stopRecording,
    cancelRecording,
    clearAudioRecording,
  };
}
