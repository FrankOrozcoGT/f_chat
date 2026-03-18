import { useState, type ReactNode } from 'react';
import { Header } from '@/layouts/components/Header';
import { CrmSidebar } from '@/layouts/components/CrmSidebar';

interface CrmLayoutProps {
  children: ReactNode;
}

export const CrmLayout = ({ children }: CrmLayoutProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-bg-primary">
      <CrmSidebar isCollapsed={isCollapsed} onToggleCollapsed={() => setIsCollapsed((v) => !v)} />
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
