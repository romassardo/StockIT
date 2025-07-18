-- ========================================
-- DATOS DE PRUEBA PARA STOCKIT MYSQL
-- Resolver errores 500 del frontend
-- ========================================

USE stockit_mysql;

-- 1. CATEGORÍAS BASE
INSERT IGNORE INTO categorias (id, nombre, requiere_serie, permite_asignacion, permite_reparacion, activo) VALUES
(1, 'Computadoras', 1, 1, 1, 1),
(2, 'Celulares', 1, 1, 1, 1),
(3, 'Periféricos', 0, 0, 0, 1),
(4, 'Consumibles', 0, 0, 0, 1),
(5, 'Componentes', 0, 0, 0, 1);

-- 2. PRODUCTOS BASE (algunos con serie, otros sin serie)
INSERT IGNORE INTO productos (id, categoria_id, marca, modelo, descripcion, stock_minimo, usa_numero_serie, activo) VALUES
-- Notebooks (con número de serie)
(1, 1, 'Dell', 'Latitude 5520', 'Laptop Dell Latitude 5520 i5 8GB 256GB SSD', 2, 1, 1),
(2, 1, 'HP', 'EliteBook 840 G8', 'HP EliteBook 840 G8 i7 16GB 512GB SSD', 2, 1, 1),
(3, 1, 'Lenovo', 'ThinkPad E14', 'Lenovo ThinkPad E14 i5 8GB 256GB SSD', 2, 1, 1),
-- Celulares (con número de serie)
(4, 2, 'Samsung', 'Galaxy A52', 'Samsung Galaxy A52 5G 128GB', 3, 1, 1),
(5, 2, 'Motorola', 'Moto G60', 'Motorola Moto G60 128GB', 3, 1, 1),
-- Periféricos (sin número de serie - manejo por stock)
(6, 3, 'Logitech', 'K120', 'Teclado Logitech K120 USB', 10, 0, 1),
(7, 3, 'Genius', 'DX-110', 'Mouse Genius DX-110 USB', 15, 0, 1),
(8, 3, 'HP', 'V194', 'Monitor HP V194 18.5 pulgadas', 5, 0, 1),
(9, 3, 'Epson', 'L3150', 'Impresora Epson L3150 Multifunción', 2, 0, 1),
-- Consumibles (sin número de serie)
(10, 4, 'Generic', 'Cable HDMI', 'Cable HDMI 2 metros', 20, 0, 1),
(11, 4, 'Duracell', 'Pilas AA', 'Pilas Duracell AA alcalinas pack x4', 50, 0, 1),
(12, 4, 'HP', 'Toner 85A', 'Toner HP 85A negro original', 10, 0, 1),
-- Componentes (sin número de serie)
(13, 5, 'Kingston', 'RAM 8GB DDR4', 'Memoria RAM Kingston 8GB DDR4 2666MHz', 15, 0, 1),
(14, 5, 'Western Digital', 'SSD 480GB', 'Disco SSD WD Green 480GB SATA', 8, 0, 1);

-- 3. EMPLEADOS DE PRUEBA
INSERT IGNORE INTO empleados (id, nombre, apellido, activo) VALUES
(1, 'Juan', 'Pérez', 1),
(2, 'María', 'González', 1),
(3, 'Carlos', 'Rodríguez', 1),
(4, 'Ana', 'Martínez', 1),
(5, 'Luis', 'López', 1),
(6, 'Carmen', 'Fernández', 1),
(7, 'Diego', 'Sánchez', 1),
(8, 'Laura', 'García', 1);

-- 4. SECTORES DE PRUEBA
INSERT IGNORE INTO sectores (id, nombre, activo) VALUES
(1, 'Administración', 1),
(2, 'Contabilidad', 1),
(3, 'Recursos Humanos', 1),
(4, 'Sistemas', 1),
(5, 'Compras', 1),
(6, 'Marketing', 1),
(7, 'Gerencia', 1),
(8, 'Logística', 1);

-- 5. SUCURSALES DE PRUEBA
INSERT IGNORE INTO sucursales (id, nombre, activo) VALUES
(1, 'Sucursal Centro', 1),
(2, 'Sucursal Norte', 1),
(3, 'Sucursal Sur', 1),
(4, 'Sucursal Este', 1),
(5, 'Sucursal Oeste', 1),
(6, 'Casa Central', 1),
(7, 'Depósito Principal', 1),
(8, 'Oficina Comercial', 1);

-- 6. INVENTARIO INDIVIDUAL (solo para productos con número de serie)
INSERT IGNORE INTO inventarioindividual (id, producto_id, numero_serie, estado, fecha_ingreso, usuario_alta_id) VALUES
-- Notebooks disponibles
(1, 1, 'DLL5520-001', 'Disponible', '2025-01-15 10:00:00', 1),
(2, 1, 'DLL5520-002', 'Disponible', '2025-01-15 10:05:00', 1),
(3, 2, 'HP840G8-001', 'Disponible', '2025-01-16 14:00:00', 1),
(4, 3, 'LNV-E14-001', 'Disponible', '2025-01-17 09:00:00', 1),
-- Notebooks asignadas
(5, 1, 'DLL5520-003', 'Asignado', '2025-01-10 11:00:00', 1),
(6, 2, 'HP840G8-002', 'Asignado', '2025-01-12 15:30:00', 1),
-- Celulares disponibles
(7, 4, 'SAM-A52-001', 'Disponible', '2025-01-18 10:00:00', 1),
(8, 4, 'SAM-A52-002', 'Disponible', '2025-01-18 10:15:00', 1),
(9, 5, 'MOT-G60-001', 'Disponible', '2025-01-19 11:00:00', 1),
-- Celulares asignados
(10, 4, 'SAM-A52-003', 'Asignado', '2025-01-14 16:00:00', 1),
-- Equipos en reparación
(11, 1, 'DLL5520-004', 'En Reparación', '2025-01-08 08:00:00', 1);

