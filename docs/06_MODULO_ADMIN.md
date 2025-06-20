# Guía Detallada: Módulo de Administración

Esta guía es exclusiva para usuarios con el rol de **Administrador**. Aquí se explica cómo configurar los cimientos del sistema.

## 1. Acceder al Panel de Administración

Haz clic en el icono de "Configuración" o "Admin" en el menú lateral para acceder al panel principal de administración. Este panel está dividido en pestañas para facilitar la gestión.

## 2. Gestión de Usuarios

En esta pestaña, puedes administrar quién tiene acceso a StockIT.

- **Crear Usuario**:
  1. Haz clic en "Crear Usuario".
  2. Completa el nombre, el email y una contraseña temporal.
  3. Asigna un rol:
      - **Administrador**: Acceso total al sistema.
      - **Usuario**: Acceso a los módulos operativos pero no al panel de administración.
- **Editar Usuario**: Modifica el nombre, email o rol de un usuario existente.
- **Activar/Desactivar**: En lugar de borrar, puedes desactivar una cuenta para revocar el acceso temporalmente.

## 3. Gestión del Catálogo

Esta es una de las secciones más importantes. Aquí defines qué productos existen en tu empresa.

### 3.1. Gestión de Categorías

Las categorías organizan tus productos de forma jerárquica (ej. Computadoras > Notebooks).

- **Crear Categoría**:
  1. Define un nombre (ej. "Periféricos").
  2. Opcional: Asígnale una "Categoría Padre" para crear una subcategoría.
  3. **Configuraciones Clave**: Marca las casillas para definir el comportamiento de todos los productos dentro de esta categoría:
      - `¿Requiere Nro. de Serie?`: **Márcala solo para Notebooks y Celulares**. Esto activa el seguimiento individual.
      - `¿Permite Asignación?`: Generalmente se marca junto con la anterior.
      - `¿Permite Reparación?`: Generalmente se marca junto con las dos anteriores.
- **Editar/Desactivar**: Puedes modificar o desactivar categorías, pero el sistema te impedirá realizar cambios que afecten a productos existentes con inventario.

### 3.2. Gestión de Productos

Aquí creas los productos específicos que pertenecen a las categorías.

- **Crear Producto**:
  1. Selecciona la **Categoría** a la que pertenece. Las configuraciones de la categoría (nro. de serie, etc.) se heredarán automáticamente.
  2. Ingresa la **Marca** (ej. "Dell") y el **Modelo** (ej. "Latitude 5520").
  3. Opcional: Añade una descripción y define un **Stock Mínimo** si es un producto de stock general.
- **Editar/Desactivar**: Puedes ajustar los detalles de un producto. No podrás cambiar la configuración de "Usa Número de Serie" si el producto ya tiene inventario registrado.

## 4. Gestión de Entidades

En esta pestaña administras las listas de personas y lugares que se usan en las asignaciones.

- **Empleados**:
  - Mantén una lista actualizada de todos los empleados de la empresa.
  - Puedes crear, editar o desactivar empleados. Un empleado inactivo ya no aparecerá en los formularios de asignación.
- **Sectores**:
  - Define los departamentos o áreas de la empresa (ej. "Sistemas", "Recursos Humanos").
- **Sucursales**:
  - Administra las diferentes ubicaciones físicas o sedes de la compañía.

Mantener estas listas actualizadas es crucial para que las asignaciones de equipos se registren correctamente. 