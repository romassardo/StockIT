import { Response } from 'express';
import { AuthRequest } from '../types/auth.types';
import { DatabaseConnection } from '../utils/database';
import { logger } from '../utils/logger';
import mysql from 'mysql2/promise';

export class InventoryController {
  private db = DatabaseConnection.getInstance();

  // Función auxiliar para transformar datos del SP a la estructura esperada por el frontend
  private transformInventoryItem = (item: any): any => {
    // Creamos el objeto anidado 'producto' a partir de los campos planos
    const producto = {
      id: item.producto_id,
      marca: item.producto_marca,
      modelo: item.producto_modelo,
      descripcion: item.producto_descripcion,
      categoria_id: item.categoria_id,
      categoria: item.categoria_nombre ? {
        id: item.categoria_id,
        nombre: item.categoria_nombre
      } : null
    };

    // Clonamos el item original para no mutarlo directamente
    const newItem = { ...item };

    // Eliminamos los campos que ya hemos anidado para limpiar el objeto final
    delete newItem.producto_id;
    delete newItem.producto_marca;
    delete newItem.producto_modelo;
    delete newItem.producto_descripcion;
    delete newItem.categoria_nombre;
    delete newItem.categoria_id;
    delete newItem.TotalRows; // Eliminar cualquier TotalRows residual

    // Devolvemos el objeto limpio con la estructura anidada correcta
    // Mapear campos de MySQL a nombres esperados por el frontend
    return {
      ...newItem,
      producto: producto,
      // Mapeo de nombres de campos MySQL -> Frontend
      created_at: item.fecha_creacion || item.created_at,
      updated_at: item.fecha_modificacion || item.updated_at
    };
  };

  public createInventoryItem = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { producto_id, numero_serie } = req.body; // ubicacion y observaciones no son parte del SP de creación directa.

      // Validaciones básicas
      if (!producto_id || !numero_serie) {
        res.status(400).json({ error: 'Producto ID y número de serie son requeridos.' });
        return;
      }

      const parsedProductId = parseInt(producto_id);
      if (isNaN(parsedProductId)) {
        res.status(400).json({ error: 'Producto ID debe ser un número.' });
        return;
      }

      // Validar formato de número de serie (no espacios, longitud mínima)
      if (String(numero_serie).trim().length < 3) {
        res.status(400).json({ error: 'El número de serie debe tener al menos 3 caracteres.' });
        return;
      }

      const cleanSerial = String(numero_serie).trim().toUpperCase();

      const [results] = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>(
        'sp_InventarioIndividual_Create',
        [
          parsedProductId,
          cleanSerial,
          req.user!.id
        ]
      );
      
      // sp_InventarioIndividual_Create devuelve el item creado en el results si tiene éxito.
      // Los errores de lógica de negocio (ej: N/S duplicado) se lanzan como RAISERROR y se capturan en el catch.
      if (!results || results.length === 0) {
        // Esto podría ocurrir si el SP no devuelve el registro por alguna razón no cubierta por RAISERROR
        logger.error('SP sp_InventarioIndividual_Create no devolvió el registro esperado.', { producto_id, numero_serie });
        res.status(500).json({ error: 'Error al crear el item de inventario, no se obtuvo confirmación.' });
        return;
      }

      logger.info(`Inventario creado: ${cleanSerial} (ID: ${results[0]?.id}) por ${req.user!.username}`);