-- 7. STOCK GENERAL (solo para productos sin número de serie)
INSERT IGNORE INTO stockgeneral (id, producto_id, cantidad_actual, ultima_actualizacion, ubicacion) VALUES
(1, 6, 25, '2025-01-20 10:00:00', 'Almacén Principal'),      -- Teclados
(2, 7, 30, '2025-01-20 10:00:00', 'Almacén Principal'),      -- Mouse
(3, 8, 8, '2025-01-20 10:00:00', 'Almacén Principal'),       -- Monitores
(4, 9, 3, '2025-01-20 10:00:00', 'Almacén Principal'),       -- Impresoras
(5, 10, 45, '2025-01-20 10:00:00', 'Almacén Consumibles'),   -- Cables HDMI
(6, 11, 120, '2025-01-20 10:00:00', 'Almacén Consumibles'),  -- Pilas AA
(7, 12, 15, '2025-01-20 10:00:00', 'Almacén Consumibles'),   -- Toner HP
(8, 13, 20, '2025-01-20 10:00:00', 'Almacén Componentes'),   -- RAM 8GB
(9, 14, 12, '2025-01-20 10:00:00', 'Almacén Componentes');   -- SSD 480GB

-- 8. ASIGNACIONES DE PRUEBA (solo para equipos con número de serie)
INSERT IGNORE INTO asignaciones (id, inventario_individual_id, empleado_id, sector_id, sucursal_id, fecha_asignacion, 
                                password_encriptacion, cuenta_gmail, numero_telefono, activa, usuario_asigna_id) VALUES
-- Notebooks asignadas a empleados
(1, 5, 1, 4, 1, '2025-01-10 11:30:00', 'nb-encryption-001', NULL, NULL, 1, 1),
(2, 6, 2, 2, 1, '2025-01-12 16:00:00', 'nb-encryption-002', NULL, NULL, 1, 1),
-- Celular asignado a empleado
(3, 10, 3, 1, 2, '2025-01-14 16:30:00', NULL, 'carlos.trabajo@empresa.com', '+5491123456789', 1, 1);

-- 9. REPARACIONES DE PRUEBA
INSERT IGNORE INTO reparaciones (id, inventario_individual_id, fecha_envio, proveedor, problema_descripcion, 
                                 estado, usuario_envia_id) VALUES
(1, 11, '2025-01-08 09:00:00', 'Servicio Técnico Dell', 'Pantalla con líneas horizontales', 'En Reparación', 1);

-- 10. MOVIMIENTOS DE STOCK DE PRUEBA (para productos sin número de serie)
INSERT IGNORE INTO movimientosstock (id, producto_id, tipo_movimiento, cantidad, fecha_movimiento, 
                                     usuario_id, motivo, observaciones) VALUES
-- Entradas iniciales de stock
(1, 6, 'Entrada', 30, '2025-01-15 08:00:00', 1, 'Compra inicial', 'Stock inicial teclados'),
(2, 7, 'Entrada', 35, '2025-01-15 08:30:00', 1, 'Compra inicial', 'Stock inicial mouse'),
(3, 10, 'Entrada', 50, '2025-01-16 09:00:00', 1, 'Compra inicial', 'Stock inicial cables'),
-- Salidas por consumo
(4, 6, 'Salida', 5, '2025-01-18 14:00:00', 1, 'Asignación', 'Entregados a empleados'),
(5, 7, 'Salida', 5, '2025-01-18 14:15:00', 1, 'Asignación', 'Entregados a empleados'),
(6, 10, 'Salida', 5, '2025-01-19 10:00:00', 1, 'Instalación', 'Cables para setup oficinas');

-- 11. LOGS DE ACTIVIDAD DE PRUEBA
INSERT IGNORE INTO logsactividad (id, usuario_id, tabla_afectada, accion, registro_id, descripcion, fecha_hora) VALUES
(1, 1, 'InventarioIndividual', 'CREATE', 1, 'Alta de notebook Dell Latitude 5520', '2025-01-15 10:01:00'),
(2, 1, 'Asignaciones', 'CREATE', 1, 'Asignación de notebook a Juan Pérez', '2025-01-10 11:31:00'),
(3, 1, 'Reparaciones', 'CREATE', 1, 'Envío a reparación notebook Dell', '2025-01-08 09:01:00'),
(4, 1, 'StockGeneral', 'UPDATE', 1, 'Entrada de stock: 30 teclados', '2025-01-15 08:01:00'),
(5, 1, 'MovimientosStock', 'CREATE', 4, 'Salida: 5 teclados por asignación', '2025-01-18 14:01:00');

-- ========================================
-- VERIFICACIÓN FINAL
-- ========================================
SELECT 'DATOS INSERTADOS CORRECTAMENTE' as STATUS;

SELECT 
  'RESUMEN DE DATOS' as INFO,
  (SELECT COUNT(*) FROM productos) as productos,
  (SELECT COUNT(*) FROM inventarioindividual) as inventario_individual,
  (SELECT COUNT(*) FROM stockgeneral) as stock_general,
  (SELECT COUNT(*) FROM empleados) as empleados,
  (SELECT COUNT(*) FROM asignaciones WHERE activa = 1) as asignaciones_activas,
  (SELECT COUNT(*) FROM reparaciones) as reparaciones; 