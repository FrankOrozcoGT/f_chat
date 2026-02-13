import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '@/features/auth/components/LoginPage';
import { DashboardPage } from '@/features/dashboard/components/DashboardPage';
import { UsersPage } from '@/features/users/components/UsersPage';
import { PhonesPage } from '@/features/phones/components/PhonesPage';
import { ConversationsPage } from '@/features/conversations/components/ConversationsPage';
import { ProtectedRoute } from '@/shared/components/ProtectedRoute';
import { ToastContainer } from '@/shared/ui/Toast';
import { socket } from '@/lib/websocket';
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

      {/* Toast notifications */}
      <ToastContainer />
    </>
  );
}

export default App;
