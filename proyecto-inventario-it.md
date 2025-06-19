# Proyecto: Sistema Web de Inventario y Activos IT

## 1. VISIÓN GENERAL DEL PROYECTO

Desarrollar una aplicación web para la gestión de inventario y control de stock del sector de Soporte IT. Este sector gestiona los productos desde su recepción, con enfoque principal en el seguimiento detallado de notebooks y celulares que llevan asignación, reparación y eventual baja.

### Objetivos Principales
- Controlar el inventario de equipos y consumibles IT
- Seguimiento detallado de notebooks y celulares (historial completo)
- Gestión de asignaciones a empleados/sectores/sucursales
- Control de reparaciones
- Alertas de stock mínimo
- Reportes y estadísticas

## 2. STACK TECNOLÓGICO

- **Backend**: Node.js con TypeScript
- **Frontend**: React con TypeScript
- **Base de Datos**: Microsoft SQL Server
- **Arquitectura DB**: Stored Procedures para operaciones críticas
- **Documentación API**: Swagger/OpenAPI
- **Control de versiones**: Git
- **Autenticación**: JWT (JSON Web Tokens)
- **Testing**: Jest para pruebas unitarias

## 3. ACLARACIONES FUNDAMENTALES

1. **Seguimiento e historial exclusivo**: SOLO las Notebooks y Celulares tienen seguimiento histórico completo y son los únicos activos que se asignan directamente a empleados, sectores o sucursales. Estos dispositivos deben mantener un registro completo de todos sus propietarios anteriores y reparaciones realizadas.

2. **Reparaciones**: SOLO las Notebooks y Celulares se envían a reparación. Los demás equipos no tienen flujo de reparación.

3. **Control de stock**: TODOS los demás productos que NO son Notebooks ni Celulares (esto incluye: Desktops, Raspberry Pi, Impresoras, Monitores, Teclados, Mouse, Memorias RAM, Discos, Pilas, Cables, etc.) se manejan como inventario regular por CANTIDAD, sin números de serie individuales ni seguimiento de asignaciones.

4. **Información de costos**: El sector de compras maneja los aspectos económicos (remitos, facturas, costos). Para el sistema de inventario IT estos datos son irrelevantes y NO se incluyen.

### Categorías de Productos Detalladas:

1. **COMPUTADORAS**
   - Desktops (manejo por stock)
   - Notebooks (seguimiento individual con serie)
   - Raspberry Pi (manejo por stock)

2. **CELULARES** 
   - Todos con seguimiento individual con serie

3. **PERIFÉRICOS** (todos por stock)
   - Teclados
   - Mouse
   - Kit Teclado/Mouse
   - Auriculares
   - Webcams
   - Monitores
   - Televisores
   - Impresoras
   - Scanners

4. **CONSUMIBLES** (todos por stock)
   - Cables (HDMI, VGA, USB, Red, etc.)
   - Pilas (AA, AAA, 9V, etc.)
   - Toner
   - Drum (Unidad de Imagen)
   - Cargadores (Celular, Notebook)
   - Papel
   - CD/DVD

5. **COMPONENTES** (todos por stock)
   - Memorias RAM
   - Discos Externos
   - Discos SSD/NVMe
   - Discos HDD
   - Placas de Video
   - Motherboards
   - Fuentes de Alimentación
   - Procesadores
   - Adaptadores USB Varios

4. **Validación de datos**: Solo los administradores del sistema pueden agregar nuevos tipos de productos al catálogo. Los usuarios estándar únicamente pueden seleccionar de opciones predefinidas.

5. **Datos de prueba**: NO utilizar mock data durante el desarrollo. Se deben cargar datos ficticios en la base de datos real para pruebas y eliminarlos antes de pasar a producción.

6. **Información sensible**: El sistema es para uso interno del departamento de IT, por lo que no hay problema en mostrar información sensible como claves y códigos de encriptación a usuarios autenticados.

### Ejemplos de Manejo por Tipo de Producto:

**CON SEGUIMIENTO INDIVIDUAL (número de serie):**
- Notebook Dell Latitude 5520 - Serie: DLL5520ABC123
- Celular Samsung A52 - Serie: SMGA52XYZ789

**SIN SEGUIMIENTO INDIVIDUAL (cantidad en stock):**
- Desktop HP EliteDesk: 15 unidades en stock
- Impresora Epson L3150: 3 unidades en stock
- Teclado Logitech K120: 45 unidades en stock
- Mouse Genius DX-110: 38 unidades en stock
- Memoria RAM Kingston 8GB: 25 unidades en stock
- Disco SSD Western Digital 480GB: 12 unidades en stock
- Cable HDMI 2m: 50 unidades en stock
- Toner HP 85A: 8 unidades en stock

## 4. MODELO DE DATOS

### Esquema de Base de Datos Principal

