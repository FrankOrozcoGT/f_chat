export type OnErrorStrategy = 'hitl' | 'retry' | 'ignore';

// Un item de preCode/postCode puede ser un string simple o un objeto con args
export type PreCodeItem = string | { code: string; args: Record<string, unknown> };

export function preCodeItemCode(item: PreCodeItem): string {
  return typeof item === 'string' ? item : item.code;
}

export interface NodeTodo {
  id: string;
  name: string;
  description?: string;
  functions: string[];
}

export interface Node {
  id: string;
  name: string;
  systemPrompt: string;
  tools: (string | { code: string; args: Record<string, unknown> })[];
  preCode: string | null; // JSON string array e.g. '["loadIntents"]'
  postCode: string | null; // JSON string array e.g. '["responder","findFlowForIntent"]'
  preCodeInputSchema: string | null;
  postCodeInputSchema: string | null;
  todos: NodeTodo[] | null;
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

export interface FlowTransition {
  id: string;
  flowId: string;
  fromNodeId: string;
  toNodeId: string;
  transitionCode: string;
}

export type FlowStatus = 'draft' | 'active' | 'archived';

export interface FlowIntent {
  id: string;
  name: string;
}

export interface Flow {
  id: string;
  name: string;
  status: FlowStatus;
  routerNodeId: string | null;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  analysisCount: number;
  routerNode: Node | null;
  nodes: FlowNode[];
  transitions: FlowTransition[];
  intents: FlowIntent[];
}

export interface FlowVersion {
  id: string;
  flowId: string;
  version: number;
  isPromoted: boolean;
  nodesSnapshot: {
    nodes: { id: string; name: string; systemPrompt: string; todos: NodeTodo[]; tools: string[] }[];
    transitions: { fromNodeId: string; toNodeId: string; transitionCode: string }[];
  };
  proposedTools: { name: string; description: string }[];
  contentHash?: string;
  createdAt: string;
}

export type FlowsResponse = Flow[];

// { [nodeId]: activeSessionCount }
export type ActiveSessionsResponse = Record<string, number>;

// === Test Types ===

export interface TestSession {
  testId: string;
}

export const TestIntent = {
  Normal: 'normal',
  Responder: 'responder',
  CloseSession: 'closeSession',
  SwitchToHitl: 'switchToHitl',
  FindFlowForIntent: 'findFlowForIntent',
  MoveToLastConversation: 'moveToLastConversation',
  ReportHacking: 'reportHacking',
  MaxIterations: 'max_iterations',
} as const;
export type TestIntent = typeof TestIntent[keyof typeof TestIntent];

export const SideEffectAction = {
  SendMessage: 'sendMessage',
  SendFarewell: 'sendFarewell',
  CloseNodeSession: 'closeNodeSession',
  CloseConversation: 'closeConversation',
  SwitchToHitl: 'switchToHitl',
  UpsertIntent: 'upsertIntent',
  TransitionToFlow: 'transitionToFlow',
  MoveToLastConversation: 'moveToLastConversation',
  ReportHacking: 'reportHacking',
} as const;
export type SideEffectAction = typeof SideEffectAction[keyof typeof SideEffectAction];

export interface TestSideEffect {
  action: SideEffectAction;
  args: Record<string, unknown>;
}

export interface NodeTransition {
  from: string;
  to: string | null;
  reason: string;
}

export interface TestSendResponse {
  response: string;
  intent: TestIntent;
  currentNodeId: string | null;
  sideEffects: TestSideEffect[];
  preCodeContext?: string;
  nodeTransitions?: NodeTransition[];
}

export interface TestStepBackResponse {
  currentNodeId: string;
  lastMessage: string;
}

export interface TestMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  type?: 'text' | 'image';
  mediaUrl?: string;
  nodeId?: string | null;
  intent?: string;
  sideEffects?: TestSideEffect[];
  preCodeContext?: string;
  nodeTransitions?: NodeTransition[];
}

export interface ConversationTestMessage {
  content: string;
  type: 'text' | 'image';
  mediaUrl?: string;
}

// === Node CRUD DTOs ===

export interface CreateNodeDto {
  name: string;
  systemPrompt?: string;
  tools?: string[];
  preCode?: string;
  preCodeInputSchema?: string;
  postCode?: string;
  postCodeInputSchema?: string;
  todos?: NodeTodo[];
  onError?: OnErrorStrategy;
}

export type UpdateNodeDto = Partial<CreateNodeDto>;

// === Flow CRUD DTOs ===

export interface CreateFlowDto {
  name: string;
  routerNodeId: string;
}

export interface UpdateFlowDto {
  name?: string;
  routerNodeId?: string;
}

// === Transition DTOs ===

export interface CreateTransitionDto {
  fromNodeId: string;
  toNodeId: string;
  transitionCode: string;
}

// === Intent Types ===

export interface Intent {
  id: string;
  name: string;
  flowId: string | null;
  flow?: Flow | null;
  createdAt: string;
  updatedAt: string;
}

export type IntentsResponse = Intent[];

export interface CreateIntentDto {
  name: string;
  flowId?: string;
}

export interface UpdateIntentDto {
  name?: string;
  flowId?: string;
}

// === Function Types ===

export const NodeFunctionType = {
  Tool: 'tool',
  PreCode: 'preCode',
  PostCode: 'postCode',
} as const;
export type NodeFunctionType = typeof NodeFunctionType[keyof typeof NodeFunctionType];

export interface ToolParameter {
  type: string;
  description?: string;
  items?: { type: string };
  enum?: string[];
}

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, ToolParameter>;
      required?: string[];
    };
  };
}

export interface NodeFunction {
  code: string;
  name: string;
  description: string;
  toolDefinition: ToolDefinition | null;
  outputSchema: unknown | null;
  type: NodeFunctionType;
}

export type NodeFunctionsResponse = NodeFunction[];

export interface Contact {
  id: string;
  name: string;
  phone: string;
  conversations: ContactConversation[];
}

export interface ContactConversation {
  id: string;
  lastMessage?: string;
  summary?: string | null;
  updatedAt: string;
}
