# Guía Detallada: Módulo de Stock General

Este módulo se utiliza para administrar todos los productos que se gestionan por **cantidad** y no por número de serie individual. Esto incluye periféricos, consumibles y componentes.

## 1. Visualizar el Stock

Al ingresar a la sección "Stock General", verás una tabla con un resumen de todos los productos sin número de serie.

### 1.1. Entendiendo la Tabla de Stock

- **Producto**: La marca y modelo del producto.
- **Categoría**: La categoría a la que pertenece (ej. "Periféricos", "Consumibles").
- **Stock Actual**: La cantidad de unidades disponibles actualmente.
- **Stock Mínimo**: El umbral definido para este producto. Si el stock actual está por debajo de este número, se considera una alerta.
- **Estado**: Un indicador visual que te muestra si el stock está:
    - `Correcto`: Por encima del mínimo.
    - `Stock Bajo`: Por debajo del mínimo.
    - `Sin Stock`: Agotado.
- **Acciones**: Botones para registrar movimientos.

## 2. Registrar Movimientos de Stock

La gestión de estos productos se basa en dos operaciones principales: entradas y salidas.

### 2.1. Registrar una Entrada de Stock

Usa esta opción cuando la empresa adquiere nuevas unidades de un producto.

1.  Haz clic en el botón **"Registrar Entrada"**.
2.  En el modal que aparece, completa los campos:
    *   **Producto**: Busca y selecciona el producto al que darás entrada.
    *   **Cantidad**: El número de unidades que ingresan.
    *   **Motivo**: Opcional, puedes indicar si es por una compra, una devolución interna, etc.
    *   **Observaciones**: Cualquier detalle adicional.
3.  Haz clic en **"Guardar"**. La cantidad ingresada se sumará al stock actual del producto.

### 2.2. Registrar una Salida de Stock

Usa esta opción cuando entregas un producto a un empleado, un sector o para consumo general.

1.  Haz clic en el botón **"Registrar Salida"**.
2.  Completa el formulario:
    *   **Producto**: Busca y selecciona el producto que se va a retirar. El sistema te mostrará el stock actual.
    *   **Cantidad**: El número de unidades a retirar. No puedes sacar más de la cantidad disponible.
    *   **Destino**: Opcional pero recomendado. Puedes especificar si el producto fue para un **Empleado**, **Sector** o **Sucursal**.
    *   **Motivo**: Razón de la salida (ej. "Consumo", "Préstamo", "Reemplazo").
3.  Haz clic en **"Guardar"**. La cantidad se descontará del stock actual.

## 3. Ver Historial de Movimientos

Para entender cómo ha variado el stock de un producto a lo largo del tiempo:

1.  En la tabla de stock, busca el producto que te interesa.
2.  En la columna "Acciones", haz clic en el icono de **historial o movimientos**.
3.  Se abrirá un modal con un listado de todas las **entradas y salidas** de ese producto, mostrando la fecha, la cantidad, el tipo de movimiento y el usuario que lo registró.
4.  Esto te permite tener una trazabilidad completa del consumo de cada ítem. 