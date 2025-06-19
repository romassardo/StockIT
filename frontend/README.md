# StockIT - Frontend

## Descripción
Frontend del sistema StockIT para gestión de inventario y activos IT. Desarrollado con React, TypeScript y Vite.

## Requisitos previos
- Node.js 18 o superior
- npm 9 o superior

## Instalación

1. Clona el repositorio:
```bash
git clone [url-del-repositorio]
cd StockIT/frontend
```

2. Instala las dependencias:
```bash
npm install
```

3. Crea un archivo `.env` basado en `.env.example`:
```bash
cp .env.example .env
```

4. Configura las variables de entorno según tu entorno de desarrollo.

## Comandos disponibles

### Desarrollo
Para iniciar el servidor de desarrollo:
```bash
npm run dev
```

### Compilación
Para compilar el proyecto para producción:
```bash
npm run build
```

### Vista previa
Para previsualizar la versión compilada:
```bash
npm run preview
```

### Verificación de tipos
Para verificar los tipos de TypeScript:
```bash
npm run type-check
```

### Linting
Para ejecutar el linter:
```bash
npm run lint
```

## Estructura del proyecto
```
frontend/
├── public/               # Archivos públicos estáticos
├── src/                  # Código fuente
│   ├── components/       # Componentes reutilizables
│   │   ├── common/       # Componentes genéricos (botones, inputs, etc.)
│   │   └── layout/       # Componentes de estructura (header, footer, etc.)
│   ├── contexts/         # Contextos de React (auth, theme, etc.)
│   ├── pages/            # Componentes de página
│   ├── routes/           # Configuración de rutas
│   ├── services/         # Servicios para API, etc.
│   ├── styles/           # Estilos CSS
│   ├── types/            # Definiciones de tipos TypeScript
│   ├── utils/            # Utilidades y helpers
│   ├── App.tsx           # Componente principal
│   └── main.tsx          # Punto de entrada
├── .env.example          # Ejemplo de variables de entorno
├── .eslintrc.json        # Configuración de ESLint
├── .gitignore            # Archivos ignorados por Git
├── package.json          # Dependencias y scripts
├── tsconfig.json         # Configuración de TypeScript
└── vite.config.ts        # Configuración de Vite
```

## Características principales
- Autenticación con JWT
- Rutas protegidas
- Formularios validados con Formik y Yup
- Comunicación con API mediante Axios
