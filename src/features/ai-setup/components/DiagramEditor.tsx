import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import mermaid from 'mermaid';
import { Plus, Trash2, Save, X, Undo2, Pencil, ArrowRight, Diamond, Square, Circle, Eye, MessageSquare, ChevronRight, Copy, Check, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import type { NodeMappingEntry, InternalQueue } from '../api/useGetFlowDiagram';
import type { FlowAnalysis } from '../api/useGetFlowAnalyses';
import { parseMermaidFlowchart, type ParsedNode, type ParsedEdge } from '../utils/parseMermaid';
import { MermaidDiagram } from '@/shared/components/MermaidDiagram';
import { ConversationDrawer } from './ConversationDrawer';

// --- CopyId ---
const CopyId = ({ value }: { value: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 px-3 pb-1 text-[10px] font-mono text-text-tertiary hover:text-accent-blue truncate w-full text-left transition-colors"
      title="Copiar conversationId"
    >
      {copied ? <Check size={10} className="text-accent-green shrink-0" /> : <Copy size={10} className="shrink-0" />}
      <span className="truncate">{copied ? 'Copiado' : value}</span>
    </button>
  );
};

// --- Types ---
type NodeShape = '[]' | '{}' | '()';
type SelectionMode = 'none' | 'select-origin' | 'select-destination';

interface Selection {
  type: 'node' | 'edge';
  id: string; // nodeId or "source->target"
}

interface ContextMenu {
  x: number;
  y: number;
  selection: Selection;
}

// --- Helpers ---
function rebuildMermaid(nodes: ParsedNode[], edges: ParsedEdge[]): string {
  const lines: string[] = ['flowchart TD'];
  const shapeMap: Record<string, string> = {};

  for (const node of nodes) {
    const shape = (node as ParsedNode & { shape?: NodeShape }).shape ?? '[]';
    const [open, close] = shape === '{}' ? ['{', '}'] : shape === '()' ? ['(', ')'] : ['[', ']'];
    shapeMap[node.id] = shape;
    lines.push(`    ${node.id}${open}${node.label}${close}`);
  }

  for (const edge of edges) {
    if (edge.label) {
      lines.push(`    ${edge.source} -->|${edge.label}| ${edge.target}`);
    } else {
      lines.push(`    ${edge.source} --> ${edge.target}`);
    }
  }

  return lines.join('\n');
}

function nextNodeId(nodes: ParsedNode[]): string {
  let max = 0;
  for (const n of nodes) {
    const m = n.id.match(/^C(\d+)$/);
    if (m) max = Math.max(max, parseInt(m[1]));
  }
  return `C${max + 1}`;
}

// --- Props ---
interface DiagramEditorProps {
  mermaidChart: string;
  nodeMapping?: Record<string, NodeMappingEntry[]>;
  internalQueues?: InternalQueue[];
  nodeCategories?: Record<string, string>;
  analyses?: FlowAnalysis[];
  selectedConversationId?: string | null;
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
  selectedConversationId: externalSelectedConv,
  onSave,
  onCancel,
  isSaving,
}: DiagramEditorProps) => {
  // State
  const [chart, setChart] = useState(mermaidChart);
  const [svg, setSvg] = useState('');
  const [renderError, setRenderError] = useState<string | null>(null);
  const [showRawEditor, setShowRawEditor] = useState(false);
  const [rawValue, setRawValue] = useState('');
  const [selection, setSelection] = useState<Selection | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const [selectMode, setSelectMode] = useState<SelectionMode>('none');
  const [mode, setMode] = useState<'move' | 'edit'>('move');
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const [showSidebar, setShowSidebar] = useState(false);
  const [localSelectedConv, setLocalSelectedConv] = useState<string | null>(externalSelectedConv ?? null);
  const [viewingConversationId, setViewingConversationId] = useState<string | null>(null);
  const selectedConversationId = localSelectedConv;
  const [selectModeEdge, setSelectModeEdge] = useState<{ source: string; target: string; field: 'source' | 'target' } | null>(null);
  const [editingLabel, setEditingLabel] = useState<{ id: string; type: 'node' | 'edge'; value: string } | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0, scale: 1, dragging: false, startX: 0, startY: 0 });

  const historyRef = useRef<string[]>([]);
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const renderIdRef = useRef(0);

  // Pan/zoom handlers
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    setPan((prev) => {
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      return { ...prev, scale: Math.min(Math.max(prev.scale * delta, 0.2), 5) };
    });
  }, []);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const onPanMouseDown = (e: React.MouseEvent) => {
    if (mode !== 'move') return;
    setPan((prev) => ({ ...prev, dragging: true, startX: e.clientX - prev.x, startY: e.clientY - prev.y }));
  };

  const onPanMouseMove = (e: React.MouseEvent) => {
    if (mode !== 'move' || !pan.dragging) return;
    setPan((prev) => ({ ...prev, x: e.clientX - prev.startX, y: e.clientY - prev.startY }));
  };

  const onPanMouseUp = () => {
    if (mode !== 'move') return;
    setPan((prev) => ({ ...prev, dragging: false }));
  };

  // Parse current chart
  const parsed = useMemo(() => parseMermaidFlowchart(chart), [chart]);

  // Push to undo history before changes
  const pushHistory = useCallback(() => {
    historyRef.current.push(chart);
    if (historyRef.current.length > 50) historyRef.current.shift();
  }, [chart]);

  const undo = useCallback(() => {
    const prev = historyRef.current.pop();
    if (prev) {
      setChart(prev);
      setSelection(null);
      setContextMenu(null);
    }
  }, []);

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

  // Render mermaid + fix SVG dimensions
  useEffect(() => {
    if (!styledChart.trim()) return;
    setRenderError(null);
    const id = `editor-${++renderIdRef.current}-${Date.now()}`;
    mermaid
      .render(id, styledChart)
      .finally(() => {
        // Mermaid injects temp SVG and error elements into body — clean them up
        document.querySelectorAll(`#${CSS.escape(id)}, [data-mermaid-temp]`).forEach((el) => el.remove());
        document.querySelectorAll('body > svg[id^="editor-"], body > .error-icon, body > [id^="editor-"]').forEach((el) => el.remove());
      })
      .then(({ svg: rendered }) => {
        setSvg(rendered);
        // Fix SVG dimensions after render
        requestAnimationFrame(() => {
          if (!svgContainerRef.current) return;
          const svgEl = svgContainerRef.current.querySelector('svg');
          if (!svgEl) return;
          const viewBox = svgEl.getAttribute('viewBox');
          if (viewBox) {
            const parts = viewBox.split(/\s+|,/).map(Number);
            if (parts.length >= 4) {
              svgEl.setAttribute('width', String(parts[2]));
              svgEl.setAttribute('height', String(parts[3]));
            }
          }
          svgEl.style.maxWidth = 'none';
          svgEl.style.overflow = 'visible';
        });
      })
      .catch((err) => {
        console.error('[DiagramEditor] mermaid render error:', err);
        setRenderError(err?.message || String(err));
      });
  }, [styledChart]);

  // Set cursor style on nodes/edges after SVG render
  useEffect(() => {
    const container = svgContainerRef.current;
    if (!container || !svg) return;
    container.querySelectorAll('.node, .edgePath, .edgeLabel').forEach((el) => {
      (el as HTMLElement).style.cursor = 'pointer';
    });
  }, [svg]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
      if (e.key === 'Escape') {
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
      }
      if (e.key === 'Delete' && selection && !editingLabel) {
        if (selection.type === 'node') handleDeleteNode(selection.id);
        if (selection.type === 'edge') {
          const [src, tgt] = selection.id.split('->');
          handleDeleteEdge(src, tgt);
        }
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        setMode((m) => m === 'move' ? 'edit' : 'move');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, onCancel, selection, contextMenu, editingLabel, selectMode]);

  // --- Actions ---
  const handleEditNodeLabel = (nodeId: string) => {
    const node = parsed.nodes.find((n) => n.id === nodeId);
    if (!node) return;
    setEditingLabel({ id: nodeId, type: 'node', value: node.label });
    setContextMenu(null);
  };

  const handleSaveLabel = () => {
    if (!editingLabel) return;
    pushHistory();
    if (editingLabel.type === 'node') {
      const newNodes = parsed.nodes.map((n) =>
        n.id === editingLabel.id ? { ...n, label: editingLabel.value } : n
      );
      setChart(rebuildMermaid(newNodes, parsed.edges));
    } else {
      const [src, tgt] = editingLabel.id.split('->');
      const newEdges = parsed.edges.map((e) =>
        e.source === src && e.target === tgt ? { ...e, label: editingLabel.value || undefined } : e
      );
      setChart(rebuildMermaid(parsed.nodes, newEdges));
    }
    setEditingLabel(null);
  };

  const handleChangeShape = (nodeId: string, shape: NodeShape) => {
    pushHistory();
    const newNodes = parsed.nodes.map((n) =>
      n.id === nodeId ? { ...n, shape } as ParsedNode & { shape: NodeShape } : n
    );
    setChart(rebuildMermaid(newNodes, parsed.edges));
    setContextMenu(null);
  };

  const handleAddNodeAfter = (nodeId: string) => {
    pushHistory();
    const newId = nextNodeId(parsed.nodes);
    const newNodes = [...parsed.nodes, { id: newId, label: 'Nuevo paso' }];
    const newEdges = [...parsed.edges, { source: nodeId, target: newId }];
    setChart(rebuildMermaid(newNodes, newEdges));
    setContextMenu(null);
    // Immediately edit the new node's label
    setTimeout(() => setEditingLabel({ id: newId, type: 'node', value: 'Nuevo paso' }), 100);
  };

  const handleDeleteNode = (nodeId: string) => {
    pushHistory();
    // Find incoming and outgoing edges
    const incoming = parsed.edges.filter((e) => e.target === nodeId);
    const outgoing = parsed.edges.filter((e) => e.source === nodeId);
    // Remove the node's edges
    let newEdges = parsed.edges.filter((e) => e.source !== nodeId && e.target !== nodeId);
    // Reconnect: each incoming source connects to each outgoing target
    for (const inc of incoming) {
      for (const out of outgoing) {
        if (!newEdges.find((e) => e.source === inc.source && e.target === out.target)) {
          newEdges.push({ source: inc.source, target: out.target });
        }
      }
    }
    const newNodes = parsed.nodes.filter((n) => n.id !== nodeId);
    setChart(rebuildMermaid(newNodes, newEdges));
    setSelection(null);
    setContextMenu(null);
  };

  const handleEditEdgeLabel = (source: string, target: string) => {
    const edge = parsed.edges.find((e) => e.source === source && e.target === target);
    setEditingLabel({ id: `${source}->${target}`, type: 'edge', value: edge?.label ?? '' });
    setContextMenu(null);
  };

  const handleDeleteEdge = (source: string, target: string) => {
    pushHistory();
    const newEdges = parsed.edges.filter((e) => !(e.source === source && e.target === target));
    // Check if any nodes become disconnected
    const connectedIds = new Set<string>();
    newEdges.forEach((e) => { connectedIds.add(e.source); connectedIds.add(e.target); });
    // Keep only connected nodes (+ nodes that are the only node)
    const newNodes = parsed.nodes.length <= 1
      ? parsed.nodes
      : parsed.nodes.filter((n) => connectedIds.has(n.id));
    setChart(rebuildMermaid(newNodes, newEdges));
    setSelection(null);
    setContextMenu(null);
  };

  const handleInsertNodeInEdge = (source: string, target: string) => {
    pushHistory();
    const newId = nextNodeId(parsed.nodes);
    const newNodes = [...parsed.nodes, { id: newId, label: 'Nuevo paso' }];
    const newEdges = parsed.edges.map((e) => {
      if (e.source === source && e.target === target) {
        return { ...e, target: newId }; // original edge now points to new node
      }
      return e;
    });
    newEdges.push({ source: newId, target }); // new node connects to original target
    setChart(rebuildMermaid(newNodes, newEdges));
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
              console.log('[DiagramEditor] node click via delegation:', id);
              if (id) {
                // Handle select mode for edge origin/destination
                if (selectMode !== 'none' && selectModeEdge) {
                  pushHistory();
                  const newEdges = parsed.edges.map((edge) => {
                    if (edge.source === selectModeEdge.source && edge.target === selectModeEdge.target) {
                      return selectModeEdge.field === 'source'
                        ? { ...edge, source: id }
                        : { ...edge, target: id };
                    }
                    return edge;
                  });
                  setChart(rebuildMermaid(parsed.nodes, newEdges));
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
                console.log('[DiagramEditor] edge click via delegation:', edgeKey);
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
                      pushHistory();
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
              onClick={() => setPan((p) => ({ ...p, scale: Math.min(p.scale * 1.2, 5) }))}
              className="p-1.5 rounded bg-bg-secondary/80 border border-border-primary text-text-secondary hover:text-text-primary transition-colors"
              title="Zoom in"
            >
              <ZoomIn size={13} />
            </button>
            <button
              onClick={() => setPan((p) => ({ ...p, scale: Math.max(p.scale * 0.8, 0.2) }))}
              className="p-1.5 rounded bg-bg-secondary/80 border border-border-primary text-text-secondary hover:text-text-primary transition-colors"
              title="Zoom out"
            >
              <ZoomOut size={13} />
            </button>
            <button
              onClick={() => setPan({ x: 0, y: 0, scale: 1, dragging: false, startX: 0, startY: 0 })}
              className="p-1.5 rounded bg-bg-secondary/80 border border-border-primary text-text-secondary hover:text-text-primary transition-colors"
              title="Reset"
            >
              <RotateCcw size={13} />
            </button>
          </div>
        </div>

        {/* Sidebar: conversations */}
        {showSidebar && analyses && (
          <div className="w-80 shrink-0 border-l border-border-primary bg-bg-secondary flex flex-col overflow-hidden">
            <div className="px-3 py-2.5 border-b border-border-primary shrink-0">
              <p className="text-xs font-semibold text-text-tertiary uppercase">Conversaciones individuales</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {analyses.map((a) => {
                const isSelected = selectedConversationId === a.conversationId;
                return (
                  <div key={a.analysisId} className={`border-b border-border-primary ${isSelected ? 'bg-accent-yellow/5' : ''}`}>
                    <div className="flex items-center gap-2 px-3 py-2">
                      <button
                        onClick={() => setLocalSelectedConv(isSelected ? null : a.conversationId)}
                        className={`flex-1 text-left text-xs truncate transition-colors ${
                          isSelected ? 'text-accent-yellow font-medium' : 'text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        <ChevronRight size={10} className={`inline mr-1 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                        {a.intent}
                        <span className="text-text-tertiary ml-1 text-[10px]">
                          {new Date(a.analyzedAt).toLocaleDateString()}
                        </span>
                      </button>
                      <button
                        onClick={() => setViewingConversationId(a.conversationId)}
                        className="p-1 rounded text-text-tertiary hover:text-accent-blue transition-colors shrink-0"
                        title="Ver mensajes"
                      >
                        <MessageSquare size={12} />
                      </button>
                    </div>
                    {/* Conversation ID — copiable */}
                    {isSelected && (
                      <CopyId value={a.conversationId} />
                    )}
                    {/* Show individual diagram when selected */}
                    {isSelected && a.flowDiagram && (
                      <div className="px-3 pb-2">
                        <p className="text-[10px] text-text-tertiary mb-1 line-clamp-2">{a.flowSummary}</p>
                        <MermaidDiagram chart={a.flowDiagram} className="max-h-48" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed z-60 bg-bg-secondary border border-border-primary rounded-lg shadow-xl py-1 min-w-45"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.selection.type === 'node' && (() => {
            const nodeId = contextMenu.selection.id;
            const category = nodeCategories?.[nodeId];
            const queues = internalQueues?.filter((q) => q.nodeId === nodeId) ?? [];
            return (
              <>
                {/* Node info */}
                {category && (
                  <div className="px-3 py-1.5 border-b border-border-primary">
                    <p className="text-[10px] text-text-tertiary uppercase font-semibold">Categoría</p>
                    <p className="text-xs text-accent-blue">{category}</p>
                  </div>
                )}
                {queues.length > 0 && (
                  <div className="px-3 py-1.5 border-b border-border-primary">
                    <p className="text-[10px] text-text-tertiary uppercase font-semibold mb-1">Canales internos</p>
                    {queues.map((q) => (
                      <div key={q.channelName} className="mb-1 last:mb-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-purple-400">{q.channelName}</span>
                          <span className="text-[10px] px-1 py-0.5 rounded bg-purple-400/15 text-purple-400 border border-purple-400/30">{q.queueType}</span>
                        </div>
                        <p className="text-[10px] text-text-tertiary mt-0.5">{q.usage}</p>
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={() => handleEditNodeLabel(nodeId)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-primary hover:bg-bg-tertiary transition-colors">
                  <Pencil size={12} /> Editar nombre
                </button>
                <div className="px-3 py-1.5 text-[10px] text-text-tertiary uppercase font-semibold">Forma</div>
                <div className="flex items-center gap-1 px-3 pb-1.5">
                  <button onClick={() => handleChangeShape(nodeId, '[]')} className="p-1.5 rounded border border-border-primary hover:border-accent-blue text-text-secondary hover:text-accent-blue" title="Rectangular">
                    <Square size={13} />
                  </button>
                  <button onClick={() => handleChangeShape(nodeId, '{}')} className="p-1.5 rounded border border-border-primary hover:border-accent-blue text-text-secondary hover:text-accent-blue" title="Decisión">
                    <Diamond size={13} />
                  </button>
                  <button onClick={() => handleChangeShape(nodeId, '()')} className="p-1.5 rounded border border-border-primary hover:border-accent-blue text-text-secondary hover:text-accent-blue" title="Redondeado">
                    <Circle size={13} />
                  </button>
                </div>
                <div className="border-t border-border-primary my-0.5" />
                <button onClick={() => handleAddNodeAfter(nodeId)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-primary hover:bg-bg-tertiary transition-colors">
                  <Plus size={12} /> Agregar nodo después
                </button>
                <div className="border-t border-border-primary my-0.5" />
                <button onClick={() => handleDeleteNode(nodeId)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-accent-red hover:bg-accent-red/10 transition-colors">
                  <Trash2 size={12} /> Eliminar nodo
                </button>
              </>
            );
          })()}

          {contextMenu.selection.type === 'edge' && (() => {
            const [src, tgt] = contextMenu.selection.id.split('->');
            return (
              <>
                <button onClick={() => handleEditEdgeLabel(src, tgt)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-primary hover:bg-bg-tertiary transition-colors">
                  <Pencil size={12} /> Editar etiqueta
                </button>
                <button onClick={() => handleChangeEdgeEndpoint(src, tgt, 'source')} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-primary hover:bg-bg-tertiary transition-colors">
                  <ArrowRight size={12} className="rotate-180" /> Cambiar origen
                </button>
                <button onClick={() => handleChangeEdgeEndpoint(src, tgt, 'target')} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-primary hover:bg-bg-tertiary transition-colors">
                  <ArrowRight size={12} /> Cambiar destino
                </button>
                <div className="border-t border-border-primary my-0.5" />
                <button onClick={() => handleInsertNodeInEdge(src, tgt)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-primary hover:bg-bg-tertiary transition-colors">
                  <Plus size={12} /> Insertar nodo en medio
                </button>
                <div className="border-t border-border-primary my-0.5" />
                <button onClick={() => handleDeleteEdge(src, tgt)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-accent-red hover:bg-accent-red/10 transition-colors">
                  <Trash2 size={12} /> Eliminar transición
                </button>
              </>
            );
          })()}
        </div>
      )}

      {/* Label editor modal */}
      {editingLabel && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/40" onClick={() => setEditingLabel(null)}>
          <div className="bg-bg-secondary border border-border-primary rounded-lg shadow-xl p-4 w-80" onClick={(e) => e.stopPropagation()}>
            <p className="text-xs text-text-tertiary uppercase font-semibold mb-2">
              {editingLabel.type === 'node' ? 'Nombre del nodo' : 'Etiqueta de transición'}
            </p>
            <input
              autoFocus
              value={editingLabel.value}
              onChange={(e) => setEditingLabel({ ...editingLabel, value: e.target.value })}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSaveLabel(); if (e.key === 'Escape') setEditingLabel(null); }}
              className="w-full px-3 py-2 bg-bg-primary border border-border-primary rounded-md text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-blue"
              placeholder={editingLabel.type === 'node' ? 'Nombre del paso...' : 'Etiqueta (opcional)...'}
            />
            <div className="flex items-center justify-end gap-2 mt-3">
              <button
                onClick={() => setEditingLabel(null)}
                className="px-3 py-1.5 text-xs text-text-secondary border border-border-primary rounded hover:bg-bg-tertiary"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveLabel}
                className="px-3 py-1.5 text-xs bg-accent-blue text-white rounded hover:opacity-90"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
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
