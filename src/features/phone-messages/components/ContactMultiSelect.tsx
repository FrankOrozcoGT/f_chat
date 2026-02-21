import { MultiSelect } from '@/shared/ui/MultiSelect';
import { useGetPhoneContacts } from '@/features/phone-messages/api/useGetPhoneContacts';
import type { Contact } from '@/features/phone-messages/types';

interface ContactMultiSelectProps {
  phoneId: string;
  value: Contact[];
  onChange: (contacts: Contact[]) => void;
  disabled?: boolean;
}

export const ContactMultiSelect = ({ phoneId, value, onChange, disabled }: ContactMultiSelectProps) => {
  const { data: contacts, isLoading, isError } = useGetPhoneContacts(phoneId);

  const options = (contacts ?? []).map((c) => ({
    value: c.id,
    label: c.name,
    sublabel: c.phoneNumber,
  }));

  const selectedIds = value.map((c) => c.id);

  const handleChange = (ids: string[]) => {
    const selected = (contacts ?? []).filter((c) => ids.includes(c.id));
    onChange(selected);
  };

  return (
    <MultiSelect
      options={options}
      value={selectedIds}
      onChange={handleChange}
      placeholder="Seleccionar números..."
      searchPlaceholder="Buscar por nombre o número..."
      isLoading={isLoading}
      isError={isError}
      errorMessage="Error al cargar contactos"
      emptyMessage="No hay contactos en esta instancia"
      disabled={disabled}
    />
  );
};
