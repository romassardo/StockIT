DELIMITER $$

DROP PROCEDURE IF EXISTS sp_Search_Global$$

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
    CREATE TEMPORARY TABLE IF NOT EXISTS temp_SearchResults (
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
    
    -- Limpiar tabla temporal
    TRUNCATE TABLE temp_SearchResults;
    
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
            CONCAT(p.marca, ' ', p.modelo),
            CONCAT(c.nombre, ' - S/N: ', ii.numero_serie),
            ii.estado,
            ii.fecha_ingreso,
            c.nombre,
            ii.numero_serie,
            NULL,
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
    
    -- BÚSQUEDA POR CONTRASEÑAS/DATOS SENSIBLES
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
            CONCAT(p.marca, ' ', p.modelo, ' - S/N: ', ii.numero_serie),
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
            (a.password_encriptacion LIKE v_SearchTermLike OR 
             a.cuenta_gmail LIKE v_SearchTermLike OR 
             a.password_gmail LIKE v_SearchTermLike OR
             a.numero_telefono LIKE v_SearchTermLike OR
             a.codigo_2fa_whatsapp LIKE v_SearchTermLike)
            AND a.activa = 1;
    END IF;
    
    -- BÚSQUEDAS GENERALES (empleados, productos, sectores, sucursales)
    IF p_SearchType = 'General' THEN
        -- Empleados
        INSERT INTO temp_SearchResults (ResultType, ItemId, Title, Description, Status, DateInfo, EntityType, SerialNumber, EncryptionPassword, RelatedInfo)
        SELECT 'Empleado', e.id, CONCAT(e.nombre, ' ', e.apellido), 'Empleado', 
               CASE WHEN e.activo = 1 THEN 'Activo' ELSE 'Inactivo' END, NOW(), 'Empleado', NULL, NULL, NULL
        FROM Empleados e
        WHERE (e.nombre LIKE v_SearchTermLike OR e.apellido LIKE v_SearchTermLike) AND e.activo = 1
        LIMIT 500;
            
        -- Productos
        INSERT INTO temp_SearchResults (ResultType, ItemId, Title, Description, Status, DateInfo, EntityType, SerialNumber, EncryptionPassword, RelatedInfo)
        SELECT 'Producto', p.id, CONCAT(p.marca, ' ', p.modelo), p.descripcion,
               CASE WHEN p.activo = 1 THEN 'Activo' ELSE 'Inactivo' END, NOW(), c.nombre, NULL, NULL,
               CONCAT('Categoría: ', c.nombre, ', Stock mínimo: ', CAST(p.stock_minimo AS CHAR))
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
            WHEN ResultType = 'Inventario' THEN 1
            WHEN ResultType = 'Asignacion' THEN 2
            WHEN ResultType = 'Empleado' THEN 3
            WHEN ResultType = 'Producto' THEN 4
            WHEN ResultType = 'Sector' THEN 5
            WHEN ResultType = 'Sucursal' THEN 6
            ELSE 99
        END,
        Title
    LIMIT v_Offset, p_PageSize;
    
    -- Limpiar
    DROP TEMPORARY TABLE IF EXISTS temp_SearchResults;
END$$

DELIMITER ;
