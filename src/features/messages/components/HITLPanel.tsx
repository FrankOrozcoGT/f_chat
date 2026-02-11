// HITL (Human-In-The-Loop) Panel - right column
// Shows ClientInfo + ConversationSummary

import { useGetConversationDetail } from '../api/useGetConversationDetail';
import { ClientInfo } from './ClientInfo';
import { ConversationSummary } from './ConversationSummary';

interface HITLPanelProps {
  conversationId: string;
}

export const HITLPanel = ({ conversationId }: HITLPanelProps) => {
  const { data: conversationDetail, isLoading } = useGetConversationDetail(conversationId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-border-primary border-t-accent-blue rounded-full animate-spin" />
          <p className="text-sm text-text-secondary">Cargando información...</p>
        </div>
      </div>
    );
  }

  if (!conversationDetail?.client) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <p className="text-sm text-text-secondary">No se pudo cargar la información del cliente</p>
      </div>
    );
  }

  // For now, summaries will be empty - can be added later if backend provides them
  const summaries: any[] = [];

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 bg-bg-primary">
      <ClientInfo client={conversationDetail.client} />
      <ConversationSummary summaries={summaries} />
    </div>
  );
};
