-- =============================================
-- SP: sp_Producto_GetAll
-- Descripción: Obtiene productos con filtros y paginación
-- Uso: Gestión de productos en administración
-- Autor: Sistema StockIT
-- Fecha: 2024-06-18
-- =============================================

CREATE PROCEDURE [dbo].[sp_Producto_GetAll]
    @categoria_id INT = NULL,
    @categoria_nombre NVARCHAR(100) = NULL,
    @usa_numero_serie BIT = NULL,
    @activo BIT = 1,
    @PageNumber INT = 1,
    @PageSize INT = 50
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Validaciones de entrada
        IF @PageNumber < 1 SET @PageNumber = 1;
        IF @PageSize < 1 OR @PageSize > 100 SET @PageSize = 50;
        
        -- Calcular offset
        DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;
        
        -- Query principal con filtros
        SELECT 
            p.id,
            p.categoria_id,
            c.nombre AS categoria_nombre,
            p.marca,
            p.modelo,
            p.descripcion,
            p.stock_minimo,
            p.usa_numero_serie,
            p.activo,
            p.fecha_creacion,
            p.fecha_modificacion,
            -- Información adicional de inventario
            CASE 
                WHEN p.usa_numero_serie = 1 THEN (
                    SELECT COUNT(*) 
                    FROM InventarioIndividual ii 
                    WHERE ii.producto_id = p.id AND ii.estado = 'Disponible'
                )
                ELSE ISNULL((
                    SELECT sg.cantidad_actual 
                    FROM StockGeneral sg 
                    WHERE sg.producto_id = p.id
                ), 0)
            END AS cantidad_disponible,
            -- Total de items para productos serializados
            CASE 
                WHEN p.usa_numero_serie = 1 THEN (
                    SELECT COUNT(*) 
                    FROM InventarioIndividual ii 
                    WHERE ii.producto_id = p.id
                )
                ELSE NULL
            END AS total_items_serializados,
            -- Alerta de stock bajo
            CASE 
                WHEN p.usa_numero_serie = 0 THEN 
                    CASE 
                        WHEN ISNULL((SELECT sg.cantidad_actual FROM StockGeneral sg WHERE sg.producto_id = p.id), 0) <= p.stock_minimo
                        THEN 1 
                        ELSE 0 
                    END
                ELSE 0
            END AS alerta_stock_bajo
        FROM Productos p
        INNER JOIN Categorias c ON p.categoria_id = c.id
        WHERE 
            (@categoria_id IS NULL OR p.categoria_id = @categoria_id)
            AND (@categoria_nombre IS NULL OR c.nombre LIKE '%' + @categoria_nombre + '%')
            AND (@usa_numero_serie IS NULL OR p.usa_numero_serie = @usa_numero_serie)
            AND p.activo = @activo
        ORDER BY 
            c.nombre, p.marca, p.modelo
        OFFSET @Offset ROWS
        FETCH NEXT @PageSize ROWS ONLY;
            
    END TRY
    BEGIN CATCH
        -- Manejo de errores
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorNumber INT = ERROR_NUMBER();
        DECLARE @ErrorLine INT = ERROR_LINE();
        
        RAISERROR('Error en sp_Producto_GetAll - Línea %d: %s', 16, 1, @ErrorLine, @ErrorMessage);
    END CATCH
END 