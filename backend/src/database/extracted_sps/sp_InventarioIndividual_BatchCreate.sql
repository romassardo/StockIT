
CREATE PROCEDURE dbo.sp_InventarioIndividual_BatchCreate
    @producto_id INT,
    @numeros_serie_csv NVARCHAR(MAX),
    @usuario_alta_id INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Tablas temporales
    DECLARE @SeriesTemp TABLE (numero_serie NVARCHAR(100) PRIMARY KEY);
    DECLARE @Duplicados TABLE (numero_serie NVARCHAR(100));
    DECLARE @Nuevos TABLE (numero_serie NVARCHAR(100));
    
    -- Tabla para capturar los IDs reciÃ©n insertados. ESTA ES LA CLAVE DE LA SOLUCIÃ“N.
    DECLARE @InsertedLogs TABLE (
        id INT, 
        numero_serie NVARCHAR(100)
    );

    -- 1. Validar producto
    IF NOT EXISTS (SELECT 1 FROM dbo.Productos WHERE id = @producto_id AND usa_numero_serie = 1 AND activo = 1)
    BEGIN
        THROW 50001, 'El producto especificado no existe, no estÃ¡ activo o no estÃ¡ configurado para usar nÃºmeros de serie.', 1;
        RETURN;
    END

    -- 2. Parsear CSV
    INSERT INTO @SeriesTemp (numero_serie)
    SELECT DISTINCT UPPER(LTRIM(RTRIM(value)))
    FROM STRING_SPLIT(@numeros_serie_csv, ',')
    WHERE LTRIM(RTRIM(value)) != '';

    -- 3. Identificar duplicados
    INSERT INTO @Duplicados (numero_serie)
    SELECT st.numero_serie FROM @SeriesTemp st JOIN dbo.InventarioIndividual ii ON st.numero_serie = ii.numero_serie;

    -- 4. Identificar nuevos
    INSERT INTO @Nuevos (numero_serie)
    SELECT st.numero_serie FROM @SeriesTemp st LEFT JOIN @Duplicados d ON st.numero_serie = d.numero_serie WHERE d.numero_serie IS NULL;

    -- 5. Insertar nuevos registros y capturar los IDs con OUTPUT
    INSERT INTO dbo.InventarioIndividual (
        producto_id,
        numero_serie,
        estado,
        usuario_alta_id,
        fecha_ingreso
    )
    OUTPUT 
        INSERTED.id, 
        INSERTED.numero_serie 
    INTO 
        @InsertedLogs(id, numero_serie) -- AquÃ­ capturamos la data
    SELECT
        @producto_id,
        n.numero_serie,
        'Disponible',
        @usuario_alta_id,
        GETDATE()
    FROM @Nuevos n;
    
    DECLARE @NuevosCount INT = @@ROWCOUNT;

    -- 6. Insertar logs de actividad usando la tabla @InsertedLogs
    INSERT INTO dbo.LogsActividad (
        usuario_id, 
        tabla_afectada, 
        accion, 
        registro_id, 
        descripcion
    )
    SELECT
        @usuario_alta_id,
        'InventarioIndividual',
        'INSERT',
        il.id, -- Usamos el ID capturado
        CONCAT(N'Alta masiva de activo. NÃºmero de serie: ', il.numero_serie) -- Usamos el N/S capturado
    FROM 
        @InsertedLogs il; -- Leemos desde la tabla con los datos garantizados

    -- 7. Devolver el resumen
    SELECT 
        @NuevosCount AS Creados,
        (SELECT STRING_AGG(numero_serie, ', ') FROM @Duplicados) AS Duplicados;

END;
