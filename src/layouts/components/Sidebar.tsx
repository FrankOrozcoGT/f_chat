import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Users, ChevronLeft, ChevronRight, LayoutDashboard } from 'lucide-react';
import { useGetMe } from '@/features/auth/api';

export const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { data: user } = useGetMe();

  const menuItems = [
    {
      icon: LayoutDashboard,
      label: 'Dashboard',
      path: '/dashboard',
      roles: ['free', 'full', 'admin'],
    },
    {
      icon: Users,
      label: 'Gestión de Usuarios',
      path: '/admin/users',
      roles: ['admin'],
    },
  ];

  // Filter menu items based on user role
  const visibleMenuItems = menuItems.filter((item) =>
    user?.role ? item.roles.includes(user.role) : false
  );

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-bg-secondary border-r border-border-primary transition-all duration-300 z-40 ${
        isCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Sidebar Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border-primary">
        {!isCollapsed && (
          <h1 className="text-lg font-semibold text-text-primary">
            Admin Panel
          </h1>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-md hover:bg-bg-tertiary transition-colors ml-auto"
          title={isCollapsed ? 'Expandir' : 'Colapsar'}
        >
          {isCollapsed ? (
            <ChevronRight size={20} className="text-text-secondary" />
          ) : (
            <ChevronLeft size={20} className="text-text-secondary" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {visibleMenuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md transition-all group ${
                  isActive
                    ? 'bg-accent-blue/10 text-accent-blue border-l-3 border-accent-blue'
                    : 'text-text-primary hover:bg-bg-tertiary hover:text-accent-blue'
                } ${isCollapsed ? 'justify-center' : ''}`
              }
              title={isCollapsed ? item.label : ''}
            >
              <Icon size={20} className="shrink-0" />
              {!isCollapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Badge (bottom) */}
      {user && !isCollapsed && (
        <div className="absolute bottom-4 left-4 right-4 p-3 bg-bg-tertiary rounded-lg border border-border-primary">
          <p className="text-xs text-text-secondary">Sesión actual</p>
          <p className="text-sm font-medium text-text-primary truncate">
            {user.name}
          </p>
          <p className="text-xs text-text-tertiary capitalize">
            {user.role}
          </p>
        </div>
      )}
    </aside>
  );
};
