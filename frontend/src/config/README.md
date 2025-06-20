# 🎨 Configuración de la Aplicación StockIT

## 📝 Cómo personalizar el footer de la sidebar

### 1. Editar tu información personal

Abre el archivo `app.config.ts` y modifica los siguientes campos:

```typescript
export const APP_CONFIG = {
  // 📱 Información de la aplicación
  name: 'StockIT',
  version: '1.0.41', // ← Cambiar aquí cuando actualices la versión
  
  // 👨‍💻 Información del desarrollador
  developer: {
    name: 'Tu Nombre Real', // ← CAMBIAR AQUÍ TU NOMBRE
    message: 'Desarrollado con ❤️' // ← Personalizar mensaje si quieres
  },
  
  // 🎨 Configuración del footer
  footer: {
    showVersion: true,    // ← Mostrar/ocultar versión
    showDeveloper: true,  // ← Mostrar/ocultar tu nombre
    showMessage: true     // ← Mostrar/ocultar mensaje
  }
}
```

### 2. Opciones de personalización

#### 🏷️ Cambiar versión
- La versión **NO ES AUTOMÁTICA**, debes cambiarla manualmente
- Cada vez que hagas mejoras, actualiza el número de versión
- Formato recomendado: `X.Y.Z` (ejemplo: 1.0.42)

#### 👤 Personalizar información del desarrollador
- `name`: Tu nombre completo o como quieras que aparezca
- `message`: Mensaje personalizado (puedes usar emojis)

#### 🎛️ Controlar qué se muestra
- `showVersion`: true/false - Mostrar "StockIT v1.0.41"
- `showDeveloper`: true/false - Mostrar tu nombre
- `showMessage`: true/false - Mostrar el mensaje

### 3. Ejemplos de personalización

#### Mostrar solo versión
```typescript
footer: {
  showVersion: true,
  showDeveloper: false,
  showMessage: false
}
```

#### Solo tu nombre
```typescript
footer: {
  showVersion: false,
  showDeveloper: true,
  showMessage: false
}
```

#### Personalización completa
```typescript
developer: {
  name: 'Juan Pérez',
  message: '🚀 Hecho con pasión por la tecnología'
}
```

### 4. 🔄 Aplicar cambios

Después de modificar el archivo, guarda y recarga la aplicación. Los cambios se verán inmediatamente en el footer de la sidebar.

### 5. 📱 Responsive Design

El footer está optimizado para:
- ✅ Desktop: Se ve completo
- ✅ Tablet: Se mantiene legible
- ✅ Mobile: Se adapta al ancho disponible

---

**💡 Tip**: Mantén tu nombre actualizado y considera cambiar la versión cada vez que agregues nuevas funcionalidades al sistema. 