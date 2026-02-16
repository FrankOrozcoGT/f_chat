import type { ApiHealth } from '../types';
import { HealthCard } from './HealthCard';

interface HealthGridProps {
  healthData: ApiHealth[];
}

export const HealthGrid = ({ healthData }: HealthGridProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {healthData.map((health) => (
        <HealthCard key={health.apiName} health={health} />
      ))}
    </div>
  );
};
