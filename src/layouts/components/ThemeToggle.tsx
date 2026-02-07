import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/shared/hooks/useTheme';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-bg-secondary transition-colors"
      title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      {theme === 'dark' ? (
        <Sun size={20} className="text-text-secondary hover:text-accent-orange transition-colors" />
      ) : (
        <Moon size={20} className="text-text-secondary hover:text-accent-blue transition-colors" />
      )}
    </button>
  );
};
