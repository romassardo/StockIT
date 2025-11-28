DELIMITER $$

CREATE PROCEDURE `sp_Report_StockAlerts`(
    IN `p_CategoriaID` INT,
    IN `p_UmbralPersonalizado` INT,
    IN `p_IncluirSinStock` BOOLEAN,
    IN `p_IncluirStockBajo` BOOLEAN,
    IN `p_PageNumber` INT,
    IN `p_PageSize` INT
)
BEGIN
    DECLARE v_Offset INT;
    DECLARE v_TotalRows INT;

    -- Iniciar transacción y manejo de errores
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        -- Rollback en caso de error
        DROP TEMPORARY TABLE IF EXISTS TempAlerts;
        RESIGNAL;
    END;
    
    SET v_Offset = (p_PageNumber - 1) * p_PageSize;

    -- Crear tabla temporal para los resultados
    CREATE TEMPORARY TABLE TempAlerts (
        ProductoID INT,
        ProductoNombre VARCHAR(255),
        Categoria VARCHAR(100),
        CategoriaID INT,
        CantidadActual INT,
        StockMinimo INT,
        UmbralPersonalizado INT,
        DiasParaAgotarse INT,
        PromedioSalidaDiaria DECIMAL(10,2),
        UltimoMovimiento DATETIME,
        TipoAlerta VARCHAR(20)
    );

    -- Insertar productos sin stock (cantidad = 0)
    IF p_IncluirSinStock THEN
        INSERT INTO TempAlerts (
            ProductoID, ProductoNombre, Categoria, CategoriaID, 
            CantidadActual, StockMinimo, UmbralPersonalizado,
            DiasParaAgotarse, PromedioSalidaDiaria, UltimoMovimiento, TipoAlerta
        )
        SELECT 
            p.id AS ProductoID,
            CONCAT_WS(' ', p.marca, p.modelo) AS ProductoNombre,
            IFNULL(c.nombre, 'Sin Categoría') AS Categoria,
            c.id AS CategoriaID,
            sg.cantidad_actual AS CantidadActual,
            p.stock_minimo AS StockMinimo,
            IFNULL(p_UmbralPersonalizado, p.stock_minimo) AS UmbralPersonalizado,
            0 AS DiasParaAgotarse, -- 0 días porque ya está agotado
            (
                SELECT IFNULL(AVG(m.cantidad), 0)
                FROM MovimientosStock m 
                WHERE m.producto_id = p.id 
                  AND m.tipo_movimiento = 'Salida'
                  AND m.fecha_movimiento >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            ) AS PromedioSalidaDiaria,
            (
                SELECT m.fecha_movimiento
                FROM MovimientosStock m 
                WHERE m.producto_id = p.id
                ORDER BY m.fecha_movimiento DESC
                LIMIT 1
            ) AS UltimoMovimiento,
            'Sin Stock' AS TipoAlerta
        FROM StockGeneral sg
        INNER JOIN Productos p ON sg.producto_id = p.id
        INNER JOIN Categorias c ON p.categoria_id = c.id
        WHERE sg.cantidad_actual = 0
          AND p.usa_numero_serie = 0
          AND p.activo = 1
          AND (p_CategoriaID IS NULL OR c.id = p_CategoriaID);
    END IF;

    -- Insertar productos con stock bajo
    IF p_IncluirStockBajo THEN
        INSERT INTO TempAlerts (
            ProductoID, ProductoNombre, Categoria, CategoriaID, 
            CantidadActual, StockMinimo, UmbralPersonalizado,
            DiasParaAgotarse, PromedioSalidaDiaria, UltimoMovimiento, TipoAlerta
        )
        SELECT 
            p.id AS ProductoID,
            CONCAT_WS(' ', p.marca, p.modelo) AS ProductoNombre,
            IFNULL(c.nombre, 'Sin Categoría') AS Categoria,
            c.id AS CategoriaID,
            sg.cantidad_actual AS CantidadActual,
            p.stock_minimo AS StockMinimo,
            IFNULL(p_UmbralPersonalizado, p.stock_minimo) AS UmbralPersonalizado,
            CASE 
                WHEN IFNULL(prom.salida_diaria, 0) = 0 THEN 999
                ELSE FLOOR(sg.cantidad_actual / prom.salida_diaria)
            END AS DiasParaAgotarse,
            IFNULL(prom.salida_diaria, 0) AS PromedioSalidaDiaria,
            ulti.ultimo_mov AS UltimoMovimiento,
            'Stock Bajo' AS TipoAlerta
        FROM StockGeneral sg
        INNER JOIN Productos p ON sg.producto_id = p.id
        INNER JOIN Categorias c ON p.categoria_id = c.id
        LEFT JOIN (
            SELECT 
                producto_id,
                AVG(cantidad) AS salida_diaria
            FROM MovimientosStock
            WHERE tipo_movimiento = 'Salida' AND fecha_movimiento >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY producto_id
        ) prom ON p.id = prom.producto_id
        LEFT JOIN (
            SELECT 
                producto_id,
                MAX(fecha_movimiento) AS ultimo_mov
            FROM MovimientosStock
            GROUP BY producto_id
        ) ulti ON p.id = ulti.producto_id
        WHERE sg.cantidad_actual > 0
          AND sg.cantidad_actual < IFNULL(p_UmbralPersonalizado, p.stock_minimo)
          AND p.usa_numero_serie = 0
          AND p.activo = 1
          AND (p_CategoriaID IS NULL OR c.id = p_CategoriaID);
    END IF;

    -- Calcular total de filas
    SELECT COUNT(*) INTO v_TotalRows FROM TempAlerts;

    -- Devolver los resultados paginados
    SELECT 
        *,
        v_TotalRows AS TotalRows
    FROM TempAlerts
    ORDER BY 
        CASE TipoAlerta 
            WHEN 'Sin Stock' THEN 1 
            WHEN 'Stock Bajo' THEN 2 
            ELSE 3 
        END,
        DiasParaAgotarse,
        ProductoNombre
    LIMIT v_Offset, p_PageSize;

    -- Devolver estadísticas agregadas como segundo recordset
    SELECT 
        'Resumen' AS ReportType,
        SUM(CASE WHEN TipoAlerta = 'Sin Stock' THEN 1 ELSE 0 END) AS TotalSinStock,
        SUM(CASE WHEN TipoAlerta = 'Stock Bajo' THEN 1 ELSE 0 END) AS TotalStockBajo,
        COUNT(*) AS TotalAlertas,
        MIN(DiasParaAgotarse) AS MinimosDiasParaAgotarse,
        AVG(DiasParaAgotarse) AS PromedioDiasParaAgotarse
    FROM TempAlerts;

    -- Limpiar tabla temporal
    DROP TEMPORARY TABLE IF EXISTS TempAlerts;

END$$

DELIMITER ; 