#### Tablas Core:
```sql
-- Usuarios del sistema
Usuarios (
    id INT PRIMARY KEY IDENTITY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('admin', 'usuario')),
    activo BIT DEFAULT 1,
    fecha_creacion DATETIME DEFAULT GETDATE(),
    ultimo_acceso DATETIME
)

-- Categorías de productos
Categorias (
    id INT PRIMARY KEY IDENTITY,
    nombre VARCHAR(50) NOT NULL,
    categoria_padre_id INT FOREIGN KEY REFERENCES Categorias(id),
    requiere_serie BIT DEFAULT 0, -- TRUE solo para Notebooks y Celulares
    permite_asignacion BIT DEFAULT 0, -- TRUE solo para Notebooks y Celulares
    permite_reparacion BIT DEFAULT 0 -- TRUE solo para Notebooks y Celulares
)

-- Catálogo de productos
Productos (
    id INT PRIMARY KEY IDENTITY,
    categoria_id INT FOREIGN KEY REFERENCES Categorias(id),
    marca VARCHAR(50) NOT NULL,
    modelo VARCHAR(100) NOT NULL,
    descripcion TEXT,
    stock_minimo INT DEFAULT 0,
    usa_numero_serie BIT DEFAULT 0, -- TRUE solo para Notebooks y Celulares
    activo BIT DEFAULT 1
)

-- Inventario Individual (SOLO para Notebooks y Celulares con número de serie)
InventarioIndividual (
    id INT PRIMARY KEY IDENTITY,
    producto_id INT FOREIGN KEY REFERENCES Productos(id),
    numero_serie VARCHAR(100) UNIQUE NOT NULL,
    estado VARCHAR(20) NOT NULL CHECK (estado IN ('Disponible', 'Asignado', 'En Reparación', 'Dado de Baja')),
    fecha_ingreso DATETIME DEFAULT GETDATE(),
    fecha_baja DATETIME,
    motivo_baja TEXT,
    usuario_alta_id INT FOREIGN KEY REFERENCES Usuarios(id),
    usuario_baja_id INT FOREIGN KEY REFERENCES Usuarios(id)
)

-- Stock General (para TODOS los productos que NO son Notebooks ni Celulares)
StockGeneral (
    id INT PRIMARY KEY IDENTITY,
    producto_id INT FOREIGN KEY REFERENCES Productos(id) UNIQUE,
    cantidad_actual INT NOT NULL DEFAULT 0,
    ultima_actualizacion DATETIME DEFAULT GETDATE(),
    ubicacion VARCHAR(100) -- Opcional: dónde se almacena
)

-- Empleados
Empleados (
    id INT PRIMARY KEY IDENTITY,
    nombre VARCHAR(50) NOT NULL,
    apellido VARCHAR(50) NOT NULL,
    activo BIT DEFAULT 1
)

-- Sucursales (55 sucursales)
Sucursales (
    id INT PRIMARY KEY IDENTITY,
    nombre VARCHAR(100) NOT NULL,
    activo BIT DEFAULT 1
)

-- Sectores (oficinas como administración, compras, etc.)
Sectores (
    id INT PRIMARY KEY IDENTITY,
    nombre VARCHAR(100) NOT NULL,
    activo BIT DEFAULT 1
)

-- Asignaciones (SOLO para Notebooks y Celulares)
Asignaciones (
    id INT PRIMARY KEY IDENTITY,
    inventario_individual_id INT FOREIGN KEY REFERENCES InventarioIndividual(id),
    empleado_id INT FOREIGN KEY REFERENCES Empleados(id),
    sector_id INT FOREIGN KEY REFERENCES Sectores(id),
    sucursal_id INT FOREIGN KEY REFERENCES Sucursales(id),
    fecha_asignacion DATETIME DEFAULT GETDATE(),
    fecha_devolucion DATETIME,
    usuario_asigna_id INT FOREIGN KEY REFERENCES Usuarios(id),
    usuario_recibe_id INT FOREIGN KEY REFERENCES Usuarios(id),
    observaciones TEXT,
    -- Campos específicos para notebooks
    password_encriptacion VARCHAR(255),
    -- Campos específicos para celulares
    numero_telefono VARCHAR(20),
    cuenta_gmail VARCHAR(100),
    password_gmail VARCHAR(255),
    codigo_2fa_whatsapp VARCHAR(50),
    activa BIT DEFAULT 1 -- Para saber si la asignación está vigente
)

-- Reparaciones (SOLO para Notebooks y Celulares)
Reparaciones (
    id INT PRIMARY KEY IDENTITY,
    inventario_individual_id INT FOREIGN KEY REFERENCES InventarioIndividual(id),
    fecha_envio DATETIME NOT NULL,
    fecha_retorno DATETIME,
    proveedor VARCHAR(100) NOT NULL,
    problema_descripcion TEXT NOT NULL,
    solucion_descripcion TEXT,
    estado VARCHAR(20) NOT NULL CHECK (estado IN ('En Reparación', 'Reparado', 'Sin Reparación')),
    usuario_envia_id INT FOREIGN KEY REFERENCES Usuarios(id),
    usuario_recibe_id INT FOREIGN KEY REFERENCES Usuarios(id)
)

-- Movimientos de Stock (para productos SIN número de serie)
MovimientosStock (
    id INT PRIMARY KEY IDENTITY,
    producto_id INT FOREIGN KEY REFERENCES Productos(id),
    tipo_movimiento VARCHAR(20) NOT NULL CHECK (tipo_movimiento IN ('Entrada', 'Salida')),
    cantidad INT NOT NULL CHECK (cantidad > 0),
    fecha_movimiento DATETIME DEFAULT GETDATE(),
    usuario_id INT FOREIGN KEY REFERENCES Usuarios(id),
    empleado_id INT NULL FOREIGN KEY REFERENCES Empleados(id),
    sector_id INT NULL FOREIGN KEY REFERENCES Sectores(id),
    sucursal_id INT NULL FOREIGN KEY REFERENCES Sucursales(id),
    motivo VARCHAR(100), -- Compra, Consumo, Préstamo, etc.
    observaciones TEXT
)

-- Logs de actividad
LogsActividad (
    id INT PRIMARY KEY IDENTITY,
    usuario_id INT FOREIGN KEY REFERENCES Usuarios(id),
    tabla_afectada VARCHAR(50) NOT NULL,
    accion VARCHAR(20) NOT NULL,
    registro_id INT NOT NULL,
    descripcion TEXT,
    fecha_hora DATETIME DEFAULT GETDATE(),
    ip_address VARCHAR(45),
    user_agent VARCHAR(255)
)

-- Changelog del proyecto
Changelog (
    id INT PRIMARY KEY IDENTITY,
    version VARCHAR(20) NOT NULL,
    fecha_cambio DATETIME DEFAULT GETDATE(),
    descripcion TEXT NOT NULL,
    tipo_cambio VARCHAR(20) NOT NULL CHECK (tipo_cambio IN ('Nueva Funcionalidad', 'Mejora', 'Corrección', 'Otro')),
    usuario_id INT FOREIGN KEY REFERENCES Usuarios(id)
)
```

