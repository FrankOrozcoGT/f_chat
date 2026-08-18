import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';

/**
 * Selección de archivo adjunto (imagen o documento) del input oculto de
 * MessageInput: mantiene el File, la preview URL cuando aplica, y expone
 * los handlers para abrir el picker en modo imagen o modo archivo genérico.
 */
export function useFileAttachment() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      if (file.type.startsWith('image/')) {
        setFilePreviewUrl(URL.createObjectURL(file));
      }
    }
  };

  const openImagePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = 'image/*';
      fileInputRef.current.click();
    }
  };

  const openFilePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = '*/*';
      fileInputRef.current.click();
    }
  };

  return {
    selectedFile,
    filePreviewUrl,
    fileInputRef,
    clearFileSelection,
    handleFileSelect,
    openImagePicker,
    openFilePicker,
  };
}
