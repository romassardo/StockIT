-- ===================================================================
-- MIGRACIÓN DE DATOS DE SQL SERVER A MYSQL
-- ===================================================================
-- Este script te ayuda a migrar datos existentes de SQL Server a MySQL
-- IMPORTANTE: Ejecutar DESPUÉS de instalar el schema y los SPs

USE stockit_mysql;

-- ===================================================================
-- MÉTODO 1: MIGRACIÓN MANUAL (Recomendado para pocos datos)
-- ===================================================================

-- 1. USUARIOS (Exportar desde SQL Server y ajustar)
-- INSERT INTO Usuarios (nombre, email, password_hash, rol, activo, fecha_creacion) VALUES
-- ('Nombre1', 'email1@empresa.com', 'hash_password1', 'admin', TRUE, '2024-01-01'),
-- ('Nombre2', 'email2@empresa.com', 'hash_password2', 'usuario', TRUE, '2024-01-01');

-- 2. EMPLEADOS
-- INSERT INTO Empleados (nombre, apellido, activo) VALUES
-- ('Juan', 'Pérez', TRUE),
-- ('María', 'González', TRUE);

-- 3. SECTORES
-- INSERT INTO Sectores (nombre, activo) VALUES
-- ('Administración', TRUE),
-- ('Sistemas', TRUE);

-- 4. SUCURSALES 
-- INSERT INTO Sucursales (nombre, activo) VALUES
-- ('Casa Central', TRUE),
-- ('Sucursal Norte', TRUE);

-- 5. PRODUCTOS
-- INSERT INTO Productos (categoria_id, marca, modelo, descripcion, stock_minimo, usa_numero_serie, activo) VALUES
-- (1, 'Dell', 'Latitude 5520', 'Laptop empresarial', 2, TRUE, TRUE),
-- (2, 'Samsung', 'Galaxy A52', 'Smartphone', 5, TRUE, TRUE);

-- ===================================================================
-- MÉTODO 2: USANDO HERRAMIENTAS EXTERNAS
-- ===================================================================

/*
OPCIÓN A: MySQL Workbench Migration Wizard
1. Abrir MySQL Workbench
2. Database > Migration Wizard
3. Configurar conexión SQL Server origen
4. Configurar conexión MySQL destino
5. Seleccionar tablas a migrar
6. Ejecutar migración

OPCIÓN B: Usando mysqldump y bcp
1. Exportar datos de SQL Server a CSV:
   bcp "SELECT * FROM StockIT.dbo.Usuarios" queryout "usuarios.csv" -c -t"," -S servidor -U usuario -P password

2. Importar a MySQL:
   LOAD DATA INFILE 'usuarios.csv' 
   INTO TABLE Usuarios 
   FIELDS TERMINATED BY ',' 
   LINES TERMINATED BY '\n';

OPCIÓN C: Scripts de PowerShell/Python
- Crear scripts personalizados para transferir datos tabla por tabla
- Útil cuando hay transformaciones específicas necesarias
*/

-- ===================================================================
-- VERIFICACIÓN POST-MIGRACIÓN
-- ===================================================================

-- Verificar conteo de registros
SELECT 'Usuarios' as tabla, COUNT(*) as registros FROM Usuarios
UNION ALL
SELECT 'Empleados', COUNT(*) FROM Empleados  
UNION ALL
SELECT 'Sectores', COUNT(*) FROM Sectores
UNION ALL
SELECT 'Sucursales', COUNT(*) FROM Sucursales
UNION ALL
SELECT 'Productos', COUNT(*) FROM Productos
UNION ALL
SELECT 'InventarioIndividual', COUNT(*) FROM InventarioIndividual
UNION ALL
SELECT 'StockGeneral', COUNT(*) FROM StockGeneral
UNION ALL
SELECT 'Asignaciones', COUNT(*) FROM Asignaciones;

-- ===================================================================
-- DATOS DE PRUEBA INICIALES (Para desarrollo)
-- ===================================================================

-- Productos de prueba
INSERT IGNORE INTO Productos (categoria_id, marca, modelo, descripcion, stock_minimo, usa_numero_serie, activo) VALUES
(1, 'Dell', 'Latitude 5520', 'Laptop empresarial Dell', 2, TRUE, TRUE),
(1, 'HP', 'EliteBook 840', 'Laptop HP para ejecutivos', 1, TRUE, TRUE),
(2, 'Samsung', 'Galaxy A52', 'Smartphone Samsung', 3, TRUE, TRUE),
(2, 'iPhone', '13 Pro', 'Smartphone Apple', 2, TRUE, TRUE),
(3, 'HP', 'EliteDesk 800', 'PC Desktop HP', 5, FALSE, TRUE),
(4, 'Logitech', 'MX Master 3', 'Mouse inalámbrico', 10, FALSE, TRUE),
(5, 'Kingston', 'DataTraveler 64GB', 'Pendrive USB 3.0', 20, FALSE, TRUE);

-- Stock inicial para productos sin N/S
INSERT IGNORE INTO StockGeneral (producto_id, cantidad_actual, ubicacion) VALUES
(5, 15, 'Depósito Principal'),
(6, 25, 'Depósito Principal'), 
(7, 50, 'Depósito Principal');

-- Inventario individual para productos con N/S
INSERT IGNORE INTO InventarioIndividual (producto_id, numero_serie, estado, usuario_alta_id) VALUES
(1, 'DELL001', 'Disponible', 1),
(1, 'DELL002', 'Disponible', 1),
(2, 'HP001', 'Disponible', 1),
(3, 'SAM001', 'Disponible', 1),
(3, 'SAM002', 'Disponible', 1),
(4, 'IPH001', 'Disponible', 1);

SELECT '✅ Migración de datos completada' AS resultado; 