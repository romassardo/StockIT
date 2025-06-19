# Sistema de Inventario IT - Backend

## Descripción
Backend para el sistema de gestión de inventario y control de stock del sector de Soporte IT. Este sistema permite gestionar productos, con enfoque especial en el seguimiento detallado de notebooks y celulares que requieren asignación, reparación y eventual baja.

## Características principales
- Control de inventario de equipos y consumibles IT
- Seguimiento detallado de notebooks y celulares (historial completo)
- Gestión de asignaciones a empleados/sectores/sucursales
- Control de reparaciones
- Alertas de stock mínimo
- Reportes y estadísticas

## Tecnologías
- Node.js con TypeScript
- Express como framework web
- SQL Server como base de datos
- JWT para autenticación
- Stored Procedures para operaciones críticas

## Requisitos previos
- Node.js 18.x o superior
- SQL Server 2019 o superior
- Git

## Instalación

1. Clonar el repositorio:
```
git clone <repositorio>
```

2. Instalar dependencias:
```
cd backend
npm install
```

3. Configurar variables de entorno:
```
# Crear archivo .env basado en .env.example
copy .env.example .env
```

4. Configurar los valores de conexión a la base de datos en el archivo `.env`

## Ejecución

### Desarrollo
```
npm run dev
```

### Producción
```
npm run build
npm start
```

## Estructura del proyecto
```
backend/
├── src/                  # Código fuente
│   ├── controllers/      # Controladores
│   ├── services/         # Servicios de negocio
│   ├── utils/            # Utilidades
│   ├── middleware/       # Middleware (autenticación, etc.)
│   ├── types/            # Definiciones de tipos
│   ├── database/         # Conexión y migraciones
│   │   └── migrations/   # Scripts SQL de migraciones
│   └── index.ts          # Punto de entrada
├── .env.example          # Plantilla de variables de entorno
├── package.json          # Dependencias y scripts
├── tsconfig.json         # Configuración TypeScript
├── .eslintrc.json        # Configuración ESLint
└── .gitignore            # Archivos ignorados por Git
```

## Características clave del sistema
- **Diferenciación crítica**: El sistema distingue entre "Inventario Individual" (notebooks/celulares con número de serie) y "Stock General" (resto de productos por cantidad).
- **Seguimiento histórico**: Solo notebooks y celulares tienen seguimiento histórico completo.
- **Reparaciones**: Solo notebooks y celulares se envían a reparación.
