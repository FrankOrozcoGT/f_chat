import { useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { LoginPage } from '@/features/auth/components/LoginPage';
import { DashboardPage } from '@/features/dashboard/components/DashboardPage';
import { UsersPage } from '@/features/users/components/UsersPage';
import { CostsPage } from '@/features/costs/components/CostsPage';
import { PhonesPage } from '@/features/phones/components/PhonesPage';
import { ConversationsPage } from '@/features/conversations/components/ConversationsPage';
import { HealthPage } from '@/features/health/components/HealthPage';
import { FlowsPage } from '@/features/flows/components/FlowsPage';
import { AiSetupPage } from '@/features/ai-setup/components/AiSetupPage';
import { FlowReviewPage } from '@/features/ai-setup/components/FlowReviewPage';
import { SettingsPage } from '@/features/settings/components/SettingsPage';
import { TenantPage } from '@/features/tenants/components/TenantPage';
import { OrganizationsPage } from '@/features/tenants/components/OrganizationsPage';
import { AcceptInvitationPage } from '@/features/tenants/components/AcceptInvitationPage';
import { ProductsPage } from '@/features/catalog/products/components/ProductsPage';
import { PromotionsPage } from '@/features/catalog/promotions/components/PromotionsPage';
import { ShippingPage } from '@/features/catalog/shipping/components/ShippingPage';
import { ProtectedRoute } from '@/shared/components/ProtectedRoute';
import { ToastContainer } from '@/shared/ui/Toast';
import { useToast } from '@/shared/hooks/useToast';
import { socket, useSocketEvent } from '@/lib/websocket';
import type { ConversationHitlPayload, ApiDownPayload, ApiUpPayload, PhoneQRUpdatedPayload, PhoneStatusChangedPayload } from '@/lib/websocket';
import { MessageDirection, messageKeys } from '@/features/messages';
import type { MessageIncomingPayload } from '@/features/messages';
import { useGetMe } from '@/features/auth/api';
import { conversationKeys, useConversationsStore } from '@/features/conversations';
import { usePhoneReconnectStore } from '@/features/phones';

/** Listeners globales que requieren estar dentro de BrowserRouter (useNavigate) */
const GlobalListeners = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { setSelectedConversation } = useConversationsStore();

  useSocketEvent<MessageIncomingPayload>('message:incoming', useCallback((data) => {
    if (data.direction !== MessageDirection.Incoming) return;
    if (!data.content) return;

    const preview = `${data.content.slice(0, 60)}${data.content.length > 60 ? '...' : ''}`;
    showToast(
      data.conversationName ? `${data.conversationName}: ${preview}` : preview,
      'info',
      () => {
        setSelectedConversation(data.conversationId, 'individual');
        navigate('/conversations');
      }
    );
  }, [navigate, showToast, setSelectedConversation]));

  return null;
};

/** Redirige según el tenantRole/plan del usuario autenticado */
const DefaultRedirect = () => {
  const { data: me, isLoading } = useGetMe();

  if (isLoading) return null;
  if (!me) return <Navigate to="/login" replace />;

  // tecnico solo accede a flows
  if (me.tenantRole === 'tecnico') return <Navigate to="/flows" replace />;
  // owner y user con plan full van a conversations
  if (me.tenant.plan === 'full') return <Navigate to="/conversations" replace />;
  // free va a dashboard
  return <Navigate to="/dashboard" replace />;
};

// Module-level guard: inicializar WebSocket solo una vez por app load
// Referencia: https://react.dev/learn/you-might-not-need-an-effect#initializing-the-application
let didInitWebSocket = false;