      res.status(201).json({
        success: true,
        message: 'Item de inventario creado exitosamente.',
        data: results[0]
      });

    } catch (error: any) {
      logger.error('Error creando inventario:', { 
        errorMessage: error.message, 
        stack: error.stack, 
        body: req.body,
        producto_id_param: req.body?.producto_id,
        numero_serie_param: req.body?.numero_serie
      });
      
      // Manejo de errores específicos del SP basados en el mensaje de error (proveniente de RAISERROR)
      if (error.message?.toLowerCase().includes('no está configurado para usar números de serie') || error.message?.toLowerCase().includes('no maneja números de serie')) {
        res.status(400).json({ error: 'El producto especificado no está configurado para usar números de serie individuales.' });
      } else if (error.message?.toLowerCase().includes('ya existe un item con el número de serie') || error.message?.toLowerCase().includes('uq_inventarioindividual_numero_serie')) {
        res.status(409).json({ error: `El número de serie '${String(req.body?.numero_serie).trim().toUpperCase()}' ya existe en el sistema.` });
      } else if (error.message?.toLowerCase().includes('no existe o no está activo') || error.message?.toLowerCase().includes('fk_inventarioindividual_producto')) {
        res.status(404).json({ error: 'El producto especificado no existe o no está activo.' });
      } else {
        res.status(500).json({ error: 'Error interno del servidor al crear el item de inventario.' });
      }
    }
  };

  public getInventoryBySerial = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { serial } = req.params;

      if (!serial || String(serial).trim().length < 3) {
        res.status(400).json({ error: 'Número de serie inválido o demasiado corto.' });
        return;
      }

      const [spResult] = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>(
        'sp_InventarioIndividual_GetBySerialNumber',
        [String(serial).trim().toUpperCase()]
      );

      // En MySQL2, para SPs con CALL: spResult puede ser [filas[], OkPacket]
      // Extraer las filas reales del primer recordset
      const rows = Array.isArray(spResult) && spResult.length > 0 && Array.isArray(spResult[0]) 
        ? spResult[0] as any[]
        : (Array.isArray(spResult) ? spResult : []);

      if (!rows || rows.length === 0) {
        res.status(404).json({ error: 'Item de inventario no encontrado con ese número de serie.' });
        return;
      }

      const rawData = rows[0];
      
      // Transformar los datos básicos usando la función auxiliar
      const transformedData = this.transformInventoryItem(rawData);
      
      // Si hay asignación activa, obtener detalles completos
      if (rawData.asignacion_actual_id) {
        try {
          const [asignacionResult] = await this.db.executeQuery<mysql.RowDataPacket[]>(`
            SELECT 
              a.id, a.inventario_individual_id, a.empleado_id, a.sector_id, a.sucursal_id,
              a.fecha_asignacion, a.fecha_devolucion, a.observaciones, a.activa,
              e.nombre AS empleado_nombre, e.apellido AS empleado_apellido,
              s.nombre AS sector_nombre,
              suc.nombre AS sucursal_nombre
            FROM Asignaciones a
            LEFT JOIN Empleados e ON a.empleado_id = e.id
            LEFT JOIN Sectores s ON a.sector_id = s.id
            LEFT JOIN Sucursales suc ON a.sucursal_id = suc.id
            WHERE a.id = ?
          `, [rawData.asignacion_actual_id]);
          
          if (asignacionResult && asignacionResult.length > 0) {
            const asig = asignacionResult[0];
            transformedData.asignacion_actual = {
              id: asig.id,
              inventario_individual_id: asig.inventario_individual_id,
              empleado_id: asig.empleado_id,
              empleado_nombre: `${asig.empleado_nombre || ''} ${asig.empleado_apellido || ''}`.trim(),
              sector_id: asig.sector_id,
              sector_nombre: asig.sector_nombre,
              sucursal_id: asig.sucursal_id,
              sucursal_nombre: asig.sucursal_nombre,
              fecha_asignacion: asig.fecha_asignacion,
              fecha_devolucion: asig.fecha_devolucion,
              observaciones: asig.observaciones,
              activa: asig.activa,
              empleado: {
                id: asig.empleado_id,
                nombre: asig.empleado_nombre,
                apellido: asig.empleado_apellido
              }
            };
          }
        } catch (e) {
          logger.warn('No se pudo obtener detalle de asignación actual:', e);
        }
      }
      
      // Si hay reparación activa, obtener detalles completos
      if (rawData.reparacion_actual_id) {
        try {
          const [reparacionResult] = await this.db.executeQuery<mysql.RowDataPacket[]>(`
            SELECT 
              r.id, r.inventario_individual_id, r.fecha_envio, r.fecha_retorno,
              r.proveedor, r.problema_descripcion, r.solucion_descripcion,
              r.estado, r.usuario_envia_id,
              u.nombre AS usuario_envia_nombre
            FROM Reparaciones r
            LEFT JOIN Usuarios u ON r.usuario_envia_id = u.id
            WHERE r.id = ?
          `, [rawData.reparacion_actual_id]);
          
          if (reparacionResult && reparacionResult.length > 0) {
            const rep = reparacionResult[0];
            transformedData.reparacion_actual = {
              id: rep.id,
              reparacion_id: rep.id,
              inventario_individual_id: rep.inventario_individual_id,
              numero_serie: transformedData.numero_serie,
              marca: transformedData.producto?.marca,
              modelo: transformedData.producto?.modelo,
              fecha_envio: rep.fecha_envio,
              fecha_retorno: rep.fecha_retorno,
              proveedor: rep.proveedor,
              problema_descripcion: rep.problema_descripcion,
              solucion_descripcion: rep.solucion_descripcion,
              estado_reparacion: rep.estado,
              usuario_envia_id: rep.usuario_envia_id,
              usuario_envia_nombre: rep.usuario_envia_nombre
            };
          }
        } catch (e) {
          logger.warn('No se pudo obtener detalle de reparación actual:', e);
        }
      }

      res.json({
        success: true,
        data: transformedData
      });

    } catch (error: any) {
      logger.error('Error obteniendo inventario por serie:', { errorMessage: error.message, stack: error.stack, serial_param: req.params?.serial });
      res.status(500).json({ error: 'Error interno del servidor al obtener inventario por serie.' });
    }
  };

  public getAvailableInventory = async (req: AuthRequest, res: Response): Promise<void> => {
    const {
      estado,
      categoria_id,
      search,
      activos_only = 'true',
      page = '1',
      limit = '50'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1 || limitNum > 100) {
      res.status(400).json({ error: 'Parámetros de paginación inválidos.' });
      return;
    }

    try {
      // Ejecutar Stored Procedure - Temporalmente usar activos_only=false para mostrar más items
      const spResults = await this.db.executeStoredProcedure(
        'sp_InventarioIndividual_GetAll',
        [
          estado,
          categoria_id,
          search,
          false, // Temporalmente false para mostrar todos los items disponibles
          pageNum,
          limitNum
        ]
      ) as mysql.RowDataPacket[][];

      // El SP devuelve un array de result sets. El primer elemento contiene las filas del primer SELECT.
      // spResults[0] es el objeto 'results' de la query.
      // Al ser un CALL, 'results' es un array [Rows[], Packet].
      const queryResults = spResults[0] as any;
      
      // Validamos que sea un array y extraemos el primer set de filas
      const rows = Array.isArray(queryResults) ? queryResults[0] : [];
      
      // Calcular total de items (usando la primera fila si existe)
      const firstRow = rows.length > 0 ? rows[0] : null;
      const totalItems = firstRow ? (firstRow.TotalRows || firstRow['TotalRows'] || 0) : 0;
      const totalPages = Math.ceil(totalItems / limitNum);
      
      const transformedData = rows.map((row: any, index: number) => {
        try {
          // Ahora 'row' sí es una fila individual (RowDataPacket)
          // El driver mysql2 normalmente devuelve objetos con nombres de columna por defecto
          
          let itemObj = row;

          // Si por alguna razón rara viniera como array indexado (poco probable ahora que corregimos el acceso)
          if (Array.isArray(row)) {
             itemObj = {
              id: row[0],
              producto_id: row[1],
              producto_marca: row[2],
              producto_modelo: row[3],
              producto_descripcion: row[4],
              categoria_nombre: row[5],
              categoria_id: row[6],
              numero_serie: row[7],
              estado: row[8],
              fecha_ingreso: row[9],
              fecha_baja: row[10],
              motivo_baja: row[11],
              fecha_creacion: row[12],
              fecha_modificacion: row[13]
             };
          }

          const transformed = this.transformInventoryItem(itemObj);
          return transformed;

        } catch (error) {
          return null;
        }
      }).filter((item: any) => item !== null);

      res.json({
        success: true,
        data: transformedData,
        pagination: {
          currentPage: pageNum,
          pageSize: limitNum,
          totalItems: totalItems,
          totalPages: totalPages,
        },
        source: 'sp'
      });

    } catch (spError: any) {
      logger.warn('SP sp_InventarioIndividual_GetAll falló, usando consulta directa como fallback.', { error: spError.message });
      
      // Fallback a consulta directa si el SP no funciona
      try {
        let whereConditions = ['ii.estado != \'Dado de Baja\''];
        let queryParams: any[] = [];

        if (estado) {
          whereConditions.push('ii.estado = ?');
          queryParams.push(estado);
        }
        if (categoria_id) {
          whereConditions.push('p.categoria_id = ?');
          queryParams.push(parseInt(categoria_id as string));
        }
        if (search) {
          const searchTerm = `%${String(search).trim()}%`;
          whereConditions.push('(ii.numero_serie LIKE ? OR p.marca LIKE ? OR p.modelo LIKE ?)');
          queryParams.push(searchTerm, searchTerm, searchTerm);
        }

        const whereClause = whereConditions.join(' AND ');
        const offset = (pageNum - 1) * limitNum;

        const countQuery = `SELECT COUNT(*) as total FROM InventarioIndividual ii INNER JOIN Productos p ON ii.producto_id = p.id WHERE ${whereClause}`;
        const [countResult] = await this.db.executeQuery(countQuery, queryParams);
        const totalItems = countResult[0]?.total || 0;
        const totalPages = Math.ceil(totalItems / limitNum);

        const mainQuery = `
          SELECT ii.*, p.marca as producto_marca, p.modelo as producto_modelo, p.descripcion as producto_descripcion, c.id as categoria_id, c.nombre as categoria_nombre, ${totalItems} as TotalRows
          FROM InventarioIndividual ii
          INNER JOIN Productos p ON ii.producto_id = p.id
          INNER JOIN Categorias c ON p.categoria_id = c.id
          WHERE ${whereClause}
          ORDER BY ii.fecha_modificacion DESC, ii.id DESC
          LIMIT ? OFFSET ?`;
        
        const [directResults] = await this.db.executeQuery(mainQuery, [...queryParams, limitNum, offset]);
        
        const transformedData = (directResults || []).map(this.transformInventoryItem);

        res.json({
          success: true,
          data: transformedData,
          pagination: {
            currentPage: pageNum,
            pageSize: limitNum,
            totalItems: totalItems,
            totalPages: totalPages,
          },
          source: 'direct_query'
        });

      } catch (fallbackError: any) {
        logger.error('Error en el fallback de getAvailableInventory:', { errorMessage: fallbackError.message, stack: fallbackError.stack });
        res.status(500).json({ error: 'Error interno del servidor al obtener el inventario.' });
      }
    }
  };

  public updateInventoryState = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { estado, observaciones } = req.body;

      const inventoryId = parseInt(id);
      if (isNaN(inventoryId)) {
        res.status(400).json({ error: 'ID de inventario inválido.' });
        return;
      }

      const validStates = ['Disponible', 'Asignado', 'En Reparación', 'Dado de Baja'];
      if (!estado || !validStates.includes(estado as string)) {
        res.status(400).json({ 
          error: 'Estado inválido. Debe ser uno de: ' + validStates.join(', ') + '.', 
          validStates: validStates 
        });
        return;
      }

      // Para 'Dado de Baja', 'observaciones' (motivo_baja) es requerido por el SP.
      if (estado === 'Dado de Baja' && (!observaciones || String(observaciones).trim() === '')) {
        res.status(400).json({ error: 'Observaciones (motivo de baja) son requeridas cuando el estado es "Dado de Baja".' });
        return;
      }

      await this.db.executeStoredProcedure(
        'sp_InventarioIndividual_UpdateState',
        [
          inventoryId,
          estado as string,
          observaciones ? String(observaciones).trim() : null,
          req.user!.id
        ]
      );

      logger.info(`Inventario ${inventoryId} actualizado a estado '${estado}' por ${req.user!.username}`);

      res.json({ success: true, message: 'Estado del item de inventario actualizado exitosamente.' });

    } catch (error: any) {
      logger.error('Error actualizando estado inventario:', { errorMessage: error.message, stack: error.stack, params: req.params, body: req.body });
      
      if (error.message?.toLowerCase().includes('item de inventario no encontrado')) {
        res.status(404).json({ error: 'Item de inventario no encontrado.' });
      } else if (error.message?.toLowerCase().includes('transición de estado no permitida') || error.message?.toLowerCase().includes('no se puede cambiar')) {
        res.status(400).json({ error: error.message }); // El SP debe proveer un mensaje claro.
      } else {
        res.status(500).json({ error: 'Error interno del servidor al actualizar estado de inventario.' });
      }
    }
  };

  public getInventoryHistory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const inventoryId = parseInt(id);
      if (isNaN(inventoryId)) {
        res.status(400).json({ error: 'ID de inventario inválido.' });
        return;
      }

      const [results] = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>(
        'sp_LogsActividad_GetByInventarioId',
        [inventoryId]
      );

      const data = results || [];

      res.json({
        success: true,
        data: data,
        totalItems: data.length
      });

    } catch (error: any) {
      logger.error('Error obteniendo historial inventario:', { errorMessage: error.message, stack: error.stack, inventory_id: req.params?.id });
      res.status(500).json({ error: 'Error interno del servidor al obtener historial de inventario.' });
    }
  };

  public getInventoryItemById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const inventoryId = parseInt(id);
      if (isNaN(inventoryId)) {
        res.status(400).json({ error: 'ID de inventario inválido.' });
        return;
      }

      const [results] = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>(
        'sp_InventarioIndividual_Get',
        [inventoryId]
      );

      if (!results || results.length === 0) {
        res.status(404).json({ error: 'Item de inventario no encontrado.' });
        return;
      }

      // Transformar los datos usando la función auxiliar
      const transformedData = this.transformInventoryItem(results[0]);

      res.json({
        success: true,
        data: transformedData
      });

    } catch (error: any) {
      logger.error('Error obteniendo item inventario por ID:', { errorMessage: error.message, stack: error.stack, inventory_id: req.params?.id });
      res.status(500).json({ error: 'Error interno del servidor al obtener item de inventario.' });
    }
  };

  public updateInventoryItem = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { 
        producto_id,
        numero_serie,
        estado,
        fecha_baja,
        motivo_baja,
        usuario_baja_id
      } = req.body;

      const inventoryId = parseInt(id);
      if (isNaN(inventoryId)) {
        res.status(400).json({ error: 'ID de inventario inválido.' });
        return;
      }

      // Validaciones básicas
      if (producto_id && isNaN(parseInt(producto_id))) {
        res.status(400).json({ error: 'Producto ID debe ser un número.' });
        return;
      }

      if (numero_serie && String(numero_serie).trim().length < 3) {
        res.status(400).json({ error: 'El número de serie debe tener al menos 3 caracteres.' });
        return;
      }

      const validStates = ['Disponible', 'Asignado', 'En Reparación', 'Dado de Baja'];
      if (estado && !validStates.includes(estado as string)) {
        res.status(400).json({ 
          error: 'Estado inválido. Debe ser uno de: ' + validStates.join(', ') + '.', 
          validStates: validStates 
        });
        return;
      }

      // Para 'Dado de Baja', 'motivo_baja' es requerido
      if (estado === 'Dado de Baja' && (!motivo_baja || String(motivo_baja).trim() === '')) {
        res.status(400).json({ error: 'Motivo de baja es requerido cuando el estado es "Dado de Baja".' });
        return;
      }

      const cleanSerial = numero_serie ? String(numero_serie).trim().toUpperCase() : null;

      await this.db.executeStoredProcedure(
        'sp_InventarioIndividual_Update',
        [
          inventoryId,
          producto_id ? parseInt(producto_id) : null,
          cleanSerial,
          estado || null,
          fecha_baja || null,
          motivo_baja ? String(motivo_baja).trim() : null,
          usuario_baja_id ? parseInt(usuario_baja_id) : null
        ]
      );

      logger.info(`Inventario ${inventoryId} actualizado por ${req.user!.username}`);

      res.json({ success: true, message: 'Item de inventario actualizado exitosamente.' });

    } catch (error: any) {
      logger.error('Error actualizando item inventario:', { errorMessage: error.message, stack: error.stack, params: req.params, body: req.body });
      
      if (error.message?.toLowerCase().includes('item de inventario no encontrado')) {
        res.status(404).json({ error: 'Item de inventario no encontrado.' });
      } else if (error.message?.toLowerCase().includes('ya existe un item con el número de serie') || error.message?.toLowerCase().includes('uq_inventarioindividual_numero_serie')) {
        res.status(409).json({ error: `El número de serie '${String(req.body?.numero_serie).trim().toUpperCase()}' ya existe en el sistema.` });
      } else if (error.message?.toLowerCase().includes('producto no existe') || error.message?.toLowerCase().includes('fk_inventarioindividual_producto')) {
        res.status(404).json({ error: 'El producto especificado no existe.' });
      } else {
        res.status(500).json({ error: 'Error interno del servidor al actualizar item de inventario.' });
      }
    }
  };

  async getHistory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const inventoryId = parseInt(id);
      
      if (isNaN(inventoryId)) {
        res.status(400).json({ error: 'ID de inventario inválido.' });
        return;
      }

      // Consulta combinada: LogsActividad + Eventos de Asignaciones + Eventos de Reparaciones
      const query = `
        -- Logs de actividad existentes
        SELECT 
          la.id,
          la.fecha_hora,
          la.accion,
          la.descripcion,
          COALESCE(u.nombre, 'Sistema') AS nombre_usuario,
          la.tabla_afectada
        FROM LogsActividad la
        LEFT JOIN Usuarios u ON la.usuario_id = u.id
        WHERE (la.tabla_afectada = 'InventarioIndividual' AND la.registro_id = ?)
           OR (la.tabla_afectada = 'Asignaciones' AND la.registro_id IN (SELECT id FROM Asignaciones WHERE inventario_individual_id = ?))
           OR (la.tabla_afectada = 'Reparaciones' AND la.registro_id IN (SELECT id FROM Reparaciones WHERE inventario_individual_id = ?))
        
        UNION ALL
        
        -- Eventos de Asignaciones (si no hay logs)
        SELECT 
          a.id * 100000 + 1 AS id,
          a.fecha_asignacion AS fecha_hora,
          'Asignación' AS accion,
          JSON_OBJECT(
            'accion', 'Nueva Asignación',
            'empleado', CONCAT(e.nombre, ' ', e.apellido),
            'sector', s.nombre,
            'sucursal', suc.nombre
          ) AS descripcion,
          COALESCE(u.nombre, 'Sistema') AS nombre_usuario,
          'Asignaciones' AS tabla_afectada
        FROM Asignaciones a
        LEFT JOIN Empleados e ON a.empleado_id = e.id
        LEFT JOIN Sectores s ON a.sector_id = s.id
        LEFT JOIN Sucursales suc ON a.sucursal_id = suc.id
        LEFT JOIN Usuarios u ON a.usuario_asigna_id = u.id
        WHERE a.inventario_individual_id = ?
        
        UNION ALL
        
        -- Eventos de Reparaciones
        SELECT 
          r.id * 100000 + 2 AS id,
          r.fecha_envio AS fecha_hora,
          'Envío a Reparación' AS accion,
          JSON_OBJECT(
            'accion', 'Envío a Reparación',
            'proveedor', r.proveedor,
            'problema', r.problema_descripcion
          ) AS descripcion,
          COALESCE(u.nombre, 'Sistema') AS nombre_usuario,
          'Reparaciones' AS tabla_afectada
        FROM Reparaciones r
        LEFT JOIN Usuarios u ON r.usuario_envia_id = u.id
        WHERE r.inventario_individual_id = ?
        
        UNION ALL
        
        -- Retornos de Reparación (cuando fecha_retorno no es null)
        SELECT 
          r.id * 100000 + 3 AS id,
          r.fecha_retorno AS fecha_hora,
          'Retorno de Reparación' AS accion,
          JSON_OBJECT(
            'accion', 'Retorno de Reparación',
            'estado_reparacion', r.estado,
            'solucion', COALESCE(r.solucion_descripcion, 'No especificada')
          ) AS descripcion,
          COALESCE(u.nombre, 'Sistema') AS nombre_usuario,
          'Reparaciones' AS tabla_afectada
        FROM Reparaciones r
        LEFT JOIN Usuarios u ON r.usuario_recibe_id = u.id
        WHERE r.inventario_individual_id = ? AND r.fecha_retorno IS NOT NULL
        
        UNION ALL
        
        -- Devoluciones de Asignaciones (cuando activa = 0 y fecha_devolucion IS NOT NULL)
        SELECT 
          a.id * 100000 + 4 AS id,
          a.fecha_devolucion AS fecha_hora,
          'Devolución' AS accion,
          JSON_OBJECT(
            'accion', 'Devolución de Activo',
            'empleado', CONCAT(COALESCE(e.nombre, ''), ' ', COALESCE(e.apellido, '')),
            'sector', s.nombre,
            'sucursal', suc.nombre,
            'observaciones', a.observaciones
          ) AS descripcion,
          COALESCE(u.nombre, 'Sistema') AS nombre_usuario,
          'Asignaciones' AS tabla_afectada
        FROM Asignaciones a
        LEFT JOIN Empleados e ON a.empleado_id = e.id
        LEFT JOIN Sectores s ON a.sector_id = s.id
        LEFT JOIN Sucursales suc ON a.sucursal_id = suc.id
        LEFT JOIN Usuarios u ON a.usuario_recibe_id = u.id
        WHERE a.inventario_individual_id = ? AND a.activa = 0 AND a.fecha_devolucion IS NOT NULL
        
        ORDER BY fecha_hora DESC
      `;
      
      const [results] = await this.db.executeQuery<mysql.RowDataPacket[]>(query, [
        inventoryId, inventoryId, inventoryId, // Para LogsActividad
        inventoryId, // Para Asignaciones
        inventoryId, // Para Reparaciones envío
        inventoryId, // Para Reparaciones retorno
        inventoryId  // Para Devoluciones
      ]);

      const data = results || [];
      
      res.json({
        success: true,
        data: data,
        totalItems: data.length
      });
    } catch (error: any) {
      logger.error('Error obteniendo historial:', { error: error.message, id: req.params.id });
      res.status(500).json({ error: 'Error al obtener historial' });
    }
  }

  public createInventoryBatch = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { items } = req.body;

      if (!Array.isArray(items) || items.length === 0) {
        res.status(400).json({ error: 'Se requiere un array de items no vacío.' });
        return;
      }

      if (items.length > 100) {
        res.status(400).json({ error: 'No se pueden crear más de 100 items a la vez.' });
        return;
      }

      // Preparar parámetros para el SP de batch create
      const serialNumbers = items.map(item => String(item.numero_serie).trim().toUpperCase()).join(',');
      const productId = items[0].producto_id;

      // Validar que todos los items tengan el mismo producto_id
      if (!items.every(item => item.producto_id === productId)) {
        res.status(400).json({ error: 'Todos los items deben tener el mismo producto_id.' });
        return;
      }

      const [results] = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>(
        'sp_InventarioIndividual_BatchCreate',
        [
          productId,
          serialNumbers,
          req.user!.id
        ]
      );

      logger.info(`Batch inventario creado: ${items.length} items por ${req.user!.username}`);

      res.status(201).json({
        success: true,
        message: `${items.length} items de inventario creados exitosamente.`,
        data: results || []
      });

    } catch (error: any) {
      logger.error('Error creando batch inventario:', { errorMessage: error.message, stack: error.stack, body: req.body });
      res.status(500).json({ error: 'Error interno del servidor al crear batch de inventario.' });
    }
  };

  public getActiveRepairs = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { 
        page = '1',
        limit = '25',
        search
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);

      if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1 || limitNum > 100) {
        res.status(400).json({ error: 'Parámetros de paginación inválidos.' });
        return;
      }

      // IMPORTANTE: El SP espera (PageNumber, PageSize, proveedor_search)
      const [spResult] = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>(
        'sp_Repair_GetActive',
        [
          pageNum,
          limitNum,
          search ? String(search).trim() : null
        ]
      );

      // En MySQL2, para SPs con CALL: spResult es [filas[], OkPacket]
      // Necesitamos extraer el primer elemento que son las filas reales
      const rawData = Array.isArray(spResult) && spResult.length > 0 && Array.isArray(spResult[0]) 
        ? spResult[0] as any[]
        : (Array.isArray(spResult) ? spResult : []);
      
      // Mapear resultados: El SP devuelve reparacion_id, no id
      const data = rawData.map((row: any, index: number) => ({
        // Usar reparacion_id como id principal para el frontend
        id: row.reparacion_id || row.ReparacionID || index + 1,
        reparacion_id: row.reparacion_id || row.ReparacionID || index + 1,
        inventario_individual_id: row.inventario_individual_id || row.InventarioIndividualID,
        producto_marca: row.producto_marca || row.ProductoMarca || row.marca,
        producto_modelo: row.producto_modelo || row.ProductoModelo || row.modelo,
        numero_serie: row.numero_serie || row.NumeroSerie,
        proveedor: row.proveedor || row.Proveedor,
        fecha_envio: row.fecha_envio || row.FechaEnvio,
        problema_descripcion: row.problema_descripcion || row.ProblemaDescripcion,
        usuario_envia_nombre: row.usuario_envia_nombre || row.UsuarioEnvia,
        dias_en_reparacion: row.dias_en_reparacion || row.DiasEnReparacion,
        TotalRows: row.TotalRows
      }));

      const totalItems = data.length > 0 ? data[0].TotalRows : 0;
      const totalPages = Math.ceil(totalItems / limitNum);

      res.json({
        success: true,
        data: data,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalItems: totalItems,
          totalPages: totalPages
        }
      });

    } catch (error: any) {
      logger.error('Error obteniendo reparaciones activas:', { errorMessage: error.message, stack: error.stack });
      res.status(500).json({ error: 'Error interno del servidor al obtener reparaciones activas.' });
    }
  };

  public createRepair = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { 
        inventario_individual_id,
        proveedor,
        problema_descripcion
      } = req.body;

      const usuario_id = req.user!.id;

      // Verificar que el ítem existe y está en estado válido
      const [checkRows] = await this.db.executeQuery<mysql.RowDataPacket[]>(
        'SELECT id, estado FROM InventarioIndividual WHERE id = ?',
        [inventario_individual_id]
      );

      if (!checkRows || checkRows.length === 0) {
        res.status(404).json({ error: 'El ítem de inventario no existe.' });
        return;
      }

      const estadoActual = checkRows[0].estado;
      if (!['Disponible', 'Asignado'].includes(estadoActual)) {
        res.status(400).json({ error: 'El ítem debe estar "Disponible" o "Asignado" para enviarlo a reparación.' });
        return;
      }

      // Crear registro de reparación
      const [insertResult] = await this.db.executeQuery<any>(
        `INSERT INTO Reparaciones (inventario_individual_id, fecha_envio, problema_descripcion, proveedor, estado, usuario_envia_id)
         VALUES (?, NOW(), ?, ?, 'En Reparación', ?)`,
        [inventario_individual_id, problema_descripcion, proveedor, usuario_id]
      );

      const nuevaReparacionId = insertResult.insertId;

      // Actualizar estado del inventario
      await this.db.executeQuery(
        `UPDATE InventarioIndividual SET estado = 'En Reparación', fecha_modificacion = NOW() WHERE id = ?`,
        [inventario_individual_id]
      );

      logger.info(`Reparación ${nuevaReparacionId} creada para inventario ${inventario_individual_id} por usuario ${usuario_id}`);

      res.status(201).json({
        success: true,
        message: 'Reparación creada exitosamente.',
        data: { id: nuevaReparacionId }
      });

    } catch (error: any) {
      logger.error('Error creando reparación:', { errorMessage: error.message, stack: error.stack, body: req.body });
      res.status(500).json({ error: 'Error interno del servidor al crear reparación.' });
    }
  };

  public returnRepair = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { 
        estado,
        solucion_descripcion
      } = req.body;

      const repairId = parseInt(id);
      if (isNaN(repairId)) {
        res.status(400).json({ error: 'ID de reparación inválido.' });
        return;
      }

      const validStates = ['Reparado', 'Sin Reparación'];
      if (!estado || !validStates.includes(estado)) {
        res.status(400).json({ 
          error: 'Estado inválido. Debe ser "Reparado" o "Sin Reparación".',
          validStates: validStates 
        });
        return;
      }

      await this.db.executeStoredProcedure(
        'sp_Repair_Return',
        [
          repairId,
          estado,
          solucion_descripcion || null,
          req.user!.id
        ]
      );

      logger.info(`Reparación ${repairId} finalizada con estado '${estado}' por ${req.user!.username}`);

      res.json({
        success: true,
        message: 'Reparación finalizada exitosamente.'
      });

    } catch (error: any) {
      logger.error('Error finalizando reparación:', { errorMessage: error.message, stack: error.stack, params: req.params, body: req.body });
      res.status(500).json({ error: 'Error interno del servidor al finalizar reparación.' });
    }
  };
}
