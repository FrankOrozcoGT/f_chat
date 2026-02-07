import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User as UserIcon, CreditCard } from 'lucide-react';
import { useGetMe, useLogout } from '@/features/auth/api';

export const UserMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { data: user, isLoading, isError } = useGetMe();
  const { mutate: logout } = useLogout();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getPlanBadgeColor = (plan?: string) => {
    if (plan === 'full') return 'bg-accent-green/10 text-accent-green';
    return 'bg-bg-tertiary text-text-secondary';
  };

  const handleLogout = () => {
    logout(); // useLogout ya maneja el redirect a /login
  };

  // Show loading skeleton while fetching user
  if (isLoading) {
    return (
      <div className="w-10 h-10 rounded-full bg-bg-secondary animate-pulse" />
    );
  }

  // Don't show anything if no user or error
  if (!user || isError) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-bg-secondary transition-colors"
      >
        {user.picture ? (
          <img
            src={user.picture}
            alt={user.name}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-accent-blue text-white flex items-center justify-center font-medium text-sm">
            {getInitials(user.name)}
          </div>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-bg-primary border border-border-primary rounded-lg shadow-lg overflow-hidden z-50">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-border-primary">
            <div className="flex items-center gap-3">
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-accent-blue text-white flex items-center justify-center font-medium">
                  {getInitials(user.name)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate">
                  {user.name}
                </p>
                <p className="text-xs text-text-secondary truncate">
                  {user.email}
                </p>
                {user.plan && (
                  <span
                    className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${getPlanBadgeColor(
                      user.plan
                    )}`}
                  >
                    {user.plan === 'full' ? 'Plan Full' : 'Plan Free'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/profile');
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary hover:bg-bg-secondary transition-colors"
            >
              <UserIcon size={18} />
              <span>Mi Perfil</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/subscription');
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary hover:bg-bg-secondary transition-colors"
            >
              <CreditCard size={18} />
              <span>Suscripción</span>
            </button>

            <div className="h-px bg-border-primary my-1" />

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-accent-red hover:bg-accent-red/10 transition-colors"
            >
              <LogOut size={18} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
