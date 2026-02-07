import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Permite enviar/recibir cookies HttpOnly
});

// Request interceptor ya no necesita agregar token manualmente
// Las cookies HttpOnly se envían automáticamente por el navegador
apiClient.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// Response interceptor for handling errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Cookie inválida o expirada, redirigir a login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Types exportados para reutilizar
export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  role: 'free' | 'full' | 'admin';
  plan?: 'free' | 'full';
}

// Ya no necesitamos googleLogin aquí, el backend maneja el OAuth directamente
