import { useState, useEffect } from 'react';
import { Plus, Tag, Pencil, Trash2, SlidersHorizontal, Clock, Settings, MessageSquare } from 'lucide-react';
import { MainLayout } from '@/layouts/MainLayout';
import { Select } from '@/shared/ui/Select';
import { SearchableSelect } from '@/shared/ui/SearchableSelect';
import { Button } from '@/shared/ui/Button';
import { Table, type TableColumn } from '@/shared/ui/Table';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@/shared/ui/Modal';
import { ConfirmModal } from '@/shared/ui/ConfirmModal';
import { FormField } from '@/shared/ui/FormField';
import { Input } from '@/shared/ui/Input';
import { useToast } from '@/shared/hooks/useToast';
import { Toast } from '@/shared/ui/Toast';
import { useGetSettings } from '../api/useGetSettings';
import { useUpdateSettings } from '../api/useUpdateSettings';
import { useGetFarewellTemplate } from '../api/useGetFarewellTemplate';
import { useUpdateFarewellTemplate } from '../api/useUpdateFarewellTemplate';
import { useGetLabels, useCreateLabel, useUpdateLabel, useDeleteLabel } from '@/features/queue/labels';
import { useGetContactsSelect } from '@/features/contacts';
import { useGetGroupsSelect } from '@/features/conversations';
import { useGetMe } from '@/features/auth/api';
import type { AnalysisMode, WorkSchedule } from '../types';
import type { ContactLabel, CreateContactLabelDto, UpdateContactLabelDto } from '@/features/queue/labels';

const DAY_NAMES: Record<string, string> = {
  '1': 'Lunes',
  '2': 'Martes',
  '3': 'Miércoles',
  '4': 'Jueves',
  '5': 'Viernes',
  '6': 'Sábado',
  '7': 'Domingo',
};

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => ({
  value: String(i),
  label: `${String(i).padStart(2, '0')}:00`,
}));

const DAY_KEYS = ['1', '2', '3', '4', '5', '6', '7'] as const;

const analysisModeOptions = [
  { value: 'manual' as const, label: 'Manual' },
  { value: 'automatic' as const, label: 'Automático' },
];

const emptyLabelForm = { label: '', clientId: '', groupJid: '' };

type TabId = 'analysis' | 'schedule' | 'labels' | 'messages';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  ownerOnly?: boolean;
}

const TABS: Tab[] = [
  { id: 'analysis', label: 'Análisis', icon: <SlidersHorizontal size={16} /> },
  { id: 'schedule', label: 'Horarios', icon: <Clock size={16} />, ownerOnly: true },
  { id: 'labels', label: 'Etiquetas', icon: <Tag size={16} /> },
  { id: 'messages', label: 'Mensajes', icon: <MessageSquare size={16} /> },
];

