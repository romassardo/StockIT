# Hoja de Ruta de Mejoras Estratégicas - StockIT

Este documento describe las próximas tareas de desarrollo enfocadas en mejorar la experiencia de usuario (UX), optimizar los flujos de trabajo y alinear la aplicación con las mejores prácticas para sistemas de gestión de inventario IT.

## Fase 1: Flujos de Trabajo Fundamentales

### Tarea 1.1: Completar el Ciclo de Vida de Reparaciones (Prioridad Alta)

**Objetivo:** Permitir al usuario gestionar el retorno de un activo desde el servicio técnico, completando así el flujo de reparaciones.

**Pasos Backend:**
- [x] **1.1.1:** Diseñar y crear el Stored Procedure `sp_Repair_Return`.
  - **Parámetros:** `@reparacion_id`, `@solucion_descripcion`, `@estado_final_reparacion` ('Reparado', 'Sin Reparación'), `@estado_final_inventario` ('Disponible', 'Dado de Baja'), `@usuario_id`.
  - **Lógica:** Actualizar `Reparaciones`, `InventarioIndividual` y crear un registro en `LogsActividad`.
- [x] **1.1.2 (Refactorización):** Crear el archivo `backend/src/controllers/repair.controller.ts`.
- [x] **1.1.3 (Refactorización):** Crear el archivo `backend/src/routes/repair.routes.ts`.
- [x] **1.1.4 (Refactorización):** Mover toda la lógica de reparaciones existente desde `inventory.controller.ts` al nuevo `repair.controller.ts`.
- [x] **1.1.5:** Implementar el endpoint `PUT /api/repairs/:id/return` en `repair.routes.ts` que llame al nuevo método en `repair.controller.ts`. **NOTA: La lógica del método ha sido implementada y está lista para pruebas.**

**Pasos Frontend:**
- [x] **1.1.6:** En la página de Reparaciones (`RepairsPage.tsx`), añadir una columna "Acciones" a la tabla.
- [x] **1.1.7:** Añadir un botón "Gestionar Retorno" en la nueva columna para cada item.
- [x] **1.1.8:** Crear un nuevo componente modal: `frontend/src/components/modals/RepairReturnModal.tsx`.
- [x] **1.1.9:** Implementar la lógica del modal para manejar los dos escenarios:
  - Opción "Reparado con Éxito" (cambia estado a 'Disponible').
  - Opción "Sin Reparación / Dar de Baja" (cambia estado a 'Dado de Baja', con motivo obligatorio).
- [x] **1.1.10:** Conectar el modal al nuevo endpoint del backend y refrescar la lista de reparaciones al completarse. **NOTA: La conexión arrojaba errores por un problema en el backend, que ya fue corregido. Pendiente de prueba final.**

**Mejoras Adicionales Implementadas Durante la Sesión:**
- [x] **Búsqueda Global:** Se añadió funcionalidad de búsqueda en la página de reparaciones, afectando a `sp_Repair_GetActive`, `repair.controller.ts` y `RepairsPage.tsx`.
- [x] **Corrección de Bugs Críticos:**
  - Resuelto error 500 en `GET /api/repairs/active` por formato de parámetros incorrecto.
  - Corregido `TypeError` en `RepairsPage.tsx` por inconsistencia de `id` vs `reparacion_id`.
  - Solucionado error de `undefined` en columna "Activo" dividiéndola en "Producto" y "N° de Serie".
  - Arreglado fondo transparente de modales con la clase `.glass-card-deep`.

**Próximo Paso Inmediato:**
- Abordar la Tarea 3.1: Evolucionar hacia la "Vista Unificada de Activo", comenzando por asegurar que el historial del activo muestre los logs de reparación correctamente.

---

## Fase 2: Mejoras de Eficiencia (Quick Wins)

### Tarea 2.1: Implementar Alta Masiva de Activos Serializados

**Objetivo:** Reducir drásticamente el tiempo necesario para registrar lotes de equipos idénticos.

**Pasos Backend:**
- [x] **2.1.1:** Diseñar y crear un Stored Procedure para alta masiva, que acepte una lista de números de serie (ej: a través de un tipo de tabla o un string delimitado).
- [x] **2.1.2:** Implementar el endpoint `POST /api/inventory/batch` en `inventory.controller.ts`.
- [x] **2.1.3:** La lógica del endpoint debe procesar la lista, llamar al SP y devolver un resumen del resultado (ej: "20 creados, 2 duplicados").

**Pasos Frontend:**
- [x] **2.1.4:** Añadir un botón "Añadir Lote" en la página de Inventario (`Inventory.tsx`).
- [x] **2.1.5:** Crear un nuevo componente modal: `frontend/src/components/inventory/BatchEntryModal.tsx`.
- [x] **2.1.6:** El modal debe permitir seleccionar un producto y pegar una lista de números de serie en un `<textarea>`.
- [x] **2.1.7:** Implementar la llamada al endpoint de alta masiva y mostrar el resumen del resultado al usuario.

---

## Fase 3: Refactorización Estratégica de la Experiencia de Usuario

### Tarea 3.1: Evolucionar hacia la "Vista Unificada de Activo"

**Objetivo:** Centralizar toda la información y acciones de un activo en una única vista contextual para evitar la navegación innecesaria entre páginas.

