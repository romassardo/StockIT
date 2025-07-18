DELIMITER $$

CREATE PROCEDURE `sp_Report_Inventory`(
    IN `p_TipoInventario` VARCHAR(20),
    IN `p_Estado` VARCHAR(20),
    IN `p_CategoriaID` INT,
    IN `p_FechaDesde` DATE,
    IN `p_FechaHasta` DATE,
    IN `p_PageNumber` INT,
    IN `p_PageSize` INT
)
BEGIN
    DECLARE v_Offset INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        DROP TEMPORARY TABLE IF EXISTS TempInventario;
        RESIGNAL;
    END;

    SET v_Offset = (p_PageNumber - 1) * p_PageSize;

    CREATE TEMPORARY TABLE TempInventario (
        ID INT,
        TipoInventario VARCHAR(20),
        ProductoID INT,
        ProductoMarca VARCHAR(100),
        ProductoModelo VARCHAR(100),
        ProductoCategoria VARCHAR(50),
        CategoriaID INT,
        NumeroSerie VARCHAR(100) NULL,
        Estado VARCHAR(20) NULL,
        Cantidad INT NULL,
        FechaIngreso DATETIME NULL,
        FechaModificacion DATETIME NULL
    );

    IF p_TipoInventario IS NULL OR p_TipoInventario = 'Individual' THEN
        INSERT INTO TempInventario (
            ID, TipoInventario, ProductoID, ProductoMarca, ProductoModelo, ProductoCategoria, CategoriaID,
            NumeroSerie, Estado, FechaIngreso, FechaModificacion
        )
        SELECT 
            ii.id,
            'Individual',
            p.id,
            p.marca,
            p.modelo, -- Asumiendo que modelo está en productos
            c.nombre,
            c.id,
            ii.numero_serie,
            ii.estado,
            ii.fecha_ingreso,
            ii.fecha_modificacion
        FROM 
            InventarioIndividual ii
            INNER JOIN Productos p ON ii.producto_id = p.id
            INNER JOIN Categorias c ON p.categoria_id = c.id
        WHERE 
            (p_Estado IS NULL OR ii.estado = p_Estado)
            AND (p_CategoriaID IS NULL OR c.id = p_CategoriaID)
            AND (p_FechaDesde IS NULL OR ii.fecha_ingreso >= p_FechaDesde)
            AND (p_FechaHasta IS NULL OR ii.fecha_ingreso <= p_FechaHasta);
    END IF;

    IF p_TipoInventario IS NULL OR p_TipoInventario = 'General' THEN
        INSERT INTO TempInventario (
            ID, TipoInventario, ProductoID, ProductoMarca, ProductoModelo, ProductoCategoria, CategoriaID,
            Cantidad, FechaModificacion
        )
        SELECT 
            sg.id,
            'General',
            p.id,
            p.marca,
            p.modelo, -- Asumiendo que modelo está en productos
            c.nombre,
            c.id,
            sg.cantidad_actual,
            sg.ultima_actualizacion
        FROM 
            StockGeneral sg
            INNER JOIN Productos p ON sg.producto_id = p.id
            INNER JOIN Categorias c ON p.categoria_id = c.id
        WHERE 
            (p_CategoriaID IS NULL OR c.id = p_CategoriaID);
    END IF;

    SELECT 
        *,
        (SELECT COUNT(*) FROM TempInventario) AS TotalRows
    FROM 
        TempInventario
    ORDER BY 
        ProductoCategoria, ProductoMarca, ProductoModelo, TipoInventario
    LIMIT v_Offset, p_PageSize;

    DROP TEMPORARY TABLE IF EXISTS TempInventario;
END$$

DELIMITER ; 