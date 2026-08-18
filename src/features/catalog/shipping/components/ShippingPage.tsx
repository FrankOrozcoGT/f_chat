import { useState } from 'react';
import { Truck, Pencil, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { useGetShippingLocations } from '@/features/catalog/shipping/api/useGetShippingLocations';
import { useCreateShippingLocation } from '@/features/catalog/shipping/api/useCreateShippingLocation';
import { useUpdateShippingLocation } from '@/features/catalog/shipping/api/useUpdateShippingLocation';
import { useDeleteShippingLocation } from '@/features/catalog/shipping/api/useDeleteShippingLocation';
import { useToast } from '@/shared/hooks/useToast';
import { getErrorMessage } from '@/shared/lib/errors';
import { useCrudModalState } from '@/shared/hooks/useCrudModalState';
import { CatalogPageLayout } from '@/shared/components/CatalogPageLayout';
import { Button } from '@/shared/ui/Button';
import { Table, type TableColumn } from '@/shared/ui/Table';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@/shared/ui/Modal';
import { ConfirmModal } from '@/shared/ui/ConfirmModal';
import { FormField } from '@/shared/ui/FormField';
import { Input } from '@/shared/ui/Input';
import { Badge } from '@/shared/ui/Badge';
import type { ShippingLocation, CreateShippingLocationDto, UpdateShippingLocationDto } from '@/features/catalog/shipping/types';

const emptyForm = { name: '', isFreeShipping: false, shippingCost: '' };

export const ShippingPage = () => {
  const { data: locations = [], isLoading, isError } = useGetShippingLocations();
  const createLocation = useCreateShippingLocation();
  const updateLocation = useUpdateShippingLocation();
  const deleteLocation = useDeleteShippingLocation();
  const { showToast } = useToast();

  const {
    modalOpen, editing, deleteTarget, setDeleteTarget, form, setForm,
    openCreate: openCreateBase, openEdit: openEditBase, closeModal,
  } = useCrudModalState<ShippingLocation, typeof emptyForm>(emptyForm, (location) => ({
    name: location.name,
    isFreeShipping: location.isFreeShipping,
    shippingCost: String(location.shippingCost),
  }));
  const [errors, setErrors] = useState<{ name?: string; shippingCost?: string }>({});

  const openCreate = () => {
    setErrors({});
    openCreateBase();
  };

  const openEdit = (location: ShippingLocation) => {
    setErrors({});
    openEditBase(location);
  };

  const validate = () => {
    const errs: { name?: string; shippingCost?: string } = {};
    if (!form.name.trim()) errs.name = 'El nombre es requerido';
    if (!form.isFreeShipping && (form.shippingCost === '' || isNaN(Number(form.shippingCost)) || Number(form.shippingCost) < 0))
      errs.shippingCost = 'Ingresa un costo válido';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const dto = {
      name: form.name.trim(),
      isFreeShipping: form.isFreeShipping,
      shippingCost: form.isFreeShipping ? 0 : Number(form.shippingCost),
    };

    try {
      if (editing) {
        await updateLocation.mutateAsync({ id: editing.id, dto: dto as UpdateShippingLocationDto });
        showToast('Ubicación actualizada', 'success');
      } else {
        await createLocation.mutateAsync(dto as CreateShippingLocationDto);
        showToast('Ubicación creada', 'success');
      }
      closeModal();
    } catch (error) {
      showToast(getErrorMessage(error, 'Error al guardar la ubicación'), 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteLocation.mutateAsync(deleteTarget.id);
      showToast('Ubicación eliminada', 'success');
    } catch (error) {
      showToast(getErrorMessage(error, 'Error al eliminar la ubicación'), 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  const isSubmitting = createLocation.isPending || updateLocation.isPending;

  const MobileCards = () => (
    <div className="md:hidden space-y-3">
      {locations.map((loc) => (
        <div key={loc.id} className="border border-border-primary rounded-lg p-4 bg-bg-secondary">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-bg-tertiary flex items-center justify-center shrink-0">
                <Truck size={16} className="text-text-secondary" />
              </div>
              <p className="font-medium text-text-primary text-sm">{loc.name}</p>
            </div>
            {loc.isFreeShipping ? (
              <Badge variant="success">Gratis</Badge>
            ) : (
              <span className="text-sm font-semibold text-text-primary">${loc.shippingCost.toLocaleString()}</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" className="flex-1 min-h-11" onClick={() => openEdit(loc)}>
              <Pencil size={14} /> Editar
            </Button>
            <Button variant="danger" size="sm" className="flex-1 min-h-11" onClick={() => setDeleteTarget(loc)}>
              <Trash2 size={14} /> Eliminar
            </Button>
          </div>
        </div>
      ))}
    </div>
  );

  const columns: TableColumn<ShippingLocation>[] = [
    {
      key: 'name',
      header: 'Ubicación',
      render: (loc) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-bg-tertiary flex items-center justify-center shrink-0">
            <Truck size={16} className="text-text-secondary" />
          </div>
          <span className="font-medium text-text-primary">{loc.name}</span>
        </div>
      ),
    },
    {
      key: 'isFreeShipping',
      header: 'Envío gratis',
      render: (loc) =>
        loc.isFreeShipping ? (
          <div className="flex items-center gap-1.5 text-accent-green">
            <CheckCircle size={16} />
            <span className="text-sm font-medium">Sí</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-text-tertiary">
            <XCircle size={16} />
            <span className="text-sm">No</span>
          </div>
        ),
    },
    {
      key: 'shippingCost',
      header: 'Costo',
      render: (loc) =>
        loc.isFreeShipping ? (
          <Badge variant="success">Gratis</Badge>
        ) : (
          <span className="font-semibold text-text-primary">${loc.shippingCost.toLocaleString()}</span>
        ),
    },
    {
      key: 'actions',
      header: '',
      render: (loc) => (
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => openEdit(loc)} title="Editar">
            <Pencil size={16} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(loc)} title="Eliminar">
            <Trash2 size={16} className="text-accent-red" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <CatalogPageLayout
      title="Ubicaciones de envío"
      subtitle={`${locations.length} ubicación${locations.length !== 1 ? 'es' : ''} configurada${locations.length !== 1 ? 's' : ''}`}
      createLabel="Nueva ubicación"
      onCreate={openCreate}
      isLoading={isLoading}
      isError={isError}
      isEmpty={locations.length === 0}
      loadingLabel="Cargando ubicaciones..."
      errorMessage="Error al cargar las ubicaciones"
      emptyState={{
        icon: Truck,
        title: 'Sin ubicaciones',
        description: 'Configura las zonas de envío para tus clientes.',
        createLabel: 'Nueva ubicación',
      }}
      modals={
        <>
          {/* Form Modal */}
          <Modal isOpen={modalOpen} onClose={closeModal} size="md">
            <ModalHeader onClose={closeModal}>
              <ModalTitle>{editing ? 'Editar ubicación' : 'Nueva ubicación'}</ModalTitle>
            </ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <FormField label="Nombre" required error={errors.name}>
                  <Input
                    placeholder="Ej: Zona Norte"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    error={!!errors.name}
                  />
                </FormField>

                {/* Toggle envío gratis */}
                <div className="flex items-center gap-3 p-3 rounded-md border border-border-primary bg-bg-secondary">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={form.isFreeShipping}
                    onClick={() => setForm((f) => ({ ...f, isFreeShipping: !f.isFreeShipping, shippingCost: !f.isFreeShipping ? '0' : f.shippingCost }))}
                    className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 ${
                      form.isFreeShipping ? 'bg-accent-green' : 'bg-bg-tertiary'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${
                        form.isFreeShipping ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <span className="text-sm font-medium text-text-primary">Envío gratis</span>
                </div>

                {!form.isFreeShipping && (
                  <FormField label="Costo de envío" required error={errors.shippingCost}>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={form.shippingCost}
                      onChange={(e) => setForm((f) => ({ ...f, shippingCost: e.target.value }))}
                      error={!!errors.shippingCost}
                    />
                  </FormField>
                )}
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="secondary" onClick={closeModal} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} isLoading={isSubmitting}>
                {editing ? 'Guardar cambios' : 'Crear ubicación'}
              </Button>
            </ModalFooter>
          </Modal>

          <ConfirmModal
            isOpen={!!deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onConfirm={handleDelete}
            title="Eliminar ubicación"
            message={`¿Estás seguro de eliminar "${deleteTarget?.name}"? Esta acción no se puede deshacer.`}
            confirmText="Eliminar"
            isLoading={deleteLocation.isPending}
          />
        </>
      }
    >
      <MobileCards />
      <div className="hidden md:block">
        <Table data={locations} columns={columns} getRowKey={(l) => l.id} />
      </div>
    </CatalogPageLayout>
  );
};
