import { Select } from '@/shared/ui/Select';
import { useGetPhones } from '@/features/phones/api/useGetPhones';
import type { Phone } from '@/features/phones/types';

interface PhoneInstanceSelectProps {
  value: Phone | null;
  onChange: (phone: Phone | null) => void;
}

export const PhoneInstanceSelect = ({ value, onChange }: PhoneInstanceSelectProps) => {
  const { data: phones, isLoading } = useGetPhones();

  const options = [
    { value: '', label: 'Seleccionar instancia...' },
    ...(phones ?? []).map((p) => ({
      value: p.id,
      label: p.instanceName,
    })),
  ];

  const handleChange = (id: string) => {
    if (!id) return onChange(null);
    const found = (phones ?? []).find((p) => p.id === id) ?? null;
    onChange(found);
  };

  return (
    <Select
      value={value?.id ?? ''}
      options={options}
      onChange={handleChange}
      placeholder="Seleccionar instancia..."
      disabled={isLoading}
      className="w-full"
    />
  );
};
