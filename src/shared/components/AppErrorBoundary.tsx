import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  error: Error | null;
}

/**
 * Último recurso ante un error de render no capturado por ningún try/catch:
 * sin esto, React desmonta el árbol entero y el usuario ve una pantalla en
 * blanco sin ninguna explicación.
 */
export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(_error: Error, _errorInfo: ErrorInfo) {
    // Sin backend de reporte de errores todavía — el mensaje visible al
    // usuario abajo es la única notificación disponible por ahora.
  }

  handleReload = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary p-4">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent-red/10 flex items-center justify-center">
            <AlertTriangle size={32} className="text-accent-red" />
          </div>
          <h1 className="text-xl font-semibold text-text-primary mb-2">
            Algo salió mal
          </h1>
          <p className="text-sm text-text-secondary mb-6">
            Ocurrió un error inesperado. Intenta recargar la página.
          </p>
          <button
            onClick={this.handleReload}
            className="px-4 py-2 bg-accent-blue text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Recargar página
          </button>
        </div>
      </div>
    );
  }
}
