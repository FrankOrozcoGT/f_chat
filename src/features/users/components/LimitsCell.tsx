import { useState } from 'react';
import { Edit2 } from 'lucide-react';
import { LimitsModal } from './LimitsModal';
import type { User } from '../types';

interface LimitsCellProps {
  user: User;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export const LimitsCell = ({ user, onSuccess, onError }: LimitsCellProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${Math.floor(num / 1000)}K`;
    }
    return num.toString();
  };

  return (
    <>
      <div className="flex items-center gap-3">
        <div className="text-sm">
          <span className="text-text-secondary">WA:</span>{' '}
          <span className="text-text-primary font-medium">{user.whatsappLimit}</span>
          <span className="text-text-secondary mx-2">|</span>
          <span className="text-text-secondary">Créd:</span>{' '}
          <span className="text-text-primary font-medium">
            {formatNumber(user.creditsLimit)}
          </span>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="p-1.5 hover:bg-bg-tertiary rounded-md transition-colors group"
          aria-label="Editar límites"
        >
          <Edit2
            size={14}
            className="text-text-tertiary group-hover:text-accent-blue transition-colors"
          />
        </button>
      </div>

      <LimitsModal
        user={user}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={onSuccess}
        onError={onError}
      />
    </>
  );
};
