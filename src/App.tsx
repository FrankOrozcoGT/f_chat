import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { LoginPage } from '@/features/auth/components/LoginPage';
import { DashboardPage } from '@/features/dashboard/components/DashboardPage';
import { UsersPage } from '@/features/users/components/UsersPage';
import { CostsPage } from '@/features/costs/components/CostsPage';
import { PhonesPage } from '@/features/phones/components/PhonesPage';
import { ConversationsPage } from '@/features/conversations/components/ConversationsPage';
import { ProtectedRoute } from '@/shared/components/ProtectedRoute';
import { Toast, ToastContainer } from '@/shared/ui/Toast';
import { useToast } from '@/shared/hooks/useToast';
import { socket } from '@/lib/websocket';
import type { ConversationHitlPayload, ApiDownPayload, ApiUpPayload } from '@/lib/websocket';
import { conversationKeys } from '@/features/conversations/api/conversationKeys';
import { messageKeys } from '@/features/messages/api/messageKeys';
import { useGetMe } from '@/features/auth/api';

/** Redirige según el rol del usuario autenticado */
const DefaultRedirect = () => {
  const { data: user, isLoading } = useGetMe();

  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'free') return <Navigate to="/dashboard" replace />;
  return <Navigate to="/conversations" replace />;
};

// Module-level guard: inicializar WebSocket solo una vez por app load
// Referencia: https://react.dev/learn/you-might-not-need-an-effect#initializing-the-application
let didInitWebSocket = false;

function App() {
  const queryClient = useQueryClient();
  const { toasts, showToast, removeToast } = useToast();

  useEffect(() => {
    // Inicializar solo UNA VEZ por app load (no por component mount)
    if (didInitWebSocket) return;
    didInitWebSocket = true;

    // Conectar socket
    socket.connect();

    // Event listeners de conexión
    function onConnect() {
      console.log('[WebSocket] Connected:', socket.id);
    }

    function onDisconnect() {
      console.log('[WebSocket] Disconnected');
    }

    function onConnectError(error: Error) {
      console.error('[WebSocket] Connection error:', error.message);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
  }, []);

  // Global HITL notification listener
  useEffect(() => {
    const handleHitl = (data: ConversationHitlPayload) => {
      console.log('[HITL] Event received:', data);
      // Reproducir sonido de notificación
      const audio = new Audio('/sounds/hitl-notification.wav');
      audio.play().catch(() => {
        console.warn('[HITL] Could not play notification sound');
      });

      // Invalidar queries para que la UI refleje el cambio de mode
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: messageKeys.detail(data.conversationId) });

      // Mostrar toast global
      showToast(`Cliente ${data.clientPhone} solicita hablar con un humano`, 'info');
    };

    socket.on('conversation:hitl', handleHitl);

    return () => {
      socket.off('conversation:hitl', handleHitl);
    };
  }, [queryClient, showToast]);

  // Global Health alerts listener
  useEffect(() => {
    const handleApiDown = (data: ApiDownPayload) => {
      console.log('[Health] API down:', data);
      showToast(`${data.apiName} no está disponible: ${data.error}`, 'error');
    };

    const handleApiUp = (data: ApiUpPayload) => {
      console.log('[Health] API recovered:', data);
      showToast(`${data.apiName} recuperada`, 'success');
    };

    socket.on('api:down', handleApiDown);
    socket.on('api:up', handleApiUp);

    return () => {
      socket.off('api:down', handleApiDown);
      socket.off('api:up', handleApiUp);
    };
  }, [showToast]);

  return (
    <>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requiredRole="free">
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Admin routes */}
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requiredRole="admin">
                <UsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/costs"
            element={
              <ProtectedRoute requiredRole="admin">
                <CostsPage />
              </ProtectedRoute>
            }
          />

          {/* Phones routes */}
          <Route
            path="/phones"
            element={
              <ProtectedRoute requiredRole="full">
                <PhonesPage />
              </ProtectedRoute>
            }
          />

          {/* Conversations routes */}
          <Route
            path="/conversations"
            element={
              <ProtectedRoute requiredRole="full">
                <ConversationsPage />
              </ProtectedRoute>
            }
          />

          {/* Default redirect según rol */}
          <Route path="/" element={<DefaultRedirect />} />
        </Routes>
      </BrowserRouter>

      {/* HITL notification toasts (global) */}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={10000}
          onClose={() => removeToast(toast.id)}
        />
      ))}

      {/* Toast notifications */}
      <ToastContainer />
    </>
  );
}

export default App;
