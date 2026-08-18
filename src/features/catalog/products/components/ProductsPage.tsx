import { useRef, useState } from 'react';
import { Package, Pencil, Trash2, ImagePlus } from 'lucide-react';
import { useGetProducts } from '../api/useGetProducts';
import { useCreateProduct } from '../api/useCreateProduct';
import { useUpdateProduct } from '../api/useUpdateProduct';
import { useDeleteProduct } from '../api/useDeleteProduct';
import { useUploadProductImage } from '../api/useUploadProductImage';
import { useToast } from '@/shared/hooks/useToast';
import { getErrorMessage } from '@/shared/lib/errors';
import { useCrudModalState } from '@/shared/hooks/useCrudModalState';
import { CatalogPageLayout } from '@/shared/components/CatalogPageLayout';
import { Button } from '@/shared/ui/Button';
import { Table, type TableColumn } from '@/shared/ui/Table';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@/shared/ui/Modal';
import { ConfirmModal } from '@/shared/ui/ConfirmModal';
import { FormField } from '@/shared/ui/FormField';
import { Input, Textarea } from '@/shared/ui/Input';
import { Badge } from '@/shared/ui/Badge';
import { DiscountsModal } from './DiscountsModal';
import type { Product, CreateProductDto, UpdateProductDto } from '../types';

const emptyForm = { name: '', basePrice: '', description: '' };

