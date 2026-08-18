import { useMemo } from 'react';
import { type Node as RFNode, type Edge, MarkerType } from '@xyflow/react';
import type { Flow, Node, ActiveSessionsResponse, FlowNode, FlowTransition } from '@/features/flows/types';

const FLOW_COL_X = 350;
const COLLAPSED_HEIGHT = 130;
const COLLAPSED_WIDTH = 220;
const EXPANDED_PADDING_TOP = 50;
const EXPANDED_PADDING_BOTTOM = 30;
const EXPANDED_PADDING_X = 40;
const COLUMN_WIDTH = 310;
const ROW_HEIGHT = 140;
const NODE_WIDTH = 160;
const NODE_HEIGHT = 90;
const FLOW_GAP = 50;
const EDGE_STYLE = { stroke: 'var(--color-border-primary)', strokeWidth: 2 };
const EDGE_MARKER = { type: MarkerType.ArrowClosed as const, color: 'var(--color-text-tertiary)' };


function getTotalSessions(flow: Flow, activeSessions: ActiveSessionsResponse): number {
  let total = flow.routerNode ? (activeSessions[flow.routerNode.id] || 0) : 0;
  for (const fn of (flow.nodes ?? [])) {
    total += activeSessions[fn.node.id] || 0;
  }
  return total;
}

interface NodePosition {
  col: number;
  row: number;
}

/**
 * BFS desde el routerNode para asignar columna a cada nodo.
 * Nodos no alcanzables desde el router se colocan al final.
 * Dentro de una columna, varios nodos se apilan en filas distintas.
 */
function computeNodePositions(
  flowNodes: FlowNode[],
  transitions: FlowTransition[],
  routerNodeId: string | null,
): Record<string, NodePosition> {
  const positions: Record<string, NodePosition> = {};
  if (flowNodes.length === 0) return positions;

  const adjacency: Record<string, string[]> = {};
  for (const t of transitions) {
    if (!adjacency[t.fromNodeId]) adjacency[t.fromNodeId] = [];
    if (!adjacency[t.fromNodeId].includes(t.toNodeId)) {
      adjacency[t.fromNodeId].push(t.toNodeId);
    }
  }

  const colByNode: Record<string, number> = {};
  const visited = new Set<string>();
  const startId = routerNodeId && flowNodes.some((fn) => fn.node.id === routerNodeId)
    ? routerNodeId
    : flowNodes[0].node.id;

  const queue: { id: string; col: number }[] = [{ id: startId, col: 0 }];
  colByNode[startId] = 0;
  visited.add(startId);

  while (queue.length > 0) {
    const { id, col } = queue.shift()!;
    const children = adjacency[id] ?? [];
    for (const childId of children) {
      const childCol = col + 1;
      if (!(childId in colByNode) || colByNode[childId] < childCol) {
        colByNode[childId] = childCol;
      }
      if (!visited.has(childId)) {
        visited.add(childId);
        queue.push({ id: childId, col: colByNode[childId] });
      }
    }
  }

  // Nodos no alcanzables: ponerlos en una columna al final
  const maxCol = Object.values(colByNode).reduce((m, c) => Math.max(m, c), 0);
  for (const fn of flowNodes) {
    if (!(fn.node.id in colByNode)) {
      colByNode[fn.node.id] = maxCol + 1;
    }
  }

  // Asignar filas: dentro de cada columna, cada nodo toma una fila secuencial
  const rowByCol: Record<number, number> = {};
  for (const fn of flowNodes) {
    const col = colByNode[fn.node.id];
    const row = rowByCol[col] ?? 0;
    positions[fn.node.id] = { col, row };
    rowByCol[col] = row + 1;
  }

  return positions;
}

interface FlowLayout {
  width: number;
  height: number;
  positions: Record<string, NodePosition>;
  maxCol: number;
  maxRow: number;
}

function computeFlowLayout(flow: Flow): FlowLayout {
  const flowNodes = flow.nodes ?? [];
  const transitions = flow.transitions ?? [];
  const routerId = flow.routerNode?.id ?? null;
  const positions = computeNodePositions(flowNodes, transitions, routerId);

  let maxCol = 0;
  let maxRow = 0;
  for (const pos of Object.values(positions)) {
    if (pos.col > maxCol) maxCol = pos.col;
    if (pos.row > maxRow) maxRow = pos.row;
  }

  const width = EXPANDED_PADDING_X * 2 + (maxCol + 1) * COLUMN_WIDTH - (COLUMN_WIDTH - NODE_WIDTH);
  const height = EXPANDED_PADDING_TOP + EXPANDED_PADDING_BOTTOM + (maxRow + 1) * ROW_HEIGHT - (ROW_HEIGHT - NODE_HEIGHT);

  return { width, height, positions, maxCol, maxRow };
}

interface LayoutOptions {
  flows: Flow[];
  expandedFlowIds: Set<string>;
  activeSessions: ActiveSessionsResponse;
  highlightedNodeId: string | null;
  onToggleExpand: (flowId: string) => void;
  onSelectNode: (node: Node, isRouter: boolean) => void;
  onCreateFlow: () => void;
  onEditFlow: (flow: Flow) => void;
  onDeleteFlow: (flow: Flow) => void;
  onFlowTransitions: (flow: Flow) => void;
  onFlowHistory: (flow: Flow) => void;
  onEditNode: (node: Node) => void;
  onAddTransition: (flowId: string, fromNode: Node) => void;
}

