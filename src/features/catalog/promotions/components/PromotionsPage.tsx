import { useState } from 'react';
import { Plus, Tag, Pencil, Trash2, Package } from 'lucide-react';
import { CrmLayout } from '@/layouts/CrmLayout';
import { useGetPromotions } from '../api/useGetPromotions';
import { useCreatePromotion } from '../api/useCreatePromotion';
import { useUpdatePromotion } from '../api/useUpdatePromotion';
import { useDeletePromotion } from '../api/useDeletePromotion';
import { useGetProducts } from '@/features/catalog/products/api/useGetProducts';
import { useToast } from '@/shared/hooks/useToast';
import { Button } from '@/shared/ui/Button';
import { Table, type TableColumn } from '@/shared/ui/Table';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@/shared/ui/Modal';
import { ConfirmModal } from '@/shared/ui/ConfirmModal';
import { FormField } from '@/shared/ui/FormField';
import { Input, Textarea } from '@/shared/ui/Input';
import { Badge } from '@/shared/ui/Badge';
import { MultiSelect } from '@/shared/ui/MultiSelect';
import type { Promotion, CreatePromotionDto, UpdatePromotionDto } from '../types';

const emptyForm = { name: '', description: '', specialPrice: '', productIds: [] as string[] };

export const PromotionsPage = () => {
  const { data: promotions = [], isLoading, isError } = useGetPromotions();
  const { data: products = [], isLoading: productsLoading, isError: productsError } = useGetProducts();
  const createPromotion = useCreatePromotion();
  const updatePromotion = useUpdatePromotion();
  const deletePromotion = useDeletePromotion();
  const { showToast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Promotion | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<{ specialPrice?: string; productIds?: string }>({});

  const productOptions = products.map((p) => ({
    value: p.id,
    label: p.name,
    sublabel: `$${p.basePrice.toLocaleString()}`,
  }));

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (promotion: Promotion) => {
    setEditing(promotion);
    setForm({
      name: promotion.name ?? '',
      description: promotion.description ?? '',
      specialPrice: String(promotion.specialPrice),
      productIds: promotion.promotionProducts.map((pp) => pp.productId),
    });
    setErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const validate = () => {
    const errs: { specialPrice?: string; productIds?: string } = {};
    if (!form.specialPrice || isNaN(Number(form.specialPrice)) || Number(form.specialPrice) < 0)
      errs.specialPrice = 'Ingresa un precio válido';
    if (form.productIds.length === 0)
      errs.productIds = 'Selecciona al menos un producto';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const dto = {
      ...(form.name.trim() && { name: form.name.trim() }),
      ...(form.description.trim() && { description: form.description.trim() }),
      specialPrice: Number(form.specialPrice),
      productIds: form.productIds,
    };

    try {
      if (editing) {
        await updatePromotion.mutateAsync({ id: editing.id, dto: dto as UpdatePromotionDto });
        showToast('Promoción actualizada', 'success');
      } else {
        await createPromotion.mutateAsync(dto as CreatePromotionDto);
        showToast('Promoción creada', 'success');
      }
      closeModal();
    } catch {
      showToast('Error al guardar la promoción', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deletePromotion.mutateAsync(deleteTarget.id);
      showToast('Promoción eliminada', 'success');
    } catch {
      showToast('Error al eliminar la promoción', 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  const isSubmitting = createPromotion.isPending || updatePromotion.isPending;

  const MobileCards = () => (
    <div className="md:hidden space-y-3">
      {promotions.map((promo) => (
        <div key={promo.id} className="border border-border-primary rounded-lg p-4 bg-bg-secondary">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-bg-tertiary flex items-center justify-center shrink-0">
                <Tag size={16} className="text-text-secondary" />
              </div>
              <div>
                <p className="font-medium text-text-primary text-sm">
                  {promo.name ?? <span className="text-text-tertiary italic">Sin nombre</span>}
                </p>
                {promo.description && (
                  <p className="text-xs text-text-secondary mt-0.5 line-clamp-1">{promo.description}</p>
                )}
              </div>
            </div>
            <p className="text-sm font-semibold text-text-primary shrink-0">
              ${promo.specialPrice.toLocaleString()}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {promo.promotionProducts.slice(0, 3).map((pp) => (
              <Badge key={pp.id} variant="default">
                <Package size={10} /> {pp.product.name}
              </Badge>
            ))}
            {promo.promotionProducts.length > 3 && (
              <Badge variant="default">+{promo.promotionProducts.length - 3} más</Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" className="flex-1 min-h-11" onClick={() => openEdit(promo)}>
              <Pencil size={14} /> Editar
            </Button>
            <Button variant="danger" size="sm" className="flex-1 min-h-11" onClick={() => setDeleteTarget(promo)}>
              <Trash2 size={14} /> Eliminar
            </Button>
          </div>
        </div>
      ))}
    </div>
  );

  const columns: TableColumn<Promotion>[] = [
    {
      key: 'name',
      header: 'Promoción',
      render: (p) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-bg-tertiary flex items-center justify-center shrink-0">
            <Tag size={16} className="text-text-secondary" />
          </div>
          <div>
            <p className="font-medium text-text-primary">
              {p.name ?? <span className="text-text-tertiary italic">Sin nombre</span>}
            </p>
            {p.description && (
              <p className="text-xs text-text-secondary mt-0.5 line-clamp-1">{p.description}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'specialPrice',
      header: 'Precio especial',
      render: (p) => (
        <span className="font-semibold text-text-primary">${p.specialPrice.toLocaleString()}</span>
      ),
    },
    {
      key: 'products',
      header: 'Productos',
      render: (p) => (
        <div className="flex flex-wrap gap-1.5">
          {p.promotionProducts.slice(0, 2).map((pp) => (
            <Badge key={pp.id} variant="default">
              <Package size={10} /> {pp.product.name}
            </Badge>
          ))}
          {p.promotionProducts.length > 2 && (
            <Badge variant="default">+{p.promotionProducts.length - 2} más</Badge>
          )}
          {p.promotionProducts.length === 0 && (
            <span className="text-text-tertiary text-sm">—</span>
          )}
        </div>
      ),
    },
    {
      key: 'discounts',
      header: 'Descuentos',
      render: (p) =>
        p.promotionDiscounts.length > 0 ? (
          <Badge variant="primary">{p.promotionDiscounts.length} cliente{p.promotionDiscounts.length !== 1 ? 's' : ''}</Badge>
        ) : (
          <span className="text-text-tertiary text-sm">—</span>
        ),
    },
    {
      key: 'actions',
      header: '',
      render: (p) => (
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => openEdit(p)} title="Editar">
            <Pencil size={16} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(p)} title="Eliminar">
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
            <h1 className="text-2xl md:text-3xl font-bold text-text-primary">Promociones</h1>
            <p className="text-sm text-text-secondary mt-1">
              {promotions.length} promoción{promotions.length !== 1 ? 'es' : ''} activa{promotions.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button onClick={openCreate} size="md">
            <Plus size={18} />
            <span className="hidden sm:inline">Nueva promoción</span>
          </Button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center min-h-64">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-border-primary border-t-accent-blue rounded-full animate-spin" />
              <p className="text-sm text-text-secondary">Cargando promociones...</p>
            </div>
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-text-secondary mb-4">Error al cargar las promociones</p>
            <Button variant="secondary" onClick={() => window.location.reload()}>Reintentar</Button>
          </div>
        )}

        {!isLoading && !isError && promotions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 md:py-16 text-center">
            <Tag size={48} className="text-text-tertiary mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">Sin promociones</h3>
            <p className="text-sm text-text-secondary mb-6 max-w-sm">
              Crea tu primera promoción agrupando productos con un precio especial.
            </p>
            <Button onClick={openCreate}>
              <Plus size={18} /> Nueva promoción
            </Button>
          </div>
        )}

        {!isLoading && !isError && promotions.length > 0 && (
          <>
            <MobileCards />
            <div className="hidden md:block">
              <Table data={promotions} columns={columns} getRowKey={(p) => p.id} />
            </div>
          </>
        )}
      </div>

      {/* Form Modal */}
      <Modal isOpen={modalOpen} onClose={closeModal} size="md">
        <ModalHeader onClose={closeModal}>
          <ModalTitle>{editing ? 'Editar promoción' : 'Nueva promoción'}</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <FormField label="Nombre" optional>
              <Input
                placeholder="Ej: Pack verano"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </FormField>
            <FormField label="Precio especial" required error={errors.specialPrice}>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.specialPrice}
                onChange={(e) => setForm((f) => ({ ...f, specialPrice: e.target.value }))}
                error={!!errors.specialPrice}
              />
            </FormField>
            <FormField label="Productos" required error={errors.productIds}>
              <MultiSelect
                options={productOptions}
                value={form.productIds}
                onChange={(ids) => setForm((f) => ({ ...f, productIds: ids }))}
                placeholder="Selecciona productos..."
                searchPlaceholder="Buscar producto..."
                isLoading={productsLoading}
                isError={productsError}
                errorMessage="Error al cargar productos"
                emptyMessage="No hay productos disponibles"
              />
            </FormField>
            <FormField label="Descripción" optional>
              <Textarea
                placeholder="Descripción de la promoción..."
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </FormField>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={closeModal} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} isLoading={isSubmitting}>
            {editing ? 'Guardar cambios' : 'Crear promoción'}
          </Button>
        </ModalFooter>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Eliminar promoción"
        message={`¿Estás seguro de eliminar "${deleteTarget?.name ?? 'esta promoción'}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        isLoading={deletePromotion.isPending}
      />

    </CrmLayout>
  );
};
