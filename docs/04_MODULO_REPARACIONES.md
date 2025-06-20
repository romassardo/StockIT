# Guía Detallada: Módulo de Reparaciones

Este módulo te permite llevar un control preciso del flujo de reparación de los activos serializados (**Notebooks y Celulares**).

## 1. Ver los Activos en Reparación

La pantalla principal de "Reparaciones" te muestra una tabla con todos los equipos que actualmente se encuentran en un servicio técnico.

- **Activo**: El equipo en reparación.
- **Nro. de Serie**: Su identificador único.
- **Proveedor**: La empresa o persona que está realizando la reparación.
- **Fecha de Envío**: Cuándo se envió el equipo.
- **Problema Reportado**: La descripción de la falla.
- **Usuario que Envía**: Quién registró el envío en el sistema.
- **Acciones**: Opciones para gestionar el retorno del equipo.

## 2. Enviar un Activo a Reparación

El proceso de envío a reparación se inicia desde el módulo de **Inventario**.

1.  Ve a la sección "Inventario".
2.  Busca un equipo que esté en estado **"Disponible"**.
3.  Haz clic en el botón de acciones y selecciona **"Enviar a Reparación"**.
4.  Completa el formulario con los detalles del proveedor y el problema.
5.  El estado del activo cambiará a **"En Reparación"** y aparecerá en la lista de este módulo.

> **Nota:** También puedes enviar a reparar un equipo directamente desde la lista de "Asignaciones Activas" si un empleado reporta un problema. El sistema te guiará para primero devolverlo (pasará a "Disponible") y luego enviarlo a reparar.

## 3. Procesar el Retorno de una Reparación

Una vez que el proveedor devuelve el equipo, debes registrar el resultado en StockIT.

1.  En la tabla de "Reparaciones Activas", busca el equipo que ha regresado.
2.  En la columna "Acciones", haz clic en el botón **"Procesar Retorno"**.
3.  Se abrirá un modal donde deberás indicar el resultado:
    *   **Solución Aplicada**: Describe qué reparación se realizó.
    *   **Estado Final**:
        *   **Reparado**: Si el equipo fue arreglado exitosamente.
        *   **Sin Reparación / Baja**: Si el equipo no pudo ser reparado.

### 3.1. Consecuencias del Estado Final

- **Si eliges "Reparado"**:
  - La reparación se marcará como completada.
  - El estado del activo en el inventario volverá a ser **"Disponible"**, listo para ser asignado de nuevo.

- **Si eliges "Sin Reparación / Baja"**:
  - La reparación se registrará como fallida.
  - El estado del activo en el inventario cambiará a **"Dado de Baja"**, y ya no podrá ser asignado.

Este proceso asegura que el historial del activo refleje con precisión todos los intentos de reparación y su resultado final. 