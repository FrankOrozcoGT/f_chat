import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  type NodeTypes,
  type EdgeTypes,
  MarkerType,
  Handle,
  Position,
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Plus, Trash2, Save, X, Undo2 } from 'lucide-react';
import { parseMermaidFlowchart, toMermaidFlowchart } from '../utils/parseMermaid';
import type { NodeMappingEntry } from '../api/useGetFlowDiagram';

// --- Custom Node ---
const EditableNode = ({ id, data, selected }: { id: string; data: { label: string; coverageClass?: string; onLabelChange: (id: string, label: string) => void }; selected?: boolean }) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(data.label);
  const inputRef = useRef<HTMLInputElement>(null);

  const coverageColors: Record<string, string> = {
    'high-coverage': 'border-accent-green bg-accent-green/10',
    'low-coverage': 'border-accent-blue bg-accent-blue/10',
    'ai-suggested': 'border-text-tertiary border-dashed bg-bg-tertiary',
    highlighted: 'border-accent-yellow bg-accent-yellow/15 ring-2 ring-accent-yellow/50',
    '': 'border-border-primary bg-bg-secondary',
  };
  const cls = coverageColors[data.coverageClass ?? ''] ?? coverageColors[''];

  const handleDoubleClick = () => {
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleBlur = () => {
    setEditing(false);
    if (value.trim() && value !== data.label) {
      data.onLabelChange(id, value.trim());
    }
  };

  return (
    <div
      className={`px-4 py-2 rounded-lg border-2 text-sm text-text-primary min-w-[120px] text-center transition-colors ${cls} ${selected ? 'ring-2 ring-accent-blue' : ''}`}
      onDoubleClick={handleDoubleClick}
    >
      <Handle type="target" position={Position.Top} className="!bg-accent-blue !w-2 !h-2" />
      {editing ? (
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
          className="bg-transparent text-center text-sm text-text-primary outline-none w-full"
        />
      ) : (
        <span>{data.label}</span>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-accent-blue !w-2 !h-2" />
    </div>
  );
};

// --- Custom Edge ---
const DeletableEdge = ({
  id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, markerEnd,
}: {
  id: string; sourceX: number; sourceY: number; targetX: number; targetY: number;
  sourcePosition: Position; targetPosition: Position; data?: { label?: string; onDelete: (id: string) => void }; markerEnd?: string;
}) => {
  const [path, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
  return (
    <>
      <BaseEdge path={path} markerEnd={markerEnd} style={{ stroke: '#64748b' }} />
      <EdgeLabelRenderer>
        <div
          className="absolute flex items-center gap-1 pointer-events-auto"
          style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
        >
          {data?.label && (
            <span className="text-[10px] bg-bg-secondary px-1.5 py-0.5 rounded text-text-tertiary border border-border-primary">
              {data.label}
            </span>
          )}
          <button
            onClick={() => data?.onDelete(id)}
            className="p-0.5 rounded bg-bg-secondary border border-border-primary text-text-tertiary hover:text-accent-red hover:border-accent-red/50 transition-colors"
          >
            <X size={10} />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

const nodeTypes: NodeTypes = { editable: EditableNode };
const edgeTypes: EdgeTypes = { deletable: DeletableEdge };

interface DiagramEditorProps {
  mermaidChart: string;
  nodeMapping?: Record<string, NodeMappingEntry[]>;
  selectedConversationId?: string | null;
  onSave: (newMermaid: string) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

interface HistoryEntry {
  nodes: Node[];
  edges: Edge[];
}

let nodeIdCounter = 0;

export const DiagramEditor = ({
  mermaidChart,
  nodeMapping,
  selectedConversationId,
  onSave,
  onCancel,
  isSaving,
}: DiagramEditorProps) => {
  const parsed = useMemo(() => parseMermaidFlowchart(mermaidChart), [mermaidChart]);

  const getCoverageClass = useCallback((nodeId: string): string => {
    if (!nodeMapping) return '';
    const sources = nodeMapping[nodeId];
    if (!sources) return '';
    if (selectedConversationId) {
      return sources.some((s) => s.conversationId === selectedConversationId) ? 'highlighted' : '';
    }
    if (sources.length === 0) return 'ai-suggested';
    if (sources.length >= 3) return 'high-coverage';
    return 'low-coverage';
  }, [nodeMapping, selectedConversationId]);

  const onLabelChange = useCallback((id: string, label: string) => {
    pushHistory();
    setNodes((nds) => nds.map((n) => n.id === id ? { ...n, data: { ...n.data, label } } : n));
  }, []);

  const onDeleteEdge = useCallback((edgeId: string) => {
    pushHistory();
    setEdges((eds) => eds.filter((e) => e.id !== edgeId));
  }, []);

  const initialNodes: Node[] = parsed.nodes.map((n, i) => ({
    id: n.id,
    type: 'editable',
    position: { x: 250, y: i * 100 },
    data: { label: n.label, coverageClass: getCoverageClass(n.id), onLabelChange },
  }));

  const initialEdges: Edge[] = parsed.edges.map((e, i) => ({
    id: `e-${e.source}-${e.target}-${i}`,
    source: e.source,
    target: e.target,
    type: 'deletable',
    markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' },
    data: { label: e.label, onDelete: onDeleteEdge },
  }));

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // --- Undo history ---
  const historyRef = useRef<HistoryEntry[]>([]);
  const isUndoingRef = useRef(false);

  const pushHistory = useCallback(() => {
    if (isUndoingRef.current) return;
    historyRef.current.push({
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    });
    // Limit history
    if (historyRef.current.length > 50) historyRef.current.shift();
  }, [nodes, edges]);

  const undo = useCallback(() => {
    const prev = historyRef.current.pop();
    if (!prev) return;
    isUndoingRef.current = true;
    setNodes(prev.nodes.map((n) => ({ ...n, data: { ...n.data, onLabelChange, coverageClass: getCoverageClass(n.id) } })));
    setEdges(prev.edges.map((e) => ({ ...e, data: { ...e.data, onDelete: onDeleteEdge } })));
    setTimeout(() => { isUndoingRef.current = false; }, 0);
  }, [getCoverageClass, onLabelChange, onDeleteEdge]);

  // Ctrl+Z handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo]);

  // Escape to cancel
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel]);

  // Update coverage when selection changes
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => ({ ...n, data: { ...n.data, coverageClass: getCoverageClass(n.id) } }))
    );
  }, [selectedConversationId, getCoverageClass]);

  const onConnect = useCallback(
    (connection: Connection) => {
      pushHistory();
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            type: 'deletable',
            markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' },
            data: { onDelete: onDeleteEdge },
          },
          eds,
        ),
      );
    },
    [onDeleteEdge, pushHistory],
  );

  const addNode = () => {
    pushHistory();
    const id = `N${++nodeIdCounter}_${Date.now()}`;
    setNodes((nds) => [
      ...nds,
      {
        id,
        type: 'editable',
        position: { x: 250, y: nds.length * 100 },
        data: { label: 'Nuevo nodo', coverageClass: '', onLabelChange },
      },
    ]);
  };

  const deleteSelectedNodes = () => {
    const selectedIds = new Set(nodes.filter((n) => n.selected).map((n) => n.id));
    if (selectedIds.size === 0) return;
    pushHistory();
    setNodes((nds) => nds.filter((n) => !selectedIds.has(n.id)));
    setEdges((eds) => eds.filter((e) => !selectedIds.has(e.source) && !selectedIds.has(e.target)));
  };

  const handleSave = () => {
    const mermaid = toMermaidFlowchart(
      nodes.map((n) => ({ id: n.id, data: { label: n.data.label as string } })),
      edges.map((e) => ({ source: e.source, target: e.target, label: e.data?.label as string | undefined })),
    );
    onSave(mermaid);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg-primary">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-bg-secondary border-b border-border-primary shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={addNode}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-bg-primary border border-border-primary rounded text-text-secondary hover:text-text-primary transition-colors"
          >
            <Plus size={13} />
            Agregar nodo
          </button>
          <button
            onClick={deleteSelectedNodes}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-bg-primary border border-border-primary rounded text-text-secondary hover:text-accent-red transition-colors"
          >
            <Trash2 size={13} />
            Eliminar
          </button>
          <button
            onClick={undo}
            disabled={historyRef.current.length === 0}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-bg-primary border border-border-primary rounded text-text-secondary hover:text-text-primary transition-colors disabled:opacity-30"
            title="Deshacer (Ctrl+Z)"
          >
            <Undo2 size={13} />
            Deshacer
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-accent-blue text-white rounded text-xs font-medium hover:opacity-90 disabled:opacity-50"
          >
            <Save size={13} />
            {isSaving ? 'Guardando...' : 'Guardar'}
          </button>
          <button
            onClick={onCancel}
            className="flex items-center gap-1.5 px-4 py-1.5 border border-border-primary text-text-secondary rounded text-xs font-medium hover:bg-bg-tertiary"
          >
            <X size={13} />
            Cerrar
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          deleteKeyCode="Delete"
          proOptions={{ hideAttribution: true }}
          className="bg-bg-primary"
        >
          <Background gap={20} size={1} color="#334155" />
          <Controls showInteractive={false} className="!bg-bg-secondary !border-border-primary !shadow-none [&>button]:!bg-bg-secondary [&>button]:!border-border-primary [&>button]:!text-text-secondary" />
          <MiniMap
            nodeColor="#3b82f6"
            maskColor="rgba(0,0,0,0.3)"
            className="!bg-bg-secondary !border-border-primary"
          />
        </ReactFlow>
      </div>

      {/* Legend */}
      {nodeMapping && (
        <div className="flex items-center gap-4 px-4 py-2 bg-bg-secondary border-t border-border-primary text-[10px] text-text-tertiary shrink-0">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded border-2 border-accent-green bg-accent-green/10" />
            Alta cobertura (3+)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded border-2 border-accent-blue bg-accent-blue/10" />
            Baja cobertura
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded border-2 border-dashed border-text-tertiary bg-bg-tertiary" />
            Sugerido por IA
          </span>
          {selectedConversationId && (
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded border-2 border-accent-yellow bg-accent-yellow/15 ring-1 ring-accent-yellow/50" />
              En conversación seleccionada
            </span>
          )}
          <span className="ml-auto text-text-tertiary">Doble click para editar nodo · Arrastra handles para conectar · Ctrl+Z deshacer</span>
        </div>
      )}
    </div>
  );
};
