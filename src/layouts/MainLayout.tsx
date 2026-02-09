import type { ReactNode } from 'react';
import { Header } from '@/layouts/components/Header';
import { Sidebar } from '@/layouts/components/Sidebar';
import { useSidebarStore } from '@/stores/useSidebarStore';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const isCollapsed = useSidebarStore((state) => state.isCollapsed);

  return (
    <div className="min-h-screen bg-bg-primary">
      <Sidebar />
      {/* Mobile: no margin, Desktop: ml-60 or ml-16 based on collapse */}
      <div className={`transition-all duration-300 ${isCollapsed ? 'md:ml-16' : 'md:ml-60'}`}>
        <Header />
        <main className="pt-16 min-h-screen">
          <div className="p-4 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