export const SettingsPage = () => {
  const { data: settings, isLoading } = useGetSettings();
  const updateSettings = useUpdateSettings();
  const { data: me } = useGetMe();
  const { toasts, showToast, removeToast } = useToast();
  const isOwner = me?.tenantRole === 'owner';

  const [activeTab, setActiveTab] = useState<TabId>('analysis');

  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('manual');
  const [messageLimit, setMessageLimit] = useState<number | ''>(30);
  const [workSchedule, setWorkSchedule] = useState<WorkSchedule>({});

  // Farewell template
  const { data: farewellTemplate } = useGetFarewellTemplate();
  const updateFarewell = useUpdateFarewellTemplate();
  const [farewellContent, setFarewellContent] = useState('');
  const farewellHasChanges = farewellTemplate !== undefined && farewellContent !== farewellTemplate.content;

  // Labels state
  const { data: labels = [], isLoading: labelsLoading } = useGetLabels();
  const createLabel = useCreateLabel();
  const updateLabel = useUpdateLabel();
  const deleteLabel = useDeleteLabel();
  const { data: contactsSelect = [] } = useGetContactsSelect();
  const { data: groupsSelect = [] } = useGetGroupsSelect();
  const [labelModalOpen, setLabelModalOpen] = useState(false);
  const [editingLabel, setEditingLabel] = useState<ContactLabel | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ContactLabel | null>(null);
  const [labelForm, setLabelForm] = useState(emptyLabelForm);
  const [labelErrors, setLabelErrors] = useState<Partial<typeof emptyLabelForm>>({});

  useEffect(() => {
    if (settings) {
      setAnalysisMode(settings.analysisMode);
      setMessageLimit(settings.messageLimit);
      setWorkSchedule(settings.workSchedule ?? {});
    }
  }, [settings]);

  useEffect(() => {
    if (farewellTemplate) {
      setFarewellContent(farewellTemplate.content);
    }
  }, [farewellTemplate]);

  const toggleDay = (day: string) => {
    setWorkSchedule((prev) => {
      const next = { ...prev };
      if (next[day as keyof WorkSchedule]) {
        delete next[day as keyof WorkSchedule];
      } else {
        next[day as keyof WorkSchedule] = { start: 8, end: 18 };
      }
      return next;
    });
  };

  const updateDayHour = (day: string, field: 'start' | 'end', value: number) => {
    setWorkSchedule((prev) => ({
      ...prev,
      [day]: { ...(prev[day as keyof WorkSchedule] ?? { start: 8, end: 18 }), [field]: value },
    }));
  };

  const handleSaveSchedule = () => {
    updateSettings.mutate(
      { workSchedule },
      {
        onSuccess: () => showToast('Horarios guardados', 'success'),
        onError: () => showToast('Error al guardar horarios', 'error'),
      }
    );
  };

  const hasChanges =
    settings && messageLimit !== '' && (analysisMode !== settings.analysisMode || messageLimit !== settings.messageLimit);

  const handleSave = () => {
    updateSettings.mutate(
      { analysisMode, messageLimit: messageLimit as number },
      {
        onSuccess: () => showToast('Configuración guardada', 'success'),
        onError: () => showToast('Error al guardar configuración', 'error'),
      }
    );
  };

  const openCreateLabel = () => {
    setEditingLabel(null);
    setLabelForm(emptyLabelForm);
    setLabelErrors({});
    setLabelModalOpen(true);
  };

  const openEditLabel = (lbl: ContactLabel) => {
    setEditingLabel(lbl);
    setLabelForm({ label: lbl.label, clientId: lbl.clientId ?? '', groupJid: lbl.groupJid ?? '' });
    setLabelErrors({});
    setLabelModalOpen(true);
  };

  const closeLabelModal = () => {
    setLabelModalOpen(false);
    setEditingLabel(null);
  };

  const validateLabel = () => {
    const errs: Partial<typeof emptyLabelForm> = {};
    if (!labelForm.label.trim()) errs.label = 'La etiqueta es requerida';
    setLabelErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLabelSubmit = async () => {
    if (!validateLabel()) return;
    const dto: CreateContactLabelDto | UpdateContactLabelDto = {
      label: labelForm.label.trim(),
      ...(labelForm.clientId.trim() && { clientId: labelForm.clientId.trim() }),
      ...(labelForm.groupJid.trim() && { groupJid: labelForm.groupJid.trim() }),
    };
    try {
      if (editingLabel) {
        await updateLabel.mutateAsync({ id: editingLabel.id, dto: dto as UpdateContactLabelDto });
        showToast('Etiqueta actualizada', 'success');
      } else {
        await createLabel.mutateAsync(dto as CreateContactLabelDto);
        showToast('Etiqueta creada', 'success');
      }
      closeLabelModal();
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        showToast('Ya existe una etiqueta con ese nombre', 'error');
      } else {
        showToast('Error al guardar la etiqueta', 'error');
      }
    }
  };

  const handleLabelDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteLabel.mutateAsync(deleteTarget.id);
      showToast('Etiqueta eliminada', 'success');
    } catch {
      showToast('Error al eliminar la etiqueta', 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  const isLabelSubmitting = createLabel.isPending || updateLabel.isPending;

  const labelColumns: TableColumn<ContactLabel>[] = [
    {
      key: 'label',
      header: 'Etiqueta',
      render: (lbl) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-bg-tertiary flex items-center justify-center shrink-0">
            <Tag size={14} className="text-text-secondary" />
          </div>
          <p className="font-medium text-text-primary">{lbl.label}</p>
        </div>
      ),
    },
    {
      key: 'clientId',
      header: 'Cliente',
      render: (lbl) => {
        if (!lbl.clientId) return <span className="text-sm text-text-secondary">—</span>;
        const contact = contactsSelect.find((c) => c.id === lbl.clientId);
        return <span className="text-sm text-text-secondary">{contact ? contact.name || contact.phoneNumber : lbl.clientId}</span>;
      },
    },
    {
      key: 'groupJid',
      header: 'Grupo',
      render: (lbl) => {
        if (!lbl.groupJid) return <span className="text-sm text-text-secondary">—</span>;
        const group = groupsSelect.find((g) => g.groupJid === lbl.groupJid);
        return <span className="text-sm text-text-secondary">{group ? group.groupName : lbl.groupJid}</span>;
      },
    },
    {
      key: 'actions',
      header: '',
      render: (lbl) => (
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => openEditLabel(lbl)} title="Editar">
            <Pencil size={16} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(lbl)} title="Eliminar">
            <Trash2 size={16} className="text-accent-red" />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-75">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-border-primary border-t-accent-blue rounded-full animate-spin" />
            <p className="text-sm text-text-secondary">Cargando configuración...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const visibleTabs = TABS.filter((t) => !t.ownerOnly || isOwner);

  return (
    <>
      <MainLayout>
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-6 md:mb-8 flex items-center gap-3">
            <Settings size={22} className="text-text-secondary" />
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-text-primary leading-tight">
                Configuración
              </h1>
              <p className="text-sm text-text-secondary">Ajustes generales del sistema</p>
            </div>
          </div>

          {/* Layout: sidebar nav + content */}
          <div className="flex gap-6 md:gap-8">
            {/* Vertical tab nav */}
            <nav className="hidden md:flex flex-col gap-1 w-44 shrink-0">
              {visibleTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors text-left w-full ${
                    activeTab === tab.id
                      ? 'bg-bg-secondary text-text-primary'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary/60'
                  }`}
                >
                  <span className={activeTab === tab.id ? 'text-accent-blue' : 'text-text-tertiary'}>
                    {tab.icon}
                  </span>
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* Mobile: horizontal tabs */}
            <div className="md:hidden flex gap-1 mb-4 w-full border-b border-border-primary pb-1">
              {visibleTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-t-md ${
                    activeTab === tab.id
                      ? 'text-text-primary border-b-2 border-accent-blue'
                      : 'text-text-secondary'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 min-w-0">

              {/* Análisis */}
              {activeTab === 'analysis' && (
                <div className="bg-bg-secondary border border-border-primary rounded-lg p-4 md:p-6 space-y-6">
                  <div>
                    <h2 className="text-base font-semibold text-text-primary mb-1">Análisis de conversaciones</h2>
                    <p className="text-sm text-text-secondary">Configura cómo se analizan las conversaciones.</p>
                  </div>

                  <div className="border-t border-border-primary pt-6 space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Modo de análisis
                      </label>
                      <Select
                        value={analysisMode}
                        options={analysisModeOptions}
                        onChange={setAnalysisMode}
                        size="md"
                      />
                      <p className="text-xs text-text-tertiary mt-2">
                        En modo automático, las conversaciones se analizan al finalizar. En manual, debes iniciar el análisis tú mismo.
                      </p>
                    </div>

                    <div>
                      <label htmlFor="messageLimit" className="block text-sm font-medium text-text-primary mb-2">
                        Límite de mensajes
                      </label>
                      <input
                        id="messageLimit"
                        type="number"
                        min={1}
                        value={messageLimit}
                        onChange={(e) => {
                          if (e.target.value === '') { setMessageLimit(''); return; }
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val) && val >= 1) setMessageLimit(val);
                        }}
                        onBlur={() => {
                          if (messageLimit === '' || messageLimit < 1) setMessageLimit(settings?.messageLimit ?? 1);
                        }}
                        className="w-full max-w-50 px-3 py-2 text-base bg-bg-primary border border-border-primary rounded-md text-text-primary focus:outline-2 focus:outline-accent-blue transition-colors"
                      />
                      <p className="text-xs text-text-tertiary mt-2">
                        Cantidad máxima de mensajes a incluir en cada análisis.
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border-primary flex justify-end">
                    <Button
                      onClick={handleSave}
                      disabled={!hasChanges || updateSettings.isPending}
                      isLoading={updateSettings.isPending}
                    >
                      Guardar cambios
                    </Button>
                  </div>
                </div>
              )}

              {/* Horarios */}
              {activeTab === 'schedule' && isOwner && (
                <div className="bg-bg-secondary border border-border-primary rounded-lg p-4 md:p-6">
                  <div className="mb-6">
                    <h2 className="text-base font-semibold text-text-primary mb-1">Horarios de trabajo</h2>
                    <p className="text-sm text-text-secondary">
                      Define el horario de atención por día. Los días sin horario no reciben atención automatizada.
                    </p>
                  </div>

                  <div className="space-y-1">
                    {DAY_KEYS.map((day) => {
                      const active = !!workSchedule[day as keyof WorkSchedule];
                      const schedule = workSchedule[day as keyof WorkSchedule];
                      return (
                        <div
                          key={day}
                          className="flex items-center gap-4 py-4 border-b border-border-primary last:border-0"
                        >
                          {/* Toggle */}
                          <button
                            role="switch"
                            aria-checked={active}
                            onClick={() => toggleDay(day)}
                            className={`relative inline-flex items-center w-11 h-6 rounded-full transition-colors shrink-0 ${
                              active ? 'bg-accent-blue' : 'bg-bg-tertiary'
                            }`}
                          >
                            <span
                              className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                                active ? 'translate-x-5.5' : 'translate-x-0.5'
                              }`}
                            />
                          </button>

                          {/* Día */}
                          <span className="text-sm font-medium text-text-primary w-24 shrink-0">{DAY_NAMES[day]}</span>

                          {/* Horas */}
                          {active && schedule ? (
                            <div className="flex items-center gap-6 flex-1">
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-text-secondary whitespace-nowrap">Desde</span>
                                <select
                                  value={String(schedule.start)}
                                  onChange={(e) => updateDayHour(day, 'start', Number(e.target.value))}
                                  className="px-3 py-2 text-sm bg-bg-primary border border-border-primary rounded-md text-text-primary focus:outline-2 focus:outline-accent-blue w-28"
                                >
                                  {HOUR_OPTIONS.map((h) => (
                                    <option key={h.value} value={h.value}>{h.label}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-text-secondary whitespace-nowrap">Hasta</span>
                                <select
                                  value={String(schedule.end)}
                                  onChange={(e) => updateDayHour(day, 'end', Number(e.target.value))}
                                  className="px-3 py-2 text-sm bg-bg-primary border border-border-primary rounded-md text-text-primary focus:outline-2 focus:outline-accent-blue w-28"
                                >
                                  {HOUR_OPTIONS.map((h) => (
                                    <option key={h.value} value={h.value}>{h.label}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-text-tertiary flex-1">Sin horario</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-4 border-t border-border-primary flex justify-end mt-4">
                    <Button onClick={handleSaveSchedule} isLoading={updateSettings.isPending}>
                      Guardar horarios
                    </Button>
                  </div>
                </div>
              )}

              {/* Etiquetas */}
              {activeTab === 'labels' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-base font-semibold text-text-primary">Etiquetas de contacto</h2>
                      <p className="text-xs text-text-secondary mt-0.5">
                        {labels.length} etiqueta{labels.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <Button onClick={openCreateLabel} size="sm">
                      <Plus size={16} />
                      Nueva etiqueta
                    </Button>
                  </div>

                  <div className="bg-bg-secondary border border-border-primary rounded-lg">
                    {labelsLoading && (
                      <div className="flex items-center justify-center py-10">
                        <div className="w-8 h-8 border-4 border-border-primary border-t-accent-blue rounded-full animate-spin" />
                      </div>
                    )}

                    {!labelsLoading && labels.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                        <Tag size={36} className="text-text-tertiary mb-3" />
                        <p className="text-sm font-medium text-text-primary mb-1">Sin etiquetas</p>
                        <p className="text-xs text-text-secondary mb-4">
                          Crea etiquetas para organizar tus contactos y grupos.
                        </p>
                        <Button size="sm" onClick={openCreateLabel}>
                          <Plus size={16} /> Nueva etiqueta
                        </Button>
                      </div>
                    )}

                    {!labelsLoading && labels.length > 0 && (
                      <>
                        <div className="md:hidden divide-y divide-border-primary">
                          {labels.map((lbl) => (
                            <div key={lbl.id} className="flex items-center justify-between gap-3 p-4">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-bg-tertiary flex items-center justify-center shrink-0">
                                  <Tag size={14} className="text-text-secondary" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-text-primary text-sm truncate">{lbl.label}</p>
                                  {(lbl.clientId || lbl.groupJid) && (
                                    <p className="text-xs text-text-secondary truncate">
                                      {lbl.clientId && `Cliente: ${contactsSelect.find((c) => c.id === lbl.clientId)?.name || contactsSelect.find((c) => c.id === lbl.clientId)?.phoneNumber || lbl.clientId}`}
                                      {lbl.clientId && lbl.groupJid && ' · '}
                                      {lbl.groupJid && `Grupo: ${groupsSelect.find((g) => g.groupJid === lbl.groupJid)?.groupName || lbl.groupJid}`}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-1 shrink-0">
                                <Button variant="ghost" size="sm" onClick={() => openEditLabel(lbl)}>
                                  <Pencil size={15} />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(lbl)}>
                                  <Trash2 size={15} className="text-accent-red" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="hidden md:block">
                          <Table data={labels} columns={labelColumns} getRowKey={(lbl) => lbl.id} />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Mensajes */}
              {activeTab === 'messages' && (
                <div className="bg-bg-secondary border border-border-primary rounded-lg p-4 md:p-6 space-y-6">
                  <div>
                    <h2 className="text-base font-semibold text-text-primary mb-1">Mensajes del sistema</h2>
                    <p className="text-sm text-text-secondary">Personaliza los mensajes automáticos que envía el bot.</p>
                  </div>

                  <div className="border-t border-border-primary pt-6 space-y-2">
                    <label className="block text-sm font-medium text-text-primary">
                      Mensaje de despedida
                    </label>
                    <p className="text-xs text-text-tertiary">
                      Se envía automáticamente al cerrar una conversación.
                    </p>
                    <textarea
                      value={farewellContent}
                      onChange={(e) => setFarewellContent(e.target.value)}
                      rows={5}
                      className="w-full px-3 py-2 text-sm bg-bg-primary border border-border-primary rounded-md text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent-blue resize-y"
                      placeholder="Ej: ¡Hasta pronto! Si necesitas algo más, no dudes en contactarnos."
                    />
                  </div>

                  <div className="pt-4 border-t border-border-primary flex justify-end">
                    <Button
                      onClick={() => {
                        updateFarewell.mutate(farewellContent, {
                          onSuccess: () => showToast('Mensaje de despedida guardado', 'success'),
                          onError: () => showToast('Error al guardar el mensaje', 'error'),
                        });
                      }}
                      disabled={!farewellHasChanges || updateFarewell.isPending}
                      isLoading={updateFarewell.isPending}
                    >
                      Guardar cambios
                    </Button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </MainLayout>

      {/* Label Modal */}
      <Modal isOpen={labelModalOpen} onClose={closeLabelModal} size="md">
        <ModalHeader onClose={closeLabelModal}>
          <ModalTitle>{editingLabel ? 'Editar etiqueta' : 'Nueva etiqueta'}</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <FormField label="Etiqueta" required error={labelErrors.label}>
              <Input
                placeholder="Ej: VIP, Urgente, Proveedor..."
                value={labelForm.label}
                onChange={(e) => setLabelForm((f) => ({ ...f, label: e.target.value }))}
                error={!!labelErrors.label}
              />
            </FormField>
            <FormField label="Cliente" optional>
              <SearchableSelect
                value={labelForm.clientId}
                options={[
                  { value: '', label: 'Sin cliente' },
                  ...contactsSelect.map((c) => ({ value: c.id, label: c.name || c.phoneNumber })),
                ]}
                onChange={(val) => setLabelForm((f) => ({ ...f, clientId: val }))}
                placeholder="Sin cliente"
                searchPlaceholder="Buscar cliente..."
              />
            </FormField>
            <FormField label="Grupo" optional>
              <SearchableSelect
                value={labelForm.groupJid}
                options={[
                  { value: '', label: 'Sin grupo' },
                  ...groupsSelect.map((g) => ({ value: g.groupJid, label: g.groupName })),
                ]}
                onChange={(val) => setLabelForm((f) => ({ ...f, groupJid: val }))}
                placeholder="Sin grupo"
                searchPlaceholder="Buscar grupo..."
              />
            </FormField>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={closeLabelModal} disabled={isLabelSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleLabelSubmit} isLoading={isLabelSubmitting}>
            {editingLabel ? 'Guardar cambios' : 'Crear etiqueta'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleLabelDelete}
        title="Eliminar etiqueta"
        message={`¿Estás seguro de eliminar "${deleteTarget?.label}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        isLoading={deleteLabel.isPending}
      />

      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </>
  );
};