### Relaciones Clave
- **Notebooks y Celulares**: Usan `InventarioIndividual` con número de serie único, tienen asignaciones y reparaciones
- **Todos los demás productos**: Usan `StockGeneral` con control por cantidad
- **Empleados, Sectores y Sucursales**: Entidades separadas para una mejor organización
- Los movimientos de stock registran todas las entradas y salidas de productos sin serie
- Las asignaciones vinculan los activos con serie a un empleado específico, indicando además su ubicación (sector/sucursal)

## 5. ESTADOS DEL SISTEMA

### Estados de Activos Serializables (Notebooks/Celulares):
- **Disponible**: En stock, listo para asignar
- **Asignado**: Actualmente en uso por empleado/sector/sucursal
- **En Reparación**: Enviado a reparación
- **Dado de Baja**: Fuera de servicio permanentemente

### Estados de Reparaciones:
- **En Reparación**: Actualmente en el proveedor
- **Reparado**: Reparación exitosa, vuelve a stock
- **Sin Reparación**: Irreparable, pasa a baja

## 6. REGLAS DE NEGOCIO Y VALIDACIONES

### Validaciones Críticas:
1. **Para Notebooks y Celulares (con número de serie)**:
   - No se puede asignar un activo que esté "En Reparación" o "Dado de Baja"
   - No se puede dar de baja un activo "Asignado" (debe devolverse primero)
   - Los números de serie deben ser únicos en todo el sistema
   - Las contraseñas de encriptación son OBLIGATORIAS para notebooks
   - Para celulares son OBLIGATORIOS: número telefónico, cuenta Gmail y contraseña
   - No se puede enviar a reparación un activo que ya está "En Reparación"
   - Al asignar a un empleado, se debe indicar en qué sector/sucursal se encuentra

2. **Para todos los demás productos (manejo por stock)**:
   - El stock no puede ser negativo
   - Las salidas no pueden exceder el stock disponible
   - Solo se pueden hacer salidas si hay stock suficiente

3. **Permisos**:
   - Solo administradores pueden crear nuevos productos en el catálogo
   - Solo administradores pueden modificar stock mínimo
   - Todos los usuarios pueden registrar movimientos de stock
   - Al dar de baja cualquier activo, el motivo es obligatorio

### Reglas de Integridad:
- Todas las transacciones críticas deben usar Stored Procedures
- Los cambios de estado deben registrarse en logs
- Las eliminaciones son lógicas (soft delete), no físicas
- Mantener historial completo de asignaciones y reparaciones para Notebooks/Celulares
- Mantener historial de todos los movimientos de stock para productos sin serie

## 7. FLUJOS DE TRABAJO PRINCIPALES

### Flujo de Alta de Notebook/Celular (con número de serie):
```
1. Administrador selecciona producto del catálogo (debe ser Notebook o Celular)
2. Ingresa número(s) de serie individual para cada unidad
3. Sistema valida unicidad del número de serie
4. Se registra en InventarioIndividual con estado "Disponible"
5. Se registra en log de actividad
6. Se actualiza dashboard
```

