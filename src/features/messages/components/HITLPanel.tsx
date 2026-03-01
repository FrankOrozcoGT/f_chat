// HITL (Human-In-The-Loop) Panel - right column
// Shows ClientInfo + ProductsPromotions + ConversationSummary (with analyzed conversations)

import { useGetConversationDetail } from '../api/useGetConversationDetail';
import { ClientInfo } from './ClientInfo';
import { ProductsPromotions } from './ProductsPromotions';
import { ConversationSummary } from './ConversationSummary';

interface HITLPanelProps {
  conversationId: string;
  onSelectHistoricalConversation?: (conversationId: string) => void;
}

export const HITLPanel = ({ conversationId, onSelectHistoricalConversation }: HITLPanelProps) => {
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

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-3 md:space-y-4 bg-bg-primary">
      <ClientInfo client={conversationDetail.client} />
      <ProductsPromotions
        products={conversationDetail.products}
        promotions={conversationDetail.promotions}
        clientDiscounts={conversationDetail.clientDiscounts}
        clientPromotionDiscounts={conversationDetail.clientPromotionDiscounts}
      />
      <ConversationSummary
        analyzedConversations={conversationDetail.analyzedConversations}
        onSelectConversation={onSelectHistoricalConversation}
      />
    </div>
  );
};
