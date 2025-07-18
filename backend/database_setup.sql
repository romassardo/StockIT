-- Configuración inicial de la base de datos StockIT en MySQL
USE stockit_mysql;

-- Tabla de Usuarios
DROP TABLE IF EXISTS Usuarios;

-- Tabla de Usuarios
CREATE TABLE IF NOT EXISTS Usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('admin', 'usuario')),
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    ultimo_acceso DATETIME
);

-- Usuario administrador por defecto (password: admin123)
INSERT IGNORE INTO Usuarios (nombre, email, password_hash, rol) VALUES 
('Administrator', 'admin@stockit.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj7.iYn4fX6O', 'admin');

-- Tabla de Categorías
CREATE TABLE IF NOT EXISTS Categorias (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL,
    categoria_padre_id INT,
    requiere_serie BOOLEAN DEFAULT FALSE,
    permite_asignacion BOOLEAN DEFAULT FALSE,
    permite_reparacion BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (categoria_padre_id) REFERENCES Categorias(id)
);

-- Categorías básicas
INSERT IGNORE INTO Categorias (id, nombre, requiere_serie, permite_asignacion, permite_reparacion) VALUES 
(1, 'Notebooks', TRUE, TRUE, TRUE),
(2, 'Celulares', TRUE, TRUE, TRUE),
(3, 'Desktops', FALSE, FALSE, FALSE),
(4, 'Periféricos', FALSE, FALSE, FALSE),
(5, 'Consumibles', FALSE, FALSE, FALSE);

-- Tabla de Productos
CREATE TABLE IF NOT EXISTS Productos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    categoria_id INT NOT NULL,
    marca VARCHAR(50) NOT NULL,
    modelo VARCHAR(100) NOT NULL,
    descripcion TEXT,
    stock_minimo INT DEFAULT 0,
    usa_numero_serie BOOLEAN DEFAULT FALSE,
    activo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (categoria_id) REFERENCES Categorias(id)
);

-- Empleados
CREATE TABLE IF NOT EXISTS Empleados (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL,
    apellido VARCHAR(50) NOT NULL,
    activo BOOLEAN DEFAULT TRUE
);

-- Sectores
CREATE TABLE IF NOT EXISTS Sectores (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    activo BOOLEAN DEFAULT TRUE
);

-- Sucursales
CREATE TABLE IF NOT EXISTS Sucursales (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    activo BOOLEAN DEFAULT TRUE
);

-- Inventario Individual (solo para activos con número de serie)
CREATE TABLE IF NOT EXISTS InventarioIndividual (
    id INT PRIMARY KEY AUTO_INCREMENT,
    producto_id INT NOT NULL,
    numero_serie VARCHAR(100) UNIQUE NOT NULL,
    estado VARCHAR(20) NOT NULL CHECK (estado IN ('Disponible', 'Asignado', 'En Reparación', 'Dado de Baja')),
    fecha_ingreso DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_baja DATETIME,
    motivo_baja TEXT,
    usuario_alta_id INT,
    usuario_baja_id INT,
    FOREIGN KEY (producto_id) REFERENCES Productos(id),
    FOREIGN KEY (usuario_alta_id) REFERENCES Usuarios(id),
    FOREIGN KEY (usuario_baja_id) REFERENCES Usuarios(id)
);

-- Stock General (para productos sin número de serie)
CREATE TABLE IF NOT EXISTS StockGeneral (
    id INT PRIMARY KEY AUTO_INCREMENT,
    producto_id INT UNIQUE NOT NULL,
    cantidad_actual INT NOT NULL DEFAULT 0,
    ultima_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    ubicacion VARCHAR(100),
    FOREIGN KEY (producto_id) REFERENCES Productos(id)
);