### Flujo de Alta de Otros Productos (sin número de serie):
```
1. Usuario selecciona producto del catálogo (Desktop, Impresora, Mouse, etc.)
2. Ingresa cantidad recibida
3. Sistema suma la cantidad al StockGeneral
4. Se crea registro en MovimientosStock tipo "Entrada"
5. Se registra en log de actividad
6. Se actualiza dashboard
```

### Flujo de Asignación de Notebook:
```
1. Usuario busca notebook disponible por número de serie
2. Selecciona empleado 
3. Selecciona ubicación del empleado (sector o sucursal)
4. Ingresa contraseña de encriptación (OBLIGATORIO)
5. Confirma asignación
6. Sistema actualiza estado a "Asignado" en InventarioIndividual
7. Se crea registro en tabla Asignaciones
8. Se registra en log de actividad
9. Se actualiza historial del activo
```

### Flujo de Asignación de Celular:
```
1. Usuario busca celular disponible por número de serie
2. Selecciona empleado
3. Selecciona ubicación del empleado (sector o sucursal)
4. Ingresa datos obligatorios:
   - Número de teléfono
   - Cuenta Gmail
   - Contraseña Gmail
   - Código 2FA WhatsApp
5. Confirma asignación
6. Sistema actualiza estado a "Asignado" en InventarioIndividual
7. Se crea registro en tabla Asignaciones
8. Se registra en log de actividad
```

### Flujo de Salida de Stock (productos sin serie):
```
1. Usuario selecciona producto del stock general
2. Verifica cantidad disponible
3. Ingresa cantidad a retirar
4. Selecciona destino (empleado, sector o sucursal)
5. Ingresa motivo (consumo, préstamo, proyecto)
6. Sistema valida stock suficiente
7. Resta cantidad de StockGeneral
8. Crea registro en MovimientosStock tipo "Salida"
9. Verifica si queda bajo stock mínimo
10. Genera alerta si corresponde
```

### Flujo de Reparación (solo Notebooks/Celulares):
```
1. Usuario busca notebook/celular por número de serie
2. Ingresa datos de reparación:
   - Proveedor
   - Descripción del problema
   - Fecha de envío
3. Sistema cambia estado a "En Reparación"
4. Se crea registro en tabla Reparaciones
5. Al retornar:
   - Si reparado: vuelve a "Disponible"
   - Si no reparado: pasa a "Dado de Baja"
6. Se actualiza historial del activo
```

### Flujo de Consulta de Stock:
```
1. Usuario accede a vista de stock
2. Puede filtrar por:
   - Categoría
   - Productos bajo mínimo
   - Ubicación
3. Ve cantidades actuales
4. Puede ver historial de movimientos
5. Puede exportar reporte
```

## 8. CHANGELOG DEL PROYECTO

El sistema incluirá un módulo de Changelog para registrar todos los avances y modificaciones realizadas durante el desarrollo. Esto permitirá tener una visión clara del progreso y documentar correctamente los cambios.

### Estructura del Changelog:
- **Versión**: Formato semántico (X.Y.Z)
- **Fecha**: Fecha del cambio
- **Tipo**: Nueva Funcionalidad, Mejora, Corrección, Otro
- **Descripción**: Detalle del cambio realizado
- **Usuario**: Desarrollador que implementó el cambio

### Visualización:
- Panel de administración con filtros por fecha, versión y tipo
- Exportación a CSV/PDF
- Notificaciones de nuevas versiones a administradores

### Ejemplo de Entradas:
```
Versión 0.1.0 (2023-06-01) - Nueva Funcionalidad
- Implementación inicial del modelo de datos
- Creación de tablas core y relaciones

Versión 0.1.1 (2023-06-05) - Mejora
- Optimización de consultas en el listado de inventario
- Mejora de rendimiento en búsquedas por número de serie

Versión 0.2.0 (2023-06-10) - Nueva Funcionalidad
- Implementación del módulo de asignaciones
- Integración de validaciones de estado para activos
```

## 9. API ENDPOINTS PRINCIPALES

### Autenticación
```
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
GET    /api/auth/profile
PUT    /api/auth/change-password
```

### Gestión de Inventario
```
GET    /api/inventory                    # Listar todos los items
GET    /api/inventory/:id               # Detalle de un item
POST   /api/inventory                   # Alta de items
PUT    /api/inventory/:id               # Actualizar item
DELETE /api/inventory/:id               # Baja lógica
POST   /api/inventory/batch             # Alta masiva
GET    /api/inventory/:id/history       # Historial completo
```

### Asignaciones
```
POST   /api/assignments                 # Nueva asignación
PUT    /api/assignments/:id/return      # Devolución
GET    /api/assignments/active          # Asignaciones activas
GET    /api/assignments/by-employee/:id # Asignaciones por empleado
GET    /api/assignments/by-sector/:id   # Asignaciones por sector
GET    /api/assignments/by-branch/:id   # Asignaciones por sucursal
```

