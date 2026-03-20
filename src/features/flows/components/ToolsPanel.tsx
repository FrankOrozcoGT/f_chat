import { useState, useMemo } from 'react';
import { List, Tag, GitBranch, Brain, Plus, Pencil, Trash2, X, Loader2, Search, Eye, PenLine } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/shared/ui/Button';
import type { Flow, Node, Intent, FlowTransition } from '../types';
import { useGetTenantMemory, useSetTenantMemory, useDeleteTenantMemory } from '@/features/tenants/api';

type ToolTab = 'nodes' | 'intents' | 'transitions' | 'memory';

interface ToolsPanelProps {
  onClose: () => void;

  // Nodos
  existingNodes: Node[];
  onEditNode: (node: Node) => void;
  onCreateNode: () => void;

  // Intents
  intents: Intent[];
  flows: Flow[];
  onCreateIntent: () => void;
  onEditIntent: (intent: Intent) => void;
  onDeleteIntent: (intent: Intent) => void;

  // Transiciones
  transitionsFlow: Flow | undefined;
  transitionsList: FlowTransition[];
  onDeleteTransition: (id: string) => void;
}

// ── MdField ──────────────────────────────────────────────────────────────────

interface MdFieldProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

const MdField = ({ value, onChange, placeholder, autoFocus }: MdFieldProps) => {
  const [preview, setPreview] = useState(false);
  return (
    <div>
      <div className="flex gap-1 mb-1">
        <button
          type="button"
          onClick={() => setPreview(false)}
          className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-colors ${!preview ? 'bg-accent-blue/10 text-accent-blue' : 'text-text-secondary hover:text-text-primary'}`}
        >
          <PenLine size={11} /> Editar
        </button>
        <button
          type="button"
          onClick={() => setPreview(true)}
          className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-colors ${preview ? 'bg-accent-blue/10 text-accent-blue' : 'text-text-secondary hover:text-text-primary'}`}
        >
          <Eye size={11} /> Preview
        </button>
      </div>
      {preview ? (
        <div className="w-full min-h-18 px-2.5 py-1.5 text-sm bg-bg-primary border border-border-primary rounded-md text-text-primary prose prose-sm prose-invert max-w-none *:my-1 [&>ul]:pl-4 [&>ol]:pl-4">
          {value ? <ReactMarkdown>{value}</ReactMarkdown> : <span className="text-text-tertiary italic">Sin contenido</span>}
        </div>
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          autoFocus={autoFocus}
          className="w-full px-2.5 py-1.5 text-sm bg-bg-primary border border-border-primary rounded-md text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent-blue resize-y"
        />
      )}
    </div>
  );
};

// ── helpers ──────────────────────────────────────────────────────────────────

/** Segmento válido: empieza con letra, solo a-z 0-9 _ */
const SEGMENT_RE = /^[a-z][a-z0-9_]*$/;

function validatePath(path: string): string {
  if (!path) return 'El path es requerido';
  const segments = path.split('.');
  if (segments.length > 5) return 'Máximo 5 niveles (4 puntos)';
  for (const seg of segments) {
    if (!SEGMENT_RE.test(seg))
      return `Segmento inválido: "${seg}" — solo a-z, 0-9, _ y debe empezar con letra`;
  }
  return '';
}

/** Aplana un objeto anidado a pares [path, valorString] */
function flatten(obj: unknown, prefix = ''): [string, string][] {
  if (obj === null || obj === undefined) return [[prefix, 'null']];
  if (typeof obj !== 'object' || Array.isArray(obj)) {
    return [[prefix, typeof obj === 'string' ? obj : JSON.stringify(obj)]];
  }
  const entries: [string, string][] = [];
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      entries.push(...flatten(v, fullKey));
    } else {
      entries.push([fullKey, typeof v === 'string' ? v : JSON.stringify(v)]);
    }
  }
  return entries;
}

// ── Memory tab ───────────────────────────────────────────────────────────────

const inputCls = 'w-full px-2.5 py-1.5 text-sm bg-bg-primary border border-border-primary rounded-md text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent-blue';

