import { useEffect, useState } from 'react';
import { useSearchContacts } from '@/features/flows/api/useSearchContacts';
import type { Contact, ContactConversation } from '@/features/flows/types';

/**
 * Búsqueda de contactos con debounce y expansión de resultados, usada en la
 * fase inicial de TestPanel para elegir la conversación a testear.
 */
export function useContactSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [expandedContactId, setExpandedContactId] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<ContactConversation | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: contacts, isLoading: isSearching } = useSearchContacts(debouncedQuery);

  const selectConversation = (contact: Contact, conversation: ContactConversation) => {
    setSelectedContact(contact);
    setSelectedConversation(conversation);
  };

  const reset = () => {
    setSelectedContact(null);
    setSelectedConversation(null);
  };

  return {
    searchQuery,
    setSearchQuery,
    debouncedQuery,
    expandedContactId,
    setExpandedContactId,
    contacts,
    isSearching,
    selectedContact,
    selectedConversation,
    selectConversation,
    reset,
  };
}