### Reparaciones
```
POST   /api/repairs                     # Enviar a reparación
PUT    /api/repairs/:id/return          # Retorno de reparación
GET    /api/repairs/active              # En reparación actualmente
GET    /api/repairs/history/:inventoryId
```

### Gestión de Stock (Consumibles)
```
GET    /api/stock                       # Estado actual
POST   /api/stock/entry                 # Entrada de stock
POST   /api/stock/exit                  # Salida de stock
GET    /api/stock/movements             # Historial de movimientos
GET    /api/stock/alerts                # Productos bajo mínimo
```

### Empleados, Sectores y Sucursales
```
GET    /api/employees                   # Listar empleados
POST   /api/employees                   # Crear empleado
PUT    /api/employees/:id               # Actualizar empleado
GET    /api/sectors                     # Listar sectores
POST   /api/sectors                     # Crear sector
PUT    /api/sectors/:id                 # Actualizar sector
GET    /api/branches                    # Listar sucursales
POST   /api/branches                    # Crear sucursal
PUT    /api/branches/:id                # Actualizar sucursal
```

### Catálogo y Productos
```
GET    /api/products                    # Listar productos
POST   /api/products                    # Crear producto (admin)
PUT    /api/products/:id                # Actualizar producto (admin)
GET    /api/categories                  # Listar categorías
POST   /api/categories                  # Crear categoría (admin)
```

### Reportes
```
GET    /api/reports/inventory-summary
GET    /api/reports/assignments-by-employee
GET    /api/reports/assignments-by-sector
GET    /api/reports/assignments-by-branch
GET    /api/reports/repairs-summary
GET    /api/reports/stock-levels
GET    /api/reports/asset-history/:id
POST   /api/reports/custom              # Reporte personalizado
```

### Changelog
```
GET    /api/changelog                   # Listar todos los cambios
POST   /api/changelog                   # Registrar nuevo cambio (admin)
GET    /api/changelog/version/:version  # Ver cambios por versión
GET    /api/changelog/export            # Exportar changelog
```

### Búsqueda
```
GET    /api/search/global               # Búsqueda global
GET    /api/search/encryption-passwords # Buscar por contraseña
GET    /api/search/serial-numbers       # Buscar por número de serie
```

### Dashboard
```
GET    /api/dashboard/stats             # Estadísticas generales
GET    /api/dashboard/alerts            # Alertas activas
GET    /api/dashboard/recent-activity   # Actividad reciente
```

## 10. ESTRUCTURA DE CARPETAS DEL PROYECTO