const MemoryTab = () => {
  const { data: memory = {}, isLoading } = useGetTenantMemory();
  const setMemory = useSetTenantMemory();
  const deleteMemory = useDeleteTenantMemory();

  const [search, setSearch] = useState('');
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editError, setEditError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newPath, setNewPath] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newError, setNewError] = useState('');

  const entries = useMemo(() => flatten(memory), [memory]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return entries;
    return entries.filter(([path, val]) =>
      path.includes(q) || val.toLowerCase().includes(q)
    );
  }, [entries, search]);

  const openEdit = (path: string, val: string) => {
    setEditingPath(path);
    setEditValue(val);
    setEditError('');
  };

  const handleSaveEdit = async () => {
    if (!editingPath) return;
    setEditError('');
    await setMemory.mutateAsync({ path: editingPath, value: editValue });
    setEditingPath(null);
  };

  const handleDelete = async (path: string) => {
    const topKey = path.split('.')[0];
    await deleteMemory.mutateAsync(topKey);
  };

  const handlePathInput = (val: string) => {
    setNewPath(val.toLowerCase().replace(/[^a-z0-9_.]/g, ''));
    setNewError('');
  };

  const handleAdd = async () => {
    const err = validatePath(newPath);
    if (err) { setNewError(err); return; }
    await setMemory.mutateAsync({ path: newPath, value: newValue });
    setNewPath('');
    setNewValue('');
    setShowAdd(false);
    setNewError('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={20} className="animate-spin text-text-secondary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search + add */}
      <div className="p-3 space-y-2 border-b border-border-primary">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            placeholder="Buscar path o valor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1.5 text-sm bg-bg-primary border border-border-primary rounded-md text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent-blue"
          />
        </div>

        {!showAdd && (
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus size={14} className="mr-1" /> Nueva entrada
          </Button>
        )}

        {showAdd && (
          <div className="space-y-2">
            <input
              type="text"
              placeholder="path (ej: banco.cuenta)"
              value={newPath}
              onChange={(e) => handlePathInput(e.target.value)}
              className={inputCls}
              autoFocus
            />
            <MdField value={newValue} onChange={setNewValue} placeholder="valor" />
            {newError && <p className="text-xs text-accent-red">{newError}</p>}
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd} isLoading={setMemory.isPending}>Guardar</Button>
              <Button size="sm" variant="ghost" onClick={() => { setShowAdd(false); setNewError(''); setNewPath(''); setNewValue(''); }}>Cancelar</Button>
            </div>
          </div>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {filtered.length === 0 && (
          <p className="text-sm text-text-secondary text-center py-8">
            {search ? 'Sin resultados.' : 'Sin datos guardados.'}
          </p>
        )}

        {filtered.map(([path, val]) => (
          <div key={path} className="bg-bg-tertiary rounded-lg overflow-hidden">
            {editingPath === path ? (
              <div className="p-2.5 space-y-1.5">
                <p className="text-xs font-mono text-accent-blue">{path}</p>
                <MdField value={editValue} onChange={(v) => { setEditValue(v); setEditError(''); }} autoFocus />
                {editError && <p className="text-xs text-accent-red">{editError}</p>}
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveEdit} isLoading={setMemory.isPending}>Guardar</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingPath(null)}>Cancelar</Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-2.5 py-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono text-accent-blue truncate">{path}</p>
                  <p className="text-xs text-text-secondary truncate">{val}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEdit(path, val)} className="p-1 rounded hover:bg-bg-secondary transition-colors" title="Editar">
                    <Pencil size={12} className="text-text-secondary" />
                  </button>
                  <button onClick={() => handleDelete(path)} className="p-1 rounded hover:bg-bg-secondary transition-colors" title="Eliminar" disabled={deleteMemory.isPending}>
                    <Trash2 size={12} className="text-accent-red" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Main panel ───────────────────────────────────────────────────────────────

const TABS: { id: ToolTab; icon: typeof List; label: string }[] = [
  { id: 'nodes', icon: List, label: 'Nodos' },
  { id: 'intents', icon: Tag, label: 'Intents' },
  { id: 'transitions', icon: GitBranch, label: 'Transiciones' },
  { id: 'memory', icon: Brain, label: 'Memoria' },
];

export const ToolsPanel = ({
  onClose,
  existingNodes,
  onEditNode,
  onCreateNode,
  intents,
  flows,
  onCreateIntent,
  onEditIntent,
  onDeleteIntent,
  transitionsFlow,
  transitionsList,
  onDeleteTransition,
}: ToolsPanelProps) => {
  const [activeTab, setActiveTab] = useState<ToolTab>('nodes');

  return (
    <div className="absolute right-0 top-0 h-full w-80 bg-bg-secondary border-l border-border-primary z-10 flex flex-col shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-primary shrink-0">
        <h3 className="text-sm font-semibold text-text-primary">Herramientas</h3>
        <button onClick={onClose} className="p-1.5 rounded hover:bg-bg-tertiary transition-colors">
          <X size={16} className="text-text-secondary" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border-primary shrink-0">
        {TABS.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            title={label}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs transition-colors border-b-2 ${
              activeTab === id
                ? 'border-accent-blue text-accent-blue'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <Icon size={15} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">

        {/* Nodos */}
        {activeTab === 'nodes' && (
          <div className="flex flex-col gap-2 p-3">
            <Button size="sm" onClick={onCreateNode}>
              <Plus size={14} className="mr-1" /> Nuevo nodo
            </Button>
            {existingNodes.length === 0 && (
              <p className="text-sm text-text-secondary text-center py-6">No hay nodos.</p>
            )}
            {existingNodes.map((node) => (
              <div key={node.id} className="flex items-center justify-between gap-2 p-3 bg-bg-tertiary rounded-lg">
                <p className="text-sm font-medium text-text-primary truncate">{node.name}</p>
                <button
                  onClick={() => onEditNode(node)}
                  className="p-1 rounded hover:bg-bg-secondary transition-colors shrink-0"
                  title="Editar"
                >
                  <Pencil size={14} className="text-text-secondary" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Intents */}
        {activeTab === 'intents' && (
          <div className="flex flex-col gap-2 p-3">
            <Button size="sm" onClick={onCreateIntent}>
              <Plus size={14} className="mr-1" /> Nuevo intent
            </Button>
            {intents.length === 0 && (
              <p className="text-sm text-text-secondary text-center py-6">No hay intents.</p>
            )}
            {intents.map((intent) => (
              <div key={intent.id} className="flex items-center justify-between gap-2 p-3 bg-bg-tertiary rounded-lg">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{intent.name}</p>
                  {intent.flowId && (
                    <p className="text-xs text-text-secondary truncate">
                      {flows.find((f) => f.id === intent.flowId)?.name ?? ''}
                    </p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => onEditIntent(intent)}
                    className="p-1 rounded hover:bg-bg-secondary transition-colors"
                    title="Editar"
                  >
                    <Pencil size={13} className="text-text-secondary" />
                  </button>
                  <button
                    onClick={() => onDeleteIntent(intent)}
                    className="p-1 rounded hover:bg-bg-secondary transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 size={13} className="text-accent-red" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Transiciones */}
        {activeTab === 'transitions' && (
          <div className="flex flex-col gap-2 p-3">
            {!transitionsFlow && (
              <p className="text-sm text-text-secondary text-center py-6">
                Abre las transiciones desde un flujo en el canvas.
              </p>
            )}
            {transitionsFlow && (
              <>
                <p className="text-xs text-text-secondary px-1 pb-1">
                  Flujo: <span className="font-medium text-text-primary">{transitionsFlow.name}</span>
                </p>
                {transitionsList.length === 0 && (
                  <p className="text-sm text-text-secondary text-center py-6">No hay transiciones.</p>
                )}
                {transitionsList.map((t) => {
                  const fromNode = transitionsFlow.nodes?.find((fn) => fn.node.id === t.fromNodeId)?.node;
                  const toNode = transitionsFlow.nodes?.find((fn) => fn.node.id === t.toNodeId)?.node;
                  return (
                    <div key={t.id} className="flex items-center justify-between gap-2 p-3 bg-bg-tertiary rounded-lg">
                      <div className="min-w-0">
                        <p className="text-xs text-text-secondary">
                          {fromNode?.name ?? t.fromNodeId} → {toNode?.name ?? t.toNodeId}
                        </p>
                        <p className="text-sm font-medium text-text-primary truncate">{t.transitionCode}</p>
                      </div>
                      <button
                        onClick={() => onDeleteTransition(t.id)}
                        className="p-1 rounded hover:bg-bg-secondary transition-colors shrink-0"
                        title="Eliminar"
                      >
                        <Trash2 size={13} className="text-accent-red" />
                      </button>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}

        {/* Memoria */}
        {activeTab === 'memory' && <MemoryTab />}
      </div>
    </div>
  );
};
