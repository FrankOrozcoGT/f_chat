import { useState } from 'react';
import { ChevronRight, MessageSquare, Copy, Check } from 'lucide-react';
import { MermaidDiagram } from '@/shared/components/MermaidDiagram';
import { formatDate } from '@/shared/lib/date';
import type { FlowAnalysis } from '../api/useGetFlowAnalyses';

const CopyId = ({ value }: { value: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 px-3 pb-1 text-[10px] font-mono text-text-tertiary hover:text-accent-blue truncate w-full text-left transition-colors"
      title="Copiar conversationId"
    >
      {copied ? <Check size={10} className="text-accent-green shrink-0" /> : <Copy size={10} className="shrink-0" />}
      <span className="truncate">{copied ? 'Copiado' : value}</span>
    </button>
  );
};

interface DiagramConversationsSidebarProps {
  analyses: FlowAnalysis[];
  selectedConversationId: string | null;
  onSelectConversation: (conversationId: string | null) => void;
  onViewConversation: (conversationId: string) => void;
}

/** Sidebar del editor de diagramas: lista de conversaciones analizadas, con diagrama individual al expandir. */
export const DiagramConversationsSidebar = ({
  analyses,
  selectedConversationId,
  onSelectConversation,
  onViewConversation,
}: DiagramConversationsSidebarProps) => {
  return (
    <div className="w-80 shrink-0 border-l border-border-primary bg-bg-secondary flex flex-col overflow-hidden">
      <div className="px-3 py-2.5 border-b border-border-primary shrink-0">
        <p className="text-xs font-semibold text-text-tertiary uppercase">Conversaciones individuales</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {analyses.map((a) => {
          const isSelected = selectedConversationId === a.conversationId;
          return (
            <div key={a.analysisId} className={`border-b border-border-primary ${isSelected ? 'bg-accent-yellow/5' : ''}`}>
              <div className="flex items-center gap-2 px-3 py-2">
                <button
                  onClick={() => onSelectConversation(isSelected ? null : a.conversationId)}
                  className={`flex-1 text-left text-xs truncate transition-colors ${
                    isSelected ? 'text-accent-yellow font-medium' : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <ChevronRight size={10} className={`inline mr-1 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                  {a.intent}
                  <span className="text-text-tertiary ml-1 text-[10px]">
                    {formatDate(a.analyzedAt)}
                  </span>
                </button>
                <button
                  onClick={() => onViewConversation(a.conversationId)}
                  className="p-1 rounded text-text-tertiary hover:text-accent-blue transition-colors shrink-0"
                  title="Ver mensajes"
                >
                  <MessageSquare size={12} />
                </button>
              </div>
              {isSelected && <CopyId value={a.conversationId} />}
              {isSelected && a.flowDiagram && (
                <div className="px-3 pb-2">
                  <p className="text-[10px] text-text-tertiary mb-1 line-clamp-2">{a.flowSummary}</p>
                  <MermaidDiagram chart={a.flowDiagram} className="max-h-48" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
