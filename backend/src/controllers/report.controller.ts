import { Response } from 'express';
import { AuthRequest } from '../types/auth.types';
import { DatabaseConnection } from '../utils/database';
import { logger } from '../utils/logger';
import { ExportService } from '../services/export.service';
import { StockMovementReportItem } from '../types';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';
import { Request } from 'express';
import sql from 'mssql';

const db = DatabaseConnection.getInstance();

// Interfaces para los resultados de los reportes
interface InventoryReportItem {
  ID: number;
  TipoInventario: string;
  ProductoID: number;
  ProductoNombre: string;
  ProductoCategoria: string;
  NumeroSerie: string | null;
  Estado: string;
  Cantidad: number | null;
  Ubicacion: string | null;
  FechaCompra: string | null;
  FechaGarantia: string | null;
  DiasRestantesGarantia: number | null;
  FechaCreacion: string;
  UltimaModificacion: string | null;
  TotalRows: number;
}

interface AssignmentReportItem {
  id: number;
  tipo_asignacion: string;
  estado: string;
  fecha_asignacion: string;
  fecha_devolucion: string | null;
  destino_nombre: string;
  producto_nombre: string;
  tipo_inventario: string;
  usuario_asigna: string;
  usuario_recibe: string | null;
  dias_asignado: number;
  TotalRows: number;
}

interface StockAlertItem {
  ProductoID: number;
  ProductoNombre: string;
  Categoria: string;
  CategoriaID: number;
  CantidadActual: number;
  StockMinimo: number;
  UmbralPersonalizado: number | null;
  DiasParaAgotarse: number;
  PromedioSalidaDiaria: number;
  UltimoMovimiento: string | null;
  TipoAlerta: string;
  TotalRows: number;
}

interface RepairHistoryItem {
  reparacion_id: number;
  numero_serie: string;
  marca: string;
  modelo: string;
  categoria: string;
  fecha_envio: string;
  fecha_retorno: string | null;
  proveedor: string;
  problema_descripcion: string;
  solucion_descripcion: string | null;
  estado: string;
  usuario_envia: string;
  usuario_recibe: string | null;
  dias_reparacion: number;
  TotalRows: number;
}

class ReportController {
  private db: DatabaseConnection;

  constructor() {
    this.db = DatabaseConnection.getInstance();
    logger.info('ReportController inicializado');
  }

