import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

class WebSocketClient {
  private socket: Socket | null = null;

  connect(token?: string) {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(WS_URL, {
      auth: {
        token: token || localStorage.getItem('auth_token'),
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('[WebSocket] Connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    return this.socket;
  }

  emit(event: string, data?: unknown) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('[WebSocket] Not connected, cannot emit:', event);
    }
  }

  on(event: string, handler: (...args: unknown[]) => void) {
    if (this.socket) {
      this.socket.on(event, handler);
    }
  }

  off(event: string, handler?: (...args: unknown[]) => void) {
    if (this.socket) {
      this.socket.off(event, handler);
    }
  }
}

export const wsClient = new WebSocketClient();
