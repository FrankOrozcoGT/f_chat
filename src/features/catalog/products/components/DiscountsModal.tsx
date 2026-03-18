import { useState } from 'react';
import { Plus, Trash2, User, Globe } from 'lucide-react';
import { Modal, ModalHeader, ModalTitle, ModalBody } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { FormField } from '@/shared/ui/FormField';
import { Input } from '@/shared/ui/Input';
import { SelectField } from '@/shared/ui/SelectField';
import { ConfirmModal } from '@/shared/ui/ConfirmModal';
import { useGetProductDiscounts } from '../api/useGetProductDiscounts';
import { useCreateDiscount } from '../api/useCreateDiscount';
import { useDeleteDiscount } from '../api/useDeleteDiscount';
import { useGetContactsSelect } from '@/features/contacts/api/useGetContactsSelect';
import { useToast } from '@/shared/hooks/useToast';
import type { Product, ProductDiscount } from '../types';

interface DiscountsModalProps {
  product: Product | null;
  onClose: () => void;
}

const emptyForm = { discountPrice: '', clientId: '__all__' };

export const DiscountsModal = ({ product, onClose }: DiscountsModalProps) => {
  const isOpen = !!product;
  const { data: discounts = [], isLoading } = useGetProductDiscounts(product?.id ?? null);
  const createDiscount = useCreateDiscount(product?.id ?? '');
  const deleteDiscount = useDeleteDiscount(product?.id ?? '');
  const { data: contacts = [], isLoading: contactsLoading } = useGetContactsSelect();
  const { showToast } = useToast();

  const clientOptions = [
    { value: '__all__', label: 'Todos los clientes' },
    ...contacts.map((c) => ({
      value: c.id,
      label: c.name ? `${c.name} (${c.phoneNumber})` : c.phoneNumber,
    })),
  ];

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Partial<typeof emptyForm>>({});
  const [deleteTarget, setDeleteTarget] = useState<ProductDiscount | null>(null);
  const [showForm, setShowForm] = useState(false);

  const resetForm = () => {
    setForm(emptyForm);
    setErrors({});
    setShowForm(false);
  };

  const validate = () => {
    const errs: Partial<typeof emptyForm> = {};
    if (!form.discountPrice || isNaN(Number(form.discountPrice)) || Number(form.discountPrice) < 0)
      errs.discountPrice = 'Ingresa un precio válido';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    try {
      await createDiscount.mutateAsync({
        discountPrice: Number(form.discountPrice),
        ...(form.clientId !== '__all__' && { clientId: form.clientId }),
      });
      showToast('Descuento creado', 'success');
      resetForm();
    } catch {
      showToast('Error al crear el descuento', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDiscount.mutateAsync(deleteTarget.id);
      showToast('Descuento eliminado', 'success');
    } catch {
      showToast('Error al eliminar el descuento', 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} size="lg">
        <ModalHeader onClose={handleClose}>
          <div>
            <ModalTitle>Descuentos — {product?.name}</ModalTitle>
            <p className="text-sm text-text-secondary mt-1">
              Precio base: <span className="font-medium text-text-primary">${product?.basePrice.toLocaleString()}</span>
            </p>
          </div>
        </ModalHeader>

        <ModalBody className="space-y-4">
          {/* Lista de descuentos */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-border-primary border-t-accent-blue rounded-full animate-spin" />
            </div>
          )}

          {!isLoading && discounts.length === 0 && (
            <div className="text-center py-8">
              <p className="text-text-secondary text-sm">No hay descuentos para este producto.</p>
            </div>
          )}

          {!isLoading && discounts.length > 0 && (
            <div className="space-y-2">
              {discounts.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border-primary bg-bg-secondary"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-bg-tertiary flex items-center justify-center shrink-0">
                      {d.clientId ? <User size={14} className="text-text-secondary" /> : <Globe size={14} className="text-text-secondary" />}
                    </div>
                    <div className="min-w-0">
                      {d.client ? (
                        <p className="text-sm font-medium text-text-primary truncate">
                          {d.client.name ?? d.client.phoneNumber}
                        </p>
                      ) : d.clientId ? (
                        <p className="text-sm text-text-secondary truncate">{d.clientId}</p>
                      ) : (
                        <p className="text-sm text-text-secondary italic">Todos los clientes</p>
                      )}
                      {d.client?.phoneNumber && d.client.name && (
                        <p className="text-xs text-text-tertiary">{d.client.phoneNumber}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-text-primary">${d.discountPrice.toLocaleString()}</p>
                      {product && (
                        <p className="text-xs text-accent-green">
                          -{Math.round(((product.basePrice - d.discountPrice) / product.basePrice) * 100)}%
                        </p>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(d)} title="Eliminar">
                      <Trash2 size={15} className="text-accent-red" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Formulario nuevo descuento */}
          {showForm ? (
            <div className="border border-border-primary rounded-lg p-4 bg-bg-secondary space-y-3">
              <p className="text-sm font-medium text-text-primary">Nuevo descuento</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField label="Precio con descuento" required error={errors.discountPrice}>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={form.discountPrice}
                    onChange={(e) => setForm((f) => ({ ...f, discountPrice: e.target.value }))}
                    error={!!errors.discountPrice}
                  />
                </FormField>
                <FormField label="Cliente" optional>
                  <SelectField
                    value={form.clientId}
                    options={clientOptions}
                    onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))}
                    disabled={contactsLoading}
                  />
                </FormField>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="secondary" size="sm" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button size="sm" onClick={handleCreate} isLoading={createDiscount.isPending}>
                  Guardar
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => setShowForm(true)}>
              <Plus size={16} /> Agregar descuento
            </Button>
          )}
        </ModalBody>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Eliminar descuento"
        message={`¿Eliminar el descuento de $${deleteTarget?.discountPrice.toLocaleString()}?`}
        confirmText="Eliminar"
        isLoading={deleteDiscount.isPending}
      />
    </>
  );
};
