import type { ReactNode } from 'react';
import { useTheme } from '@/shared/hooks/useTheme';

interface AuthLayoutProps {
  children: ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  // Initialize theme to ensure dark mode class is applied
  useTheme();

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-text-primary">
            fcoder
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            AI-powered coding assistant
          </p>
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  );
};
