// HITL (Human-In-The-Loop) Panel - right column
// Shows ClientInfo + ProductsPromotions + Analyze button + ConversationSummary

import { useQueryClient } from '@tanstack/react-query';
import { Search, Loader2 } from 'lucide-react';
import { useGetConversationDetail } from '../api/useGetConversationDetail';
import { useAnalyzeConversation } from '../api/useAnalyzeConversation';
import { messageKeys } from '../api/messageKeys';
import { useToast } from '@/shared/hooks/useToast';
import { ClientInfo } from './ClientInfo';
import { ProductsPromotions } from './ProductsPromotions';
import { ConversationSummary } from './ConversationSummary';

interface HITLPanelProps {
  conversationId: string;
  onSelectHistoricalConversation?: (conversationId: string) => void;
}

export const HITLPanel = ({ conversationId, onSelectHistoricalConversation }: HITLPanelProps) => {
  const queryClient = useQueryClient();
  const { data: conversationDetail, isLoading } = useGetConversationDetail(conversationId);
  const { showToast } = useToast();
  const { mutate: analyze, isPending: isAnalyzing } = useAnalyzeConversation();

  const handleAnalyze = () => {
    analyze(conversationId, {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: messageKeys.detail(conversationId) });
        showToast(`Análisis completado — ${data.creditsUsed.toFixed(2)} créditos usados`, 'success');
      },
      onError: (error: any) => {
        const msg = error?.response?.data?.message || 'Error al analizar la conversación';
        showToast(msg, 'error');
      },
    });
  };

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

  const hasAnalyzed = conversationDetail.analyzedConversations.length > 0;

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-3 md:space-y-4 bg-bg-primary">
      <ClientInfo client={conversationDetail.client} />
      <ProductsPromotions
        products={conversationDetail.products}
        promotions={conversationDetail.promotions}
        clientDiscounts={conversationDetail.clientDiscounts}
        clientPromotionDiscounts={conversationDetail.clientPromotionDiscounts}
      />
      <button
        onClick={handleAnalyze}
        disabled={isAnalyzing}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-accent-blue text-white text-sm font-medium hover:bg-accent-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Analizando...
          </>
        ) : (
          <>
            <Search className="w-4 h-4" />
            {hasAnalyzed ? 'Re-analizar' : 'Analizar Conversación'}
          </>
        )}
      </button>
      {hasAnalyzed && (
        <ConversationSummary
          analyzedConversations={conversationDetail.analyzedConversations}
          onSelectConversation={onSelectHistoricalConversation}
        />
      )}
    </div>
  );
};
