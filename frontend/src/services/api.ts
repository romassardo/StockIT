import axios, { type AxiosInstance, type AxiosError, type AxiosResponse } from 'axios';

let apiInstance: AxiosInstance;

function createApiInstance(): AxiosInstance {
  if (apiInstance) {
    return apiInstance;
  }

  const instance = axios.create({
    baseURL: 'http://localhost:3002/api',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error: AxiosError) => {
      return Promise.reject(error);
    }
  );

  instance.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
      // Solo redirigir por 401 si NO es una petición de login
      if (error.response && error.response.status === 401) {
        // Verificar si la petición es al endpoint de login
        const isLoginRequest = error.config?.url?.includes('/auth/login');
        
        if (!isLoginRequest) {
          // Solo limpiar y redirigir si NO es un intento de login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          // Usamos replace para no añadir al historial de navegación
          window.location.replace('/login?session_expired=true');
        }
      }
      return Promise.reject(error);
    }
  );

  apiInstance = instance;
  return apiInstance;
}

// Exportamos la función que devuelve la instancia única
export const getApiInstance = (): AxiosInstance => {
  return createApiInstance();
};

// Exportamos una instancia por defecto para uso general
const api = getApiInstance();
export default api;
