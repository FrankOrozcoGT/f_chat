// Zustand store for phone reconnect state
// Tracks latest QR code received via WebSocket and dismiss cooldown

import { create } from 'zustand';

const DISMISS_KEY = 'phone_reconnect_dismissed_at';
const DISMISS_DURATION_MS = 60 * 60 * 1000; // 1 hour

interface PhoneReconnectState {
  /** Latest QR code string received from phone:qr_updated */
  latestQR: string | null;
  /** Phone ID associated with the latest QR */
  latestQRPhoneId: string | null;
  /** Whether the disconnected modal is visible */
  showModal: boolean;

  setLatestQR: (phoneId: string, qrCode: string) => void;
  clearQR: () => void;
  openModal: () => void;
  closeModal: () => void;
  /** Dismiss and don't show again for 1 hour */
  dismissFor1Hour: () => void;
  /** Check if currently within the dismiss cooldown */
  isDismissed: () => boolean;
}

export const usePhoneReconnectStore = create<PhoneReconnectState>((set) => ({
  latestQR: null,
  latestQRPhoneId: null,
  showModal: false,

  setLatestQR: (phoneId, qrCode) => set({ latestQR: qrCode, latestQRPhoneId: phoneId }),
  clearQR: () => set({ latestQR: null, latestQRPhoneId: null, showModal: false }),
  openModal: () => set({ showModal: true }),
  closeModal: () => set({ showModal: false }),

  dismissFor1Hour: () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    set({ showModal: false });
  },

  isDismissed: () => {
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (!dismissedAt) return false;
    return Date.now() - parseInt(dismissedAt, 10) < DISMISS_DURATION_MS;
  },
}));
