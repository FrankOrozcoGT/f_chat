import { useState, useRef } from 'react';
import type { NodeMappingEntry, InternalQueue } from '@/features/ai-setup/api/useGetFlowDiagram';
import type { FlowAnalysis } from '@/features/ai-setup/api/useGetFlowAnalyses';
import { ConversationDrawer } from '@/features/ai-setup/components/ConversationDrawer';
import { DiagramContextMenu, type ContextMenuState } from '@/features/ai-setup/components/DiagramContextMenu';
import { DiagramConversationsSidebar } from '@/features/ai-setup/components/DiagramConversationsSidebar';
import { DiagramLabelEditorModal, type EditingLabelState } from '@/features/ai-setup/components/DiagramLabelEditorModal';
import { DiagramEditorToolbar } from '@/features/ai-setup/components/DiagramEditorToolbar';
import { DiagramZoomControls } from '@/features/ai-setup/components/DiagramZoomControls';
import { DiagramLegendFooter } from '@/features/ai-setup/components/DiagramLegendFooter';
import { usePanZoom } from '@/features/ai-setup/hooks/usePanZoom';
import { useMermaidChartEditor, type NodeShape } from '@/features/ai-setup/hooks/useMermaidChartEditor';
import { useDiagramRender } from '@/features/ai-setup/hooks/useDiagramRender';
import { useDiagramKeyboardShortcuts } from '@/features/ai-setup/hooks/useDiagramKeyboardShortcuts';
import { useStyledDiagramChart } from '@/features/ai-setup/hooks/useStyledDiagramChart';

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

  const styledChart = useStyledDiagramChart({
    chart,
    parsed,
    nodeMapping,
    internalQueues,
    selectedConversationId,
    selection,
  });

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
      <DiagramEditorToolbar
        mode={mode}
        onToggleMode={() => setMode((m) => m === 'move' ? 'edit' : 'move')}
        onUndo={undo}
        onOpenRawEditor={() => { setRawValue(chart); setShowRawEditor(true); }}
        selectMode={selectMode}
        onCancelSelectMode={() => { setSelectMode('none'); setSelectModeEdge(null); }}
        hasSidebarToggle={!!analyses && analyses.length > 0}
        showSidebar={showSidebar}
        onToggleSidebar={() => setShowSidebar((v) => !v)}
        analysesCount={analyses?.length ?? 0}
        onSave={handleSave}
        isSaving={isSaving}
        onCancel={onCancel}
      />

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
          <DiagramZoomControls onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={resetPan} />
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

      <DiagramLegendFooter
        hasNodeMapping={!!nodeMapping}
        hasInternalQueues={!!internalQueues && internalQueues.length > 0}
        mode={mode}
      />

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
