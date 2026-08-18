import { X, Wrench, Code, AlertTriangle, Users, SlidersHorizontal, ListTodo } from 'lucide-react';
import type { Node, PreCodeItem } from '../types';
import { preCodeItemCode } from '../types';

function parseJsonArray(value: string | null, fieldLabel: string): { items: PreCodeItem[]; error: string | null } {
  if (!value) return { items: [], error: null };
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return { items: [], error: `${fieldLabel} tiene un formato inválido` };
    }
    return { items: parsed, error: null };
  } catch {
    return { items: [], error: `No se pudo leer ${fieldLabel} (dato corrupto)` };
  }
}

interface NodeDetailPanelProps {
  node: Node;
  activeSessions: number;
  isRouter?: boolean;
  onClose: () => void;
}

export const NodeDetailPanel = ({ node, activeSessions, isRouter, onClose }: NodeDetailPanelProps) => {
  const tools = node.tools ?? [];
  const { items: preCodeItems, error: preCodeError } = parseJsonArray(node.preCode, 'Pre Code');
  const { items: postCodeItems, error: postCodeError } = parseJsonArray(node.postCode, 'Post Code');

  return (
    <div className="absolute right-0 top-0 h-full w-96 bg-bg-secondary border-l border-border-primary z-10 overflow-y-auto shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border-primary sticky top-0 bg-bg-secondary">
        <div>
          <h3 className="text-base font-semibold text-text-primary">{node.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            {isRouter && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-accent-blue/10 text-accent-blue">
                Router
              </span>
            )}
            {activeSessions > 0 && (
              <span className="flex items-center gap-1 text-xs text-accent-green">
                <Users size={12} /> {activeSessions} activos
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md hover:bg-bg-tertiary transition-colors"
        >
          <X size={18} className="text-text-secondary" />
        </button>
      </div>

      <div className="p-4 space-y-5">
        {/* System Prompt */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-text-tertiary uppercase">System Prompt</h4>
            <span className="text-[10px] text-text-tertiary">
              ~{Math.ceil((node.systemPrompt?.length || 0) / 4).toLocaleString()} / 4,000 tokens
            </span>
          </div>
          <pre className="text-sm text-text-secondary bg-bg-tertiary rounded-lg p-3 whitespace-pre-wrap max-h-60 overflow-y-auto">
            {node.systemPrompt || '(vacio)'}
          </pre>
        </section>

        {/* Tools */}
        {tools.length > 0 && (
          <section>
            <h4 className="text-xs font-semibold text-text-tertiary uppercase mb-2 flex items-center gap-1">
              <Wrench size={12} /> Tools ({tools.length})
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {tools.map((tool) => {
                const label = typeof tool === 'string' ? tool : tool.code;
                return (
                  <span key={label} className="px-2 py-1 text-xs rounded bg-bg-tertiary text-text-secondary">
                    {label}
                  </span>
                );
              })}
            </div>
          </section>
        )}

        {/* Pre Code */}
        {(preCodeItems.length > 0 || preCodeError) && (
          <section>
            <h4 className="text-xs font-semibold text-text-tertiary uppercase mb-2 flex items-center gap-1">
              <Code size={12} /> Pre Code
            </h4>
            {preCodeError && (
              <p className="flex items-center gap-1.5 text-xs text-accent-red mb-2">
                <AlertTriangle size={12} /> {preCodeError}
              </p>
            )}
            <div className="flex flex-col gap-1.5">
              {preCodeItems.map((item) => {
                const code = preCodeItemCode(item);
                const hasArgs = typeof item === 'object';
                const keys = hasArgs ? ((item as { code: string; args: { keys?: string[] } }).args.keys ?? []) : [];
                return (
                  <div key={code} className="flex flex-wrap items-center gap-1.5">
                    <span className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-accent-purple/10 text-accent-purple">
                      {hasArgs && <SlidersHorizontal size={10} />}
                      {code}
                    </span>
                    {keys.map((k) => (
                      <span key={k} className="px-2 py-0.5 text-xs rounded bg-bg-tertiary text-text-secondary">
                        {k}
                      </span>
                    ))}
                  </div>
                );
              })}
            </div>
            {node.preCodeInputSchema && (
              <pre className="text-xs text-text-tertiary bg-bg-tertiary rounded-md p-2 mt-2 whitespace-pre-wrap max-h-40 overflow-y-auto">
                {node.preCodeInputSchema}
              </pre>
            )}
          </section>
        )}

        {/* Post Code */}
        {(postCodeItems.length > 0 || postCodeError) && (
          <section>
            <h4 className="text-xs font-semibold text-text-tertiary uppercase mb-2 flex items-center gap-1">
              <Code size={12} /> Post Code
            </h4>
            {postCodeError && (
              <p className="flex items-center gap-1.5 text-xs text-accent-red mb-2">
                <AlertTriangle size={12} /> {postCodeError}
              </p>
            )}
            <div className="flex flex-col gap-1.5">
              {postCodeItems.map((item) => {
                const code = preCodeItemCode(item);
                const hasArgs = typeof item === 'object';
                const keys = hasArgs ? ((item as { code: string; args: { keys?: string[] } }).args.keys ?? []) : [];
                return (
                  <div key={code} className="flex flex-wrap items-center gap-1.5">
                    <span className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-accent-orange/10 text-accent-orange">
                      {hasArgs && <SlidersHorizontal size={10} />}
                      {code}
                    </span>
                    {keys.map((k) => (
                      <span key={k} className="px-2 py-0.5 text-xs rounded bg-bg-tertiary text-text-secondary">
                        {k}
                      </span>
                    ))}
                  </div>
                );
              })}
            </div>
            {node.postCodeInputSchema && (
              <pre className="text-xs text-text-tertiary bg-bg-tertiary rounded-md p-2 mt-2 whitespace-pre-wrap max-h-40 overflow-y-auto">
                {node.postCodeInputSchema}
              </pre>
            )}
          </section>
        )}

        {/* Todos */}
        {node.todos && node.todos.length > 0 && (
          <section>
            <h4 className="text-xs font-semibold text-text-tertiary uppercase mb-2 flex items-center gap-1">
              <ListTodo size={12} /> Todos ({node.todos.length})
            </h4>
            <div className="space-y-2">
              {node.todos.map((todo) => (
                <div key={todo.id} className="border border-border-primary rounded-lg p-3 space-y-1.5">
                  <p className="text-sm font-medium text-text-primary">{todo.name}</p>
                  {todo.description && (
                    <p className="text-xs text-text-secondary">{todo.description}</p>
                  )}
                  {(todo.functions ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {(todo.functions ?? []).map((fn) => (
                        <span key={fn} className="px-1.5 py-0.5 text-xs rounded bg-accent-blue/10 text-accent-blue">{fn}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* On Error */}
        <section>
          <h4 className="text-xs font-semibold text-text-tertiary uppercase mb-2 flex items-center gap-1">
            <AlertTriangle size={12} /> On Error
          </h4>
          <span className="px-2 py-1 text-xs rounded bg-bg-tertiary text-text-secondary">
            {node.onError}
          </span>
        </section>
      </div>
    </div>
  );
};
