import { MainLayout } from '@/layouts/MainLayout';
import { Clock, Sparkles } from 'lucide-react';

/**
 * Página mostrada a usuarios con rol "free" cuando intentan acceder a funcionalidades premium.
 */
export const ComingSoonPage = () => {
  return (
    <MainLayout>
      <div className="min-h-[calc(100vh-6rem)] flex items-center justify-center">
        <div className="max-w-md text-center">
          {/* Icon */}
          <div className="relative inline-flex mb-6">
            <div className="w-24 h-24 bg-accent-blue/10 rounded-full flex items-center justify-center">
              <Clock size={48} className="text-accent-blue" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-accent-orange rounded-full flex items-center justify-center animate-bounce">
              <Sparkles size={16} className="text-white" />
            </div>
          </div>

          {/* Content */}
          <h1 className="text-3xl font-semibold text-text-primary mb-4">
            ¡Próximamente!
          </h1>
          <p className="text-text-secondary mb-6 leading-relaxed">
            Esta funcionalidad estará disponible muy pronto para usuarios con plan Free.
            Estamos trabajando en traerte la mejor experiencia posible.
          </p>

          {/* Info Card */}
          <div className="bg-bg-secondary border border-border-primary rounded-lg p-6 text-left">
            <h3 className="text-sm font-semibold text-text-primary mb-3">
              Mientras tanto, puedes:
            </h3>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li className="flex items-start gap-2">
                <span className="text-accent-blue mt-0.5">•</span>
                <span>Explorar tu dashboard actual</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-blue mt-0.5">•</span>
                <span>Actualizar tu perfil</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-blue mt-0.5">•</span>
                <span>Contactar soporte si tienes dudas</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};
