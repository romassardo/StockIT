# Guía Detallada: Módulo de Inventario

Este módulo es el corazón de la gestión de activos individualizados como **Notebooks** y **Celulares**.

## 1. Visualizar el Inventario

Al acceder a la sección "Inventario" (o "Notebooks & Celulares") desde el menú lateral, verás una tabla con todos los activos serializados registrados.

### 1.1. Entendiendo la Tabla de Inventario

La tabla principal te muestra la siguiente información:
- **Producto**: Marca y modelo del equipo.
- **Categoría**: El tipo de producto (ej. "Notebook", "Celular").
- **Nro. de Serie**: El identificador único del activo.
- **Estado**: El estado actual del activo. Los estados pueden ser:
    - `Disponible`: En stock, listo para ser asignado.
    - `Asignado`: Actualmente en uso por un empleado.
    - `En Reparación`: Fuera de servicio, en manos de un proveedor técnico.
    - `Dado de Baja`: Permanentemente fuera de servicio.
- **Acciones**: Botones para interactuar con cada activo.

### 1.2. Buscar y Filtrar

Para encontrar un activo específico rápidamente, puedes usar la barra de búsqueda para buscar por número de serie, marca o modelo.

## 2. Añadir un Nuevo Activo

Puedes añadir activos al inventario de dos formas:

### 2.1. Añadir un Único Ítem

1.  Haz clic en el botón **"Añadir Item"**.
2.  Se abrirá un modal donde deberás completar la siguiente información:
    *   **Producto**: Selecciona el tipo de producto (ej. "HP EliteBook 840 G8").
    *   **Número de Serie**: Ingresa el número de serie único del equipo.
3.  Haz clic en **"Guardar"**. El nuevo activo aparecerá en la lista con estado "Disponible".

### 2.2. Añadir por Lote

Esta opción es útil cuando recibes múltiples unidades del mismo producto.
1.  Haz clic en el botón **"Añadir Lote"**.
2.  Selecciona el **Producto** del cual vas a ingresar varias unidades.
3.  En el campo de texto, ingresa los **números de serie** de cada unidad, uno por línea.
4.  Haz clic en **"Guardar Lote"**. El sistema creará un registro individual para cada número de serie ingresado.

## 3. Ver el Historial de un Activo

Cada activo tiene un historial completo de su ciclo de vida. Para verlo:
1.  Busca el activo en la tabla.
2.  En la columna "Acciones", haz clic en el icono de **reloj (o historial)**.
3.  Se abrirá un modal o un panel lateral con una línea de tiempo que muestra:
    *   **Creación**: Cuándo se dio de alta el activo.
    *   **Asignaciones**: Todas las veces que fue asignado a un empleado, incluyendo fechas y detalles.
    *   **Devoluciones**: Cuándo fue devuelto.
    *   **Reparaciones**: Si fue enviado a reparar, los detalles del proveedor y el problema.
    *   **Cambios de Estado**: Cualquier otra modificación relevante.

## 4. Enviar un Activo a Reparación

Cuando un equipo presenta fallas, puedes gestionar su reparación desde StockIT.

1.  Busca el activo que necesita ser reparado. Debe estar en estado "Disponible".
2.  Haz clic en el botón de acciones y selecciona **"Enviar a Reparación"** (icono de herramienta).
3.  Completa el formulario:
    *   **Proveedor**: El servicio técnico que realizará la reparación.
    *   **Descripción del Problema**: Detalla la falla que presenta el equipo.
4.  Al guardar, el estado del activo cambiará a **"En Reparación"**.

El seguimiento del retorno de la reparación se gestiona desde el módulo de "Reparaciones". 