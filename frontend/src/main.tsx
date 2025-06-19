import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';

// Declaramos el tipo para ImportMeta.env
declare global {
  interface ImportMeta {
    env: Record<string, string>;
  }
}

// StrictMode removido para evitar duplicación de efectos en desarrollo
// que causaba duplicación de stock en las operaciones de entrada/salida
ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />
);
