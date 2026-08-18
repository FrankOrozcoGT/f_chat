import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Pencil, Layers, Trash2, Loader2, Rocket, Eye } from 'lucide-react';
import { usePromoteFlow, useDeleteFlow } from '@/features/flows';
import { useGetFlowDiagram } from '../api/useGetFlowDiagram';
import { useGetFlowAnalyses } from '../api/useGetFlowAnalyses';
import { useApproveDiagram } from '../api/useApproveDiagram';
import { useUpdateFlowDiagram } from '../api/useUpdateFlowDiagram';
import { DiagramEditor } from './DiagramEditor';
import type { Flow } from '@/features/flows';

interface FlowCardProps {
  flow: Flow;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  mergeMode: boolean;
}

export const FlowCard = ({ flow, selected, onToggleSelect, mergeMode }: FlowCardProps) => {
  const navigate = useNavigate();
  const updateDiagram = useUpdateFlowDiagram();
  const approveDiagram = useApproveDiagram();
  const { mutate: promote, isPending: isPromoting } = usePromoteFlow();
  const { mutate: discard, isPending: isDiscarding } = useDeleteFlow();

  const [editing, setEditing] = useState(false);

  const { data: diagram, isLoading: diagramLoading } = useGetFlowDiagram(flow.id);
  const { data: analyses } = useGetFlowAnalyses(editing ? flow.id : null);

  const isApproved = diagram?.diagramApproved;
  const isBusy = isPromoting || isDiscarding;
  const hasNodes = flow.nodes.length > 0;

  const handleSave = (newMermaid: string) => {
    updateDiagram.mutate({ flowId: flow.id, diagram: newMermaid }, {
      onSuccess: () => setEditing(false),
    });
  };

  return (
    <div className="border border-border-primary rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-bg-primary border-b border-border-primary">
        <div className="flex items-center gap-2 min-w-0">
          {mergeMode && (
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onToggleSelect(flow.id)}
              className="w-3.5 h-3.5 shrink-0 accent-purple-500"
            />
          )}
          <Layers size={14} className="text-accent-blue shrink-0" />
          <span className="text-sm font-medium text-text-primary truncate">{flow.name}</span>
          {flow.analysisCount > 0 && (
            <span className="text-[10px] text-accent-blue font-medium">{flow.analysisCount} conv.</span>
          )}
          {isApproved && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border bg-accent-green/15 text-accent-green border-accent-green/30">
              Diagrama aprobado
            </span>
          )}
          {diagram?.diagramModified && !isApproved && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border bg-accent-yellow/15 text-accent-yellow border-accent-yellow/30">
              Modificado
            </span>
          )}
          {hasNodes && (
            <span className="text-[10px] text-text-tertiary">
              {flow.nodes.length} nodo{flow.nodes.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setEditing(true)}
            className="p-1.5 rounded hover:bg-bg-tertiary text-text-tertiary hover:text-text-secondary transition-colors"
            title="Editar diagrama"
          >
            <Pencil size={14} />
          </button>
          {!isApproved && (
            <button
              onClick={() => approveDiagram.mutate(flow.id)}
              disabled={approveDiagram.isPending}
              className="flex items-center gap-1 px-2.5 py-1 bg-accent-green text-white rounded text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              title="Aprobar diagrama"
            >
              {approveDiagram.isPending ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
              {approveDiagram.isPending ? 'Aprobando...' : 'Aprobar diagrama'}
            </button>
          )}
          {hasNodes && (
            <>
              <button
                onClick={() => navigate(`/ai-setup/flows/${flow.id}`)}
                disabled={isBusy}
                className="flex items-center gap-1 px-2.5 py-1 border border-border-primary text-text-secondary rounded text-xs font-medium hover:border-accent-blue hover:text-accent-blue transition-colors disabled:opacity-50"
              >
                <Eye size={12} />
                Revisar
              </button>
              <button
                onClick={() => promote(flow.id)}
                disabled={isBusy}
                className="flex items-center gap-1 px-2.5 py-1 bg-accent-blue text-white rounded text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isPromoting ? <Loader2 size={12} className="animate-spin" /> : <Rocket size={12} />}
                Promover
              </button>
            </>
          )}
          <button
            onClick={() => discard(flow.id)}
            disabled={isBusy}
            title="Descartar"
            className="p-1.5 rounded text-text-tertiary hover:text-accent-red hover:bg-accent-red/10 transition-colors disabled:opacity-40"
          >
            {isDiscarding ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={14} />}
          </button>
        </div>
      </div>

      {editing && (
        diagramLoading ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary">
            <Loader2 size={24} className="animate-spin text-text-tertiary" />
          </div>
        ) : diagram ? (
          <DiagramEditor
            mermaidChart={diagram.consolidatedDiagram}
            nodeMapping={diagram.nodeMapping}
            internalQueues={diagram.internalQueues}
            nodeCategories={diagram.nodeCategories}
            analyses={analyses}
            onSave={handleSave}
            onCancel={() => setEditing(false)}
            isSaving={updateDiagram.isPending}
          />
        ) : null
      )}
    </div>
  );
};
