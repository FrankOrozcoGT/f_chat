import { useState, useRef, useMemo } from 'react';
import { Save, X, Undo2, Eye, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import type { NodeMappingEntry, InternalQueue } from '../api/useGetFlowDiagram';
import type { FlowAnalysis } from '../api/useGetFlowAnalyses';
import { ConversationDrawer } from './ConversationDrawer';
import { DiagramContextMenu, type ContextMenuState } from './DiagramContextMenu';
import { DiagramConversationsSidebar } from './DiagramConversationsSidebar';
import { DiagramLabelEditorModal, type EditingLabelState } from './DiagramLabelEditorModal';
import { usePanZoom } from '../hooks/usePanZoom';
import { useMermaidChartEditor, type NodeShape } from '../hooks/useMermaidChartEditor';
import { useDiagramRender } from '../hooks/useDiagramRender';
import { useDiagramKeyboardShortcuts } from '../hooks/useDiagramKeyboardShortcuts';

// --- Types ---
type SelectionMode = 'none' | 'select-origin' | 'select-destination';
type Selection = ContextMenuState['selection'];

// --- Props ---
interface DiagramEditorProps {
  mermaidChart: string;
  nodeMapping?: Record<string, NodeMappingEntry[]>;
  internalQueues?: InternalQueue[];
  nodeCategories?: Record<string, string>;
  analyses?: FlowAnalysis[];
  onSave: (newMermaid: string) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

// --- Component ---
export const DiagramEditor = ({
  mermaidChart,
  nodeMapping,
  internalQueues,
  nodeCategories,
  analyses,
  onSave,
  onCancel,
  isSaving,
}: DiagramEditorProps) => {
  // State
  const [showRawEditor, setShowRawEditor] = useState(false);
  const [rawValue, setRawValue] = useState('');
  const [selection, setSelection] = useState<Selection | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [selectMode, setSelectMode] = useState<SelectionMode>('none');
  const [mode, setMode] = useState<'move' | 'edit'>('move');
  const [showSidebar, setShowSidebar] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [viewingConversationId, setViewingConversationId] = useState<string | null>(null);
  const [selectModeEdge, setSelectModeEdge] = useState<{ source: string; target: string; field: 'source' | 'target' } | null>(null);
  const [editingLabel, setEditingLabel] = useState<EditingLabelState | null>(null);

  const svgContainerRef = useRef<HTMLDivElement>(null);

  const {
    chart,
    parsed,
    setChart,
    undo: undoChart,
    editNodeLabel,
    editEdgeLabel,
    changeNodeShape,
    addNodeAfter,
    deleteNode,
    deleteEdge,
    insertNodeInEdge,
    changeEdgeEndpoint,
  } = useMermaidChartEditor(mermaidChart);

  const {
    pan,
    containerRef: canvasRef,
    onMouseDown: onPanMouseDown,
    onMouseMove: onPanMouseMove,
    onMouseUp: onPanMouseUp,
    zoomIn,
    zoomOut,
    reset: resetPan,
  } = usePanZoom(mode === 'move');

  const undo = () => {
    if (undoChart()) {
      setSelection(null);
      setContextMenu(null);
    }
  };

  // Apply coverage styles + conversation count in labels
  const styledChart = useMemo(() => {
    if (!nodeMapping) return chart;
    let displayChart = chart;

    // Inject conversation count into node labels
    Object.entries(nodeMapping).forEach(([nodeId, sources]) => {
      const uniqueConvs = new Set(sources.map((s) => s.conversationId)).size;
      if (uniqueConvs > 0) {
        // Match node definition like C1[Label] or C1{Label} or C1(Label)
        const nodeRegex = new RegExp(`(${nodeId}\\s*[\\[\\(\\{][\\[\\(\\{]?)([^\\]\\)\\}]+)([\\]\\)\\}][\\]\\)\\}]?)`);
        displayChart = displayChart.replace(nodeRegex, `$1$2 · ${uniqueConvs} conv$3`);
      }
    });

    const styleLines: string[] = [];
    Object.entries(nodeMapping).forEach(([nodeId, sources]) => {
      if (!parsed.nodes.find((n) => n.id === nodeId)) return;
      if (selectedConversationId) {
        if (sources.some((s) => s.conversationId === selectedConversationId)) {
          styleLines.push(`    style ${nodeId} fill:#fbbf24,stroke:#f59e0b,color:#1a1a2e`);
        }
      } else if (sources.length === 0) {
        styleLines.push(`    style ${nodeId} fill:#334155,stroke:#64748b,stroke-dasharray: 5 5`);
      } else if (sources.length >= 3) {
        styleLines.push(`    style ${nodeId} fill:#166534,stroke:#22c55e,color:#e2e8f0`);
      } else {
        styleLines.push(`    style ${nodeId} fill:#1e3a5f,stroke:#3b82f6,color:#e2e8f0`);
      }
    });

    // Mark nodes with internal queues (purple border)
    if (internalQueues) {
      const queueNodeIds = new Set(internalQueues.map((q) => q.nodeId));
      queueNodeIds.forEach((nodeId) => {
        if (!styleLines.some((l) => l.includes(`style ${nodeId}`))) {
          styleLines.push(`    style ${nodeId} stroke:#a855f7,stroke-width:2px`);
        }
      });
    }

    // Highlight selected node/edge
    if (selection?.type === 'node') {
      styleLines.push(`    style ${selection.id} stroke:#fbbf24,stroke-width:3px`);
    }

    return styleLines.length > 0 ? displayChart + '\n' + styleLines.join('\n') : displayChart;
  }, [chart, nodeMapping, internalQueues, selectedConversationId, selection, parsed.nodes]);

  const { svg, renderError, setRenderError } = useDiagramRender(styledChart, svgContainerRef);

  // --- Actions ---
  const handleEditNodeLabel = (nodeId: string) => {
    const node = parsed.nodes.find((n) => n.id === nodeId);
    if (!node) return;
    setEditingLabel({ id: nodeId, type: 'node', value: node.label });
    setContextMenu(null);
  };

  const handleSaveLabel = () => {
    if (!editingLabel) return;
    if (editingLabel.type === 'node') {
      editNodeLabel(editingLabel.id, editingLabel.value);
    } else {
      const [src, tgt] = editingLabel.id.split('->');
      editEdgeLabel(src, tgt, editingLabel.value);
    }
    setEditingLabel(null);
  };

  const handleChangeShape = (nodeId: string, shape: NodeShape) => {
    changeNodeShape(nodeId, shape);
    setContextMenu(null);
  };

  const handleAddNodeAfter = (nodeId: string) => {
    const newId = addNodeAfter(nodeId);
    setContextMenu(null);
    // Immediately edit the new node's label
    setTimeout(() => setEditingLabel({ id: newId, type: 'node', value: 'Nuevo paso' }), 100);
  };

  const handleDeleteNode = (nodeId: string) => {
    deleteNode(nodeId);
    setSelection(null);
    setContextMenu(null);
  };

  const handleEditEdgeLabel = (source: string, target: string) => {
    const edge = parsed.edges.find((e) => e.source === source && e.target === target);
    setEditingLabel({ id: `${source}->${target}`, type: 'edge', value: edge?.label ?? '' });
    setContextMenu(null);
  };

  const handleDeleteEdge = (source: string, target: string) => {
    deleteEdge(source, target);
    setSelection(null);
    setContextMenu(null);
  };

  const handleInsertNodeInEdge = (source: string, target: string) => {
    const newId = insertNodeInEdge(source, target);
    setContextMenu(null);
    setTimeout(() => setEditingLabel({ id: newId, type: 'node', value: 'Nuevo paso' }), 100);
  };

  const handleChangeEdgeEndpoint = (source: string, target: string, field: 'source' | 'target') => {
    setSelectMode(field === 'source' ? 'select-origin' : 'select-destination');
    setSelectModeEdge({ source, target, field });
    setContextMenu(null);
  };

  const handleSave = () => {
    // Strip style lines before saving
    const cleanChart = chart.split('\n').filter((l) => !l.trim().startsWith('style ')).join('\n');
    onSave(cleanChart);
  };

  useDiagramKeyboardShortcuts({
    hasEditingLabel: !!editingLabel,
    hasContextMenu: !!contextMenu,
    isSelectingEndpoint: selectMode !== 'none',
    onUndo: undo,
    onEscape: () => {
      if (editingLabel) {
        setEditingLabel(null);
      } else if (contextMenu) {
        setContextMenu(null);
      } else if (selectMode !== 'none') {
        setSelectMode('none');
        setSelectModeEdge(null);
      } else {
        onCancel();
      }
    },
    onDeleteSelection: () => {
      if (!selection) return;
      if (selection.type === 'node') handleDeleteNode(selection.id);
      if (selection.type === 'edge') {
        const [src, tgt] = selection.id.split('->');
        handleDeleteEdge(src, tgt);
      }
    },
    onToggleMode: () => setMode((m) => m === 'move' ? 'edit' : 'move'),
  });

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg-primary">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-bg-secondary border-b border-border-primary shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode((m) => m === 'move' ? 'edit' : 'move')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border rounded transition-colors ${
              mode === 'edit'
                ? 'bg-accent-yellow/15 text-accent-yellow border-accent-yellow/30'
                : 'bg-accent-blue/15 text-accent-blue border-accent-blue/30'
            }`}
            title="Tab para cambiar"
          >
            {mode === 'move' ? '🖐 Mover' : '✏️ Editar'}
          </button>
          <button
            onClick={undo}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-bg-primary border border-border-primary rounded text-text-secondary hover:text-text-primary transition-colors disabled:opacity-30"
            title="Deshacer (Ctrl+Z)"
          >
            <Undo2 size={13} />
            Deshacer
          </button>
          <button
            onClick={() => { setRawValue(chart); setShowRawEditor(true); }}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-bg-primary border border-border-primary rounded text-text-secondary hover:text-text-primary transition-colors"
            title="Editar código mermaid"
          >
            {'</>'}
          </button>
          {selectMode !== 'none' && (
            <span className="text-xs text-accent-yellow bg-accent-yellow/10 border border-accent-yellow/30 px-2.5 py-1 rounded">
              Haz click en un nodo para seleccionar {selectMode === 'select-origin' ? 'nuevo origen' : 'nuevo destino'}
              <button onClick={() => { setSelectMode('none'); setSelectModeEdge(null); }} className="ml-2 text-text-tertiary hover:text-text-primary">
                <X size={11} />
              </button>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {analyses && analyses.length > 0 && (
            <button
              onClick={() => setShowSidebar((v) => !v)}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium border rounded transition-colors ${
                showSidebar
                  ? 'bg-accent-blue/15 text-accent-blue border-accent-blue/30'
                  : 'bg-bg-primary text-text-secondary border-border-primary hover:text-text-primary'
              }`}
            >
              <Eye size={13} />
              Conversaciones ({analyses.length})
            </button>
          )}
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

      {/* Main area: canvas + optional sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* SVG canvas with pan/zoom */}
        <div
          ref={canvasRef}
          className="flex-1 overflow-hidden relative select-none"
          style={{ cursor: mode === 'move' ? (pan.dragging ? 'grabbing' : 'grab') : 'default' }}
          onMouseDown={mode === 'move' ? onPanMouseDown : undefined}
          onMouseMove={mode === 'move' ? onPanMouseMove : undefined}
          onMouseUp={mode === 'move' ? onPanMouseUp : undefined}
          onMouseLeave={mode === 'move' ? onPanMouseUp : undefined}
          onClick={(e) => {
            if (mode !== 'edit') return;
            const target = e.target as Element;

            // Check if clicked on a node
            const nodeEl = target.closest('.node');
            if (nodeEl) {
              const id = nodeEl.id?.replace(/^flowchart-/, '').replace(/-\d+$/, '');
              if (id) {
                // Handle select mode for edge origin/destination
                if (selectMode !== 'none' && selectModeEdge) {
                  changeEdgeEndpoint(selectModeEdge.source, selectModeEdge.target, selectModeEdge.field, id);
                  setSelectMode('none');
                  setSelectModeEdge(null);
                  setContextMenu(null);
                  return;
                }
                setSelection({ type: 'node', id });
                setContextMenu({ x: e.clientX, y: e.clientY, selection: { type: 'node', id } });
                return;
              }
            }

            // Check if clicked on an edge path or label
            const edgePathEl = target.closest('.edgePath');
            const edgeLabelEl = target.closest('.edgeLabel');
            const edgeEl = edgePathEl || edgeLabelEl;
            if (edgeEl) {
              // Try to find edge key from ID
              const candidates = [edgeEl.id, edgeEl.closest('[id]')?.id ?? ''];
              let edgeKey: string | null = null;
              for (const eid of candidates) {
                const m = eid.match(/L[_-]([A-Za-z0-9_]+)[_-]([A-Za-z0-9_]+)/);
                if (m) { edgeKey = `${m[1]}->${m[2]}`; break; }
              }
              // Fallback: match by DOM index
              if (!edgeKey) {
                const allEdgePaths = svgContainerRef.current?.querySelectorAll('.edgePath');
                const allEdgeLabels = svgContainerRef.current?.querySelectorAll('.edgeLabel');
                const idx = edgePathEl
                  ? Array.from(allEdgePaths ?? []).indexOf(edgePathEl)
                  : Array.from(allEdgeLabels ?? []).indexOf(edgeLabelEl!);
                if (idx >= 0 && parsed.edges[idx]) {
                  edgeKey = `${parsed.edges[idx].source}->${parsed.edges[idx].target}`;
                }
              }
              if (edgeKey) {
                setSelection({ type: 'edge', id: edgeKey });
                setContextMenu({ x: e.clientX, y: e.clientY, selection: { type: 'edge', id: edgeKey } });
                return;
              }
            }

            // Background click — deselect
            setContextMenu(null);
            setSelection(null);
          }}
        >
          <div
            ref={svgContainerRef}
            style={{
              transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${pan.scale})`,
              transformOrigin: 'top left',
              position: 'absolute',
              top: '50%',
              left: '50%',
              pointerEvents: mode === 'edit' ? 'auto' : 'none',
            }}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
          {/* Error + raw editor */}
          {renderError && (
            <div className="absolute inset-0 z-10 flex flex-col bg-bg-primary/95 p-4 overflow-auto">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-medium text-accent-red">Error de mermaid</span>
                <button
                  onClick={() => { setShowRawEditor(true); setRawValue(chart); setRenderError(null); }}
                  className="text-[10px] px-2 py-0.5 bg-accent-blue/15 text-accent-blue border border-accent-blue/30 rounded"
                >
                  Editar código
                </button>
              </div>
              <pre className="text-xs text-accent-red/80 font-mono whitespace-pre-wrap mb-3 bg-bg-secondary rounded p-3 border border-accent-red/20">{renderError}</pre>
              <pre className="text-[10px] text-text-tertiary font-mono whitespace-pre-wrap bg-bg-secondary rounded p-3 border border-border-primary flex-1 overflow-auto">{chart}</pre>
            </div>
          )}
          {showRawEditor && (
            <div className="absolute inset-0 z-10 flex flex-col bg-bg-primary p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-text-primary">Editar diagrama (mermaid)</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setChart(rawValue);
                      setShowRawEditor(false);
                      setRenderError(null);
                    }}
                    className="px-3 py-1 text-xs bg-accent-blue text-white rounded hover:opacity-90"
                  >
                    Aplicar
                  </button>
                  <button
                    onClick={() => setShowRawEditor(false)}
                    className="px-3 py-1 text-xs border border-border-primary text-text-secondary rounded hover:bg-bg-tertiary"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
              <textarea
                value={rawValue}
                onChange={(e) => setRawValue(e.target.value)}
                className="flex-1 px-3 py-2 bg-bg-secondary border border-border-primary rounded-md text-xs font-mono text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-blue resize-none"
              />
            </div>
          )}
          {/* Zoom controls */}
          <div className="absolute bottom-3 right-3 flex items-center gap-1 z-10">
            <button
              onClick={zoomIn}
              className="p-1.5 rounded bg-bg-secondary/80 border border-border-primary text-text-secondary hover:text-text-primary transition-colors"
              title="Zoom in"
            >
              <ZoomIn size={13} />
            </button>
            <button
              onClick={zoomOut}
              className="p-1.5 rounded bg-bg-secondary/80 border border-border-primary text-text-secondary hover:text-text-primary transition-colors"
              title="Zoom out"
            >
              <ZoomOut size={13} />
            </button>
            <button
              onClick={resetPan}
              className="p-1.5 rounded bg-bg-secondary/80 border border-border-primary text-text-secondary hover:text-text-primary transition-colors"
              title="Reset"
            >
              <RotateCcw size={13} />
            </button>
          </div>
        </div>

        {/* Sidebar: conversations */}
        {showSidebar && analyses && (
          <DiagramConversationsSidebar
            analyses={analyses}
            selectedConversationId={selectedConversationId}
            onSelectConversation={setSelectedConversationId}
            onViewConversation={setViewingConversationId}
          />
        )}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <DiagramContextMenu
          contextMenu={contextMenu}
          nodeCategories={nodeCategories}
          internalQueues={internalQueues}
          onEditNodeLabel={handleEditNodeLabel}
          onChangeShape={handleChangeShape}
          onAddNodeAfter={handleAddNodeAfter}
          onDeleteNode={handleDeleteNode}
          onEditEdgeLabel={handleEditEdgeLabel}
          onChangeEdgeEndpoint={handleChangeEdgeEndpoint}
          onInsertNodeInEdge={handleInsertNodeInEdge}
          onDeleteEdge={handleDeleteEdge}
          onStopPropagation={(e) => e.stopPropagation()}
        />
      )}

      {/* Label editor modal */}
      {editingLabel && (
        <DiagramLabelEditorModal
          editingLabel={editingLabel}
          onChange={(value) => setEditingLabel({ ...editingLabel, value })}
          onSave={handleSaveLabel}
          onClose={() => setEditingLabel(null)}
        />
      )}

      {/* Legend + hints */}
      <div className="flex items-center gap-4 px-4 py-2 bg-bg-secondary border-t border-border-primary text-[10px] text-text-tertiary shrink-0">
        {nodeMapping && (
          <>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded border-2 border-accent-green bg-accent-green/10" />
              Alta cobertura
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded border-2 border-accent-blue bg-accent-blue/10" />
              Baja cobertura
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded border-2 border-dashed border-text-tertiary" />
              Sugerido IA
            </span>
          </>
        )}
        {internalQueues && internalQueues.length > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded border-2 border-purple-400 bg-purple-400/10" />
            Canal interno
          </span>
        )}
        <span className="ml-auto">Tab: cambiar modo · {mode === 'edit' ? 'Click en nodo o flecha para acciones · Delete eliminar' : 'Arrastra para mover · Scroll para zoom'} · Ctrl+Z deshacer · Esc cerrar</span>
      </div>

      {/* Conversation drawer */}
      {viewingConversationId && (() => {
        const analysis = analyses?.find((a) => a.conversationId === viewingConversationId);
        return (
          <ConversationDrawer
            conversationId={viewingConversationId}
            title={analysis?.intent ?? 'Conversación'}
            subtitle={analysis?.flowSummary}
            groupJid={analysis?.groupJid}
            participants={analysis?.participants}
            isInternal={analysis?.isInternal}
            onClose={() => setViewingConversationId(null)}
          />
        );
      })()}
    </div>
  );
};
