/**
 * Script para aplicar el SP de búsqueda global de la Bóveda
 * Ejecutar con: node backend/scripts/apply_vault_sp.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function applyVaultSP() {
  console.log('🔐 Aplicando SP de Búsqueda Global para la Bóveda...');
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
  });

  try {
    // Crear el SP de búsqueda global
    const spGlobalSearch = `
      DROP PROCEDURE IF EXISTS sp_Search_Global;
      
      CREATE PROCEDURE sp_Search_Global(
          IN p_SearchTerm VARCHAR(100),
          IN p_SearchType VARCHAR(50),
          IN p_PageNumber INT,
          IN p_PageSize INT
      )
      BEGIN
          DECLARE v_Offset INT;
          DECLARE v_TotalCount INT DEFAULT 0;
          DECLARE v_SearchTermLike VARCHAR(102);
          
          -- Validaciones y valores por defecto
          SET p_SearchType = IFNULL(p_SearchType, 'General');
          SET p_PageNumber = IFNULL(p_PageNumber, 1);
          SET p_PageSize = IFNULL(p_PageSize, 10);
          SET v_Offset = (p_PageNumber - 1) * p_PageSize;
          
          SET v_SearchTermLike = CONCAT('%', TRIM(p_SearchTerm), '%');
          
          -- Crear tabla temporal para resultados
          DROP TEMPORARY TABLE IF EXISTS temp_SearchResults;
          CREATE TEMPORARY TABLE temp_SearchResults (
              ResultType VARCHAR(50),
              ItemId INT,
              Title VARCHAR(200),
              Description VARCHAR(500),
              Status VARCHAR(50),
              DateInfo DATETIME,
              EntityType VARCHAR(50),
              SerialNumber VARCHAR(100),
              EncryptionPassword VARCHAR(100),
              RelatedInfo VARCHAR(500)
          );
          
          -- BÚSQUEDA POR NÚMERO DE SERIE
          IF p_SearchType = 'SerialNumber' OR p_SearchType = 'General' THEN
              INSERT INTO temp_SearchResults (
                  ResultType, ItemId, Title, Description, Status, 
                  DateInfo, EntityType, SerialNumber, EncryptionPassword, RelatedInfo
              )
              SELECT 
                  CASE 
                      WHEN a.id IS NOT NULL THEN 'Asignacion'
                      WHEN r.id IS NOT NULL THEN 'Reparacion'
                      ELSE 'Inventario'
                  END,
                  CASE 
                      WHEN a.id IS NOT NULL THEN a.id
                      WHEN r.id IS NOT NULL THEN r.id
                      ELSE ii.id
                  END,
                  CONCAT(COALESCE(p.marca, ''), ' ', COALESCE(p.modelo, '')),
                  CONCAT(COALESCE(c.nombre, ''), ' - S/N: ', COALESCE(ii.numero_serie, '')),
                  ii.estado,
                  ii.fecha_ingreso,
                  c.nombre,
                  ii.numero_serie,
                  CASE 
                      WHEN c.nombre LIKE '%Notebook%' THEN a.password_encriptacion
                      WHEN c.nombre LIKE '%Celular%' THEN a.password_gmail
                      ELSE NULL
                  END,
                  CASE 
                      WHEN a.id IS NOT NULL THEN CONCAT('Asignado a: ', COALESCE(CONCAT(e.nombre, ' ', e.apellido), s.nombre, b.nombre, 'Desconocido'))
                      WHEN r.id IS NOT NULL THEN CONCAT('En reparación desde: ', DATE_FORMAT(r.fecha_envio, '%d/%m/%Y'))
                      ELSE NULL
                  END
              FROM 
                  InventarioIndividual ii
              INNER JOIN 
                  Productos p ON ii.producto_id = p.id
              INNER JOIN 
                  Categorias c ON p.categoria_id = c.id
              LEFT JOIN 
                  Asignaciones a ON ii.id = a.inventario_individual_id AND a.activa = 1
              LEFT JOIN 
                  Empleados e ON a.empleado_id = e.id
              LEFT JOIN 
                  Sectores s ON a.sector_id = s.id
              LEFT JOIN 
                  Sucursales b ON a.sucursal_id = b.id
              LEFT JOIN 
                  Reparaciones r ON ii.id = r.inventario_individual_id AND r.estado = 'En Reparación'
              WHERE 
                  ii.numero_serie LIKE v_SearchTermLike;
          END IF;
          
          -- BÚSQUEDA POR CONTRASEÑAS/DATOS SENSIBLES Y ASIGNACIONES POR PERSONA
          IF p_SearchType = 'EncryptionPassword' OR p_SearchType = 'General' THEN
              INSERT INTO temp_SearchResults (
                  ResultType, ItemId, Title, Description, Status, 
                  DateInfo, EntityType, SerialNumber, EncryptionPassword, RelatedInfo
              )
              SELECT 
                  'Asignacion',
                  a.id,
                  CASE 
                      WHEN e.id IS NOT NULL THEN CONCAT('Asignado a: ', e.nombre, ' ', e.apellido)
                      WHEN s.id IS NOT NULL THEN CONCAT('Asignado a sector: ', s.nombre)
                      WHEN b.id IS NOT NULL THEN CONCAT('Asignado a sucursal: ', b.nombre)
                      ELSE 'Asignación'
                  END,
                  CONCAT(COALESCE(p.marca, ''), ' ', COALESCE(p.modelo, ''), ' - S/N: ', COALESCE(ii.numero_serie, '')),
                  CASE WHEN a.activa = 1 THEN 'Asignado' ELSE 'Inactivo' END,
                  a.fecha_asignacion,
                  c.nombre,
                  ii.numero_serie,
                  CASE 
                      WHEN c.nombre LIKE '%Notebook%' THEN a.password_encriptacion
                      WHEN c.nombre LIKE '%Celular%' THEN a.password_gmail
                      ELSE NULL
                  END,
                  CASE
                      WHEN c.nombre LIKE '%Celular%' THEN 
                          CONCAT('Gmail: ', COALESCE(a.cuenta_gmail, 'N/A'), 
                          ', Tel: ', COALESCE(a.numero_telefono, 'N/A'), 
                          ', 2FA: ', COALESCE(a.codigo_2fa_whatsapp, 'N/A'))
                      ELSE CONCAT('Asignado el: ', DATE_FORMAT(a.fecha_asignacion, '%d/%m/%Y'))
                  END
              FROM 
                  Asignaciones a
              INNER JOIN 
                  InventarioIndividual ii ON a.inventario_individual_id = ii.id
              INNER JOIN 
                  Productos p ON ii.producto_id = p.id
              INNER JOIN 
                  Categorias c ON p.categoria_id = c.id
              LEFT JOIN 
                  Empleados e ON a.empleado_id = e.id
              LEFT JOIN 
                  Sectores s ON a.sector_id = s.id
              LEFT JOIN 
                  Sucursales b ON a.sucursal_id = b.id
              WHERE 
                  (
                   -- Búsqueda por datos sensibles
                   a.password_encriptacion LIKE v_SearchTermLike OR 
                   a.cuenta_gmail LIKE v_SearchTermLike OR 
                   a.password_gmail LIKE v_SearchTermLike OR
                   a.numero_telefono LIKE v_SearchTermLike OR
                   a.codigo_2fa_whatsapp LIKE v_SearchTermLike OR
                   -- Búsqueda por beneficiario (nombre empleado, sector, sucursal)
                   e.nombre LIKE v_SearchTermLike OR
                   e.apellido LIKE v_SearchTermLike OR
                   CONCAT(e.nombre, ' ', e.apellido) LIKE v_SearchTermLike OR
                   s.nombre LIKE v_SearchTermLike OR
                   b.nombre LIKE v_SearchTermLike
                  )
                  AND a.activa = 1;
          END IF;
          
          -- BÚSQUEDAS GENERALES (empleados, productos, sectores, sucursales)
          IF p_SearchType = 'General' THEN
              -- Empleados
              INSERT INTO temp_SearchResults (ResultType, ItemId, Title, Description, Status, DateInfo, EntityType, SerialNumber, EncryptionPassword, RelatedInfo)
              SELECT 'Empleado', e.id, CONCAT(e.nombre, ' ', e.apellido), 'Empleado', 
                     CASE WHEN e.activo = 1 THEN 'Activo' ELSE 'Inactivo' END, NOW(), 'Empleado', NULL, NULL, 
                     CONCAT('Email: ', COALESCE(e.email_laboral, 'N/A'))
              FROM Empleados e
              WHERE (e.nombre LIKE v_SearchTermLike OR e.apellido LIKE v_SearchTermLike OR e.email_laboral LIKE v_SearchTermLike) AND e.activo = 1
              LIMIT 500;
                  
              -- Productos
              INSERT INTO temp_SearchResults (ResultType, ItemId, Title, Description, Status, DateInfo, EntityType, SerialNumber, EncryptionPassword, RelatedInfo)
              SELECT 'Producto', p.id, CONCAT(COALESCE(p.marca, ''), ' ', COALESCE(p.modelo, '')), COALESCE(p.descripcion, ''),
                     CASE WHEN p.activo = 1 THEN 'Activo' ELSE 'Inactivo' END, NOW(), c.nombre, NULL, NULL,
                     CONCAT('Categoría: ', c.nombre)
              FROM Productos p INNER JOIN Categorias c ON p.categoria_id = c.id
              WHERE (p.marca LIKE v_SearchTermLike OR p.modelo LIKE v_SearchTermLike OR p.descripcion LIKE v_SearchTermLike) AND p.activo = 1
              LIMIT 500;
                  
              -- Sectores
              INSERT INTO temp_SearchResults (ResultType, ItemId, Title, Description, Status, DateInfo, EntityType, SerialNumber, EncryptionPassword, RelatedInfo)
              SELECT 'Sector', s.id, s.nombre, 'Sector',
                     CASE WHEN s.activo = 1 THEN 'Activo' ELSE 'Inactivo' END, NOW(), 'Sector', NULL, NULL, NULL
              FROM Sectores s WHERE s.nombre LIKE v_SearchTermLike AND s.activo = 1
              LIMIT 100;
                  
              -- Sucursales
              INSERT INTO temp_SearchResults (ResultType, ItemId, Title, Description, Status, DateInfo, EntityType, SerialNumber, EncryptionPassword, RelatedInfo)
              SELECT 'Sucursal', b.id, b.nombre, 'Sucursal',
                     CASE WHEN b.activo = 1 THEN 'Activo' ELSE 'Inactivo' END, NOW(), 'Sucursal', NULL, NULL, NULL
              FROM Sucursales b WHERE b.nombre LIKE v_SearchTermLike AND b.activo = 1
              LIMIT 100;
          END IF;
          
          -- Obtener total
          SELECT COUNT(*) INTO v_TotalCount FROM temp_SearchResults;
          
          -- Devolver resultados paginados
          SELECT 
              ResultType, ItemId, Title, Description, Status, DateInfo, EntityType, SerialNumber, EncryptionPassword, RelatedInfo,
              v_TotalCount AS TotalCount, p_PageNumber AS CurrentPage, p_PageSize AS PageSize,
              CEIL(v_TotalCount / p_PageSize) AS TotalPages
          FROM temp_SearchResults
          ORDER BY 
              CASE 
                  WHEN ResultType = 'Asignacion' THEN 1
                  WHEN ResultType = 'Inventario' THEN 2
                  WHEN ResultType = 'Reparacion' THEN 3
                  WHEN ResultType = 'Empleado' THEN 4
                  WHEN ResultType = 'Producto' THEN 5
                  WHEN ResultType = 'Sector' THEN 6
                  WHEN ResultType = 'Sucursal' THEN 7
                  ELSE 99
              END,
              Title
          LIMIT p_PageSize OFFSET v_Offset;
          
          -- Limpiar
          DROP TEMPORARY TABLE IF EXISTS temp_SearchResults;
      END;
    `;

    await connection.query(spGlobalSearch);
    console.log('✅ SP sp_Search_Global creado exitosamente');
    
    // Recrear siempre sp_Assignment_GetDetailsById con la versión robusta (LEFT JOIN en Usuarios)
    const spGetDetails = `
      DROP PROCEDURE IF EXISTS sp_Assignment_GetDetailsById;
      
      CREATE PROCEDURE sp_Assignment_GetDetailsById(
          IN p_assignment_id INT
      )
      BEGIN
          SELECT
              A.id AS asignacion_id,
              A.fecha_asignacion,
              A.fecha_devolucion,
              A.observaciones AS asignacion_observaciones,
              A.password_encriptacion,
              A.cuenta_gmail,
              A.password_gmail,
              A.numero_telefono,
              A.codigo_2fa_whatsapp,
              NULL AS imei_1,
              NULL AS imei_2,
              A.activa AS asignacion_activa,
              II.id AS inventario_id,
              II.numero_serie,
              II.estado AS inventario_estado,
              P.id AS producto_id,
              P.marca AS producto_marca,
              P.modelo AS producto_modelo,
              P.descripcion AS producto_descripcion,
              C.id AS categoria_id,
              C.nombre AS categoria_nombre,
              E.id AS empleado_id,
              CONCAT(E.nombre, ' ', E.apellido) AS empleado_nombre,
              S.id AS sector_id,
              S.nombre AS sector_nombre,
              SU.id AS sucursal_id,
              SU.nombre AS sucursal_nombre,
              COALESCE(UA.nombre, 'Desconocido') AS usuario_asigna_nombre,
              UR.nombre AS usuario_recibe_nombre
          FROM Asignaciones A
          JOIN InventarioIndividual II ON A.inventario_individual_id = II.id
          JOIN Productos P ON II.producto_id = P.id
          JOIN Categorias C ON P.categoria_id = C.id
          LEFT JOIN Empleados E ON A.empleado_id = E.id
          LEFT JOIN Sectores S ON A.sector_id = S.id
          LEFT JOIN Sucursales SU ON A.sucursal_id = SU.id
          LEFT JOIN Usuarios UA ON A.usuario_asigna_id = UA.id
          LEFT JOIN Usuarios UR ON A.usuario_recibe_id = UR.id
          WHERE A.id = p_assignment_id;
      END;
    `;

    await connection.query(spGetDetails);
    console.log('✅ SP sp_Assignment_GetDetailsById actualizado (versión robusta)');
    
    console.log('\n🎉 La Bóveda está lista para usar');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

applyVaultSP()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
