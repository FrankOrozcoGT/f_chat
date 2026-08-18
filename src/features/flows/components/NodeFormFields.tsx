import { X, SlidersHorizontal } from 'lucide-react';
import { MultiSelect } from '@/shared/ui/MultiSelect';
import { Button } from '@/shared/ui/Button';
import { FormField } from '@/shared/ui/FormField';
import { Input, Textarea } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';
import { NodeFunctionType, preCodeItemCode } from '../types';
import type { NodeFunction, PreCodeItem } from '../types';
import type { NodeForm, NodeFormTab } from '../hooks/useNodeCrud';

const TAB_ORDER: NodeFormTab[] = ['general', 'precode', 'todos', 'tools', 'postcode'];

const ON_ERROR_OPTIONS = [
  { value: 'hitl', label: 'HITL' },
  { value: 'retry', label: 'Retry' },
  { value: 'ignore', label: 'Ignore' },
];

interface CodeItemsListProps {
  items: PreCodeItem[];
  onEditArgs: (code: string) => void;
}

const CodeItemsList = ({ items, onEditArgs }: CodeItemsListProps) => (
  <>
    {items.filter((i) => typeof i === 'object').map((item) => {
      const obj = item as { code: string; args: Record<string, unknown> };
      const preview = Object.values(obj.args).flat().filter(Boolean).join(', ');
      return (
        <div key={obj.code} className="mt-1.5 flex items-center gap-2 px-2 py-1 bg-bg-tertiary rounded-md text-xs text-text-secondary">
          <SlidersHorizontal size={11} className="shrink-0 text-accent-purple" />
          <span className="font-medium text-text-primary">{obj.code}</span>
          <span className="text-text-tertiary truncate">{preview || '(sin args)'}</span>
          <button type="button" onClick={() => onEditArgs(obj.code)} className="ml-auto text-accent-blue hover:opacity-70 transition-opacity shrink-0">Editar</button>
        </div>
      );
    })}
  </>
);

interface NodeFormFieldsProps {
  form: NodeForm;
  errors: { name?: string };
  activeTab: NodeFormTab;
  onTabChange: (tab: NodeFormTab) => void;
  onChange: (updater: (f: NodeForm) => NodeForm) => void;
  functions: NodeFunction[];
  onPreCodeChange: (field: 'preCode' | 'postCode', codes: string[]) => void;
  onEditArgs: (field: 'preCode' | 'postCode', code: string) => void;
}

/**
 * Formulario de nodo (tabs: general/precode/todos/tools/postcode), usado
 * idéntico tanto para editar como para crear un nodo — solo cambia el
 * form/errors/tab que recibe y a dónde despachan los handlers.
 */
export const NodeFormFields = ({
  form,
  errors,
  activeTab,
  onTabChange,
  onChange,
  functions,
  onPreCodeChange,
  onEditArgs,
}: NodeFormFieldsProps) => {
  const labels: Record<NodeFormTab, string> = {
    general: 'General',
    precode: 'Pre Code',
    todos: `Todos${form.todos.length ? ` (${form.todos.length})` : ''}`,
    tools: 'Tools',
    postcode: 'Post Code',
  };

  return (
    <>
      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-border-primary">
        {TAB_ORDER.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => onTabChange(tab)}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${activeTab === tab ? 'border-accent-blue text-accent-blue' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
          >
            {labels[tab]}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {activeTab === 'general' && (
          <>
            <FormField label="Nombre" required error={errors.name}>
              <Input value={form.name} onChange={(e) => onChange((f) => ({ ...f, name: e.target.value }))} error={!!errors.name} />
            </FormField>
            <FormField label="System Prompt" optional>
              <Textarea rows={8} placeholder="Instrucciones del sistema..." value={form.systemPrompt} onChange={(e) => onChange((f) => ({ ...f, systemPrompt: e.target.value }))} />
            </FormField>
            <FormField label="On Error">
              <Select value={form.onError} options={ON_ERROR_OPTIONS} onChange={(val) => onChange((f) => ({ ...f, onError: val }))} className="w-full" />
            </FormField>
          </>
        )}

        {activeTab === 'precode' && (
          <FormField label="Pre Code" optional>
            <MultiSelect
              value={form.preCode.map(preCodeItemCode)}
              options={functions.filter((f) => f.type === NodeFunctionType.PreCode || f.type === NodeFunctionType.Tool).map((f) => ({ value: f.code, label: f.name, sublabel: f.description }))}
              onChange={(vals) => onPreCodeChange('preCode', vals)}
              placeholder="Seleccionar pre code..."
            />
            <CodeItemsList items={form.preCode} onEditArgs={(code) => onEditArgs('preCode', code)} />
          </FormField>
        )}

        {activeTab === 'todos' && (
          <div className="space-y-2">
            {form.todos.map((todo, idx) => (
              <div key={todo.id} className="border border-border-primary rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Nombre del todo"
                    value={todo.name}
                    onChange={(e) => onChange((f) => ({ ...f, todos: f.todos.map((t, i) => i === idx ? { ...t, name: e.target.value } : t) }))}
                  />
                  <button type="button" onClick={() => onChange((f) => ({ ...f, todos: f.todos.filter((_, i) => i !== idx) }))} className="p-1.5 text-text-tertiary hover:text-accent-red transition-colors shrink-0">
                    <X size={14} />
                  </button>
                </div>
                <Textarea
                  rows={2}
                  placeholder="Descripción..."
                  value={todo.description ?? ''}
                  onChange={(e) => onChange((f) => ({ ...f, todos: f.todos.map((t, i) => i === idx ? { ...t, description: e.target.value } : t) }))}
                />
                <MultiSelect
                  value={todo.functions}
                  options={form.tools.map((code) => { const fn = functions.find((f) => f.code === code); return { value: code, label: fn?.name ?? code }; })}
                  onChange={(vals) => onChange((f) => ({ ...f, todos: f.todos.map((t, i) => i === idx ? { ...t, functions: vals } : t) }))}
                  placeholder="Tools de este todo..."
                />
              </div>
            ))}
            <Button variant="secondary" onClick={() => onChange((f) => ({ ...f, todos: [...f.todos, { id: crypto.randomUUID(), name: '', description: '', functions: [] }] }))}>
              + Agregar todo
            </Button>
          </div>
        )}

        {activeTab === 'tools' && (
          <FormField label="Tools" optional>
            <MultiSelect
              value={form.tools}
              options={functions.filter((f) => f.type === NodeFunctionType.Tool).map((f) => ({ value: f.code, label: f.name, sublabel: f.description }))}
              onChange={(vals) => onChange((f) => ({ ...f, tools: vals }))}
              placeholder="Seleccionar tools..."
            />
          </FormField>
        )}

        {activeTab === 'postcode' && (
          <FormField label="Post Code" optional>
            <MultiSelect
              value={form.postCode.map(preCodeItemCode)}
              options={functions.filter((f) => f.type === NodeFunctionType.PostCode).map((f) => ({ value: f.code, label: f.name, sublabel: f.description }))}
              onChange={(vals) => onPreCodeChange('postCode', vals)}
              placeholder="Seleccionar post code..."
            />
            <CodeItemsList items={form.postCode} onEditArgs={(code) => onEditArgs('postCode', code)} />
          </FormField>
        )}
      </div>
    </>
  );
};
