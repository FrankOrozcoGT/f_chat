import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Package, Tag, Truck, ChevronLeft, ChevronRight, X, ArrowLeft } from 'lucide-react';

const menuItems = [
  {
    icon: Package,
    label: 'Productos',
    path: '/crm/catalog/products',
  },
  {
    icon: Tag,
    label: 'Promociones',
    path: '/crm/catalog/promotions',
  },
  {
    icon: Truck,
    label: 'Envíos',
    path: '/crm/catalog/shipping',
  },
];

interface CrmSidebarProps {
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
}

export const CrmSidebar = ({ isCollapsed, onToggleCollapsed }: CrmSidebarProps) => {
  const [isMobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-screen bg-bg-secondary border-r border-border-primary transition-all duration-300 z-40
          ${isCollapsed ? 'w-16' : 'w-60'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border-primary">
          {!isCollapsed && (
            <h1 className="text-lg font-semibold text-text-primary">CRM</h1>
          )}

          {/* Mobile close */}
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-md hover:bg-bg-tertiary transition-colors md:hidden"
            title="Cerrar"
          >
            <X size={20} className="text-text-secondary" />
          </button>

          {/* Desktop collapse */}
          <button
            onClick={onToggleCollapsed}
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

        {/* Back to chat */}
        <div className="p-4 border-b border-border-primary">
          <button
            onClick={() => navigate('/conversations')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-all w-full text-text-secondary hover:bg-bg-tertiary hover:text-accent-blue ${isCollapsed ? 'justify-center' : ''}`}
            title={isCollapsed ? 'Volver al Chat' : ''}
          >
            <ArrowLeft size={20} className="shrink-0" />
            {!isCollapsed && <span className="text-sm font-medium">Volver al Chat</span>}
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
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
      </aside>
    </>
  );
};