function App() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  useEffect(() => {
    // Inicializar solo UNA VEZ por app load (no por component mount)
    if (didInitWebSocket) return;
    didInitWebSocket = true;

    // Conectar socket
    socket.connect();
  }, []);

  // Global HITL notification listener
  useSocketEvent<ConversationHitlPayload>('conversation:hitl', useCallback((data) => {
    // Reproducir sonido de notificación
    const audio = new Audio('/sounds/hitl-notification.wav');
    audio.play().catch(() => {});

    // Invalidar queries para que la UI refleje el cambio de mode
    queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
    queryClient.invalidateQueries({ queryKey: messageKeys.detail(data.conversationId) });

    // Mostrar toast global
    showToast(`Cliente ${data.clientPhone} solicita hablar con un humano`, 'info');
  }, [queryClient, showToast]));

  // Global phone:qr_updated & phone:status_changed listeners
  useSocketEvent<PhoneQRUpdatedPayload>('phone:qr_updated', useCallback((data) => {
    usePhoneReconnectStore.getState().setLatestQR(data.phoneId, data.qrCode);
  }, []));

  useSocketEvent<PhoneStatusChangedPayload>('phone:status_changed', useCallback((data) => {
    if (data.status === 'connected') {
      usePhoneReconnectStore.getState().clearQR();
    }
  }, []));

  // Global Health alerts listener
  useSocketEvent<ApiDownPayload>('api:down', useCallback((data) => {
    showToast(`${data.apiName} no está disponible: ${data.error}`, 'error');
  }, [showToast]));

  useSocketEvent<ApiUpPayload>('api:up', useCallback((data) => {
    showToast(`${data.apiName} recuperada`, 'success');
  }, [showToast]));

  return (
    <>
      <BrowserRouter>
        <GlobalListeners />
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/invitations/accept/:token" element={<AcceptInvitationPage />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requiredAccess="authenticated">
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Admin routes */}
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requiredAccess="super-admin">
                <UsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/costs"
            element={
              <ProtectedRoute requiredAccess="super-admin">
                <CostsPage />
              </ProtectedRoute>
            }
          />

          {/* Health routes - accesible para todos los usuarios autenticados */}
          <Route
            path="/admin/health"
            element={
              <ProtectedRoute requiredAccess="authenticated">
                <HealthPage />
              </ProtectedRoute>
            }
          />

          {/* Phones routes */}
          <Route
            path="/phones"
            element={
              <ProtectedRoute requiredAccess="full-plan">
                <PhonesPage />
              </ProtectedRoute>
            }
          />

          {/* Settings routes */}
          <Route
            path="/settings"
            element={
              <ProtectedRoute requiredAccess="authenticated">
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          {/* Conversations routes */}
          <Route
            path="/conversations"
            element={
              <ProtectedRoute requiredAccess="conversations">
                <ConversationsPage />
              </ProtectedRoute>
            }
          />

          {/* Flows routes */}
          <Route
            path="/flows"
            element={
              <ProtectedRoute requiredAccess="flows">
                <FlowsPage />
              </ProtectedRoute>
            }
          />

          {/* AI Setup routes */}
          <Route
            path="/ai-setup"
            element={
              <ProtectedRoute requiredAccess="ai-setup">
                <AiSetupPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai-setup/flows/:flowId"
            element={
              <ProtectedRoute requiredAccess="ai-setup">
                <FlowReviewPage />
              </ProtectedRoute>
            }
          />

          {/* Tenant management — owner only */}
          <Route
            path="/tenant"
            element={
              <ProtectedRoute requiredAccess="tenant-owner">
                <TenantPage />
              </ProtectedRoute>
            }
          />

          {/* Organizations — todos los usuarios autenticados */}
          <Route
            path="/organizations"
            element={
              <ProtectedRoute requiredAccess="authenticated">
                <OrganizationsPage />
              </ProtectedRoute>
            }
          />

          {/* CRM routes */}
          <Route
            path="/crm/catalog/products"
            element={
              <ProtectedRoute requiredAccess="conversations">
                <ProductsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/crm/catalog/promotions"
            element={
              <ProtectedRoute requiredAccess="conversations">
                <PromotionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/crm/catalog/shipping"
            element={
              <ProtectedRoute requiredAccess="conversations">
                <ShippingPage />
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
