import axios, { type AxiosInstance, type AxiosError, type AxiosResponse } from 'axios';

let apiInstance: AxiosInstance;

function createApiInstance(): AxiosInstance {
  if (apiInstance) {
    return apiInstance;
  }

  const instance = axios.create({
    baseURL: '/api',
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
      if (error.response && error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Usamos replace para no añadir al historial de navegación
        window.location.replace('/login?session_expired=true');
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
