import { useMemo } from 'react';
import { type Node as RFNode, type Edge, MarkerType } from '@xyflow/react';
import type { Flow, Node, ActiveSessionsResponse } from '../types';

const FLOW_COL_X = 350;
const COLLAPSED_HEIGHT = 130;
const COLLAPSED_WIDTH = 220;
const EXPANDED_PADDING_TOP = 50;
const EXPANDED_PADDING_BOTTOM = 30;
const EXPANDED_PADDING_X = 30;
const NODE_GAP_Y = 120;
const INTERNAL_ROUTER_X = 40;
const INTERNAL_PROCESS_X = 350;
const FLOW_GAP = 50;
const EDGE_STYLE = { stroke: 'var(--color-border-primary)', strokeWidth: 2 };
const EDGE_MARKER = { type: MarkerType.ArrowClosed as const, color: 'var(--color-text-tertiary)' };

function parseJsonArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getTotalSessions(flow: Flow, activeSessions: ActiveSessionsResponse): number {
  let total = activeSessions[flow.routerNode.id] || 0;
  for (const fn of flow.nodes) {
    total += activeSessions[fn.node.id] || 0;
  }
  return total;
}

interface LayoutOptions {
  flows: Flow[];
  expandedFlowIds: Set<string>;
  activeSessions: ActiveSessionsResponse;
  highlightedNodeId: string | null;
  onToggleExpand: (flowId: string) => void;
  onSelectNode: (node: Node, isRouter: boolean) => void;
}

export function useFlowCanvasLayout({
  flows,
  expandedFlowIds,
  activeSessions,
  highlightedNodeId,
  onToggleExpand,
  onSelectNode,
}: LayoutOptions): { nodes: RFNode[]; edges: Edge[] } {
  return useMemo(() => {
    const rfNodes: RFNode[] = [];
    const rfEdges: Edge[] = [];

    // Calculate total height to center the global router
    let totalHeight = 0;
    for (const flow of flows) {
      if (expandedFlowIds.has(flow.id)) {
        totalHeight += EXPANDED_PADDING_TOP + NODE_GAP_Y + EXPANDED_PADDING_BOTTOM;
      } else {
        totalHeight += COLLAPSED_HEIGHT;
      }
      totalHeight += FLOW_GAP;
    }
    totalHeight -= FLOW_GAP; // remove last gap

    // Global router node
    rfNodes.push({
      id: 'global-router',
      type: 'globalRouter',
      position: { x: 0, y: Math.max(0, totalHeight / 2 - 40) },
      data: {},
    });

    // Flows
    let currentY = 0;

    for (const flow of flows) {
      const isExpanded = expandedFlowIds.has(flow.id);
      const nodeCount = flow.nodes.length;
      const nodeSpacing = INTERNAL_PROCESS_X - INTERNAL_ROUTER_X + 50;
      const expandedWidth = INTERNAL_ROUTER_X + nodeCount * nodeSpacing + 150;
      const expandedHeight = EXPANDED_PADDING_TOP + NODE_GAP_Y + EXPANDED_PADDING_BOTTOM;

      // Flow group node
      rfNodes.push({
        id: flow.id,
        type: 'flowGroup',
        position: { x: FLOW_COL_X, y: currentY },
        data: {
          label: flow.name,
          totalActiveSessions: getTotalSessions(flow, activeSessions),
          nodeCount: flow.nodes.length + 1,
          isExpanded,
          onToggleExpand: () => onToggleExpand(flow.id),
        },
        style: isExpanded
          ? { width: expandedWidth, height: expandedHeight }
          : { width: COLLAPSED_WIDTH, height: COLLAPSED_HEIGHT },
      });

      // Edge from global router to flow
      rfEdges.push({
        id: `global-router-${flow.id}`,
        source: 'global-router',
        target: flow.id,
        type: 'smoothstep',
        animated: true,
        style: EDGE_STYLE,
        markerEnd: EDGE_MARKER,
      });

      if (isExpanded) {
        // All nodes as process nodes (routerNode is just the entry node, not a special type)
        const nodeIdToRfId: Record<string, string> = {};
        const startY = EXPANDED_PADDING_TOP;

        flow.nodes.forEach((flowNode, i) => {
          const tools = parseJsonArray(flowNode.node.tools);
          const rfId = `${flow.id}__node__${flowNode.node.id}`;
          nodeIdToRfId[flowNode.node.id] = rfId;

          rfNodes.push({
            id: rfId,
            type: 'process',
            position: { x: INTERNAL_ROUTER_X + i * (INTERNAL_PROCESS_X - INTERNAL_ROUTER_X + 50), y: startY },
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
            },
          });
        });

        // Edge from global router to the entry node (routerNode)
        const entryRfId = nodeIdToRfId[flow.routerNode.id];
        if (entryRfId) {
          // Update the external edge to point to the entry node directly
          rfEdges[rfEdges.length - 1] = {
            ...rfEdges[rfEdges.length - 1],
            target: entryRfId,
          };
        }

        // Edges from transitions
        for (const transition of flow.transitions) {
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
  }, [flows, expandedFlowIds, activeSessions, highlightedNodeId, onToggleExpand, onSelectNode]);
}
