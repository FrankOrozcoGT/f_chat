import { useMemo } from 'react';
import type { NodeMappingEntry, InternalQueue } from '@/features/ai-setup/api/useGetFlowDiagram';
import type { useMermaidChartEditor } from '@/features/ai-setup/hooks/useMermaidChartEditor';

interface Selection {
  type: 'node' | 'edge';
  id: string;
}

interface UseStyledDiagramChartParams {
  chart: string;
  parsed: ReturnType<typeof useMermaidChartEditor>['parsed'];
  nodeMapping?: Record<string, NodeMappingEntry[]>;
  internalQueues?: InternalQueue[];
  selectedConversationId: string | null;
  selection: Selection | null;
}

/**
 * Inyecta en el chart mermaid el conteo de conversaciones por nodo y las
 * líneas `style` de cobertura/canal-interno/selección — separado del
 * editor porque es puro cálculo sobre el string del chart, sin estado propio.
 */
export function useStyledDiagramChart({
  chart,
  parsed,
  nodeMapping,
  internalQueues,
  selectedConversationId,
  selection,
}: UseStyledDiagramChartParams): string {
  return useMemo(() => {
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
}
