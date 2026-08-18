import { useState } from 'react';
import { Tag, Clock, Settings, MessageSquare, SlidersHorizontal } from 'lucide-react';
import { MainLayout } from '@/layouts/MainLayout';
import { useToast } from '@/shared/hooks/useToast';
import { Toast } from '@/shared/ui/Toast';
import { useGetSettings } from '../api/useGetSettings';
import { useGetMe } from '@/features/auth/api/useGetMe';
import { AnalysisSettingsTab } from './AnalysisSettingsTab';
import { ScheduleSettingsTab } from './ScheduleSettingsTab';
import { LabelsSettingsTab } from './LabelsSettingsTab';
import { MessagesSettingsTab } from './MessagesSettingsTab';

type TabId = 'analysis' | 'schedule' | 'labels' | 'messages';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  ownerOnly?: boolean;
}

const TABS: Tab[] = [
  { id: 'analysis', label: 'Análisis', icon: <SlidersHorizontal size={16} /> },
  { id: 'schedule', label: 'Horarios', icon: <Clock size={16} />, ownerOnly: true },
  { id: 'labels', label: 'Etiquetas', icon: <Tag size={16} /> },
  { id: 'messages', label: 'Mensajes', icon: <MessageSquare size={16} /> },
];

export const SettingsPage = () => {
  const { isLoading } = useGetSettings();
  const { data: me } = useGetMe();
  const { toasts, removeToast } = useToast();
  const isOwner = me?.tenantRole === 'owner';

  const [activeTab, setActiveTab] = useState<TabId>('analysis');

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-75">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-border-primary border-t-accent-blue rounded-full animate-spin" />
            <p className="text-sm text-text-secondary">Cargando configuración...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const visibleTabs = TABS.filter((t) => !t.ownerOnly || isOwner);

  return (
    <>
      <MainLayout>
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-6 md:mb-8 flex items-center gap-3">
            <Settings size={22} className="text-text-secondary" />
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-text-primary leading-tight">
                Configuración
              </h1>
              <p className="text-sm text-text-secondary">Ajustes generales del sistema</p>
            </div>
          </div>

          {/* Layout: sidebar nav + content */}
          <div className="flex gap-6 md:gap-8">
            {/* Vertical tab nav */}
            <nav className="hidden md:flex flex-col gap-1 w-44 shrink-0">
              {visibleTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors text-left w-full ${
                    activeTab === tab.id
                      ? 'bg-bg-secondary text-text-primary'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary/60'
                  }`}
                >
                  <span className={activeTab === tab.id ? 'text-accent-blue' : 'text-text-tertiary'}>
                    {tab.icon}
                  </span>
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* Mobile: horizontal tabs */}
            <div className="md:hidden flex gap-1 mb-4 w-full border-b border-border-primary pb-1">
              {visibleTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-t-md ${
                    activeTab === tab.id
                      ? 'text-text-primary border-b-2 border-accent-blue'
                      : 'text-text-secondary'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 min-w-0">
              {activeTab === 'analysis' && <AnalysisSettingsTab />}
              {activeTab === 'schedule' && isOwner && <ScheduleSettingsTab />}
              {activeTab === 'labels' && <LabelsSettingsTab />}
              {activeTab === 'messages' && <MessagesSettingsTab />}
            </div>
          </div>
        </div>
      </MainLayout>

      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </>
  );
};
