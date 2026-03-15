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

export interface FlowTransition {
  id: string;
  flowId: string;
  fromNodeId: string;
  toNodeId: string;
  transitionCode: string;
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
  transitions: FlowTransition[];
}

export type FlowsResponse = Flow[];

// { [nodeId]: activeSessionCount }
export type ActiveSessionsResponse = Record<string, number>;

// === Test Types ===

export interface TestSession {
  testId: string;
}

export enum TestIntent {
  Normal = 'normal',
  Responder = 'responder',
  CloseSession = 'closeSession',
  SwitchToHitl = 'switchToHitl',
  FindFlowForIntent = 'findFlowForIntent',
  MoveToLastConversation = 'moveToLastConversation',
  ReportHacking = 'reportHacking',
  MaxIterations = 'max_iterations',
}

export enum SideEffectAction {
  SendMessage = 'sendMessage',
  SendFarewell = 'sendFarewell',
  CloseNodeSession = 'closeNodeSession',
  CloseConversation = 'closeConversation',
  SwitchToHitl = 'switchToHitl',
  UpsertIntent = 'upsertIntent',
  TransitionToFlow = 'transitionToFlow',
  MoveToLastConversation = 'moveToLastConversation',
  ReportHacking = 'reportHacking',
}

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
