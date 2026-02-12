import { useState } from 'react';
import { DollarSign, TrendingUp, Mic, MessageSquare, Volume2, Loader2, AlertCircle } from 'lucide-react';
import { MainLayout } from '@/layouts/MainLayout';
import { Card, CardBody } from '@/shared/ui/Card';
import { Select, type SelectOption } from '@/shared/ui/Select';
import { useGetCosts } from '../api/useGetCosts';
import type { Period } from '../types';

export const CostsPage = () => {
  const [period, setPeriod] = useState<Period>('month');
  const { data: costs, isLoading, isError, error } = useGetCosts(period);

  const periodOptions: SelectOption<Period>[] = [
    { value: 'day', label: 'Día' },
    { value: 'week', label: 'Semana' },
    { value: 'month', label: 'Mes' },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={32} className="text-accent-blue animate-spin" />
            <p className="text-text-secondary">Cargando costos...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (isError) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-3 text-center">
            <AlertCircle size={48} className="text-accent-red" />
            <h2 className="text-xl font-semibold text-text-primary">Error al cargar costos</h2>
            <p className="text-text-secondary max-w-md">
              {error instanceof Error ? error.message : 'No se pudieron cargar los costos. Por favor, intenta de nuevo.'}
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <DollarSign size={28} className="text-accent-blue" />
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-text-primary">Costos y Analytics</h1>
              <p className="text-sm md:text-base text-text-secondary mt-1">
                Monitoreo de gastos en servicios de IA
              </p>
            </div>
          </div>

          {/* Period filter */}
          <Select
            value={period}
            options={periodOptions}
            onChange={setPeriod}
            variant="default"
            size="md"
          />
        </div>

        {/* Stats Grid - 2 cols mobile, 4 cols desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {/* Total STT */}
          <Card variant="default">
            <CardBody className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Mic size={20} className="text-accent-blue" />
                <p className="text-xs md:text-sm text-text-secondary">Total STT</p>
              </div>
              <p className="text-xl md:text-2xl font-bold text-text-primary">
                {formatCurrency(costs?.totalSTT || 0)}
              </p>
            </CardBody>
          </Card>

          {/* Total LLM */}
          <Card variant="default">
            <CardBody className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <MessageSquare size={20} className="text-accent-green" />
                <p className="text-xs md:text-sm text-text-secondary">Total LLM</p>
              </div>
              <p className="text-xl md:text-2xl font-bold text-text-primary">
                {formatCurrency(costs?.totalLLM || 0)}
              </p>
            </CardBody>
          </Card>

          {/* Total TTS */}
          <Card variant="default">
            <CardBody className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Volume2 size={20} className="text-accent-orange" />
                <p className="text-xs md:text-sm text-text-secondary">Total TTS</p>
              </div>
              <p className="text-xl md:text-2xl font-bold text-text-primary">
                {formatCurrency(costs?.totalTTS || 0)}
              </p>
            </CardBody>
          </Card>

          {/* Total General */}
          <Card variant="elevated" className="col-span-2 lg:col-span-1">
            <CardBody className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <TrendingUp size={20} className="text-accent-purple" />
                <p className="text-xs md:text-sm text-text-secondary font-medium">Total General</p>
              </div>
              <p className="text-xl md:text-2xl font-bold text-accent-purple">
                {formatCurrency(costs?.total || 0)}
              </p>
            </CardBody>
          </Card>
        </div>

        {/* Costs by Client - Basic List */}
        {costs?.byClient && costs.byClient.length > 0 && (
          <Card>
            <CardBody>
              <h3 className="text-base md:text-lg font-semibold text-text-primary mb-4">
                Costos por Cliente
              </h3>
              <div className="space-y-2">
                {costs.byClient.map((client) => (
                  <div
                    key={client.clientPhone}
                    className="flex items-center justify-between p-3 bg-bg-primary rounded-md border border-border-primary"
                  >
                    <div>
                      <p className="text-sm font-medium text-text-primary">{client.clientPhone}</p>
                      <p className="text-xs text-text-secondary">{client.messageCount} mensajes</p>
                    </div>
                    <p className="text-sm font-semibold text-text-primary">
                      {formatCurrency(client.totalCost)}
                    </p>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        )}

        {/* Costs by Day - Basic List */}
        {costs?.byDay && costs.byDay.length > 0 && (
          <Card>
            <CardBody>
              <h3 className="text-base md:text-lg font-semibold text-text-primary mb-4">
                Costos por Día
              </h3>
              <div className="space-y-2">
                {costs.byDay.map((day) => (
                  <div
                    key={day.date}
                    className="flex items-center justify-between p-3 bg-bg-primary rounded-md border border-border-primary"
                  >
                    <p className="text-sm font-medium text-text-primary">
                      {new Date(day.date).toLocaleDateString('es-ES', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="text-sm font-semibold text-text-primary">
                      {formatCurrency(day.totalCost)}
                    </p>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};
