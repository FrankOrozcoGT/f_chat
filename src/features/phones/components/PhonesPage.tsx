import { useState, useCallback } from 'react';
import { Smartphone, AlertCircle, Loader2, Plus } from 'lucide-react';
import { MainLayout } from '@/layouts/MainLayout';
import { useGetPhones } from '../api/useGetPhones';
import { useToast } from '@/shared/hooks/useToast';
import { Toast } from '@/shared/ui/Toast';
import { Button } from '@/shared/ui/Button';
import { PhoneCard } from './PhoneCard';
import { CreatePhoneModal } from './CreatePhoneModal';
import { PhoneSyncModal } from './PhoneSyncModal';
import { useSocketEvent } from '@/lib/websocket';
import type { PhoneSyncingPayload, PhoneSyncProgressPayload, PhoneSyncCompletePayload } from '@/lib/websocket';

export const PhonesPage = () => {
  const { data: phones, isLoading, isError, error } = useGetPhones();
  const { toasts, showToast, removeToast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Sync modal state
  const [syncModal, setSyncModal] = useState<{
    isOpen: boolean;
    phase: 'syncing' | 'progress' | 'complete';
    contactsCount: number;
    phoneId: string | null;
  }>({ isOpen: false, phase: 'syncing', contactsCount: 0, phoneId: null });

  const closeSyncModal = useCallback(() => {
    setSyncModal({ isOpen: false, phase: 'syncing', contactsCount: 0, phoneId: null });
  }, []);

  useSocketEvent<PhoneSyncingPayload>('phone:syncing', useCallback((data) => {
    setSyncModal({ isOpen: true, phase: 'syncing', contactsCount: data.contactsCount, phoneId: data.phoneId });
  }, []));

  useSocketEvent<PhoneSyncProgressPayload>('phone:sync_progress', useCallback((data) => {
    setSyncModal((prev) => ({ ...prev, isOpen: true, phase: 'progress', contactsCount: data.contactsCount, phoneId: data.phoneId }));
  }, []));

  useSocketEvent<PhoneSyncCompletePayload>('phone:sync_complete', useCallback((data) => {
    setSyncModal((prev) => ({ ...prev, isOpen: true, phase: 'complete', contactsCount: data.contactsCount, phoneId: data.phoneId }));
  }, []));

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={32} className="text-accent-blue animate-spin" />
            <p className="text-text-secondary">Cargando instancias...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (isError) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="flex flex-col items-center gap-3 text-center">
            <AlertCircle size={48} className="text-accent-red" />
            <h2 className="text-xl font-semibold text-text-primary">
              Error al cargar instancias
            </h2>
            <p className="text-text-secondary max-w-md">
              {error instanceof Error
                ? error.message
                : 'No se pudieron cargar las instancias de WhatsApp. Por favor, intenta de nuevo.'}
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const emptyState = (
    <div className="bg-bg-secondary rounded-lg border border-border-primary p-8 md:p-12 text-center max-w-md mx-auto">
      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-accent-blue/10 flex items-center justify-center mx-auto mb-4">
        <Smartphone size={32} className="text-accent-blue" />
      </div>
      <h3 className="text-lg md:text-xl font-medium text-text-primary mb-2">
        No hay teléfonos conectados
      </h3>
      <p className="text-sm md:text-base text-text-secondary mb-6">
        Crea tu primera instancia de WhatsApp para comenzar a gestionar conversaciones con
        clientes.
      </p>
      <Button
        variant="primary"
        size="lg"
        onClick={() => setIsCreateModalOpen(true)}
        className="w-full md:w-auto"
      >
        <Plus size={20} />
        Crear Primera Instancia
      </Button>
    </div>
  );

  return (
    <MainLayout>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-accent-blue/10 flex items-center justify-center">
              <Smartphone size={24} className="text-accent-blue" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-text-primary">
                Instancias WhatsApp
              </h1>
              <p className="text-sm md:text-base text-text-secondary mt-1">
                {phones?.length || 0} instancia{phones?.length !== 1 ? 's' : ''} registrada
                {phones?.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full md:w-auto"
          >
            <Plus size={20} />
            Nueva Instancia
          </Button>
        </div>

        {/* Grid de instancias */}
        {!phones || phones.length === 0 ? (
          emptyState
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-4 md:gap-6">
            {phones.map((phone) => (
              <PhoneCard key={phone.id} phone={phone} />
            ))}
          </div>
        )}
      </div>

      {/* Modal crear instancia */}
      <CreatePhoneModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          showToast('Instancia creada exitosamente', 'success');
        }}
      />

      {/* Modal sincronización — bloquea interacción durante sync */}
      <PhoneSyncModal
        isOpen={syncModal.isOpen}
        phase={syncModal.phase}
        contactsCount={syncModal.contactsCount}
        instanceName={phones?.find((p) => p.id === syncModal.phoneId)?.instanceName}
        onClose={closeSyncModal}
      />
    </MainLayout>
  );
};
