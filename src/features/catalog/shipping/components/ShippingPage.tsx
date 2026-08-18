import { useState } from 'react';
import { Plus, Truck, Pencil, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { CrmLayout } from '@/layouts/CrmLayout';
import { useGetShippingLocations } from '../api/useGetShippingLocations';
import { useCreateShippingLocation } from '../api/useCreateShippingLocation';
import { useUpdateShippingLocation } from '../api/useUpdateShippingLocation';
import { useDeleteShippingLocation } from '../api/useDeleteShippingLocation';
import { useToast } from '@/shared/hooks/useToast';
import { getErrorMessage } from '@/shared/lib/errors';
import { Button } from '@/shared/ui/Button';
import { Table, type TableColumn } from '@/shared/ui/Table';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@/shared/ui/Modal';
import { ConfirmModal } from '@/shared/ui/ConfirmModal';
import { FormField } from '@/shared/ui/FormField';
import { Input } from '@/shared/ui/Input';
import { Badge } from '@/shared/ui/Badge';
import type { ShippingLocation, CreateShippingLocationDto, UpdateShippingLocationDto } from '../types';

const emptyForm = { name: '', isFreeShipping: false, shippingCost: '' };

export const ShippingPage = () => {
  const { data: locations = [], isLoading, isError } = useGetShippingLocations();
  const createLocation = useCreateShippingLocation();
  const updateLocation = useUpdateShippingLocation();
  const deleteLocation = useDeleteShippingLocation();
  const { showToast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ShippingLocation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ShippingLocation | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<{ name?: string; shippingCost?: string }>({});

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (location: ShippingLocation) => {
    setEditing(location);
    setForm({
      name: location.name,
      isFreeShipping: location.isFreeShipping,
      shippingCost: String(location.shippingCost),
    });
    setErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
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
    <CrmLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-text-primary">Ubicaciones de envío</h1>
            <p className="text-sm text-text-secondary mt-1">
              {locations.length} ubicación{locations.length !== 1 ? 'es' : ''} configurada{locations.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button onClick={openCreate} size="md">
            <Plus size={18} />
            <span className="hidden sm:inline">Nueva ubicación</span>
          </Button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center min-h-64">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-border-primary border-t-accent-blue rounded-full animate-spin" />
              <p className="text-sm text-text-secondary">Cargando ubicaciones...</p>
            </div>
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-text-secondary mb-4">Error al cargar las ubicaciones</p>
            <Button variant="secondary" onClick={() => window.location.reload()}>Reintentar</Button>
          </div>
        )}

        {!isLoading && !isError && locations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 md:py-16 text-center">
            <Truck size={48} className="text-text-tertiary mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">Sin ubicaciones</h3>
            <p className="text-sm text-text-secondary mb-6 max-w-sm">
              Configura las zonas de envío para tus clientes.
            </p>
            <Button onClick={openCreate}>
              <Plus size={18} /> Nueva ubicación
            </Button>
          </div>
        )}

        {!isLoading && !isError && locations.length > 0 && (
          <>
            <MobileCards />
            <div className="hidden md:block">
              <Table data={locations} columns={columns} getRowKey={(l) => l.id} />
            </div>
          </>
        )}
      </div>

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

    </CrmLayout>
  );
};