export const ProductsPage = () => {
  const { data: products = [], isLoading, isError } = useGetProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const uploadImage = useUploadProductImage();
  const { showToast } = useToast();

  const imageInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetId, setUploadTargetId] = useState<string | null>(null);

  const {
    modalOpen, editing, deleteTarget, setDeleteTarget, form, setForm,
    openCreate: openCreateBase, openEdit: openEditBase, closeModal,
  } = useCrudModalState<Product, typeof emptyForm>(emptyForm, (product) => ({
    name: product.name,
    basePrice: String(product.basePrice),
    description: product.description ?? '',
  }));
  const [discountsProduct, setDiscountsProduct] = useState<Product | null>(null);
  const [errors, setErrors] = useState<Partial<typeof emptyForm>>({});

  const openCreate = () => {
    setErrors({});
    openCreateBase();
  };

  const openEdit = (product: Product) => {
    setErrors({});
    openEditBase(product);
  };

  const validate = () => {
    const errs: Partial<typeof emptyForm> = {};
    if (!form.name.trim()) errs.name = 'El nombre es requerido';
    if (!form.basePrice || isNaN(Number(form.basePrice)) || Number(form.basePrice) < 0)
      errs.basePrice = 'Ingresa un precio válido';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const dto = {
      name: form.name.trim(),
      basePrice: Number(form.basePrice),
      ...(form.description.trim() && { description: form.description.trim() }),
    };

    try {
      if (editing) {
        await updateProduct.mutateAsync({ id: editing.id, dto: dto as UpdateProductDto });
        showToast('Producto actualizado', 'success');
      } else {
        await createProduct.mutateAsync(dto as CreateProductDto);
        showToast('Producto creado', 'success');
      }
      closeModal();
    } catch (error) {
      showToast(getErrorMessage(error, 'Error al guardar el producto'), 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteProduct.mutateAsync(deleteTarget.id);
      showToast('Producto eliminado', 'success');
    } catch (error) {
      showToast(getErrorMessage(error, 'Error al eliminar el producto'), 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  const openImageUpload = (productId: string) => {
    setUploadTargetId(productId);
    imageInputRef.current?.click();
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTargetId) return;
    e.target.value = '';
    try {
      await uploadImage.mutateAsync({ id: uploadTargetId, file });
      showToast('Imagen actualizada', 'success');
    } catch (error) {
      showToast(getErrorMessage(error, 'Error al subir la imagen'), 'error');
    } finally {
      setUploadTargetId(null);
    }
  };

  const isSubmitting = createProduct.isPending || updateProduct.isPending;

  // Mobile card view
  const MobileCards = () => (
    <div className="md:hidden space-y-3">
      {products.map((product) => (
        <div
          key={product.id}
          className="border border-border-primary rounded-lg p-4 bg-bg-secondary"
        >
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-3">
              <button
                onClick={() => openImageUpload(product.id)}
                className="w-9 h-9 rounded-full bg-bg-tertiary flex items-center justify-center shrink-0 overflow-hidden hover:opacity-80 transition-opacity"
                title="Cambiar imagen"
              >
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <Package size={16} className="text-text-secondary" />
                )}
              </button>
              <div>
                <p className="font-medium text-text-primary text-sm">{product.name}</p>
                {product.description && (
                  <p className="text-xs text-text-secondary mt-0.5 line-clamp-1">
                    {product.description}
                  </p>
                )}
              </div>
            </div>
            <p className="text-sm font-semibold text-text-primary shrink-0">
              ${product.basePrice.toLocaleString()}
            </p>
          </div>
          <div className="mb-3">
            <button onClick={() => setDiscountsProduct(product)} className="cursor-pointer">
              <Badge variant={product.discounts.length > 0 ? 'primary' : 'default'}>
                {product.discounts.length > 0 ? `${product.discounts.length} descuento${product.discounts.length !== 1 ? 's' : ''}` : 'Sin descuentos'}
              </Badge>
            </button>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" className="flex-1 min-h-11" onClick={() => openImageUpload(product.id)} isLoading={uploadImage.isPending && uploadTargetId === product.id}>
              <ImagePlus size={14} /> Imagen
            </Button>
            <Button variant="secondary" size="sm" className="flex-1 min-h-11" onClick={() => openEdit(product)}>
              <Pencil size={14} /> Editar
            </Button>
            <Button variant="danger" size="sm" className="flex-1 min-h-11" onClick={() => setDeleteTarget(product)}>
              <Trash2 size={14} /> Eliminar
            </Button>
          </div>
        </div>
      ))}
    </div>
  );

  const columns: TableColumn<Product>[] = [
    {
      key: 'name',
      header: 'Producto',
      render: (p) => (
        <div className="flex items-center gap-3">
          <button
            onClick={() => openImageUpload(p.id)}
            className="w-9 h-9 rounded-full bg-bg-tertiary flex items-center justify-center shrink-0 overflow-hidden hover:opacity-80 transition-opacity"
            title="Cambiar imagen"
          >
            {p.imageUrl ? (
              <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
            ) : (
              <Package size={16} className="text-text-secondary" />
            )}
          </button>
          <div>
            <p className="font-medium text-text-primary">{p.name}</p>
            {p.description && (
              <p className="text-xs text-text-secondary mt-0.5 line-clamp-1">{p.description}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'basePrice',
      header: 'Precio base',
      render: (p) => (
        <span className="font-semibold text-text-primary">${p.basePrice.toLocaleString()}</span>
      ),
    },
    {
      key: 'discounts',
      header: 'Descuentos',
      render: (p) => (
        <button onClick={() => setDiscountsProduct(p)} className="cursor-pointer">
          <Badge variant={p.discounts.length > 0 ? 'primary' : 'default'}>
            {p.discounts.length > 0 ? `${p.discounts.length} descuento${p.discounts.length !== 1 ? 's' : ''}` : 'Sin descuentos'}
          </Badge>
        </button>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (p) => (
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => openImageUpload(p.id)} title="Subir imagen" isLoading={uploadImage.isPending && uploadTargetId === p.id}>
            <ImagePlus size={16} />
          </Button>
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
    <CatalogPageLayout
      title="Productos"
      subtitle={`${products.length} producto${products.length !== 1 ? 's' : ''} en el catálogo`}
      createLabel="Nuevo producto"
      onCreate={openCreate}
      isLoading={isLoading}
      isError={isError}
      isEmpty={products.length === 0}
      loadingLabel="Cargando productos..."
      errorMessage="Error al cargar los productos"
      emptyState={{
        icon: Package,
        title: 'Sin productos',
        description: 'Agrega tu primer producto al catálogo.',
        createLabel: 'Nuevo producto',
      }}
      modals={
        <>
          {/* Form Modal */}
          <Modal isOpen={modalOpen} onClose={closeModal} size="md">
            <ModalHeader onClose={closeModal}>
              <ModalTitle>{editing ? 'Editar producto' : 'Nuevo producto'}</ModalTitle>
            </ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <FormField label="Nombre" required error={errors.name}>
                  <Input
                    placeholder="Ej: Caja de cartón grande"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    error={!!errors.name}
                  />
                </FormField>
                <FormField label="Precio base" required error={errors.basePrice}>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={form.basePrice}
                    onChange={(e) => setForm((f) => ({ ...f, basePrice: e.target.value }))}
                    error={!!errors.basePrice}
                  />
                </FormField>
                <FormField label="Descripción" optional>
                  <Textarea
                    placeholder="Descripción del producto..."
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
                {editing ? 'Guardar cambios' : 'Crear producto'}
              </Button>
            </ModalFooter>
          </Modal>

          {/* Discounts Modal */}
          <DiscountsModal
            product={discountsProduct}
            onClose={() => setDiscountsProduct(null)}
          />

          {/* Hidden image input */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />

          {/* Delete Confirm */}
          <ConfirmModal
            isOpen={!!deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onConfirm={handleDelete}
            title="Eliminar producto"
            message={`¿Estás seguro de eliminar "${deleteTarget?.name}"? Esta acción no se puede deshacer.`}
            confirmText="Eliminar"
            isLoading={deleteProduct.isPending}
          />
        </>
      }
    >
      <MobileCards />
      <div className="hidden md:block">
        <Table
          data={products}
          columns={columns}
          getRowKey={(p) => p.id}
        />
      </div>
    </CatalogPageLayout>
  );
};
