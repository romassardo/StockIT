# Documentación API: StockIT Sistema de Inventario

## Descripción General

Esta documentación describe los endpoints API disponibles para la gestión de empleados, sectores y sucursales en el sistema StockIT. Todos los endpoints requieren autenticación mediante token JWT y tienen permisos basados en roles.

## Base URL

```
http://localhost:3000/api
```

## Autenticación

Todos los endpoints requieren un token JWT válido enviado en el header `Authorization`:

```
Authorization: Bearer <token_jwt>
```

---

## Empleados (Employees)

### Crear Empleado
**Endpoint:** `POST /employees`  
**Roles permitidos:** `admin`  
**Descripción:** Crea un nuevo empleado en el sistema.

**Request Body:**
```json
{
  "nombre": "Juan",
  "apellido": "Pérez",
  "email": "juan.perez@ejemplo.com",
  "telefono": "1123456789",
  "sector_id": 1,
  "sucursal_id": 1,
  "fecha_ingreso": "2025-01-15",
  "activo": true
}
```

**Respuesta Exitosa (201):**
```json
{
  "success": true,
  "message": "Empleado creado exitosamente.",
  "data": {
    "id": 1
  }
}
```

**Errores:**
- `400` - Falta nombre o apellido
- `409` - El empleado ya existe
- `401` - Usuario no autenticado
- `403` - Usuario no tiene permisos
- `500` - Error interno del servidor

### Obtener Todos los Empleados
**Endpoint:** `GET /employees`  
**Roles permitidos:** `admin`, `usuario`  
**Descripción:** Obtiene una lista de todos los empleados.

**Query Parameters:**
- `activo_only` (boolean, opcional) - Si es `true` (predeterminado), solo devuelve empleados activos. Si es `false`, devuelve todos.

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "message": "Empleados obtenidos exitosamente.",
  "data": [
    {
      "id": 1,
      "nombre": "Juan",
      "apellido": "Pérez",
      "nombre_completo": "Juan Pérez",
      "activo": true,
      "email": "juan.perez@ejemplo.com"
    }
  ]
}
```

### Obtener Empleado por ID
**Endpoint:** `GET /employees/:id`  
**Roles permitidos:** `admin`, `usuario`  
**Descripción:** Obtiene información detallada de un empleado específico.

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nombre": "Juan",
    "apellido": "Pérez",
    "nombre_completo": "Juan Pérez",
    "email": "juan.perez@ejemplo.com",
    "telefono": "1123456789",
    "sector_id": 1,
    "sucursal_id": 1,
    "fecha_ingreso": "2025-01-15",
    "activo": true
  }
}
```

**Errores:**
- `400` - ID inválido
- `404` - Empleado no encontrado
- `500` - Error interno del servidor

### Actualizar Empleado
**Endpoint:** `PUT /employees/:id`  
**Roles permitidos:** `admin`  
**Descripción:** Actualiza la información de un empleado existente.

**Request Body:**
```json
{
  "nombre": "Juan Carlos",
  "apellido": "Pérez",
  "email": "juancarlos.perez@ejemplo.com",
  "telefono": "1123456789",
  "sector_id": 2,
  "sucursal_id": 1,
  "fecha_ingreso": "2025-01-15"
}
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "message": "Empleado actualizado exitosamente.",
  "data": {
    "id": 1
  }
}
```

**Errores:**
- `400` - ID inválido o campos obligatorios faltantes
- `404` - Empleado no encontrado
- `401` - Usuario no autenticado
- `403` - Usuario no tiene permisos
- `500` - Error interno del servidor

### Cambiar Estado Activo/Inactivo
**Endpoint:** `PATCH /employees/:id/toggle-active`  
**Roles permitidos:** `admin`  
**Descripción:** Cambia el estado activo/inactivo de un empleado.

**Request Body:**
```json
{
  "activo": false
}
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "message": "Estado del empleado actualizado exitosamente.",
  "data": {
    "id": 1,
    "activo": false
  }
}
```

**Errores:**
- `400` - ID inválido o valor de activo faltante
- `404` - Empleado no encontrado
- `409` - El empleado ya tiene ese estado
- `401` - Usuario no autenticado
- `403` - Usuario no tiene permisos
- `500` - Error interno del servidor

---

## Sectores (Sectors)

### Crear Sector
**Endpoint:** `POST /sectors`  
**Roles permitidos:** `admin`  
**Descripción:** Crea un nuevo sector en el sistema.

**Request Body:**
```json
{
  "nombre": "IT",
  "descripcion": "Departamento de Tecnología",
  "responsable_email": "responsable.it@ejemplo.com"
}
```

**Respuesta Exitosa (201):**
```json
{
  "success": true,
  "message": "Sector creado exitosamente.",
  "sectorId": 1
}
```

**Errores:**
- `400` - Falta nombre
- `409` - El sector ya existe
- `401` - Usuario no autenticado
- `403` - Usuario no tiene permisos
- `500` - Error interno del servidor

### Obtener Todos los Sectores
**Endpoint:** `GET /sectors`  
**Roles permitidos:** `admin`, `usuario`  
**Descripción:** Obtiene una lista de todos los sectores.

