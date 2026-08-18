import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Layers, MessageSquare, FlaskConical, CheckCircle, Trash2, Loader2, AlertCircle, Wrench, GitBranch, ChevronDown, ChevronRight } from 'lucide-react';
import { MainLayout } from '@/layouts/MainLayout';
import { useGetFlows } from '@/features/flows/api/useGetFlows';
import { useGetFlowVersions } from '@/features/flows/api/useGetFlowVersions';
import { usePromoteFlow } from '@/features/flows/api/usePromoteFlow';
import { useDeleteFlow } from '@/features/flows/api/useDeleteFlow';
import { TestPanel } from '@/features/flows/components/TestPanel';
import { useGetFlowAnalyses } from '../api/useGetFlowAnalyses';
import { MermaidDiagram } from '@/shared/components/MermaidDiagram';
import { formatDate } from '@/shared/lib/date';

type Tab = 'version' | 'conversations' | 'test';

export const FlowReviewPage = () => {
  const { flowId } = useParams<{ flowId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('version');
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set([0]));
  const { data: flows } = useGetFlows();
  const { data: versions, isLoading: versionsLoading } = useGetFlowVersions(flowId ?? null);
  const { data: analyses, isLoading: analysesLoading } = useGetFlowAnalyses(flowId ?? null);
  const { mutate: promote, isPending: isPromoting } = usePromoteFlow();
  const { mutate: discard, isPending: isDiscarding } = useDeleteFlow();

  const flow = flows?.find((f) => f.id === flowId);
  const latestVersion = versions?.[0];

  const handlePromote = () => {
    if (!flowId) return;
    promote(flowId, { onSuccess: () => navigate('/ai-setup') });
  };

  const handleDiscard = () => {
    if (!flowId) return;
    discard(flowId, { onSuccess: () => navigate('/ai-setup') });
  };

  const toggleNode = (i: number) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'version', label: 'Versión', icon: <Layers size={15} /> },
    { id: 'conversations', label: 'Conversaciones', icon: <MessageSquare size={15} /> },
    { id: 'test', label: 'Probar', icon: <FlaskConical size={15} /> },
  ];

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/ai-setup')}
              className="p-1.5 rounded-md hover:bg-bg-secondary transition-colors text-text-secondary"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <GitBranch size={18} className="text-accent-blue" />
                <h1 className="text-xl font-semibold text-text-primary">
                  {flow?.name ?? 'Cargando...'}
                </h1>
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-accent-yellow/15 text-accent-yellow border border-accent-yellow/30">
                  Borrador
                </span>
              </div>
              {latestVersion && (
                <p className="text-xs text-text-secondary mt-0.5 ml-7">
                  Versión {latestVersion.version} · {latestVersion.nodesSnapshot.nodes.length} nodos · {latestVersion.nodesSnapshot.transitions.length} transiciones
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDiscard}
              disabled={isDiscarding || isPromoting}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-border-primary text-text-secondary rounded-md text-sm hover:border-accent-red hover:text-accent-red transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDiscarding ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Descartar
            </button>
            <button
              onClick={handlePromote}
              disabled={isPromoting || isDiscarding}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-accent-green text-white rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPromoting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
              Aprobar
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border-primary mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-accent-blue text-accent-blue'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab: Versión */}
        {activeTab === 'version' && (
          <div className="flex flex-col gap-4">
            {versionsLoading && (
              <div className="flex items-center gap-2 text-text-secondary py-8 justify-center">
                <Loader2 size={18} className="animate-spin" />
                <span className="text-sm">Cargando versión...</span>
              </div>
            )}

            {!versionsLoading && !latestVersion && (
              <div className="flex items-center gap-2 p-4 bg-accent-yellow/10 border border-accent-yellow/30 rounded-md">
                <AlertCircle size={16} className="text-accent-yellow shrink-0" />
                <p className="text-sm text-accent-yellow">Este flow no tiene versiones guardadas aún</p>
              </div>
            )}

            {latestVersion && (
              <>
                {/* Proposed tools */}
                {latestVersion.proposedTools?.length > 0 && (
                  <div className="p-4 bg-accent-blue/5 border border-accent-blue/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Wrench size={14} className="text-accent-blue" />
                      <p className="text-sm font-medium text-accent-blue">Herramientas sugeridas por la IA</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      {latestVersion.proposedTools.map((t) => (
                        <div key={t.name} className="flex items-start gap-2">
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-accent-blue/10 text-accent-blue shrink-0">{t.name}</span>
                          <span className="text-xs text-text-secondary">{t.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Nodes */}
                <div className="flex flex-col gap-2">
                  {latestVersion.nodesSnapshot.nodes.map((node, i) => (
                    <div key={i} className="bg-bg-secondary border border-border-primary rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleNode(i)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-bg-tertiary/50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {expandedNodes.has(i) ? <ChevronDown size={14} className="text-text-secondary" /> : <ChevronRight size={14} className="text-text-secondary" />}
                          <span className="text-sm font-medium text-text-primary">{node.name}</span>
                          {node.tools.length > 0 && (
                            <span className="text-xs text-text-tertiary">{node.tools.length} tools</span>
                          )}
                        </div>
                      </button>

                      {expandedNodes.has(i) && (
                        <div className="px-4 pb-4 border-t border-border-primary">
                          {/* System prompt */}
                          <div className="mt-3 mb-3">
                            <p className="text-xs font-semibold text-text-tertiary uppercase mb-1.5">System Prompt</p>
                            <pre className="text-xs text-text-secondary bg-bg-primary rounded-md p-3 whitespace-pre-wrap max-h-40 overflow-y-auto">
                              {node.systemPrompt}
                            </pre>
                          </div>

                          {/* Tools */}
                          {node.tools.length > 0 && (
                            <div className="mb-3">
                              <p className="text-xs font-semibold text-text-tertiary uppercase mb-1.5">Tools</p>
                              <div className="flex flex-wrap gap-1.5">
                                {node.tools.map((t, ti) => (
                                  <span key={ti} className="px-2 py-0.5 text-xs rounded bg-bg-primary border border-border-primary text-text-secondary">
                                    {typeof t === 'string' ? t : (t as { code: string }).code}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Todos */}
                          {node.todos?.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-text-tertiary uppercase mb-1.5">Todos</p>
                              <div className="flex flex-col gap-1.5">
                                {node.todos.map((todo) => (
                                  <div key={todo.id} className="p-2.5 bg-bg-primary border border-border-primary rounded-md">
                                    <p className="text-xs font-medium text-text-primary">{todo.name}</p>
                                    {todo.description && (
                                      <p className="text-xs text-text-secondary mt-0.5">{todo.description}</p>
                                    )}
                                    {todo.functions?.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-1.5">
                                        {todo.functions.map((fn) => (
                                          <span key={fn} className="px-1.5 py-0.5 text-[10px] rounded bg-accent-blue/10 text-accent-blue">{fn}</span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Transitions */}
                {latestVersion.nodesSnapshot.transitions.length > 0 && (
                  <div className="bg-bg-secondary border border-border-primary rounded-lg p-4">
                    <p className="text-xs font-semibold text-text-tertiary uppercase mb-3">Transiciones</p>
                    <div className="flex flex-col gap-1.5">
                      {latestVersion.nodesSnapshot.transitions.map((t, i) => {
                        const fromName = latestVersion.nodesSnapshot.nodes.find((n) => n.id === t.fromNodeId)?.name ?? t.fromNodeId;
                        const toName = latestVersion.nodesSnapshot.nodes.find((n) => n.id === t.toNodeId)?.name ?? t.toNodeId;
                        return (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <span className="text-text-secondary">{fromName}</span>
                            <span className="text-text-tertiary">→</span>
                            <span className="text-text-secondary">{toName}</span>
                            <span className="px-1.5 py-0.5 rounded bg-bg-primary border border-border-primary text-text-tertiary font-mono">{t.transitionCode}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Selected cases */}
              </>
            )}
          </div>
        )}

        {/* Tab: Conversaciones */}
        {activeTab === 'conversations' && (
          <div className="flex flex-col gap-3">
            {analysesLoading && (
              <div className="flex items-center gap-2 text-text-secondary py-8 justify-center">
                <Loader2 size={18} className="animate-spin" />
                <span className="text-sm">Cargando conversaciones...</span>
              </div>
            )}

            {!analysesLoading && (!analyses || analyses.length === 0) && (
              <p className="text-sm text-text-secondary italic text-center py-8">Sin conversaciones origen</p>
            )}

            {analyses?.map((a) => (
              <div key={a.analysisId} className="bg-bg-secondary border border-border-primary rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-accent-blue/10 text-accent-blue">{a.intent}</span>
                  <span className="text-xs text-text-tertiary">{formatDate(a.analyzedAt)}</span>
                </div>
                <p className="text-sm text-text-secondary mb-3">{a.flowSummary}</p>
                <details className="group">
                  <summary className="text-xs text-text-tertiary cursor-pointer hover:text-text-secondary">Ver diagrama</summary>
                  <MermaidDiagram chart={a.flowDiagram} className="mt-2" />
                </details>
              </div>
            ))}
          </div>
        )}

        {/* Tab: Probar */}
        {activeTab === 'test' && (
          <div className="relative h-150 rounded-lg overflow-hidden border border-border-primary">
            <TestPanel
              flowId={flowId}
              onClose={() => setActiveTab('version')}
              onNodeHighlight={() => {}}
            />
          </div>
        )}
      </div>
    </MainLayout>
  );
};
