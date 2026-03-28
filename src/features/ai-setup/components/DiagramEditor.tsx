import { useState, useCallback, useRef, useMemo } from 'react';
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
import { Plus, Trash2, Save, X } from 'lucide-react';
import { parseMermaidFlowchart, toMermaidFlowchart } from '../utils/parseMermaid';
import type { NodeMappingEntry } from '../api/useGetFlowDiagram';

// Custom node with editable label
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

// Custom edge with delete button
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

    // If a conversation is selected, highlight matching nodes
    if (selectedConversationId) {
      const isInConversation = sources.some((s) => s.conversationId === selectedConversationId);
      return isInConversation ? 'highlighted' : '';
    }

    // Default coverage coloring
    if (sources.length === 0) return 'ai-suggested';
    if (sources.length >= 3) return 'high-coverage';
    return 'low-coverage';
  }, [nodeMapping, selectedConversationId]);

  const onLabelChange = useCallback((id: string, label: string) => {
    setNodes((nds) => nds.map((n) => n.id === id ? { ...n, data: { ...n.data, label } } : n));
  }, []);

  const onDeleteEdge = useCallback((edgeId: string) => {
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

  // Update coverage classes when selectedConversationId changes
  useMemo(() => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: { ...n.data, coverageClass: getCoverageClass(n.id) },
      }))
    );
  }, [selectedConversationId, getCoverageClass]);

  const onConnect = useCallback(
    (connection: Connection) => {
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
    [onDeleteEdge],
  );

  const addNode = () => {
    const id = `N${++nodeIdCounter}_${Date.now()}`;
    setNodes((nds) => [
      ...nds,
      {
        id,
        type: 'editable',
        position: { x: 250, y: (nds.length) * 100 },
        data: { label: 'Nuevo nodo', coverageClass: '', onLabelChange },
      },
    ]);
  };

  const deleteSelectedNodes = () => {
    const selectedIds = new Set(nodes.filter((n) => n.selected).map((n) => n.id));
    if (selectedIds.size === 0) return;
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
    <div className="flex flex-col h-[500px] border border-border-primary rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-bg-primary border-b border-border-primary shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={addNode}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-bg-secondary border border-border-primary rounded text-text-secondary hover:text-text-primary transition-colors"
          >
            <Plus size={12} />
            Agregar nodo
          </button>
          <button
            onClick={deleteSelectedNodes}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-bg-secondary border border-border-primary rounded text-text-secondary hover:text-accent-red transition-colors"
          >
            <Trash2 size={12} />
            Eliminar seleccionados
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1 px-3 py-1 bg-accent-blue text-white rounded text-xs font-medium hover:opacity-90 disabled:opacity-50"
          >
            <Save size={12} />
            {isSaving ? 'Guardando...' : 'Guardar'}
          </button>
          <button
            onClick={onCancel}
            className="flex items-center gap-1 px-3 py-1 border border-border-primary text-text-secondary rounded text-xs hover:bg-bg-tertiary"
          >
            <X size={12} />
            Cancelar
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
        <div className="flex items-center gap-4 px-3 py-1.5 bg-bg-primary border-t border-border-primary text-[10px] text-text-tertiary">
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
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded border-2 border-accent-yellow bg-accent-yellow/15 ring-1 ring-accent-yellow/50" />
            En conversación seleccionada
          </span>
        </div>
      )}
    </div>
  );
};
