import { useState } from 'react';

/**
 * Estado genérico de "modal de crear/editar + target de borrado" usado por
 * las páginas CRUD del catálogo (productos, promociones, envíos, etc.).
 * `toFormValues` mapea la entidad editada a los valores iniciales del form.
 */
export function useCrudModalState<T, Form>(emptyForm: Form, toFormValues: (entity: T) => Form) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (entity: T) => {
    setEditing(entity);
    setForm(toFormValues(entity));
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  return {
    modalOpen, editing, deleteTarget, setDeleteTarget,
    form, setForm,
    openCreate, openEdit, closeModal,
  };
}
