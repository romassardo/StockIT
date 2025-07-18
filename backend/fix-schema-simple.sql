-- ========================================
-- CORRECCIÓN SIMPLE DEL ESQUEMA MYSQL
-- ========================================

USE stockit_mysql;

-- 1. CATEGORIAS - Intentar agregar columnas (puede dar error si ya existen, pero continuará)
ALTER TABLE categorias ADD COLUMN requiere_serie TINYINT(1) DEFAULT 0;
ALTER TABLE categorias ADD COLUMN permite_asignacion TINYINT(1) DEFAULT 0;
ALTER TABLE categorias ADD COLUMN permite_reparacion TINYINT(1) DEFAULT 0;
ALTER TABLE categorias ADD COLUMN activo TINYINT(1) DEFAULT 1;

-- 2. PRODUCTOS
ALTER TABLE productos ADD COLUMN descripcion TEXT;
ALTER TABLE productos ADD COLUMN stock_minimo INT DEFAULT 0;
ALTER TABLE productos ADD COLUMN usa_numero_serie TINYINT(1) DEFAULT 0;
ALTER TABLE productos ADD COLUMN activo TINYINT(1) DEFAULT 1;

-- 3. EMPLEADOS
ALTER TABLE empleados ADD COLUMN activo TINYINT(1) DEFAULT 1;

-- 4. SECTORES
ALTER TABLE sectores ADD COLUMN activo TINYINT(1) DEFAULT 1;

-- 5. SUCURSALES
ALTER TABLE sucursales ADD COLUMN activo TINYINT(1) DEFAULT 1;

-- 6. INVENTARIOINDIVIDUAL
ALTER TABLE inventarioindividual ADD COLUMN fecha_baja DATETIME;
ALTER TABLE inventarioindividual ADD COLUMN motivo_baja TEXT;
ALTER TABLE inventarioindividual ADD COLUMN usuario_alta_id INT;
ALTER TABLE inventarioindividual ADD COLUMN usuario_baja_id INT;

-- 7. STOCKGENERAL
ALTER TABLE stockgeneral ADD COLUMN ultima_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE stockgeneral ADD COLUMN ubicacion VARCHAR(100);

-- 8. ASIGNACIONES
ALTER TABLE asignaciones ADD COLUMN password_encriptacion VARCHAR(255);
ALTER TABLE asignaciones ADD COLUMN cuenta_gmail VARCHAR(100);
ALTER TABLE asignaciones ADD COLUMN password_gmail VARCHAR(255);
ALTER TABLE asignaciones ADD COLUMN numero_telefono VARCHAR(20);
ALTER TABLE asignaciones ADD COLUMN codigo_2fa_whatsapp VARCHAR(50);
ALTER TABLE asignaciones ADD COLUMN imei_1 VARCHAR(20);
ALTER TABLE asignaciones ADD COLUMN imei_2 VARCHAR(20);
ALTER TABLE asignaciones ADD COLUMN observaciones TEXT;
ALTER TABLE asignaciones ADD COLUMN activa TINYINT(1) DEFAULT 1;
ALTER TABLE asignaciones ADD COLUMN usuario_asigna_id INT;
ALTER TABLE asignaciones ADD COLUMN usuario_recibe_id INT;

-- 9. REPARACIONES
ALTER TABLE reparaciones ADD COLUMN fecha_retorno DATETIME;
ALTER TABLE reparaciones ADD COLUMN proveedor VARCHAR(100);
ALTER TABLE reparaciones ADD COLUMN problema_descripcion TEXT;
ALTER TABLE reparaciones ADD COLUMN solucion_descripcion TEXT;
ALTER TABLE reparaciones ADD COLUMN estado VARCHAR(20) DEFAULT 'En Reparación';
ALTER TABLE reparaciones ADD COLUMN usuario_envia_id INT;
ALTER TABLE reparaciones ADD COLUMN usuario_recibe_id INT;

-- 10. MOVIMIENTOSSTOCK
ALTER TABLE movimientosstock ADD COLUMN fecha_movimiento DATETIME DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE movimientosstock ADD COLUMN usuario_id INT;
ALTER TABLE movimientosstock ADD COLUMN empleado_id INT;
ALTER TABLE movimientosstock ADD COLUMN sector_id INT;
ALTER TABLE movimientosstock ADD COLUMN sucursal_id INT;
ALTER TABLE movimientosstock ADD COLUMN motivo VARCHAR(100);
ALTER TABLE movimientosstock ADD COLUMN observaciones TEXT;

-- 11. LOGSACTIVIDAD
ALTER TABLE logsactividad ADD COLUMN tabla_afectada VARCHAR(50);
ALTER TABLE logsactividad ADD COLUMN accion VARCHAR(20);
ALTER TABLE logsactividad ADD COLUMN registro_id INT;
ALTER TABLE logsactividad ADD COLUMN descripcion TEXT;
ALTER TABLE logsactividad ADD COLUMN fecha_hora DATETIME DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE logsactividad ADD COLUMN ip_address VARCHAR(45);
ALTER TABLE logsactividad ADD COLUMN user_agent VARCHAR(255);

SELECT 'ESQUEMA ACTUALIZADO - ALGUNAS COLUMNAS PUEDEN YA EXISTIR' as RESULTADO; 