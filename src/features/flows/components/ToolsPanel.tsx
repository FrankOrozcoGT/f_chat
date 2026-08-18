import { useState } from 'react';
import { List, Tag, GitBranch, Brain, Plus, Pencil, Trash2, X } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import type { Flow, Node, Intent, FlowTransition } from '../types';
import { MemoryTab } from './MemoryTab';

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
