import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, CalendarDays, MessageSquare, TrendingUp, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { MainLayout } from '@/layouts/MainLayout';
import { StatCard } from '@/shared/ui/StatCard';
import { DateRangePicker } from '@/shared/ui/DateRangePicker';
import type { DateRange } from '@/shared/ui/DateRangePicker';
import { useGetMe } from '@/features/auth/api/useGetMe';
import { useGetDashboard } from '@/features/dashboard/api/useGetDashboard';

export const DashboardPage = () => {
  const { data: me } = useGetMe();
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const from = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined;
  const to = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined;

  const { data: stats, isLoading } = useGetDashboard(from, to);

  useEffect(() => {
    const pendingToken = sessionStorage.getItem('pending_invitation_token');
    if (pendingToken) {
      sessionStorage.removeItem('pending_invitation_token');
      navigate(`/invitations/accept/${pendingToken}`, { replace: true });
    }
  }, [navigate]);

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-text-primary mb-1">Dashboard</h1>
            <p className="text-sm md:text-base text-text-secondary">
              Bienvenido de nuevo, {me?.user.name}
            </p>
          </div>
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            placeholder="Últimos 30 días"
          />
        </div>

        {/* Período activo */}
        {stats && (
          <p className="text-xs text-text-tertiary mb-4">
            Período: {stats.from} → {stats.to}
          </p>
        )}

        {/* Stats grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="bg-bg-secondary border border-border-primary rounded-lg p-4 md:p-6 animate-pulse h-28 md:h-32"
              />
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            <StatCard
              label="Clientes totales"
              value={stats.totalClients}
              icon={<Users size={18} />}
            />
            <StatCard
              label="Suma de días activos"
              value={stats.totalActiveDays}
              icon={<CalendarDays size={18} />}
            />
            <StatCard
              label="Mensajes totales"
              value={stats.totalMessages}
              icon={<MessageSquare size={18} />}
            />
            <StatCard
              label="Días prom. por cliente"
              value={stats.avgDaysPerClient.toFixed(2)}
              subtext="promedio de días"
              icon={<TrendingUp size={18} />}
            />
            <StatCard
              label="Msgs prom. por día activo"
              value={stats.avgMessagesPerActiveDay.toFixed(2)}
              subtext="promedio de mensajes"
              icon={<Activity size={18} />}
            />
          </div>
        ) : null}
      </div>
    </MainLayout>
  );
};