**Query Parameters:**
- `activo_only` (boolean, opcional) - Si es `true` (predeterminado), solo devuelve sectores activos. Si es `false`, devuelve todos.

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "message": "Sectores obtenidos exitosamente.",
  "data": [
    {
      "id": 1,
      "nombre": "IT",
      "descripcion": "Departamento de Tecnología",
      "responsable_email": "responsable.it@ejemplo.com",
      "activo": true
    }
  ]
}
```

### Obtener Sector por ID
**Endpoint:** `GET /sectors/:id`  
**Roles permitidos:** `admin`, `usuario`  
**Descripción:** Obtiene información detallada de un sector específico.

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nombre": "IT",
    "descripcion": "Departamento de Tecnología",
    "responsable_email": "responsable.it@ejemplo.com",
    "activo": true
  }
}
```

**Errores:**
- `400` - ID inválido
- `404` - Sector no encontrado
- `401` - Usuario no autenticado
- `500` - Error interno del servidor

### Actualizar Sector
**Endpoint:** `PUT /sectors/:id`  
**Roles permitidos:** `admin`  
**Descripción:** Actualiza la información de un sector existente.

**Request Body:**
```json
{
  "nombre": "Tecnología",
  "descripcion": "Departamento de Tecnología e Informática",
  "responsable_email": "responsable.tech@ejemplo.com",
  "activo": true
}
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "message": "Sector actualizado exitosamente."
}
```

**Errores:**
- `400` - ID inválido o nombre faltante
- `404` - Sector no encontrado
- `409` - Ya existe otro sector con ese nombre
- `401` - Usuario no autenticado
- `403` - Usuario no tiene permisos
- `500` - Error interno del servidor

### Cambiar Estado Activo/Inactivo
**Endpoint:** `PATCH /sectors/:id/toggle-active`  
**Roles permitidos:** `admin`  
**Descripción:** Cambia el estado activo/inactivo de un sector.

**Request Body:**
No requiere cuerpo de solicitud. El estado se cambia automáticamente al inverso del actual.

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "message": "Estado del sector cambiado exitosamente."
}
```

**Errores:**
- `400` - ID inválido
- `404` - Sector no encontrado
- `401` - Usuario no autenticado
- `403` - Usuario no tiene permisos
- `500` - Error interno del servidor

---

## Sucursales (Branches)

### Crear Sucursal
**Endpoint:** `POST /branches`  
**Roles permitidos:** `admin`  
**Descripción:** Crea una nueva sucursal en el sistema.

**Request Body:**
```json
{
  "nombre": "Sede Central",
  "activo": true
}
```

**Respuesta Exitosa (201):**
```json
{
  "success": true,
  "message": "Sucursal creada exitosamente.",
  "branchId": 1
}
```

**Errores:**
- `400` - Falta nombre o nombre inválido
- `401` - Usuario no autenticado
- `403` - Usuario no tiene permisos
- `500` - Error interno del servidor

### Obtener Todas las Sucursales
**Endpoint:** `GET /branches`  
**Roles permitidos:** Usuario autenticado (cualquier rol)  
**Descripción:** Obtiene una lista de todas las sucursales.

**Query Parameters:**
- `includeInactive` (boolean, opcional) - Si es `false` (predeterminado), solo devuelve sucursales activas. Si es `true`, devuelve todas.

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Sede Central",
      "activo": true
    }
  ]
}
```

### Obtener Sucursal por ID
**Endpoint:** `GET /branches/:id`  
**Roles permitidos:** Usuario autenticado (cualquier rol)  
**Descripción:** Obtiene información detallada de una sucursal específica.

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nombre": "Sede Central",
    "activo": true
  }
}
```

**Errores:**
- `400` - ID inválido
- `404` - Sucursal no encontrada
- `401` - Usuario no autenticado
- `500` - Error interno del servidor

### Actualizar Sucursal
**Endpoint:** `PUT /branches/:id`  
**Roles permitidos:** `admin`  
**Descripción:** Actualiza el nombre de una sucursal existente.

**Request Body:**
```json
{
  "nombre": "Sede Principal"
}
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "message": "Sucursal actualizada exitosamente.",
  "data": {
    "id": 1,
    "nombre": "Sede Principal"
  }
}
```

**Errores:**
- `400` - ID inválido o nombre faltante
- `404` - Sucursal no encontrada
- `401` - Usuario no autenticado
- `403` - Usuario no tiene permisos
- `500` - Error interno del servidor

### Cambiar Estado Activo/Inactivo
**Endpoint:** `PATCH /branches/:id/toggle-active`  
**Roles permitidos:** `admin`  
**Descripción:** Cambia el estado activo/inactivo de una sucursal.

**Request Body:**
```json
{
  "activo": false
}
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "message": "Estado de la sucursal actualizado exitosamente.",
  "data": {
    "id": 1,
    "activo": false
  }
}
```

**Errores:**
- `400` - ID inválido o valor de activo faltante/inválido
- `404` - Sucursal no encontrada
- `409` - La sucursal ya tiene ese estado
- `401` - Usuario no autenticado
- `403` - Usuario no tiene permisos
- `500` - Error interno del servidor