```
proyecto-inventario-it/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── inventory.controller.ts
│   │   │   ├── assignment.controller.ts
│   │   │   ├── repair.controller.ts
│   │   │   ├── stock.controller.ts
│   │   │   ├── employee.controller.ts
│   │   │   ├── sector.controller.ts
│   │   │   ├── branch.controller.ts
│   │   │   ├── product.controller.ts
│   │   │   ├── report.controller.ts
│   │   │   ├── changelog.controller.ts
│   │   │   └── dashboard.controller.ts
│   │   ├── models/
│   │   │   ├── user.model.ts
│   │   │   ├── inventory.model.ts
│   │   │   ├── assignment.model.ts
│   │   │   ├── repair.model.ts
│   │   │   ├── employee.model.ts
│   │   │   ├── sector.model.ts
│   │   │   ├── branch.model.ts
│   │   │   ├── changelog.model.ts
│   │   │   └── product.model.ts
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── inventory.routes.ts
│   │   │   ├── assignment.routes.ts
│   │   │   ├── repair.routes.ts
│   │   │   ├── stock.routes.ts
│   │   │   ├── employee.routes.ts
│   │   │   ├── sector.routes.ts
│   │   │   ├── branch.routes.ts
│   │   │   ├── changelog.routes.ts
│   │   │   └── index.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── validation.middleware.ts
│   │   │   ├── error.middleware.ts
│   │   │   └── logging.middleware.ts
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── email.service.ts
│   │   │   ├── changelog.service.ts
│   │   │   └── report.service.ts
│   │   ├── utils/
│   │   │   ├── database.ts
│   │   │   ├── logger.ts
│   │   │   └── validators.ts
│   │   ├── database/
│   │   │   ├── stored-procedures/
│   │   │   │   ├── sp_inventory_CRUD.sql
│   │   │   │   ├── sp_assignments.sql
│   │   │   │   ├── sp_repairs.sql
│   │   │   │   ├── sp_stock.sql
│   │   │   │   ├── sp_employees.sql
│   │   │   │   ├── sp_sectors.sql
│   │   │   │   ├── sp_branches.sql
│   │   │   │   ├── sp_changelog.sql
│   │   │   │   └── sp_reports.sql
│   │   │   ├── migrations/
│   │   │   │   ├── 001_initial_schema.sql
│   │   │   │   ├── 002_stored_procedures.sql
│   │   │   │   └── 003_indexes.sql
│   │   │   └── seeds/
│   │   │       └── test_data.sql
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── app.ts
│   ├── tests/
│   ├── swagger/
│   │   └── swagger.json
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── DataTable.tsx
│   │   │   │   └── SearchBar.tsx
│   │   │   ├── inventory/
│   │   │   │   ├── InventoryList.tsx
│   │   │   │   ├── InventoryForm.tsx
│   │   │   │   └── InventoryDetail.tsx
│   │   │   ├── assignments/
│   │   │   │   ├── AssignmentForm.tsx
│   │   │   │   └── AssignmentHistory.tsx
│   │   │   ├── repairs/
│   │   │   │   ├── RepairForm.tsx
│   │   │   │   └── RepairList.tsx
│   │   │   ├── employees/
│   │   │   │   ├── EmployeeList.tsx
│   │   │   │   └── EmployeeForm.tsx
│   │   │   ├── sectors/
│   │   │   │   ├── SectorList.tsx
│   │   │   │   └── SectorForm.tsx
│   │   │   ├── branches/
│   │   │   │   ├── BranchList.tsx
│   │   │   │   └── BranchForm.tsx
│   │   │   ├── changelog/
│   │   │   │   ├── ChangelogList.tsx
│   │   │   │   └── ChangelogEntry.tsx
│   │   │   └── dashboard/
│   │   │       ├── StatsWidget.tsx
│   │   │       ├── AlertsWidget.tsx
│   │   │       └── ChartsWidget.tsx
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Inventory.tsx
│   │   │   ├── Assignments.tsx
│   │   │   ├── Repairs.tsx
│   │   │   ├── Stock.tsx
│   │   │   ├── Employees.tsx
│   │   │   ├── Sectors.tsx
│   │   │   ├── Branches.tsx
│   │   │   ├── Changelog.tsx
│   │   │   ├── Reports.tsx
│   │   │   └── Admin.tsx
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── inventory.service.ts
│   │   │   ├── employee.service.ts
│   │   │   ├── sector.service.ts
│   │   │   ├── branch.service.ts
│   │   │   └── changelog.service.ts
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useInventory.ts
│   │   │   ├── useEmployee.ts
│   │   │   └── useNotification.ts
│   │   ├── utils/
│   │   │   ├── constants.ts
│   │   │   ├── helpers.ts
│   │   │   └── validators.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── documentation/
│   ├── API.md
│   ├── DATABASE.md
│   └── DEPLOYMENT.md
└── README.md
```

## 11. STORED PROCEDURES PRINCIPALES

### Inventario Individual (Notebooks/Celulares)
```sql
-- sp_InventarioIndividual_Create
-- sp_InventarioIndividual_Update
-- sp_InventarioIndividual_Delete (soft delete)
-- sp_InventarioIndividual_GetById
-- sp_InventarioIndividual_GetBySerialNumber
-- sp_InventarioIndividual_GetAvailable
-- sp_InventarioIndividual_Search
-- sp_InventarioIndividual_GetHistory
```

### Stock General (Todos los demás productos)
```sql
-- sp_StockGeneral_GetCurrent
-- sp_StockGeneral_Entry (registra entrada y actualiza stock)
-- sp_StockGeneral_Exit (valida y registra salida)
-- sp_StockGeneral_GetBelowMinimum
-- sp_StockGeneral_GetByCategory
-- sp_StockGeneral_GetMovements
```

### Asignaciones (Solo para Notebooks/Celulares)
```sql
-- sp_Assignment_Create
-- sp_Assignment_Return
-- sp_Assignment_GetActive
-- sp_Assignment_GetHistory
-- sp_Assignment_GetByEmployee
-- sp_Assignment_GetBySector
-- sp_Assignment_GetByBranch
-- sp_Assignment_SearchByEncryption (buscar por password)
```

### Empleados, Sectores y Sucursales
```sql
-- sp_Employee_Create
-- sp_Employee_Update
-- sp_Employee_GetAll
-- sp_Employee_GetById
-- sp_Sector_Create
-- sp_Sector_Update
-- sp_Sector_GetAll
-- sp_Sector_GetById
-- sp_Branch_Create
-- sp_Branch_Update
-- sp_Branch_GetAll
-- sp_Branch_GetById
```

### Reparaciones (Solo para Notebooks/Celulares)
```sql
-- sp_Repair_Send
-- sp_Repair_Return
-- sp_Repair_GetActive
-- sp_Repair_GetHistory
-- sp_Repair_GetByProvider
```

### Movimientos de Stock
```sql
-- sp_Movement_Create
-- sp_Movement_GetByProduct
-- sp_Movement_GetByDateRange
-- sp_Movement_GetByEmployee
-- sp_Movement_GetBySector
-- sp_Movement_GetByBranch
-- sp_Movement_ValidateStock (verifica disponibilidad antes de salida)
```

