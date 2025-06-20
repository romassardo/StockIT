# Manual de Usuario - StockIT

¡Bienvenido a StockIT! Esta guía está diseñada para ayudarte a navegar y utilizar todas las funcionalidades del sistema de gestión de inventario y activos de IT.

## 1. Introducción

### 1.1. ¿Qué es StockIT?
StockIT es una aplicación web moderna diseñada para simplificar la gestión del inventario de IT. Permite llevar un control detallado tanto de activos individuales con número de serie (como notebooks y celulares) como de productos de consumo general (como teclados, mouses y cables).

### 1.2. Dos Tipos de Inventario
Es fundamental entender que StockIT maneja dos tipos de productos de forma diferente:

*   **Activos con Número de Serie (Inventario Individual):**
    *   **¿Qué son?** Notebooks y Celulares.
    *   **¿Cómo se gestionan?** Cada unidad es única y se rastrea por su número de serie. Tienen un historial completo de asignaciones y reparaciones.
    *   **Estados:** Disponible, Asignado, En Reparación, Dado de Baja.

*   **Activos de Stock General:**
    *   **¿Qué son?** Todo lo demás (monitores, teclados, cables, componentes, etc.).
    *   **¿Cómo se gestionan?** Por cantidad total en stock. No tienen número de serie individual.
    *   **Operaciones:** Se registran entradas (compras) y salidas (consumo) de cantidades.

## 2. Primeros Pasos

### 2.1. Iniciar Sesión
Para acceder a StockIT, necesitarás un nombre de usuario y una contraseña proporcionados por el administrador del sistema.

1.  Navega a la página de inicio de StockIT.
2.  Ingresa tu email y contraseña.
3.  Haz clic en el botón "Iniciar Sesión".

### 2.2. Panel de Control (Dashboard)
Al iniciar sesión, serás recibido por el Panel de Control. Este te ofrece una vista rápida del estado actual del inventario:
-   **Estadísticas Generales**: Widgets que muestran el total de activos, el estado de los equipos serializados y las alertas de stock.
-   **Actividad Reciente**: Un resumen de las últimas acciones realizadas en el sistema.
-   **Gráficos**: Visualizaciones del inventario.

## 3. Módulos Principales

A continuación, se detalla el funcionamiento de cada sección principal de StockIT, accesible desde el menú lateral.

### 3.1. Gestión de Inventario (Notebooks y Celulares)

Esta sección se centra en la gestión de activos que tienen un número de serie único.

*   **Ver Inventario**: Visualiza una lista de todos los notebooks y celulares, con su estado actual (Disponible, Asignado, etc.).
*   **Añadir Nuevos Activos**: Registra nuevos equipos en el sistema, ya sea de forma individual o por lotes.
*   **Ver Detalles**: Consulta el historial completo de un activo, incluyendo todas sus asignaciones y reparaciones pasadas.
*   **Enviar a Reparación**: Inicia el proceso de reparación para un activo.

➡️ **Ver guía detallada:** [Módulo de Inventario](./01_MODULO_INVENTARIO.md)

### 3.2. Gestión de Stock General

Esta sección es para todos los productos que no tienen número de serie y se gestionan por cantidad (ej. teclados, mouses, cables, toners).

*   **Ver Stock**: Revisa las cantidades actuales de todos los productos de consumo.
*   **Registrar Entrada**: Añade unidades al stock cuando se recibe nuevo material.
*   **Registrar Salida**: Descuenta unidades del stock cuando se entregan a un empleado o sector.
*   **Ver Movimientos**: Consulta un historial de todas las entradas y salidas para un producto específico.

➡️ **Ver guía detallada:** [Módulo de Stock General](./02_MODULO_STOCK.md)

### 3.3. Gestión de Asignaciones

Este módulo es exclusivamente para **Notebooks y Celulares**. Aquí es donde se formaliza la entrega de un equipo a un empleado.

*   **Asignar un Activo**: Busca un equipo disponible y asígnalo a un empleado, especificando su ubicación (sector/sucursal).
*   **Registrar Datos Clave**: Al asignar, puedes (y debes) registrar información crítica como la contraseña de encripción de una notebook o los datos de la cuenta de un celular.
*   **Devolver un Activo**: Procesa la devolución de un equipo cuando el empleado lo regresa. El activo vuelve a estar "Disponible".
*   **Ver Asignaciones Activas**: Consulta una lista de todos los equipos que están actualmente en uso y quién los tiene.

➡️ **Ver guía detallada:** [Módulo de Asignaciones](./03_MODULO_ASIGNACIONES.md)

### 3.4. Gestión de Reparaciones

Este módulo, también exclusivo para **Notebooks y Celulares**, te permite gestionar el proceso de envío y retorno de equipos a servicios técnicos.

*   **Ver Reparaciones Activas**: Consulta la lista de todos los equipos que se encuentran actualmente en un proveedor para ser reparados.
*   **Procesar Retorno**: Cuando un equipo vuelve del servicio técnico, registra si fue reparado con éxito o si no tuvo solución.
*   **Historial de Reparaciones**: Cada reparación queda registrada en el historial del activo.

➡️ **Ver guía detallada:** [Módulo de Reparaciones](./04_MODULO_REPARACIONES.md)

### 3.5. Hub de Reportes

StockIT incluye un potente módulo de reportes para que puedas analizar el estado de tu inventario desde diferentes perspectivas.

*   **Generar Reportes**: Accede a reportes predefinidos como "Stock Disponible", "Alertas de Stock", "Asignaciones por Empleado", y más.
*   **Filtros Avanzados**: Cada reporte cuenta con filtros específicos para que puedas acotar la información que necesitas.
*   **Exportar Datos**: La mayoría de los reportes te permiten exportar los datos a formato Excel para un análisis más profundo.

➡️ **Ver guía detallada:** [Módulo de Reportes](./05_MODULO_REPORTES.md)

## 4. Funciones Administrativas

Esta sección está dirigida a los usuarios con rol de **Administrador**.

### 4.1. Panel de Administración

El panel de administración es el centro de control para configurar y mantener StockIT.

*   **Gestión de Usuarios**: Crear, editar y desactivar las cuentas de usuario que pueden acceder al sistema.
*   **Gestión del Catálogo**: Definir los productos y categorías que se pueden gestionar en el inventario.
*   **Gestión de Entidades**: Administrar la lista de empleados, sectores y sucursales de la empresa.

➡️ **Ver guía detallada:** [Módulo de Administración](./06_MODULO_ADMIN.md)

## 5. Consejos Finales y Soporte

### 5.1. Bóveda de Datos (Vault)

Recuerda que tienes la **Bóveda de Datos** (icono de lupa en el menú) para realizar búsquedas rápidas de información sensible (contraseñas, datos de cuentas, etc.) de activos asignados. Es una herramienta muy poderosa para el día a día del soporte técnico.

### 5.2. ¿Necesitas Ayuda?

Si encuentras algún problema o tienes alguna duda que no esté cubierta en este manual, no dudes en contactar al equipo de desarrollo o a tu administrador de sistemas.

¡Gracias por usar StockIT! 