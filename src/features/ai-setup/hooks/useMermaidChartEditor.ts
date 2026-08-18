import { useCallback, useMemo, useState } from 'react';
import { parseMermaidFlowchart, type ParsedNode, type ParsedEdge } from '../utils/parseMermaid';
import { useUndoHistory } from './useUndoHistory';

export type NodeShape = '[]' | '{}' | '()';

function rebuildMermaid(nodes: ParsedNode[], edges: ParsedEdge[]): string {
  const lines: string[] = ['flowchart TD'];

  for (const node of nodes) {
    const shape = (node as ParsedNode & { shape?: NodeShape }).shape ?? '[]';
    const [open, close] = shape === '{}' ? ['{', '}'] : shape === '()' ? ['(', ')'] : ['[', ']'];
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

/**
 * Estado y mutaciones del grafo mermaid que edita DiagramEditor: parseo,
 * undo, y todas las operaciones de nodos/edges (editar etiqueta, cambiar
 * forma, agregar, eliminar, insertar en medio, cambiar endpoint).
 */
export function useMermaidChartEditor(initialChart: string) {
  const [chart, setChartRaw] = useState(initialChart);
  const { push: pushHistory, undo: popHistory } = useUndoHistory<string>();

  const parsed = useMemo(() => parseMermaidFlowchart(chart), [chart]);

  const setChart = useCallback((next: string, opts?: { skipHistory?: boolean }) => {
    if (!opts?.skipHistory) pushHistory(chart);
    setChartRaw(next);
  }, [chart, pushHistory]);

  const undo = useCallback((): boolean => {
    const prev = popHistory();
    if (prev !== undefined) {
      setChartRaw(prev);
      return true;
    }
    return false;
  }, [popHistory]);

  const editNodeLabel = useCallback((nodeId: string, value: string) => {
    const newNodes = parsed.nodes.map((n) => (n.id === nodeId ? { ...n, label: value } : n));
    setChart(rebuildMermaid(newNodes, parsed.edges));
  }, [parsed, setChart]);

  const editEdgeLabel = useCallback((source: string, target: string, value: string) => {
    const newEdges = parsed.edges.map((e) =>
      e.source === source && e.target === target ? { ...e, label: value || undefined } : e
    );
    setChart(rebuildMermaid(parsed.nodes, newEdges));
  }, [parsed, setChart]);

  const changeNodeShape = useCallback((nodeId: string, shape: NodeShape) => {
    const newNodes = parsed.nodes.map((n) =>
      n.id === nodeId ? ({ ...n, shape } as ParsedNode & { shape: NodeShape }) : n
    );
    setChart(rebuildMermaid(newNodes, parsed.edges));
  }, [parsed, setChart]);

  const addNodeAfter = useCallback((nodeId: string): string => {
    const newId = nextNodeId(parsed.nodes);
    const newNodes = [...parsed.nodes, { id: newId, label: 'Nuevo paso' }];
    const newEdges = [...parsed.edges, { source: nodeId, target: newId }];
    setChart(rebuildMermaid(newNodes, newEdges));
    return newId;
  }, [parsed, setChart]);

  const deleteNode = useCallback((nodeId: string) => {
    // Find incoming and outgoing edges
    const incoming = parsed.edges.filter((e) => e.target === nodeId);
    const outgoing = parsed.edges.filter((e) => e.source === nodeId);
    // Remove the node's edges
    const newEdges = parsed.edges.filter((e) => e.source !== nodeId && e.target !== nodeId);
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
  }, [parsed, setChart]);

  const deleteEdge = useCallback((source: string, target: string) => {
    const newEdges = parsed.edges.filter((e) => !(e.source === source && e.target === target));
    // Check if any nodes become disconnected
    const connectedIds = new Set<string>();
    newEdges.forEach((e) => { connectedIds.add(e.source); connectedIds.add(e.target); });
    // Keep only connected nodes (+ nodes that are the only node)
    const newNodes = parsed.nodes.length <= 1
      ? parsed.nodes
      : parsed.nodes.filter((n) => connectedIds.has(n.id));
    setChart(rebuildMermaid(newNodes, newEdges));
  }, [parsed, setChart]);

  const insertNodeInEdge = useCallback((source: string, target: string): string => {
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
    return newId;
  }, [parsed, setChart]);

  const changeEdgeEndpoint = useCallback((source: string, target: string, field: 'source' | 'target', newNodeId: string) => {
    const newEdges = parsed.edges.map((edge) => {
      if (edge.source === source && edge.target === target) {
        return field === 'source' ? { ...edge, source: newNodeId } : { ...edge, target: newNodeId };
      }
      return edge;
    });
    setChart(rebuildMermaid(parsed.nodes, newEdges));
  }, [parsed, setChart]);

  return {
    chart,
    parsed,
    setChart,
    undo,
    editNodeLabel,
    editEdgeLabel,
    changeNodeShape,
    addNodeAfter,
    deleteNode,
    deleteEdge,
    insertNodeInEdge,
    changeEdgeEndpoint,
  };
}
