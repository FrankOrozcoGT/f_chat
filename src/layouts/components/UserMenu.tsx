import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Building2, Settings } from 'lucide-react';
import { useGetMe, useLogout } from '@/features/auth/api';

const roleLabel: Record<string, string> = {
  owner: 'Owner',
  user: 'Usuario',
  tecnico: 'Técnico',
};

export const UserMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const { data: me, isLoading, isError } = useGetMe();
  const { mutate: logout } = useLogout();

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

  const getPlanBadgeColor = (plan: string) => {
    if (plan === 'full') return 'bg-accent-green/10 text-accent-green';
    return 'bg-bg-tertiary text-text-secondary';
  };

  if (isLoading) {
    return <div className="w-10 h-10 rounded-full bg-bg-secondary animate-pulse" />;
  }

  if (!me || isError) return null;

  const { user, tenant, tenantRole, availableTenants } = me;

  return (
    <>
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
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${getPlanBadgeColor(tenant.plan)}`}>
                      {tenant.plan === 'full' ? 'Plan Full' : 'Plan Free'}
                    </span>
                    <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-bg-tertiary text-text-secondary">
                      {roleLabel[tenantRole] ?? tenantRole}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <Building2 size={12} className="text-text-tertiary shrink-0" />
                <p className="text-xs text-text-tertiary truncate">{tenant.name}</p>
              </div>
            </div>

            {/* Organizaciones */}
            <div className="border-b border-border-primary">
              <p className="px-4 pt-2 pb-1 text-xs font-medium text-text-tertiary uppercase tracking-wide">
                Organizaciones
              </p>

              {/* Gestionar organizaciones */}
              <button
                onClick={() => { setIsOpen(false); navigate('/organizations'); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 min-h-11 text-sm text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors"
              >
                <Settings size={14} className="shrink-0" />
                <span>Gestionar organizaciones</span>
              </button>
            </div>

            {/* Logout */}
            <div className="py-1">
              <button
                onClick={() => logout()}
                className="w-full flex items-center gap-3 px-4 py-2.5 min-h-11 text-sm text-accent-red hover:bg-accent-red/10 transition-colors"
              >
                <LogOut size={18} />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        )}
      </div>

    </>
  );
};