### Changelog
```sql
-- sp_Changelog_Create
-- sp_Changelog_GetAll
-- sp_Changelog_GetByVersion
-- sp_Changelog_GetByDateRange
-- sp_Changelog_GetByType
```

### Reportes
```sql
-- sp_Report_InventorySummary (combina individual y general)
-- sp_Report_AssetHistory (solo notebooks/celulares)
-- sp_Report_StockLevels (productos sin serie)
-- sp_Report_RepairsSummary
-- sp_Report_AssignmentsByEmployee
-- sp_Report_AssignmentsBySector
-- sp_Report_AssignmentsByBranch
-- sp_Report_StockAlerts
-- sp_Report_MovementsSummary
```

### Productos y Catálogo
```sql
-- sp_Product_Create (define si usa serie o no)
-- sp_Product_Update
-- sp_Product_GetAll
-- sp_Product_GetByCategory
-- sp_Product_SetMinimumStock
```

## 12. DATOS DE PRUEBA (DESARROLLO)

### Usuarios
- 2 administradores: admin1@empresa.com, admin2@empresa.com
- 8 usuarios estándar: usuario1@empresa.com ... usuario8@empresa.com

### Empleados, Sectores y Sucursales
- **50 empleados** con nombres y apellidos
- **10 sectores**: Administración, Compras, Contable, RRHH, Marketing, Publicidad, Sistemas, Soporte, Gerencia, Logística
- **55 sucursales** numeradas del 1 al 55

### Inventario Individual (Notebooks y Celulares con número de serie)
- **50 notebooks** con números de serie únicos:
  - 10 asignadas a empleados en diferentes sectores/sucursales
  - 5 en reparación
  - 35 disponibles
- **30 celulares** con números de serie únicos:
  - 8 asignados con datos completos (teléfono, Gmail, etc.)
  - 2 en reparación
  - 20 disponibles

### Stock General (Productos sin número de serie)
- **Computadoras**: 
  - 20 Desktops (15 en stock)
  - 10 Raspberry Pi (8 en stock)
- **Periféricos**:
  - 50 Teclados
  - 45 Mouse
  - 30 Monitores
  - 5 Impresoras
  - 15 Webcams
- **Consumibles**:
  - 200 Cables varios (HDMI, USB, Red)
  - 100 Pilas (AA, AAA)
  - 20 Toner
  - 50 Cargadores
- **Componentes**:
  - 40 Memorias RAM (diferentes capacidades)
  - 25 Discos SSD
  - 15 Discos HDD
  - 10 Placas de video

### Asignaciones Históricas (Solo Notebooks/Celulares)
- 20 asignaciones completadas (con devolución)
- 18 asignaciones activas
- Datos completos de encriptación para notebooks
- Datos completos de cuentas para celulares

### Movimientos de Stock (Productos sin serie)
- 100 movimientos de entrada 
- 150 movimientos de salida (consumo/asignación)
- Diferentes destinos (empleados, sectores, sucursales)

### Reparaciones (Solo Notebooks/Celulares)
- 10 reparaciones completadas exitosamente
- 5 reparaciones sin solución (dados de baja)
- 7 actualmente en reparación

### Changelog
- 15 entradas de changelog con diferentes versiones y tipos de cambio

### Alertas de Stock
- 5 productos configurados bajo su stock mínimo para pruebas de alertas

## 13. MÉTRICAS Y KPIs DEL DASHBOARD

### Widgets Principales
1. **Total de Activos**:
   - Notebooks y Celulares: cantidad individual por estado
   - Otros productos: cantidad total en stock por categoría
   
2. **Estado de Activos con Serie** (Solo Notebooks/Celulares):
   - Disponibles vs Asignados vs En Reparación vs Dados de Baja
   - Porcentaje de utilización
   
3. **Niveles de Stock** (Productos sin serie):
   - Stock actual vs Stock mínimo
   - Productos bajo mínimo (alertas)
   
4. **Reparaciones** (Solo Notebooks/Celulares):
   - En curso vs Completadas
   - Tiempo promedio de reparación
   - Tasa de éxito
   
5. **Movimientos Recientes**:
   - Últimas asignaciones (Notebooks/Celulares)
   - Últimos movimientos de stock (otros productos)
   
6. **Distribución por Destino**:
   - Notebooks/Celulares asignados por empleado
   - Notebooks/Celulares asignados por sector/sucursal
   - Consumo de stock por destino (empleado/sector/sucursal)

### Gráficos
- Evolución del inventario total (línea temporal)
- Notebooks/Celulares: distribución por estado (torta)
- Stock general: niveles actuales vs mínimos (barras)
- Top 10 productos más consumidos (sin serie)
- Historial de reparaciones por mes
- Tendencia de consumo de productos sin serie
- Distribución de activos por sucursal/sector

## 14. SEGURIDAD Y PERMISOS

### Niveles de Acceso
- **Administrador**: Acceso total, gestión de catálogo, usuarios, reportes
- **Usuario Estándar**: Operaciones de inventario, asignaciones, consultas

