import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AuthLayout } from '../../../layouts/AuthLayout';
import { Toast } from '../../../shared/ui/Toast';
import type { ToastType } from '../../../shared/ui/Toast';

export const LoginPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(() => {
    // Initialize toast from URL params
    const error = searchParams.get('error');
    if (error === 'access_denied') {
      return {
        message: 'Necesitamos permisos para continuar',
        type: 'error' as ToastType,
      };
    } else if (error === 'network') {
      return {
        message: 'Error de conexión, verifica tu internet',
        type: 'error' as ToastType,
      };
    }
    return null;
  });

  useEffect(() => {
    // Clear error params after showing toast
    const error = searchParams.get('error');
    if (error) {
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const handleGoogleLogin = () => {
    const redirect = searchParams.get('redirect');
    console.log('[Login] redirect param:', redirect);
    if (redirect) {
      sessionStorage.setItem('auth_redirect', redirect);
      console.log('[Login] saved to sessionStorage:', redirect);
    }
    const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
    console.log('[Login] going to:', `${backendUrl}/auth/google-login`);
    window.location.href = `${backendUrl}/auth/google-login`;
  };

  return (
    <AuthLayout>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className="bg-bg-secondary border border-border-primary rounded-lg p-8 shadow-sm">
        <div className="space-y-6">
          {/* Title */}
          <div className="text-center">
            <h2 className="text-xl font-semibold text-text-primary">
              Sign in to fcoder
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              Use your Google account to continue
            </p>
          </div>

          {/* Google Sign In Button */}
          <button
            onClick={handleGoogleLogin}
            className="w-full h-10 flex items-center justify-center gap-3 px-4 bg-bg-primary border border-border-secondary rounded-md text-text-primary text-base font-medium hover:bg-bg-tertiary transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2"
          >
            {/* Google Icon */}
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.20443C17.64 8.56625 17.5827 7.95262 17.4764 7.36353H9V10.8449H13.8436C13.635 11.9699 13.0009 12.9231 12.0477 13.5613V15.8194H14.9564C16.6582 14.2526 17.64 11.9453 17.64 9.20443Z" fill="#4285F4"/>
              <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5613C11.2418 14.1013 10.2109 14.4204 9 14.4204C6.65591 14.4204 4.67182 12.8372 3.96409 10.71H0.957275V13.0418C2.43818 15.9831 5.48182 18 9 18Z" fill="#34A853"/>
              <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.82999 3.96409 7.28999V4.95818H0.957275C0.347727 6.17318 0 7.54772 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
              <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          {/* Footer note */}
          <p className="text-xs text-center text-text-tertiary leading-relaxed">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </AuthLayout>
  );
};
