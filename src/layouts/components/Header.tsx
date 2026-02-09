import { Menu } from 'lucide-react';
import { UserMenu } from '@/layouts/components/UserMenu';
import { ThemeToggle } from '@/layouts/components/ThemeToggle';
import { useSidebarStore } from '@/stores/useSidebarStore';

export const Header = () => {
  const toggleMobile = useSidebarStore((state) => state.toggleMobile);
  const isCollapsed = useSidebarStore((state) => state.isCollapsed);

  return (
    <header className={`fixed top-0 left-0 right-0 h-16 bg-bg-primary border-b border-border-primary z-30 transition-all duration-300 ${isCollapsed ? 'md:left-16' : 'md:left-60'}`}>
      <div className="h-full px-4 md:px-6 flex items-center justify-between">
        {/* Left Section: Hamburger (mobile) + Logo/Title */}
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <button
            onClick={toggleMobile}
            className="p-2 rounded-md hover:bg-bg-secondary transition-colors md:hidden"
            title="Menú"
          >
            <Menu size={20} className="text-text-primary" />
          </button>

          <h2 className="text-xl font-semibold text-text-primary">
            fcoder
          </h2>
        </div>

        {/* Right Section: Theme Toggle + User Menu */}
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
};