export function useFlowCanvasLayout({
  flows,
  expandedFlowIds,
  activeSessions,
  highlightedNodeId,
  onToggleExpand,
  onSelectNode,
  onCreateFlow,
  onEditFlow,
  onDeleteFlow,
  onFlowTransitions,
  onFlowHistory,
  onEditNode,
  onAddTransition,
}: LayoutOptions): { nodes: RFNode[]; edges: Edge[] } {
  return useMemo(() => {
    const rfNodes: RFNode[] = [];
    const rfEdges: Edge[] = [];

    // Pre-compute layout per flow so totalHeight accounts for bifurcations
    const flowLayouts: Record<string, FlowLayout> = {};
    let totalHeight = 0;
    for (const flow of flows) {
      if (expandedFlowIds.has(flow.id)) {
        const layout = computeFlowLayout(flow);
        flowLayouts[flow.id] = layout;
        totalHeight += layout.height;
      } else {
        totalHeight += COLLAPSED_HEIGHT;
      }
      totalHeight += FLOW_GAP;
    }
    totalHeight -= FLOW_GAP;

    // Global router node
    rfNodes.push({
      id: 'global-router',
      type: 'globalRouter',
      position: { x: 0, y: Math.max(0, totalHeight / 2 - 40) },
      data: { onCreateFlow },
    });

    let currentY = 0;

    for (const flow of flows) {
      const isExpanded = expandedFlowIds.has(flow.id);
      const layout = flowLayouts[flow.id];
      const expandedWidth = layout?.width ?? COLLAPSED_WIDTH;
      const expandedHeight = layout?.height ?? COLLAPSED_HEIGHT;

      rfNodes.push({
        id: flow.id,
        type: 'flowGroup',
        position: { x: FLOW_COL_X, y: currentY },
        data: {
          label: flow.name,
          status: flow.status,
          totalActiveSessions: getTotalSessions(flow, activeSessions),
          nodeCount: flow.nodes.length + 1,
          isExpanded,
          onToggleExpand: () => onToggleExpand(flow.id),
          onEdit: () => onEditFlow(flow),
          onDelete: () => onDeleteFlow(flow),
          onTransitions: () => onFlowTransitions(flow),
          onHistory: () => onFlowHistory(flow),
        },
        style: isExpanded
          ? { width: expandedWidth, height: expandedHeight }
          : { width: COLLAPSED_WIDTH, height: COLLAPSED_HEIGHT },
      });

      rfEdges.push({
        id: `global-router-${flow.id}`,
        source: 'global-router',
        target: flow.id,
        type: 'smoothstep',
        animated: true,
        style: EDGE_STYLE,
        markerEnd: EDGE_MARKER,
      });

      if (isExpanded && layout) {
        const nodeIdToRfId: Record<string, string> = {};

        for (const flowNode of flow.nodes ?? []) {
          const pos = layout.positions[flowNode.node.id];
          if (!pos) continue;

          const tools = flowNode.node.tools ?? [];
          const rfId = `${flow.id}__node__${flowNode.node.id}`;
          nodeIdToRfId[flowNode.node.id] = rfId;

          rfNodes.push({
            id: rfId,
            type: 'process',
            position: {
              x: EXPANDED_PADDING_X + pos.col * COLUMN_WIDTH,
              y: EXPANDED_PADDING_TOP + pos.row * ROW_HEIGHT,
            },
            parentId: flow.id,
            extent: 'parent' as const,
            data: {
              label: flowNode.node.name,
              activeSessions: activeSessions[flowNode.node.id] || 0,
              toolsCount: tools.length,
              hasPreCode: !!flowNode.node.preCode,
              hasPostCode: !!flowNode.node.postCode,
              onError: flowNode.node.onError,
              isHighlighted: highlightedNodeId === flowNode.node.id,
              onSelect: () => onSelectNode(flowNode.node, false),
              onEdit: () => onEditNode(flowNode.node),
              onAddTransition: () => onAddTransition(flow.id, flowNode.node),
            },
          });
        }

        const entryRfId = flow.routerNode ? nodeIdToRfId[flow.routerNode.id] : undefined;
        if (entryRfId) {
          rfEdges[rfEdges.length - 1] = {
            ...rfEdges[rfEdges.length - 1],
            target: entryRfId,
          };
        }

        for (const transition of (flow.transitions ?? [])) {
          const sourceRfId = nodeIdToRfId[transition.fromNodeId];
          const targetRfId = nodeIdToRfId[transition.toNodeId];
          if (sourceRfId && targetRfId) {
            rfEdges.push({
              id: `transition-${transition.id}`,
              source: sourceRfId,
              target: targetRfId,
              type: 'smoothstep',
              animated: true,
              style: EDGE_STYLE,
              markerEnd: EDGE_MARKER,
              label: transition.transitionCode,
              labelStyle: { fill: 'var(--color-text-tertiary)', fontSize: 10 },
            });
          }
        }

        currentY += expandedHeight + FLOW_GAP;
      } else {
        currentY += COLLAPSED_HEIGHT + FLOW_GAP;
      }
    }

    return { nodes: rfNodes, edges: rfEdges };
  }, [flows, expandedFlowIds, activeSessions, highlightedNodeId, onToggleExpand, onSelectNode, onCreateFlow, onEditFlow, onDeleteFlow, onFlowTransitions, onFlowHistory, onEditNode, onAddTransition]);
}