  /**
   * Obtiene un reporte de inventario con opciones de filtrado y paginación
   */
  public getInventoryReport = async (req: Request, res: Response): Promise<Response> => {
    try {
      const {
        TipoInventario,
        Estado,
        CategoriaID,
        FechaDesde,
        FechaHasta,
        PageNumber = 1,
        PageSize = 20
      } = req.query;

      const params: { [key: string]: any } = {
        PageNumber: { type: sql.Int, value: Number(PageNumber) },
        PageSize: { type: sql.Int, value: Number(PageSize) },
      };

      if (TipoInventario) {
        params.TipoInventario = { type: sql.NVarChar(20), value: TipoInventario };
      }
      if (Estado) {
        params.Estado = { type: sql.NVarChar(20), value: Estado };
      }
      if (CategoriaID) {
        params.CategoriaID = { type: sql.Int, value: Number(CategoriaID) };
      }
      if (FechaDesde) {
        params.FechaDesde = { type: sql.Date, value: FechaDesde };
      }
      if (FechaHasta) {
        params.FechaHasta = { type: sql.Date, value: FechaHasta };
      }

      const result = await this.db.executeStoredProcedure('sp_Report_Inventory', params);

      return res.json(result.recordset);

    } catch (error) {
      console.error('Error al generar el reporte de inventario:', error);
      if (error instanceof Error) {
          return res.status(500).json({ message: 'Error interno del servidor', error: error.message });
      }
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  };

  /**
   * Obtiene un reporte de inventario completo (serializado y general)
   */
  public getFullInventoryReport = async (req: Request, res: Response): Promise<Response> => {
    try {
      const {
        PageNumber = 1,
        PageSize = 20,
        FilterType,
        FilterCategoria,
        SortBy,
        SortOrder
      } = req.query;

      const params: { [key: string]: any } = {
        PageNumber: { type: sql.Int, value: Number(PageNumber) },
        PageSize: { type: sql.Int, value: Number(PageSize) },
      };

      if (FilterType) {
        params.FilterType = { type: sql.NVarChar(50), value: FilterType };
      }
      if (FilterCategoria) {
        params.FilterCategoria = { type: sql.NVarChar(100), value: FilterCategoria };
      }
      if (SortBy) {
        params.SortBy = { type: sql.NVarChar(50), value: SortBy };
      }
      if (SortOrder) {
        params.SortOrder = { type: sql.NVarChar(4), value: SortOrder };
      }

      const result = await this.db.executeStoredProcedure('sp_Report_StockDisponible', params);

      const items = result.recordset;
      const totalRecords = items.length > 0 ? (items[0] as { TotalRecords: number }).TotalRecords : 0;

      return res.json({
        items,
        totalRecords,
        totalPages: Math.ceil(totalRecords / Number(PageSize)),
        currentPage: Number(PageNumber)
      });

    } catch (error) {
      logger.error('Error al generar el reporte de stock disponible:', error);
      if (error instanceof Error) {
        return res.status(500).json({ message: 'Error interno del servidor', error: error.message });
      }
      return res.status(500).json({ message: 'Error interno del servidor, error no identificado.' });
    }
  };

  /**
   * Obtiene un reporte de asignaciones por destino con opciones de filtrado y paginación
   */
  public getAssignmentsByDestinationReport = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const {
        tipoDestino,
        destinoId,
        estadoAsignacion,
        fechaDesde,
        fechaHasta,
        page = 1,
        pageSize = 20
      } = req.query;

      // Validar parámetros
      const pageNumber = Number(page);
      const itemsPerPage = Number(pageSize);

      if (isNaN(pageNumber) || pageNumber < 1) {
        res.status(400).json({
          success: false,
          message: 'Número de página inválido'
        });
        return;
      }

      if (isNaN(itemsPerPage) || itemsPerPage < 1 || itemsPerPage > 100) {
        res.status(400).json({
          success: false,
          message: 'Tamaño de página inválido (debe estar entre 1 y 100)'
        });
        return;
      }

      // Parámetros para el stored procedure
      const params = {
        TipoDestino: tipoDestino || null,
        DestinoID: destinoId ? Number(destinoId) : null,
        EstadoAsignacion: estadoAsignacion || null,
        FechaDesde: fechaDesde || null,
        FechaHasta: fechaHasta || null,
        PageNumber: pageNumber,
        PageSize: itemsPerPage
      };

      // Ejecutar el stored procedure
      const result = await this.db.executeStoredProcedure('sp_Report_AssignmentsByDestination', params);
      
      if (!result.recordsets || result.recordsets.length === 0 || result.recordsets[0].length === 0) {
        res.status(200).json({
          success: true,
          message: 'No se encontraron registros para los criterios especificados',
          data: {
            items: [],
            stats: [],
            pagination: {
              page: pageNumber,
              pageSize: itemsPerPage,
              totalItems: 0,
              totalPages: 0
            }
          }
        });
        return;
      }

      // Obtener datos paginados (primer conjunto de resultados)
      const items = result.recordsets[0];
      
      // Obtener estadísticas (segundo conjunto de resultados)
      const stats = result.recordsets[1] || [];

      // Obtener total de registros para paginación
      // Corrección: Agregar type assertion para evitar error TS2571
      const totalItems = items.length > 0 ? (items[0] as AssignmentReportItem).TotalRows || 0 : 0;
      const totalPages = Math.ceil(totalItems / itemsPerPage);

      res.status(200).json({
        success: true,
        data: {
          items,
          stats,
          pagination: {
            page: pageNumber,
            pageSize: itemsPerPage,
            totalItems,
            totalPages
          }
        }
      });
    } catch (error: any) {
      logger.error(`Error al obtener reporte de asignaciones por destino: ${error.message}`, { error });
      res.status(500).json({
        success: false,
        message: 'Error al generar el reporte de asignaciones por destino',
        error: error.message
      });
    }
  };

  /**
   * Obtiene un reporte de alertas de stock con opciones de filtrado y paginación
   */
  public getStockAlertsReport = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const {
        tipoAlerta,
        categoriaId,
        diasParaAgotarse,
        page = 1,
        pageSize = 20
      } = req.query;

      // Validar parámetros
      const pageNumber = Number(page);
      const itemsPerPage = Number(pageSize);
      const diasLimite = diasParaAgotarse ? Number(diasParaAgotarse) : null;

      if (isNaN(pageNumber) || pageNumber < 1) {
        res.status(400).json({
          success: false,
          message: 'Número de página inválido'
        });
        return;
      }

      if (isNaN(itemsPerPage) || itemsPerPage < 1 || itemsPerPage > 100) {
        res.status(400).json({
          success: false,
          message: 'Tamaño de página inválido (debe estar entre 1 y 100)'
        });
        return;
      }

      if (diasLimite !== null && (isNaN(diasLimite) || diasLimite < 0)) {
        res.status(400).json({
          success: false,
          message: 'Valor de días para agotarse inválido'
        });
        return;
      }

      // Parámetros para el stored procedure
      const params = {
        CategoriaID: categoriaId ? Number(categoriaId) : null,
        UmbralPersonalizado: null, // Por ahora no implementamos umbral personalizado
        IncluirSinStock: tipoAlerta === 'Sin Stock' ? 1 : (tipoAlerta ? 0 : 1), // Si no se especifica tipo, incluir ambos
        IncluirStockBajo: tipoAlerta === 'Stock Bajo' ? 1 : (tipoAlerta ? 0 : 1), // Si no se especifica tipo, incluir ambos
        PageNumber: pageNumber,
        PageSize: itemsPerPage
      };

      // Ejecutar el stored procedure
      const result = await this.db.executeStoredProcedure('sp_Report_StockAlerts', params);
      
      if (!result.recordsets || result.recordsets.length === 0 || result.recordsets[0].length === 0) {
        res.status(200).json({
          success: true,
          message: 'No se encontraron registros para los criterios especificados',
          data: {
            items: [],
            summary: {},
            pagination: {
              page: pageNumber,
              pageSize: itemsPerPage,
              totalItems: 0,
              totalPages: 0
            }
          }
        });
        return;
      }

      // Obtener datos paginados (primer conjunto de resultados)
      const items = result.recordsets[0];
      
      // Obtener resumen (segundo conjunto de resultados)
      const summary = result.recordsets[1] || [];

      // Obtener total de registros para paginación
      const totalItems = summary.length > 0 ? (summary[0] as { TotalRows: number }).TotalRows || 0 : 0;
      const totalPages = Math.ceil(totalItems / itemsPerPage);

      res.status(200).json({
        success: true,
        summary: summary.length > 0 ? summary[0] : {},
        items,
        pagination: {
          page: pageNumber,
          pageSize: itemsPerPage,
          totalItems,
          totalPages
        }
      });
    } catch (error: any) {
      logger.error(`Error al obtener reporte de alertas de stock: ${error.message}`, { error });
      res.status(500).json({
        success: false,
        message: 'Error al generar el reporte de alertas de stock',
        error: error.message
      });
    }
  };

  /**
   * Obtiene el número total de alertas de stock.
   */
  public getStockAlertsCount = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const result = await this.db.executeStoredProcedure('sp_Report_GetStockAlertsCount', {});
      
      // DEBUG: Ver la estructura del resultado de la base de datos
      console.log('Resultado de sp_Report_GetStockAlertsCount:', JSON.stringify(result, null, 2));

      const count = (result.recordset[0] as { TotalAlerts: number })?.TotalAlerts || 0;

      res.status(200).json({
        success: true,
        data: {
          count
        }
      });

    } catch (error: any) {
      logger.error(`Error al obtener el contador de alertas de stock: ${error.message}`, { error });
      res.status(500).json({
        success: false,
        message: 'Error al obtener el contador de alertas de stock.',
        error: error.message
      });
    }
  };

  /**
   * Exporta un reporte a formato Excel
   */
  public exportReportToExcel = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { reportType, ...queryParams } = req.query;
      
      if (!reportType) {
        res.status(400).json({
          success: false,
          message: 'Tipo de reporte no especificado'
        });
        return;
      }
      
      let reportData: any[] = [];
      let fileName = '';
      
      // Obtener datos según el tipo de reporte
      switch (reportType) {
        case 'inventory':
          // Usar los mismos parámetros pero sin paginación
          const inventoryParams = {
            TipoInventario: queryParams.tipoInventario || null,
            Estado: queryParams.estado || null,
            CategoriaID: queryParams.categoriaId ? Number(queryParams.categoriaId) : null,
            FechaDesde: queryParams.fechaDesde || null,
            FechaHasta: queryParams.fechaHasta || null,
            // No paginar para exportación
            PageNumber: 1,
            PageSize: 10000 // Valor alto para obtener todos los registros
          };
          
          const inventoryResult = await this.db.executeStoredProcedure('sp_Report_Inventory', inventoryParams);
          reportData = inventoryResult.recordset || [];
          fileName = 'Reporte_Inventario';
          break;
          
        case 'assignmentsByDestination':
          const assignmentsParams = {
            TipoDestino: queryParams.tipoDestino || null,
            DestinoID: queryParams.destinoId ? Number(queryParams.destinoId) : null,
            EstadoAsignacion: queryParams.estadoAsignacion || null,
            FechaDesde: queryParams.fechaDesde || null,
            FechaHasta: queryParams.fechaHasta || null,
            PageNumber: 1,
            PageSize: 10000
          };
          
          const assignmentsResult = await this.db.executeStoredProcedure('sp_Report_AssignmentsByDestination', assignmentsParams);
          reportData = assignmentsResult.recordsets[0] || [];
          fileName = 'Reporte_Asignaciones_Por_Destino';
          break;
          
        case 'stockAlerts':
          const stockAlertsParams = {
            TipoAlerta: queryParams.tipoAlerta || null,
            CategoriaID: queryParams.categoriaId ? Number(queryParams.categoriaId) : null,
            DiasParaAgotarse: queryParams.diasParaAgotarse ? Number(queryParams.diasParaAgotarse) : null,
            PageNumber: 1,
            PageSize: 10000
          };
          
          const stockAlertsResult = await this.db.executeStoredProcedure('sp_Report_StockAlerts', stockAlertsParams);
          reportData = stockAlertsResult.recordsets[0] || [];
          fileName = 'Reporte_Alertas_Stock';
          break;
          
        default:
          res.status(400).json({
            success: false,
            message: 'Tipo de reporte no válido'
          });
          return;
      }
      
      if (!reportData.length) {
        res.status(404).json({
          success: false,
          message: 'No se encontraron datos para exportar'
        });
        return;
      }

      // Eliminar columnas técnicas que no deberían estar en el reporte
      reportData = reportData.map(item => {
        const { TotalRows, ...rest } = item;
        return rest;
      });

      // Crear libro de Excel
      const worksheet = XLSX.utils.json_to_sheet(reportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte');

      // Nombre de archivo con timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fullFileName = `${fileName}_${timestamp}.xlsx`;
      
      // Directorio temporal para guardar el archivo
      const tempDir = path.join(__dirname, '..', '..', 'temp');
      
      // Crear directorio si no existe
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const filePath = path.join(tempDir, fullFileName);
      
      // Escribir archivo
      XLSX.writeFile(workbook, filePath);
      
      // Enviar archivo al cliente
      res.download(filePath, fullFileName, (err) => {
        if (err) {
          logger.error(`Error al enviar archivo de reporte: ${err.message}`, { error: err });
          // Si ya se envió la respuesta, no hacer nada
          if (!res.headersSent) {
            res.status(500).json({
              success: false,
              message: 'Error al enviar el archivo de reporte'
            });
          }
        }
        
        // Eliminar el archivo temporal después de enviarlo
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) {
            logger.error(`Error al eliminar archivo temporal: ${unlinkErr.message}`);
          }
        });
      });
    } catch (error: any) {
      logger.error(`Error al exportar reporte a Excel: ${error.message}`, { error });
      res.status(500).json({
        success: false,
        message: 'Error al exportar el reporte a Excel',
        error: error.message
      });
    }
  };

  /**
   * Exporta reporte de Stock Disponible a Excel
   */
  public exportStockDisponible = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      // Obtener todos los datos sin paginación
      const params = {
        PageNumber: 1,
        PageSize: 10000, // Valor alto para obtener todos
        FilterType: req.query.FilterType || null,
        FilterCategoria: req.query.FilterCategoria || null,
        SortBy: req.query.SortBy || 'Categoria',
        SortOrder: req.query.SortOrder || 'ASC'
      };

      const result = await this.db.executeStoredProcedure('sp_Report_StockDisponible', params);
      const data = result.recordset || [];

      // Generar Excel
      const excelBuffer = ExportService.generateExcel({
        title: 'Reporte de Stock Disponible',
        filename: ExportService.generateFilename('stock_disponible'),
        columns: ExportService.getStockDisponibleColumns(),
        data: data,
        sheetName: 'Stock Disponible'
      });

      const filename = ExportService.generateFilename('stock_disponible');

      // Configurar headers para descarga
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', excelBuffer.length);

      // Enviar archivo
      res.send(excelBuffer);

      logger.info(`Stock Disponible exportado exitosamente por usuario: ${req.user?.id}`);

    } catch (error: any) {
      logger.error(`Error al exportar Stock Disponible: ${error.message}`, { error });
      res.status(500).json({
        success: false,
        message: 'Error al exportar el reporte',
        error: error.message
      });
    }
  };

  /**
   * Exporta reporte de Asignaciones por Destino a Excel
   */
  public exportAssignmentsByDestination = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      // Obtener todos los datos sin paginación
      const params = {
        TipoDestino: req.query.TipoDestino || null,
        DestinoID: req.query.DestinoID ? Number(req.query.DestinoID) : null,
        EstadoAsignacion: req.query.EstadoAsignacion || null,
        FechaDesde: req.query.FechaDesde || null,
        FechaHasta: req.query.FechaHasta || null,
        PageNumber: 1,
        PageSize: 10000 // Valor alto para obtener todos
      };

      const result = await this.db.executeStoredProcedure('sp_Report_AssignmentsByDestination', params);
      const data = result.recordset || [];

      // Formatear fechas para mejor presentación
      const formattedData = data.map((item: any) => ({
        ...item,
        fecha_asignacion: item.fecha_asignacion ? new Date(item.fecha_asignacion).toLocaleDateString('es-ES') : '',
        fecha_devolucion: item.fecha_devolucion ? new Date(item.fecha_devolucion).toLocaleDateString('es-ES') : ''
      }));

      const reportTitle = req.query.TipoDestino ? 
        `Asignaciones por ${req.query.TipoDestino}` : 
        'Asignaciones por Destino';

      // Generar Excel
      const excelBuffer = ExportService.generateExcel({
        title: reportTitle,
        filename: ExportService.generateFilename('asignaciones_destino'),
        columns: ExportService.getAssignmentColumns(),
        data: formattedData,
        sheetName: 'Asignaciones'
      });

      const filename = ExportService.generateFilename('asignaciones_destino');

      // Configurar headers para descarga
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', excelBuffer.length);

      // Enviar archivo
      res.send(excelBuffer);

      logger.info(`Asignaciones por Destino exportadas exitosamente por usuario: ${req.user?.id}`, { params });

    } catch (error: any) {
      logger.error(`Error al exportar Asignaciones por Destino: ${error.message}`, { error });
      res.status(500).json({
        success: false,
        message: 'Error al exportar el reporte',
        error: error.message
      });
    }
  };

  /**
   * Obtiene un reporte de historia de reparaciones con opciones de filtrado y paginación
   */
  public getRepairHistoryReport = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const {
        fechaDesde,
        fechaHasta,
        estado,
        proveedor,
        page = 1,
        pageSize = 20
      } = req.query;

      // Validar parámetros
      const pageNumber = Number(page);
      const itemsPerPage = Number(pageSize);

      if (isNaN(pageNumber) || pageNumber < 1) {
        res.status(400).json({
          success: false,
          message: 'Número de página inválido'
        });
        return;
      }

      if (isNaN(itemsPerPage) || itemsPerPage < 1 || itemsPerPage > 100) {
        res.status(400).json({
          success: false,
          message: 'Tamaño de página inválido (debe ser entre 1 y 100)'
        });
        return;
      }

      // Preparar parámetros para el SP
      const params: { [key: string]: any } = {
        PageNumber: { type: sql.Int, value: pageNumber },
        PageSize: { type: sql.Int, value: itemsPerPage }
      };

      // Agregar filtros opcionales
      if (fechaDesde) {
        params.FechaDesde = { type: sql.Date, value: fechaDesde };
      }
      if (fechaHasta) {
        params.FechaHasta = { type: sql.Date, value: fechaHasta };
      }
      if (estado && estado !== '') {
        params.Estado = { type: sql.NVarChar(20), value: estado };
      }
      if (proveedor && proveedor !== '') {
        params.Proveedor = { type: sql.NVarChar(100), value: proveedor };
      }

      // Ejecutar stored procedure
      const result = await this.db.executeStoredProcedure('sp_Report_RepairHistory', params);
      const items = result.recordset as RepairHistoryItem[];

      // Calcular totales para paginación
      const totalRecords = items.length > 0 ? items[0].TotalRows : 0;
      const totalPages = Math.ceil(totalRecords / itemsPerPage);

      // Preparar respuesta
      const response = {
        success: true,
        data: {
          items,
          pagination: {
            currentPage: pageNumber,
            pageSize: itemsPerPage,
            totalRecords,
            totalPages,
            hasNextPage: pageNumber < totalPages,
            hasPreviousPage: pageNumber > 1
          }
        }
      };

      res.json(response);

    } catch (error) {
      logger.error('Error al obtener reporte de historia de reparaciones:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener el reporte',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  /**
   * Exporta reporte de Historia de Reparaciones a Excel
   */
  public exportRepairHistory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      // Obtener todos los datos sin paginación
      const params: { [key: string]: any } = {
        PageNumber: { type: sql.Int, value: 1 },
        PageSize: { type: sql.Int, value: 10000 }, // Valor alto para obtener todos
      };

      // Agregar filtros opcionales
      if (req.query.fechaDesde) {
        params.FechaDesde = { type: sql.Date, value: req.query.fechaDesde };
      }
      if (req.query.fechaHasta) {
        params.FechaHasta = { type: sql.Date, value: req.query.fechaHasta };
      }
      if (req.query.estado && req.query.estado !== '') {
        params.Estado = { type: sql.NVarChar(20), value: req.query.estado };
      }
      if (req.query.proveedor && req.query.proveedor !== '') {
        params.Proveedor = { type: sql.NVarChar(100), value: req.query.proveedor };
      }

      const result = await this.db.executeStoredProcedure('sp_Report_RepairHistory', params);
      const data = result.recordset || [];

      // Formatear fechas para mejor presentación
      const formattedData = data.map((item: any) => ({
        'ID Reparación': item.reparacion_id,
        'Número de Serie': item.numero_serie,
        'Marca': item.marca,
        'Modelo': item.modelo,
        'Categoría': item.categoria,
        'Fecha Envío': item.fecha_envio ? new Date(item.fecha_envio).toLocaleDateString('es-ES') : '',
        'Fecha Retorno': item.fecha_retorno ? new Date(item.fecha_retorno).toLocaleDateString('es-ES') : 'Pendiente',
        'Proveedor': item.proveedor,
        'Estado': item.estado,
        'Días Reparación': item.dias_reparacion,
        'Problema': item.problema_descripcion,
        'Solución': item.solucion_descripcion || 'Pendiente',
        'Usuario Envía': item.usuario_envia,
        'Usuario Recibe': item.usuario_recibe || 'Pendiente'
      }));

      // Generar Excel
      const excelBuffer = ExportService.generateExcel({
        title: 'Historia de Reparaciones',
        filename: ExportService.generateFilename('historia_reparaciones'),
        columns: [
          { header: 'ID Reparación', key: 'ID Reparación', width: 15 },
          { header: 'Número de Serie', key: 'Número de Serie', width: 20 },
          { header: 'Marca', key: 'Marca', width: 15 },
          { header: 'Modelo', key: 'Modelo', width: 20 },
          { header: 'Categoría', key: 'Categoría', width: 15 },
          { header: 'Fecha Envío', key: 'Fecha Envío', width: 15 },
          { header: 'Fecha Retorno', key: 'Fecha Retorno', width: 15 },
          { header: 'Proveedor', key: 'Proveedor', width: 20 },
          { header: 'Estado', key: 'Estado', width: 15 },
          { header: 'Días Reparación', key: 'Días Reparación', width: 15 },
          { header: 'Problema', key: 'Problema', width: 30 },
          { header: 'Solución', key: 'Solución', width: 30 },
          { header: 'Usuario Envía', key: 'Usuario Envía', width: 20 },
          { header: 'Usuario Recibe', key: 'Usuario Recibe', width: 20 }
        ],
        data: formattedData
      });

      // Configurar headers para descarga
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `historia_reparaciones_${timestamp}.xlsx`;
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

      // Enviar archivo
      res.send(excelBuffer);

      logger.info(`Historia de Reparaciones exportada exitosamente por usuario: ${req.user?.id}`);

    } catch (error: any) {
      logger.error(`Error al exportar Historia de Reparaciones: ${error.message}`, { error });
      res.status(500).json({
        success: false,
        message: 'Error al exportar el reporte',
        error: error.message
      });
    }
  };

  /**
   * Obtiene reporte de Auditoría de Movimientos con paginación y filtros
   */
  public getStockMovements = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { 
        page = 1, 
        pageSize = 25,
        tipoMovimiento,
        fechaDesde,
        fechaHasta,
        producto,
        usuario
      } = req.query;

      // Validaciones
      const pageNumber = parseInt(page as string);
      const itemsPerPage = parseInt(pageSize as string);

      if (isNaN(pageNumber) || pageNumber < 1) {
        res.status(400).json({
          success: false,
          message: 'Número de página inválido'
        });
        return;
      }

      if (isNaN(itemsPerPage) || itemsPerPage < 1 || itemsPerPage > 100) {
        res.status(400).json({
          success: false,
          message: 'Tamaño de página inválido (debe ser entre 1 y 100)'
        });
        return;
      }

      // Preparar parámetros para el SP
      const params: { [key: string]: any } = {
        PageNumber: { type: sql.Int, value: pageNumber },
        PageSize: { type: sql.Int, value: itemsPerPage }
      };

      // Agregar filtros opcionales
      if (fechaDesde) {
        params.fecha_desde = { type: sql.Date, value: fechaDesde };
      }
      if (fechaHasta) {
        params.fecha_hasta = { type: sql.Date, value: fechaHasta };
      }
      if (tipoMovimiento && tipoMovimiento !== '') {
        params.tipo_movimiento = { type: sql.NVarChar(20), value: tipoMovimiento };
      }
      if (producto && producto !== '') {
        params.producto = { type: sql.NVarChar(100), value: producto };
      }
      if (usuario && usuario !== '') {
        params.usuario = { type: sql.NVarChar(100), value: usuario };
      }

      // Ejecutar stored procedure
      const result = await this.db.executeStoredProcedure('sp_Report_StockMovements', params);
      const items = result.recordset as StockMovementReportItem[] || [];

      // Calcular totales para paginación
      const totalRecords = items.length > 0 ? items[0].TotalRecords : 0;
      const totalPages = Math.ceil(totalRecords / itemsPerPage);

      // Preparar respuesta
      const response = {
        success: true,
        data: {
          items,
          pagination: {
            currentPage: pageNumber,
            pageSize: itemsPerPage,
            totalRecords,
            totalPages,
            hasNextPage: pageNumber < totalPages,
            hasPreviousPage: pageNumber > 1
          }
        }
      };

      res.json(response);

    } catch (error) {
      logger.error('Error al obtener reporte de auditoría de movimientos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener el reporte',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  /**
   * Exporta reporte de Auditoría de Movimientos a Excel
   */
  public exportStockMovements = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      // Obtener todos los datos sin paginación
      const params: { [key: string]: any } = {
        PageNumber: { type: sql.Int, value: 1 },
        PageSize: { type: sql.Int, value: 10000 }, // Valor alto para obtener todos
      };

      // Agregar filtros opcionales
      if (req.query.fechaDesde) {
        params.fecha_desde = { type: sql.Date, value: req.query.fechaDesde };
      }
      if (req.query.fechaHasta) {
        params.fecha_hasta = { type: sql.Date, value: req.query.fechaHasta };
      }
      if (req.query.tipoMovimiento && req.query.tipoMovimiento !== '') {
        params.tipo_movimiento = { type: sql.NVarChar(20), value: req.query.tipoMovimiento };
      }
      if (req.query.producto && req.query.producto !== '') {
        params.producto = { type: sql.NVarChar(100), value: req.query.producto };
      }
      if (req.query.usuario && req.query.usuario !== '') {
        params.usuario = { type: sql.NVarChar(100), value: req.query.usuario };
      }

      const result = await this.db.executeStoredProcedure('sp_Report_StockMovements', params);
      const data = result.recordset as StockMovementReportItem[] || [];

      // Formatear datos para mejor presentación
      const formattedData = data.map((item: any) => ({
        'ID Movimiento': item.movimiento_id,
        'Fecha': item.fecha_movimiento ? new Date(item.fecha_movimiento).toLocaleDateString('es-ES') : '',
        'Tipo': item.tipo_movimiento,
        'Producto': item.producto,
        'Categoría': item.categoria,
        'Cantidad': item.cantidad,
        'Stock Anterior': item.stock_anterior,
        'Stock Actual': item.stock_actual,
        'Motivo': item.motivo || '',
        'Destino': item.destino || 'Sin destino',
        'Tipo Destino': item.tipo_destino,
        'Usuario': item.usuario_nombre,
        'Observaciones': item.observaciones || ''
      }));

      // Generar Excel
      const excelBuffer = ExportService.generateExcel({
        title: 'Auditoría de Movimientos de Stock',
        filename: ExportService.generateFilename('auditoria_movimientos'),
        columns: [
          { header: 'ID Movimiento', key: 'ID Movimiento', width: 15 },
          { header: 'Fecha', key: 'Fecha', width: 15 },
          { header: 'Tipo', key: 'Tipo', width: 12 },
          { header: 'Producto', key: 'Producto', width: 25 },
          { header: 'Categoría', key: 'Categoría', width: 15 },
          { header: 'Cantidad', key: 'Cantidad', width: 12 },
          { header: 'Stock Anterior', key: 'Stock Anterior', width: 15 },
          { header: 'Stock Actual', key: 'Stock Actual', width: 15 },
          { header: 'Motivo', key: 'Motivo', width: 20 },
          { header: 'Destino', key: 'Destino', width: 20 },
          { header: 'Tipo Destino', key: 'Tipo Destino', width: 15 },
          { header: 'Usuario', key: 'Usuario', width: 15 },
          { header: 'Observaciones', key: 'Observaciones', width: 30 }
        ],
        data: formattedData
      });

      // Configurar headers para descarga
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `auditoria_movimientos_${timestamp}.xlsx`;
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

      // Enviar archivo
      res.send(excelBuffer);

      logger.info(`Auditoría de Movimientos exportada exitosamente por usuario: ${req.user?.id}`);

    } catch (error: any) {
      logger.error(`Error al exportar Auditoría de Movimientos: ${error.message}`, { error });
      res.status(500).json({
        success: false,
        message: 'Error al exportar el reporte',
        error: error.message
      });
    }
  };
}

export const reportController = new ReportController();