import { MessageSquare, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardSubtitle, CardBody } from '@/shared/ui/Card';
import { MessageBubble } from '@/features/messages/components/MessageBubble';
import { useGetPhoneMessages } from '../api/useGetPhoneMessages';
import type { Contact } from '../types';

interface PhoneMessagePanelProps {
  contact: Contact;
  phoneId: string;
}

export const PhoneMessagePanel = ({ contact, phoneId }: PhoneMessagePanelProps) => {
  const { data: messages, isLoading, isError } = useGetPhoneMessages(phoneId, contact.id);

  return (
    <Card className="flex flex-col min-h-80 max-h-125">
      <CardHeader>
        <CardTitle>{contact.name}</CardTitle>
        <CardSubtitle>{contact.phoneNumber}</CardSubtitle>
      </CardHeader>

      <CardBody className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="flex items-center justify-center h-full py-8">
            <Loader2 size={20} className="animate-spin text-text-secondary" />
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center h-full py-8 text-center gap-2">
            <p className="text-sm text-accent-red">Error al cargar los mensajes</p>
            <p className="text-xs text-text-secondary">Intenta recargar la página</p>
          </div>
        )}

        {!isLoading && !isError && messages && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-8 text-center gap-2">
            <MessageSquare size={24} className="text-text-secondary" />
            <p className="text-sm text-text-secondary">Sin mensajes</p>
          </div>
        )}

        {!isLoading && !isError && messages && messages.length > 0 && (
          <div className="flex flex-col gap-3 py-2">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                clientName={contact.name}
              />
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
};