**Pasos Frontend (Evolutivos):**
- [x] **3.1.1 (Fase 1 - Enriquecer):** Modificar el modal `InventoryDetail.tsx` para que muestre claramente el contexto actual del activo (a quién está asignado o a qué proveedor de reparación fue enviado).
- [x] **3.1.2 (Fase 2 - Acciones Contextuales):** Añadir una sección de "Acciones Rápidas" dentro del modal `InventoryDetail.tsx`. Los botones mostrados deben depender del estado actual del activo ("Asignar", "Registrar Devolución", "Enviar a Reparar", "Gestionar Retorno").
- [x] **3.1.3 (Fase 3 - Unificar):** Hacer que al hacer clic en un activo desde CUALQUIER página (Inventario, Asignaciones, Reparaciones) se abra este modal unificado.
- [x] **3.1.4 (Opcional, Futuro):** Evaluar la conversión del modal a un panel lateral deslizable (`drawer`) para una experiencia aún más fluida.

---

## Fase 4: Mejoras de Usabilidad General

### Tarea 4.1: Crear el "Centro de Control de Stock General"

**Objetivo:** Simplificar y agilizar la gestión de productos no serializados (stock por cantidad).

**Pasos Frontend:**
- [x] **4.1.1:** Crear una nueva página `StockControl.tsx` que muestre una tabla-dashboard de todos los productos de stock general.
- [x] **4.1.2:** La tabla debe incluir columnas para "Stock Actual" y "Acciones Rápidas".
- [x] **4.1.3:** Implementar botones `+ Entrada` y `- Salida` en la columna de acciones.
- [x] **4.1.4:** Modificar los modales existentes (`StockEntryModal`, `StockExitModal`) para que puedan ser invocados desde esta tabla, pre-cargando el producto seleccionado.

---

## Fase 5: Visión a Futuro

### Tarea 5.1: Implementar Paleta de Comandos Global

**Objetivo:** Ofrecer una herramienta para "power users" que permita realizar búsquedas y acciones rápidas desde cualquier lugar de la aplicación.

**Pasos Backend:**
- [ ] **5.1.1:** Diseñar un endpoint de búsqueda global `GET /api/search/command` que pueda interpretar consultas complejas y buscar en múltiples tablas (activos, empleados, productos, etc.).

**Pasos Frontend:**
- [ ] **5.1.2:** Crear un componente `CommandPalette.tsx` que se active con un atajo de teclado (`Ctrl+K`).
- [ ] **5.1.3:** Implementar la lógica para llamar al endpoint de búsqueda y mostrar los resultados (activos, acciones, navegación).
- [ ] **5.1.4:** Implementar la ejecución de acciones rápidas directamente desde la paleta. 

---

## Fase 6: Módulo de Consulta de Datos Sensibles

### Tarea 6.1: Crear la Página de "Consulta Rápida / Bóveda de Datos" (Prioridad Crítica)

**Objetivo:** Crear una página dedicada para que el equipo de soporte pueda buscar y consultar rápidamente datos sensibles de asignaciones (contraseñas de encriptación, IMEIs, cuentas de Gmail, etc.) sin interferir con los flujos de gestión de inventario.

**Nota de Diseño Obligatoria:** La implementación visual de esta página debe seguir **estrictamente** las especificaciones del documento `design-UX-UI-guide.md`. Se espera que esta página sea un ejemplo del "Modern Design System 2025", utilizando efectos de glassmorphism, gradientes, tipografía moderna y el sistema de orbes de fondo estándar.

**Pasos Backend:**
- [x] **6.1.1:** Diseñar un nuevo Stored Procedure `sp_Search_SensitiveData` que acepte un término de búsqueda y busque en múltiples campos relevantes (N° Serie, Empleado, IMEI, N° Teléfono, etc.) de las asignaciones activas.
- [x] **6.1.2:** Implementar un nuevo endpoint `GET /api/search/sensitive` en un controlador de búsqueda (`search.controller.ts`) que llame al nuevo SP.
- [x] **6.1.3:** Asegurar que el endpoint devuelva una estructura de datos clara y segura, conteniendo todos los datos necesarios para la vista del frontend.

**Pasos Frontend:**
- [x] **6.1.4:** Crear una nueva ruta y una nueva página `QuickLookupPage.tsx`.
- [x] **6.1.5:** Añadir un enlace a esta nueva página en el menú de navegación lateral, posiblemente con un ícono de "llave" o "búsqueda avanzada".
- [x] **6.1.6:** Diseñar la página con un componente principal de barra de búsqueda.
- [x] **6.1.7:** Implementar la lógica para llamar al nuevo endpoint del backend a medida que el usuario escribe (con "debounce" para no sobrecargar el servidor).
- [x] **6.1.8:** Diseñar y crear un componente `ResultCard.tsx` que muestre los datos del activo encontrado de forma clara y ordenada.
- [x] **6.1.9:** Integrar botones de "Copiar al portapapeles" en la `ResultCard` para cada campo de dato sensible, mejorando drásticamente la usabilidad para el equipo de soporte.

**Implementación Final y Conclusión (COMPLETADO):**
- **Arquitectura:** Se implementó una solución de dos pasos más robusta. El `sp_Search_Global` existente se usa para la búsqueda inicial de resumen. Luego, si el resultado es una asignación, se llama a un segundo SP (`sp_Assignment_GetDetailsById`) a través del endpoint `GET /api/assignments/:id/details` para obtener los datos sensibles completos.
- **Componentes:** La página se llamó `Vault.tsx` y se crearon los componentes `SearchResultCard.tsx` y `SensitiveDataModal.tsx`. El modal fue refactorizado para ser "inteligente", gestionando su propia llamada a la API para obtener los detalles.
- **Resultado:** La funcionalidad está 100% completada. Se solucionaron bugs críticos relacionados con renderizados en bucle (`Maximum update depth exceeded`), validación de longitud de búsqueda (Error 400) e inconsistencias de parámetros entre el controlador y el Stored Procedure. La Bóveda de Datos es ahora una herramienta estable, eficiente y crucial para el equipo de soporte. 