### Medidas de Seguridad
- Autenticación JWT con refresh tokens
- Encriptación de contraseñas con bcrypt
- Validación de entrada en todos los endpoints
- Rate limiting para prevenir atasos
- Logs de auditoría para todas las operaciones
- Backup automático de base de datos

## 15. SISTEMA DE BACKUP

### Estrategia de Respaldo
- **Backup Completo**: Diario a las 2:00 AM
- **Backup Diferencial**: Cada 4 horas
- **Backup de Logs**: Cada hora
- **Retención**: 30 días para completos, 7 días para diferenciales
- **Almacenamiento**: Local + Copia en nube (Azure/AWS)

### Procedimiento de Restauración
1. Identificar punto de restauración necesario
2. Restaurar backup completo más reciente
3. Aplicar diferenciales hasta el punto deseado
4. Aplicar logs de transacciones
5. Verificar integridad de datos
6. Actualizar logs de restauración

## 16. MANEJO DE ERRORES

### Códigos de Error Estandarizados
- 400: Validación fallida
- 401: No autenticado
- 403: Sin permisos
- 404: Recurso no encontrado
- 409: Conflicto (ej: número de serie duplicado)
- 500: Error interno del servidor

### Estrategia de Logging
- Todos los errores se registran con contexto completo
- Niveles: ERROR, WARN, INFO, DEBUG
- Rotación de logs diaria
- Alertas automáticas para errores críticos

## 17. CONSIDERACIONES DE RENDIMIENTO

### Optimizaciones
- Índices en campos de búsqueda frecuente
- Paginación en todas las listas (25 items por defecto)
- Caché para datos estáticos (categorías, productos)
- Lazy loading en frontend
- Compresión de respuestas API
- Queries optimizadas con EXPLAIN PLAN

### Métricas de Rendimiento
- Tiempo de respuesta objetivo: < 2 segundos
- Queries complejas: < 5 segundos
- Carga de dashboard: < 3 segundos
- Búsquedas: < 1 segundo

## 18. DOCUMENTACIÓN ADICIONAL

### Para Desarrolladores
- Documentación completa de API con Swagger
- Guía de estilo de código
- Documentación de stored procedures
- Guía de contribución

### Para Usuarios
- Manual de usuario
- Videos tutoriales de operaciones comunes
- FAQ
- Guía de resolución de problemas

## 19. FASES DE IMPLEMENTACIÓN

### Fase 1: MVP (2-3 semanas)
- Autenticación básica
- CRUD de inventario
- Asignaciones simples
- Dashboard básico
- Estructura de Empleados, Sectores y Sucursales

### Fase 2: Funcionalidades Core (2-3 semanas)
- Gestión completa de notebooks/celulares
- Sistema de reparaciones
- Control de stock de consumibles
- Reportes básicos
- Implementación del Changelog

### Fase 3: Funcionalidades Avanzadas (2 semanas)
- Sistema de alertas
- Reportes avanzados
- Optimizaciones de rendimiento
- Integración de backups

### Fase 4: Pulido y Deployment (1 semana)
- Testing completo
- Documentación final
- Deployment a producción
- Capacitación de usuarios

## 20. NOTAS PARA EL DESARROLLO CON IA

### Principios a Seguir
1. **Código Limpio**: Implementar SOLID, DRY, KISS
2. **TypeScript Estricto**: Usar tipos en todas partes, evitar 'any'
3. **Comentarios**: Solo cuando agreguen valor, código autodocumentado
4. **Testing**: Escribir tests para funciones críticas
5. **Commits**: Mensajes descriptivos siguiendo conventional commits

### DIFERENCIACIÓN CRÍTICA DEL SISTEMA
**MUY IMPORTANTE**: El sistema maneja dos tipos de inventario completamente diferentes:

1. **INVENTARIO INDIVIDUAL** (Solo Notebooks y Celulares):
   - Cada unidad tiene número de serie único
   - Se rastrea individualmente
   - Tiene historial de asignaciones
   - Puede enviarse a reparación
   - Estados: Disponible, Asignado, En Reparación, Dado de Baja

2. **STOCK GENERAL** (Todo lo demás: Desktops, Impresoras, Teclados, Mouse, Memorias, Discos, Cables, etc.):
   - Se maneja por cantidad total
   - NO tienen números de serie
   - NO se asignan individualmente
   - NO se envían a reparación
   - Solo se registran entradas y salidas con cantidades

### Prioridades
1. Funcionalidad sobre estética (UI se definirá aparte)
2. Seguridad en todas las operaciones
3. Performance en queries complejas
4. Mantenibilidad del código
5. Documentación clara

### Evitar
- Hardcodear valores (usar constantes/config)
- Lógica de negocio en controladores (usar servicios)
- Queries directas sin validación
- Estados globales innecesarios
- Dependencias excesivas
- Confundir el manejo de productos con serie vs sin serie