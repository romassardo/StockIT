/**
 * ⚙️ Configuración de la Aplicación - StockIT
 * 
 * Centraliza la información de la aplicación que aparece en el footer
 * de la sidebar y otros lugares de la UI.
 */

export const APP_CONFIG = {
  // 📱 Información de la aplicación
  name: 'StockIT',
  version: '1.0.80',
  
  // 👨‍💻 Información del desarrollador
  developer: {
    name: 'Rodfloyd75', // ← Cambia aquí tu nombre
    message: 'Hecho con Vibe Coding 😎'
  },
  
  // 🎨 Configuración del footer
  footer: {
    showVersion: true,
    showDeveloper: true,
    showMessage: true
  }
} as const;

// 🔗 Helpers para usar en componentes
export const getAppVersion = () => `${APP_CONFIG.name} v${APP_CONFIG.version}`;
export const getDeveloperInfo = () => APP_CONFIG.developer;
export const getFooterConfig = () => APP_CONFIG.footer; 