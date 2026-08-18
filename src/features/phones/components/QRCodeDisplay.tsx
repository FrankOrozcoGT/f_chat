import { useState, useEffect, useCallback } from 'react';
import { QrCode, Loader2 } from 'lucide-react';
import QRCodeLib from 'qrcode';
import { useSocketEvent } from '@/lib/websocket';
import type { PhoneQRUpdatedPayload, PhoneStatusChangedPayload } from '@/lib/websocket';
import type { PhoneStatus } from '@/features/phones/types';
import { getErrorMessage } from '@/shared/lib/errors';

interface QRCodeDisplayProps {
  phoneId: string;
  initialQR: string;
  status: PhoneStatus;
  onStatusChange?: (status: PhoneStatus) => void;
}

export const QRCodeDisplay = ({
  phoneId,
  initialQR,
  status,
  onStatusChange,
}: QRCodeDisplayProps) => {
  const [qrCodeImage, setQrCodeImage] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generar QR Code como imagen desde el string
  useEffect(() => {
    const generateQRImage = async () => {
      try {
        setIsGenerating(true);
        setError(null);

        // Si ya es una imagen base64, usarla directamente
        if (initialQR?.startsWith('data:image/')) {
          setQrCodeImage(initialQR);
          return;
        }

        // Si es un string, generar la imagen QR
        const qrDataURL = await QRCodeLib.toDataURL(initialQR, {
          width: 400,
          margin: 2,
          errorCorrectionLevel: 'M',
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        });

        setQrCodeImage(qrDataURL);
      } catch (err) {
        setError(getErrorMessage(err, 'Error al generar código QR'));
      } finally {
        setIsGenerating(false);
      }
    };

    if (initialQR) {
      generateQRImage();
    }
  }, [initialQR]);

  // WebSocket listeners para actualizaciones en tiempo real
  useSocketEvent<PhoneQRUpdatedPayload>('phone:qr_updated', useCallback(async (data) => {
    if (data.phoneId !== phoneId) return;
    try {
      const qrDataURL = await QRCodeLib.toDataURL(data.qrCode, {
        width: 400,
        margin: 2,
        errorCorrectionLevel: 'M',
      });
      setQrCodeImage(qrDataURL);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err, 'Error al generar código QR'));
    }
  }, [phoneId]));

  useSocketEvent<PhoneStatusChangedPayload>('phone:status_changed', useCallback((data) => {
    if (data.phoneId === phoneId && onStatusChange) {
      onStatusChange(data.status);
    }
  }, [phoneId, onStatusChange]));

  if (status === 'connected') {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-6 bg-accent-green/10 border border-accent-green/20 rounded-lg">
        <div className="w-16 h-16 rounded-full bg-accent-green/20 flex items-center justify-center">
          <QrCode size={32} className="text-accent-green" />
        </div>
        <p className="text-center text-text-primary font-medium">¡Teléfono conectado!</p>
        <p className="text-center text-sm text-text-secondary">
          El teléfono se conectó exitosamente a WhatsApp
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* QR Code Image */}
      <div className="relative bg-white p-4 rounded-lg border-2 border-border-primary">
        {isGenerating ? (
          <div className="w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={32} className="text-accent-blue animate-spin" />
              <p className="text-sm text-text-secondary">Generando código QR...</p>
            </div>
          </div>
        ) : error ? (
          <div className="w-64 h-64 md:w-80 md:h-80 flex items-center justify-center bg-accent-red/10 text-center p-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-accent-red">Error al generar QR</p>
              <p className="text-xs text-text-secondary">{error}</p>
            </div>
          </div>
        ) : (
          <img
            src={qrCodeImage}
            alt="WhatsApp QR Code"
            className="w-64 h-64 md:w-80 md:h-80"
            style={{ imageRendering: 'pixelated' }}
          />
        )}
      </div>

      {/* Instructions */}
      <div className="text-center space-y-2 max-w-md">
        <p className="text-sm font-medium text-text-primary">Escanea este código con WhatsApp</p>
        <ol className="text-xs text-text-secondary text-left space-y-1 pl-4">
          <li>1. Abre WhatsApp en tu teléfono</li>
          <li>2. Ve a Menú → Dispositivos vinculados</li>
          <li>3. Toca "Vincular un dispositivo"</li>
          <li>4. Escanea este código QR</li>
        </ol>
      </div>

      {/* Info sobre actualización automática */}
      {status === 'pending' && (
        <div className="text-xs text-text-tertiary text-center">
          El código se actualiza automáticamente cada ~60s
        </div>
      )}
    </div>
  );
};
