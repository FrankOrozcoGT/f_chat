/**
 * Parses a simple mermaid flowchart TD/LR into nodes and edges for ReactFlow.
 * Supports: A[Label], A(Label), A{Label}, A([Label]), A((Label))
 * Edges: A --> B, A -->|label| B, A --- B, A ---|label| B
 */

export interface ParsedNode {
  id: string;
  label: string;
}

export interface ParsedEdge {
  source: string;
  target: string;
  label?: string;
}

export function parseMermaidFlowchart(chart: string): { nodes: ParsedNode[]; edges: ParsedEdge[] } {
  const nodes = new Map<string, string>();
  const edges: ParsedEdge[] = [];

  const lines = chart.split('\n').map((l) => l.trim()).filter(Boolean);

  // Skip the first line if it's the flowchart declaration
  const startIdx = lines.findIndex((l) => /^flowchart\s/i.test(l) || /^graph\s/i.test(l));
  const contentLines = startIdx >= 0 ? lines.slice(startIdx + 1) : lines;

  // Regex for node definitions: ID[Label] or ID(Label) or ID{Label} etc.
  const nodePattern = /([A-Za-z0-9_]+)\s*[\[\(\{][\[\(\{]?\s*([^\]\)\}]+?)\s*[\]\)\}][\]\)\}]?/g;

  // Regex for edges: A -->|label| B or A --> B or A --- B etc.
  const edgePattern = /([A-Za-z0-9_]+)\s*(-{2,3}>?\|?[^|]*\|?-{0,3}>?)\s*(?:\|([^|]+)\|)?\s*([A-Za-z0-9_]+)/g;

  for (const line of contentLines) {
    // Skip style/class/subgraph lines
    if (/^(style|class|subgraph|end|click|linkStyle)/i.test(line)) continue;

    // Extract nodes
    let match: RegExpExecArray | null;
    nodePattern.lastIndex = 0;
    while ((match = nodePattern.exec(line)) !== null) {
      nodes.set(match[1], match[2]);
    }

    // Extract edges
    // More flexible edge regex: handles A --> B, A -->|text| B, A --- B
    const edgeRegex = /([A-Za-z0-9_]+)\s*(-+>?-*(?:\|[^|]*\|)?-*>?)\s*([A-Za-z0-9_]+)/g;
    edgeRegex.lastIndex = 0;
    while ((match = edgeRegex.exec(line)) !== null) {
      const source = match[1];
      const target = match[3];
      // Extract label from -->|label| pattern
      const labelMatch = match[2].match(/\|([^|]+)\|/);
      edges.push({
        source,
        target,
        label: labelMatch?.[1],
      });

      // Ensure both source and target exist as nodes
      if (!nodes.has(source)) nodes.set(source, source);
      if (!nodes.has(target)) nodes.set(target, target);
    }
  }

  return {
    nodes: Array.from(nodes.entries()).map(([id, label]) => ({ id, label })),
    edges,
  };
}

/**
 * Converts ReactFlow nodes/edges back to mermaid flowchart TD syntax.
 */
export function toMermaidFlowchart(
  nodes: { id: string; data: { label: string } }[],
  edges: { source: string; target: string; label?: string }[],
): string {
  const lines: string[] = ['flowchart TD'];

  // Node definitions
  for (const node of nodes) {
    lines.push(`    ${node.id}[${node.data.label}]`);
  }

  // Edge definitions
  for (const edge of edges) {
    if (edge.label) {
      lines.push(`    ${edge.source} -->|${edge.label}| ${edge.target}`);
    } else {
      lines.push(`    ${edge.source} --> ${edge.target}`);
    }
  }

  return lines.join('\n');
}
