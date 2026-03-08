export type OnErrorStrategy = 'hitl' | 'retry' | 'ignore';

export interface Node {
  id: string;
  name: string;
  systemPrompt: string;
  tools: string; // JSON string array
  preCode: string | null; // JSON string array e.g. '["loadIntents"]'
  postCode: string | null; // JSON string array e.g. '["responder","findFlowForIntent"]'
  preCodeInputSchema: string | null;
  postCodeInputSchema: string | null;
  onError: OnErrorStrategy;
  createdAt: string;
  updatedAt: string;
}

export interface FlowNode {
  id: string;
  flowId: string;
  nodeId: string;
  node: Node;
}

export interface Flow {
  id: string;
  name: string;
  routerNodeId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  routerNode: Node;
  nodes: FlowNode[];
}

export type FlowsResponse = Flow[];

// { [nodeId]: activeSessionCount }
export type ActiveSessionsResponse = Record<string, number>;

// === Test Types ===

export interface TestSession {
  testId: string;
}

export interface TestSendResponse {
  response: string;
  currentNodeId: string;
}

export interface TestStepBackResponse {
  currentNodeId: string;
  lastMessage: string;
}

export interface TestMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  nodeId?: string;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  conversations: ContactConversation[];
}

export interface ContactConversation {
  id: string;
  lastMessage?: string;
  updatedAt: string;
}
