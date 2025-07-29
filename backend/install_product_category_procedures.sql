-- =============================================
-- Script para instalar procedimientos almacenados de Productos y Categorías
-- =============================================

USE stockit_mysql;

-- Instalar procedimiento para obtener productos
SOURCE src/database/mysql_procedures/stock_general/sp_Producto_GetAll.sql;

-- Instalar procedimientos para categorías
SOURCE src/database/mysql_procedures/stock_general/sp_Categoria_GetAll.sql;
SOURCE src/database/mysql_procedures/stock_general/sp_Categoria_Create.sql;
SOURCE src/database/mysql_procedures/stock_general/sp_Categoria_Update.sql;
SOURCE src/database/mysql_procedures/stock_general/sp_Categoria_ToggleActive.sql;

-- Verificar que los procedimientos se instalaron correctamente
SHOW PROCEDURE STATUS WHERE Db = 'stockit_mysql' AND Name LIKE '%Producto%';
SHOW PROCEDURE STATUS WHERE Db = 'stockit_mysql' AND Name LIKE '%Categoria%';

SELECT 'Procedimientos de Productos y Categorías instalados exitosamente' AS mensaje;
