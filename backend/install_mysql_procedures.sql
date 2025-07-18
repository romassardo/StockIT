-- ===================================================================
-- INSTALACIÓN MASIVA DE STORED PROCEDURES PARA STOCKIT MYSQL
-- ===================================================================
-- Este script instala todos los SPs convertidos desde SQL Server

USE stockit_mysql;

-- Eliminar todos los procedimientos existentes si existen
DROP PROCEDURE IF EXISTS sp_Assignment_Create;
DROP PROCEDURE IF EXISTS sp_Assignment_Cancel;
DROP PROCEDURE IF EXISTS sp_Assignment_Return;
DROP PROCEDURE IF EXISTS sp_Assignment_GetDetailsById;
DROP PROCEDURE IF EXISTS sp_Asignaciones_GetByInventarioId;

DROP PROCEDURE IF EXISTS sp_InventarioIndividual_Create;
DROP PROCEDURE IF EXISTS sp_InventarioIndividual_BatchCreate;
DROP PROCEDURE IF EXISTS sp_InventarioIndividual_Get;
DROP PROCEDURE IF EXISTS sp_InventarioIndividual_GetAll;
DROP PROCEDURE IF EXISTS sp_InventarioIndividual_GetByEstado;
DROP PROCEDURE IF EXISTS sp_InventarioIndividual_GetByProducto;
DROP PROCEDURE IF EXISTS sp_InventarioIndividual_GetBySerialNumber;
DROP PROCEDURE IF EXISTS sp_InventarioIndividual_Update;
DROP PROCEDURE IF EXISTS sp_InventarioIndividual_UpdateEstado;

DROP PROCEDURE IF EXISTS sp_Repair_Create;
DROP PROCEDURE IF EXISTS sp_Repair_Complete;
DROP PROCEDURE IF EXISTS sp_Repair_Cancel;
DROP PROCEDURE IF EXISTS sp_Repair_Return;
DROP PROCEDURE IF EXISTS sp_Repair_GetActive;
DROP PROCEDURE IF EXISTS sp_Repair_GetById;
DROP PROCEDURE IF EXISTS sp_Repair_GetByInventarioId;
DROP PROCEDURE IF EXISTS sp_Reparaciones_GetByInventarioId;

DROP PROCEDURE IF EXISTS sp_StockGeneral_Entry;
DROP PROCEDURE IF EXISTS sp_StockGeneral_Exit;
DROP PROCEDURE IF EXISTS sp_StockGeneral_GetAll;
DROP PROCEDURE IF EXISTS sp_StockGeneral_GetById;
DROP PROCEDURE IF EXISTS sp_StockGeneral_GetLowStock;

DROP PROCEDURE IF EXISTS sp_Report_Inventory_Full;
DROP PROCEDURE IF EXISTS sp_Report_Inventory;
DROP PROCEDURE IF EXISTS sp_Report_AssignmentsByDestination;
DROP PROCEDURE IF EXISTS sp_Report_GetStockAlertsCount;
DROP PROCEDURE IF EXISTS sp_Report_RepairHistory;
DROP PROCEDURE IF EXISTS sp_Report_StockAlerts;
DROP PROCEDURE IF EXISTS sp_Report_StockDisponible;
DROP PROCEDURE IF EXISTS sp_Report_StockMovements;

-- ===================================================================
-- MENSAJE DE INICIO
-- ===================================================================
SELECT 'Iniciando instalación de Stored Procedures MySQL...' AS estado;

-- ===================================================================
-- NOTA: Los procedimientos serán cargados desde archivos individuales
-- Usar el comando SOURCE para cada archivo después de ejecutar este script
-- ===================================================================

SELECT 'Procedimientos eliminados. Listo para instalar nuevos SPs.' AS resultado; 