// Conversation summary component for HITL Panel
// Shows previous conversations summaries (if available)

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '@/shared/ui/Card';

interface ConversationSummaryItem {
  id: string;
  date: string;
  summary: string;
}

interface ConversationSummaryProps {
  summaries?: ConversationSummaryItem[];
}

export const ConversationSummary = ({ summaries = [] }: ConversationSummaryProps) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  if (summaries.length === 0) {
    return (
      <Card variant="default" className="p-4 md:p-6">
        <CardHeader className="mb-4 pb-4">
          <CardTitle>Conversaciones Previas</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <MessageSquare className="w-12 h-12 text-text-tertiary mb-3" />
            <p className="text-sm text-text-secondary">
              No hay resúmenes de conversaciones previas
            </p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card variant="default" className="p-4 md:p-6">
      <CardHeader className="mb-4 pb-4">
        <CardTitle>Conversaciones Previas</CardTitle>
      </CardHeader>

      <CardBody className="space-y-3">
        {summaries.map((item) => {
          const isExpanded = expandedIds.has(item.id);
          const shouldTruncate = item.summary.length > 150;
          const displayText = isExpanded || !shouldTruncate
            ? item.summary
            : `${item.summary.slice(0, 150)}...`;

          const formattedDate = formatDistanceToNow(new Date(item.date), {
            addSuffix: true,
            locale: es,
          });

          return (
            <div
              key={item.id}
              className="p-3 rounded-lg bg-bg-tertiary border border-border-primary"
            >
              {/* Date */}
              <p className="text-xs font-semibold text-text-secondary mb-2">
                {formattedDate}
              </p>

              {/* Summary text */}
              <p className="text-sm text-text-primary whitespace-pre-wrap mb-2">
                {displayText}
              </p>

              {/* Expand/Collapse button */}
              {shouldTruncate && (
                <button
                  onClick={() => toggleExpanded(item.id)}
                  className="flex items-center gap-1 text-xs text-accent-blue hover:underline"
                >
                  {isExpanded ? (
                    <>
                      Ver menos <ChevronUp className="w-3 h-3" />
                    </>
                  ) : (
                    <>
                      Ver más <ChevronDown className="w-3 h-3" />
                    </>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </CardBody>
    </Card>
  );
};
