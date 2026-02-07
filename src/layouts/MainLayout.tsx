import type { ReactNode } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="min-h-screen bg-bg-primary">
      <Sidebar />
      <div className="ml-60 transition-all duration-300">
        <Header />
        <main className="pt-16 min-h-screen">
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
