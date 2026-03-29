import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import mermaid from 'mermaid';
import { Plus, Trash2, Save, X, Undo2, Pencil, ArrowRight, Diamond, Square, Circle } from 'lucide-react';
import type { NodeMappingEntry } from '../api/useGetFlowDiagram';
import { parseMermaidFlowchart, type ParsedNode, type ParsedEdge } from '../utils/parseMermaid';

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
  selectedConversationId?: string | null;
  onSave: (newMermaid: string) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

// --- Component ---
export const DiagramEditor = ({
  mermaidChart,
  nodeMapping,
  selectedConversationId,
  onSave,
  onCancel,
  isSaving,
}: DiagramEditorProps) => {
  // State
  const [chart, setChart] = useState(mermaidChart);
  const [svg, setSvg] = useState('');
  const [selection, setSelection] = useState<Selection | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const [selectMode, setSelectMode] = useState<SelectionMode>('none');
  const [selectModeEdge, setSelectModeEdge] = useState<{ source: string; target: string; field: 'source' | 'target' } | null>(null);
  const [editingLabel, setEditingLabel] = useState<{ id: string; type: 'node' | 'edge'; value: string } | null>(null);

  const historyRef = useRef<string[]>([]);
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const renderIdRef = useRef(0);

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

  // Apply coverage styles
  const styledChart = useMemo(() => {
    if (!nodeMapping) return chart;
    const styleLines: string[] = [];
    Object.entries(nodeMapping).forEach(([nodeId, sources]) => {
      // Check node exists in current chart
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

    // Highlight selected node/edge
    if (selection?.type === 'node') {
      styleLines.push(`    style ${selection.id} stroke:#fbbf24,stroke-width:3px`);
    }

    return styleLines.length > 0 ? chart + '\n' + styleLines.join('\n') : chart;
  }, [chart, nodeMapping, selectedConversationId, selection, parsed.nodes]);

  // Render mermaid
  useEffect(() => {
    if (!styledChart.trim()) return;
    const id = `editor-${++renderIdRef.current}-${Date.now()}`;
    mermaid
      .render(id, styledChart)
      .then(({ svg: rendered }) => setSvg(rendered))
      .catch(() => {});
  }, [styledChart]);

  // Attach click handlers to SVG nodes/edges after render
  useEffect(() => {
    const container = svgContainerRef.current;
    if (!container || !svg) return;

    // Click on nodes
    const nodeEls = container.querySelectorAll('.node');
    nodeEls.forEach((el) => {
      const id = el.id?.replace(/^flowchart-/, '').replace(/-\d+$/, '');
      if (!id) return;

      (el as HTMLElement).style.cursor = 'pointer';
      const handler = (e: Event) => {
        e.stopPropagation();

        // If we're in select mode for edge origin/destination
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
        setContextMenu({
          x: (e as MouseEvent).clientX,
          y: (e as MouseEvent).clientY,
          selection: { type: 'node', id },
        });
      };
      el.addEventListener('click', handler);
    });

    // Click on edges
    const edgeEls = container.querySelectorAll('.edgePath, .edgeLabel');
    edgeEls.forEach((el) => {
      (el as HTMLElement).style.cursor = 'pointer';
      // Try to get edge info from id or nearby elements
      const handler = (e: Event) => {
        e.stopPropagation();
        // Find which edge this corresponds to by position/id
        const edgeId = el.id || '';
        // Mermaid edge ids are like L-C1-C2-0
        const m = edgeId.match(/L-([A-Za-z0-9_]+)-([A-Za-z0-9_]+)/);
        if (m) {
          const edgeKey = `${m[1]}->${m[2]}`;
          setSelection({ type: 'edge', id: edgeKey });
          setContextMenu({
            x: (e as MouseEvent).clientX,
            y: (e as MouseEvent).clientY,
            selection: { type: 'edge', id: edgeKey },
          });
        }
      };
      el.addEventListener('click', handler);
    });

    // Click on background to deselect
    const svgEl = container.querySelector('svg');
    if (svgEl) {
      const bgHandler = (e: Event) => {
        if ((e.target as Element).closest('.node, .edgePath, .edgeLabel')) return;
        setSelection(null);
        setContextMenu(null);
      };
      svgEl.addEventListener('click', bgHandler);
    }
  }, [svg, selectMode, selectModeEdge, parsed, pushHistory]);

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
          <span className="text-sm font-medium text-text-primary mr-2">Editor de diagrama</span>
          <button
            onClick={undo}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-bg-primary border border-border-primary rounded text-text-secondary hover:text-text-primary transition-colors disabled:opacity-30"
            title="Deshacer (Ctrl+Z)"
          >
            <Undo2 size={13} />
            Deshacer
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

      {/* SVG canvas */}
      <div className="flex-1 overflow-auto relative" onClick={() => { setContextMenu(null); setSelection(null); }}>
        <div
          ref={svgContainerRef}
          className="min-h-full flex items-center justify-center p-8"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
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
            return (
              <>
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
        <span className="ml-auto">Click en nodo o flecha para acciones · Delete para eliminar · Ctrl+Z deshacer · Esc cerrar</span>
      </div>
    </div>
  );
};
