import { MainLayout } from '@/layouts/MainLayout';
import { ShieldX, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Página 403 - Acceso Denegado
 * Mostrada cuando un usuario intenta acceder a una ruta sin los permisos necesarios.
 */
export const ForbiddenPage = () => {
  const navigate = useNavigate();

  return (
    <MainLayout>
      <div className="min-h-[calc(100vh-6rem)] flex items-center justify-center">
        <div className="max-w-md text-center">
          {/* Icon */}
          <div className="w-24 h-24 bg-accent-red/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldX size={48} className="text-accent-red" />
          </div>

          {/* Content */}
          <h1 className="text-4xl font-bold text-text-primary mb-2">403</h1>
          <h2 className="text-2xl font-semibold text-text-primary mb-4">
            Acceso Denegado
          </h2>
          <p className="text-text-secondary mb-8 leading-relaxed">
            No tienes permisos suficientes para acceder a esta sección.
            Esta área está restringida a administradores.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-accent-blue text-white rounded-lg font-medium hover:bg-accent-blue/90 transition-colors"
            >
              <Home size={20} />
              <span>Volver al Dashboard</span>
            </button>
          </div>

          {/* Help Text */}
          <p className="text-xs text-text-tertiary mt-8">
            Si crees que esto es un error, contacta al administrador del sistema.
          </p>
        </div>
      </div>
    </MainLayout>
  );
};
