# Guía Detallada: Módulo de Asignaciones

Este módulo es central para el control y seguimiento de los activos más importantes: **Notebooks y Celulares**. Aquí se gestiona el ciclo de vida de la asignación de un equipo a un responsable.

## 1. Ver las Asignaciones Activas

La pantalla principal de "Asignaciones" muestra una tabla con todos los equipos que están actualmente asignados.

- **Activo**: El equipo específico (ej. "Dell Latitude 5520").
- **Nro. de Serie**: Identificador único del equipo.
- **Asignado a**: El nombre del empleado responsable.
- **Ubicación**: El sector o sucursal donde se encuentra el empleado.
- **Fecha de Asignación**: Cuándo se le entregó el equipo.
- **Acciones**: Opciones para gestionar la asignación (ej. devolver, ver detalles).

Puedes usar los filtros para encontrar rápidamente asignaciones por empleado, estado o fechas.

## 2. Crear una Nueva Asignación

Este es el proceso para entregar un notebook o celular a un empleado.

1.  Desde la página de "Asignaciones" o "Inventario", busca un activo que esté en estado **"Disponible"**.
2.  Selecciona la opción **"Asignar"**.
3.  Se abrirá el formulario de asignación. Rellena los siguientes campos:
    *   **Empleado**: Selecciona el empleado que recibirá el equipo.
    *   **Ubicación**: Indica el **Sector** o la **Sucursal** del empleado.
    *   **Observaciones**: Cualquier nota relevante sobre la entrega.

### 2.1. Campos Específicos por Tipo de Activo

Dependiendo del activo, deberás completar información adicional **obligatoria**:

#### Para Notebooks:
- **Contraseña de Encriptación**: La contraseña del disco (BitLocker, etc.). Este dato es crucial para futuras recuperaciones.

#### Para Celulares:
- **Número de Teléfono**: La línea asociada al dispositivo.
- **Cuenta de Gmail**: La cuenta de Google configurada.
- **Contraseña de Gmail**: La contraseña de la cuenta.
- **Código 2FA WhatsApp**: El código de recuperación de WhatsApp.

4.  Haz clic en **"Confirmar Asignación"**. El estado del activo cambiará a **"Asignado"** y se creará un registro permanente de esta asignación.

## 3. Devolver un Activo

Cuando un empleado deja la compañía o cambia de equipo, debes procesar la devolución.

1.  En la lista de "Asignaciones Activas", busca el equipo que deseas devolver.
2.  En la columna "Acciones", haz clic en el botón **"Devolver"**.
3.  Se abrirá un modal de confirmación. Puedes añadir observaciones sobre el estado en que se devuelve el equipo (ej. "Carcasa rayada", "Funciona perfectamente").
4.  Confirma la devolución.
5.  El sistema realizará dos acciones clave:
    *   La asignación actual se marcará como "Devuelta" (inactiva).
    *   El estado del activo en el inventario volverá a ser **"Disponible"**, listo para una nueva asignación o para ser enviado a reparación si es necesario.

## 4. Consultar Datos Sensibles (Bóveda)

A veces, necesitarás consultar rápidamente la contraseña de una notebook o los datos de un celular asignado. Para esto se utiliza la **Bóveda de Datos**.

1.  Ve al módulo "Bóveda" en el menú lateral.
2.  Usa la barra de búsqueda para encontrar el activo por su número de serie, empleado, etc.
3.  El sistema te mostrará la información sensible asociada a esa asignación, con botones para copiar los datos fácilmente. 