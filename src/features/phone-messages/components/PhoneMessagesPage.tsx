import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { MainLayout } from '@/layouts/MainLayout';
import { PhoneInstanceSelect } from './PhoneInstanceSelect';
import { ContactMultiSelect } from './ContactMultiSelect';
import type { Phone } from '@/features/phones/types';
import type { Contact } from '@/features/phone-messages/types';

export const PhoneMessagesPage = () => {
  const [selectedPhone, setSelectedPhone] = useState<Phone | null>(null);
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);

  const handlePhoneChange = (phone: Phone | null) => {
    setSelectedPhone(phone);
    setSelectedContacts([]);
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-accent-blue/10 flex items-center justify-center">
            <MessageSquare size={24} className="text-accent-blue" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-text-primary">
              Mensajes por Número
            </h1>
            <p className="text-sm md:text-base text-text-secondary mt-1">
              Selecciona una instancia y los números que quieres consultar
            </p>
          </div>
        </div>

        {/* Selects en cascada */}
        <div className="flex flex-col sm:flex-row gap-3 max-w-2xl">
          <div className="flex-1">
            <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wide">
              Instancia
            </label>
            <PhoneInstanceSelect
              value={selectedPhone}
              onChange={handlePhoneChange}
            />
          </div>

          <div className="flex-1">
            <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wide">
              Números
            </label>
            <ContactMultiSelect
              phoneId={selectedPhone?.id ?? ''}
              value={selectedContacts}
              onChange={setSelectedContacts}
              disabled={!selectedPhone}
            />
          </div>
        </div>

        {/* Paneles — Task 2 */}
        {selectedContacts.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {selectedContacts.map((contact) => (
              <div
                key={contact.id}
                className="bg-bg-secondary border border-border-primary rounded-lg p-4 min-h-50 flex items-center justify-center"
              >
                <p className="text-text-secondary text-sm">{contact.name}</p>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {selectedContacts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-bg-secondary border border-border-primary flex items-center justify-center mb-4">
              <MessageSquare size={28} className="text-text-secondary" />
            </div>
            <p className="text-text-secondary text-sm">
              {!selectedPhone
                ? 'Selecciona una instancia para comenzar'
                : 'Selecciona uno o más números para ver sus mensajes'}
            </p>
          </div>
        )}

      </div>
    </MainLayout>
  );
};