-- Asignaciones (solo para activos con número de serie)
CREATE TABLE IF NOT EXISTS Asignaciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    inventario_individual_id INT NOT NULL,
    empleado_id INT,
    sector_id INT,
    sucursal_id INT,
    fecha_asignacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_devolucion DATETIME,
    usuario_asigna_id INT,
    usuario_recibe_id INT,
    observaciones TEXT,
    password_encriptacion VARCHAR(255),
    numero_telefono VARCHAR(20),
    cuenta_gmail VARCHAR(100),
    password_gmail VARCHAR(255),
    codigo_2fa_whatsapp VARCHAR(50),
    activa BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (inventario_individual_id) REFERENCES InventarioIndividual(id),
    FOREIGN KEY (empleado_id) REFERENCES Empleados(id),
    FOREIGN KEY (sector_id) REFERENCES Sectores(id),
    FOREIGN KEY (sucursal_id) REFERENCES Sucursales(id),
    FOREIGN KEY (usuario_asigna_id) REFERENCES Usuarios(id),
    FOREIGN KEY (usuario_recibe_id) REFERENCES Usuarios(id)
);

-- Reparaciones (solo para activos con número de serie)
CREATE TABLE IF NOT EXISTS Reparaciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    inventario_individual_id INT NOT NULL,
    fecha_envio DATETIME NOT NULL,
    fecha_retorno DATETIME,
    proveedor VARCHAR(100) NOT NULL,
    problema_descripcion TEXT NOT NULL,
    solucion_descripcion TEXT,
    estado VARCHAR(20) NOT NULL CHECK (estado IN ('En Reparación', 'Reparado', 'Sin Reparación')),
    usuario_envia_id INT,
    usuario_recibe_id INT,
    FOREIGN KEY (inventario_individual_id) REFERENCES InventarioIndividual(id),
    FOREIGN KEY (usuario_envia_id) REFERENCES Usuarios(id),
    FOREIGN KEY (usuario_recibe_id) REFERENCES Usuarios(id)
);

-- Movimientos de Stock (para productos sin número de serie)
CREATE TABLE IF NOT EXISTS MovimientosStock (
    id INT PRIMARY KEY AUTO_INCREMENT,
    producto_id INT NOT NULL,
    tipo_movimiento VARCHAR(20) NOT NULL CHECK (tipo_movimiento IN ('Entrada', 'Salida')),
    cantidad INT NOT NULL CHECK (cantidad > 0),
    fecha_movimiento DATETIME DEFAULT CURRENT_TIMESTAMP,
    usuario_id INT,
    empleado_id INT,
    sector_id INT,
    sucursal_id INT,
    motivo VARCHAR(100),
    observaciones TEXT,
    FOREIGN KEY (producto_id) REFERENCES Productos(id),
    FOREIGN KEY (usuario_id) REFERENCES Usuarios(id),
    FOREIGN KEY (empleado_id) REFERENCES Empleados(id),
    FOREIGN KEY (sector_id) REFERENCES Sectores(id),
    FOREIGN KEY (sucursal_id) REFERENCES Sucursales(id)
);

-- Logs de Actividad
CREATE TABLE IF NOT EXISTS LogsActividad (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT,
    tabla_afectada VARCHAR(50) NOT NULL,
    accion VARCHAR(20) NOT NULL,
    registro_id INT NOT NULL,
    descripcion TEXT,
    fecha_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    FOREIGN KEY (usuario_id) REFERENCES Usuarios(id)
);

-- Datos de prueba básicos
INSERT IGNORE INTO Empleados (nombre, apellido) VALUES 
('Juan', 'Pérez'),
('María', 'González'),
('Carlos', 'López');

INSERT IGNORE INTO Sectores (nombre) VALUES 
('Administración'),
('Sistemas'),
('Soporte'),
('Contabilidad');

INSERT IGNORE INTO Sucursales (nombre) VALUES 
('Casa Central'),
('Sucursal Norte'),
('Sucursal Sur');

SELECT 'Base de datos configurada correctamente' AS resultado; 