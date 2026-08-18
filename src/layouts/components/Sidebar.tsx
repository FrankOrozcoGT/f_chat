import { NavLink } from 'react-router-dom';
import { Users, ChevronLeft, ChevronRight, LayoutDashboard, Smartphone, MessageSquare, Activity, DollarSign, Settings, X, Workflow, Building2, ShoppingBag, BrainCircuit } from 'lucide-react';
import { useGetMe } from '@/features/auth';
import { useSidebarStore } from '@/stores/useSidebarStore';
import type { AuthMe } from '@/features/auth';

const menuItems = [
  {
    icon: LayoutDashboard,
    label: 'Dashboard',
    path: '/dashboard',
    visibleFor: () => true,
  },
  {
    icon: Smartphone,
    label: 'Instancias WhatsApp',
    path: '/phones',
    visibleFor: (me: AuthMe) =>
      me.tenant.plan === 'full' && (me.tenantRole === 'owner' || me.tenantRole === 'tecnico'),
  },
  {
    icon: MessageSquare,
    label: 'Conversaciones',
    path: '/conversations',
    visibleFor: (me: AuthMe) =>
      me.tenant.plan === 'full' && (me.tenantRole === 'owner' || me.tenantRole === 'user'),
  },
  {
    icon: Workflow,
    label: 'Automatizacion',
    path: '/flows',
    visibleFor: (me: AuthMe) =>
      me.tenant.plan === 'full' && (me.tenantRole === 'owner' || me.tenantRole === 'tecnico'),
  },
  {
    icon: BrainCircuit,
    label: 'AI Setup',
    path: '/ai-setup',
    visibleFor: (me: AuthMe) =>
      me.tenant.plan === 'full' && (me.tenantRole === 'owner' || me.tenantRole === 'tecnico'),
  },
  {
    icon: ShoppingBag,
    label: 'CRM / Catálogo',
    path: '/crm/catalog/products',
    visibleFor: (me: AuthMe) =>
      me.tenant.plan === 'full' && (me.tenantRole === 'owner' || me.tenantRole === 'user'),
  },
  {
    icon: Building2,
    label: 'Mi Organización',
    path: '/tenant',
    visibleFor: (me: AuthMe) => me.tenantRole === 'owner',
  },
  {
    icon: DollarSign,
    label: 'Costos',
    path: '/admin/costs',
    visibleFor: (me: AuthMe) => me.systemRole === 'super_admin',
  },
  {
    icon: Activity,
    label: 'Health Status',
    path: '/admin/health',
    visibleFor: () => true,
  },
  {
    icon: Users,
    label: 'Gestión de Usuarios',
    path: '/admin/users',
    visibleFor: (me: AuthMe) => me.systemRole === 'super_admin',
  },
  {
    icon: Settings,
    label: 'Configuración',
    path: '/settings',
    visibleFor: () => true,
  },
];

const roleLabel: Record<string, string> = {
  owner: 'Owner',
  user: 'Usuario',
  tecnico: 'Técnico',
};

export const Sidebar = () => {
  const { isMobileOpen, setMobileOpen, isCollapsed, toggleCollapsed } = useSidebarStore();
  const { data: me } = useGetMe();

  const visibleMenuItems = me ? menuItems.filter((item) => item.visibleFor(me)) : [];

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-bg-secondary border-r border-border-primary transition-all duration-300 z-40
          ${isCollapsed ? 'w-16' : 'w-60'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
      {/* Sidebar Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border-primary">
        {!isCollapsed && (
          <h1 className="text-lg font-semibold text-text-primary">
            Admin Panel
          </h1>
        )}

        {/* Mobile close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="p-1.5 rounded-md hover:bg-bg-tertiary transition-colors md:hidden"
          title="Cerrar"
        >
          <X size={20} className="text-text-secondary" />
        </button>

        {/* Desktop collapse button */}
        <button
          onClick={toggleCollapsed}
          className="hidden md:block p-1.5 rounded-md hover:bg-bg-tertiary transition-colors ml-auto"
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
              onClick={() => setMobileOpen(false)}
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
      {me && !isCollapsed && (
        <div className="absolute bottom-4 left-4 right-4 p-3 bg-bg-tertiary rounded-lg border border-border-primary">
          <p className="text-xs text-text-secondary truncate">{me.tenant.name}</p>
          <p className="text-sm font-medium text-text-primary truncate">
            {me.user.name}
          </p>
          <p className="text-xs text-text-tertiary">
            {roleLabel[me.tenantRole] ?? me.tenantRole}
          </p>
        </div>
      )}
    </aside>
    </>
  );
};
