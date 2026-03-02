// Conversation summary component for HITL Panel
// Shows analyzed sub-conversations from GET /api/conversations/:id
// Click to load historical messages in the main panel

import { useState } from 'react';
import { ChevronDown, ChevronUp, MessageSquare, History } from 'lucide-react';
import { Card } from '@/shared/ui/Card';
import { Badge } from '@/shared/ui/Badge';
import type { AnalyzedConversation } from '../types';

interface ConversationSummaryProps {
  analyzedConversations: AnalyzedConversation[];
  onSelectConversation?: (conversationId: string) => void;
}

export const ConversationSummary = ({
  analyzedConversations,
  onSelectConversation,
}: ConversationSummaryProps) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (analyzedConversations.length === 0) {
    return (
      <Card variant="default" className="p-3 md:p-4">
        <div className="flex items-center gap-2 text-text-tertiary">
          <History className="w-4 h-4" />
          <span className="text-xs">Sin conversaciones analizadas</span>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="default" className="p-3 md:p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <History className="w-4 h-4 text-accent-blue" />
        <h4 className="text-sm font-semibold text-text-primary">
          Historial ({analyzedConversations.length})
        </h4>
      </div>

      {/* Sub-conversations list */}
      <div className="space-y-1.5">
        {analyzedConversations.map((conv) => {
          const isExpanded = expandedIds.has(conv.id);
          const summary = conv.summary || 'Sin resumen';
          const shouldTruncate = summary.length > 100;
          const displayText = isExpanded || !shouldTruncate
            ? summary
            : `${summary.slice(0, 100)}...`;

          return (
            <div
              key={conv.id}
              className="p-2 rounded-lg bg-bg-tertiary border border-border-primary hover:border-accent-blue/40 transition-colors"
            >
              {/* Top row: badge + message count + click action */}
              <div className="flex items-center justify-between mb-1">
                <Badge variant="default" size="sm">
                  {conv.messageCount} msgs
                </Badge>
                <button
                  onClick={() => onSelectConversation?.(conv.id)}
                  className="flex items-center gap-1 text-xs text-accent-blue hover:underline"
                >
                  <MessageSquare className="w-3 h-3" />
                  Ver
                </button>
              </div>

              {/* Summary text */}
              <p className="text-xs text-text-secondary whitespace-pre-wrap leading-relaxed">
                {displayText}
              </p>

              {shouldTruncate && (
                <button
                  onClick={() => toggleExpanded(conv.id)}
                  className="flex items-center gap-1 mt-1 text-xs text-accent-blue hover:underline"
                >
                  {isExpanded ? (
                    <>Menos <ChevronUp className="w-3 h-3" /></>
                  ) : (
                    <>Más <ChevronDown className="w-3 h-3" /></>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};
