import { UserMenu } from './UserMenu';
import { ThemeToggle } from './ThemeToggle';

export const Header = () => {
  return (
    <header className="fixed top-0 left-60 right-0 h-16 bg-bg-primary border-b border-border-primary z-30 transition-all duration-300">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Logo/Title */}
        <div className="flex items-center gap-3">
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
