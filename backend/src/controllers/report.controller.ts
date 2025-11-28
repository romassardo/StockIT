import { Request, Response } from 'express';
import { DatabaseConnection } from '../utils/database';
import { logger } from '../utils/logger';
import { AuthRequest } from '../types/auth.types';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { ExportService } from '../services/export.service';
import mysql from 'mysql2/promise';

interface StockMovementReportItem {
  MovimientoId: number;
  TipoMovimiento: string;
  Cantidad: number;
  FechaMovimiento: string;
  ProductoNombre: string;
  Categoria: string;
  UsuarioNombre: string;
  EmpleadoNombre?: string;
  SectorNombre?: string;
  SucursalNombre?: string;
  Motivo?: string;
  Observaciones?: string;
}

class ReportController {
  private db: DatabaseConnection;

  constructor() {
    this.db = DatabaseConnection.getInstance();
  }

  private getPaginationParams(query: any) {
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || parseInt(query.pageSize as string) || 25;
    return { page, limit };
  }

  private handleControllerError(res: Response, error: any, message: string) {
    logger.error(`${message}: ${error.message}`, { 
      error: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      message: `${message}. Por favor, inténtelo de nuevo más tarde.`,
      error: error.message
    });
  }

  public getInventoryReport = async (req: Request, res: Response) => {
    try {
      const { page, limit } = this.getPaginationParams(req.query);
      
      const [results] = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>('sp_Report_Inventory_Full', [
        page,
        limit,
        req.query.categoriaId || null,
        req.query.estado || null,
        req.query.fechaDesde || null,
        req.query.fechaHasta || null
      ]);

      // MySQL devuelve resultados en un array, el primer elemento contiene los datos
      const data = Array.isArray(results) ? results : [];
      const totalRows = data.length > 0 ? data[0].TotalRows : 0;

      res.status(200).json({
        success: true,
        data: data,
        pagination: {
          page,
          limit,
          totalRows,
          totalPages: Math.ceil(totalRows / limit)
        }
      });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Error al obtener el reporte de inventario');
    }
  };

  public getFullInventoryReport = async (req: Request, res: Response) => {
    try {
      const { page, limit } = this.getPaginationParams(req.query);
      const filterType = req.query.FilterType as string || null;
      const filterCategoria = req.query.FilterCategoria as string || null;
      const sortBy = req.query.SortBy as string || 'Categoria';
      const sortOrder = req.query.SortOrder as string || 'ASC';

      const [rows] = await this.db.executeStoredProcedure<any>('sp_Report_StockDisponible', [
        page,
        limit,
        filterType,
        filterCategoria,
        sortBy,
        sortOrder,
        req.query.searchTerm || null
      ]);

      // Handle potential nested array from mysql2
      const items = (Array.isArray(rows) && Array.isArray(rows[0])) ? rows[0] : rows;
      
      // DEBUG: Inspect result structure
      logger.info(`[DEBUG] FullInventory Report - Rows isArray: ${Array.isArray(rows)}, Rows length: ${rows.length}`);
      if (rows.length > 0) {
         logger.info(`[DEBUG] FullInventory Report - First element isArray: ${Array.isArray(rows[0])}`);
      }
      logger.info(`[DEBUG] FullInventory Report - Extracted items length: ${items.length}`);
      if (items.length > 0) {
         logger.info(`[DEBUG] FullInventory Report - First item keys: ${Object.keys(items[0]).join(', ')}`);
         logger.info(`[DEBUG] FullInventory Report - TotalRecords val: ${items[0].TotalRecords}`);
      }

      // Get total records from the first item (window function result)
      const totalRecords = items.length > 0 ? items[0].TotalRecords : 0;

      res.status(200).json({
        success: true,
        items: items,
        totalItems: totalRecords,
        totalPages: Math.ceil(totalRecords / limit),
        currentPage: page
      });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Error al obtener el reporte completo de inventario');
    }
  };

  public getAssignmentsByDestinationReport = async (req: AuthRequest, res: Response) => {
    try {
      const { page, limit } = this.getPaginationParams(req.query);
      
      // Convertir 'activa'/'devuelta' del frontend a 'Activa'/'Devuelta' que espera el SP
      let estadoAsignacion = req.query.estadoAsignacion as string | null;
      if (estadoAsignacion === 'activa') {
        estadoAsignacion = 'Activa';
      } else if (estadoAsignacion === 'devuelta') {
        estadoAsignacion = 'Devuelta';
      } else if (!estadoAsignacion) {
        estadoAsignacion = null;
      }

      const [rows] = await this.db.executeStoredProcedure<any>('sp_Report_AssignmentsByDestination', [
        req.query.tipoDestino || null,
        req.query.destinoId ? Number(req.query.destinoId) : null,
        estadoAsignacion,
        req.query.fechaDesde || null,
        req.query.fechaHasta || null,
        page,
        limit,
        req.query.searchTerm || null,
        req.query.tipoDispositivo || null
      ]);

      // Handle potential nested array from mysql2 (como en getFullInventoryReport)
      const items = (Array.isArray(rows) && Array.isArray(rows[0])) ? rows[0] : rows;
      
      // DEBUG: Inspect result structure
      logger.info(`[DEBUG] AssignmentsByDestination - Rows isArray: ${Array.isArray(rows)}, Rows length: ${rows.length}`);
      if (rows.length > 0) {
         logger.info(`[DEBUG] AssignmentsByDestination - First element isArray: ${Array.isArray(rows[0])}`);
      }
      logger.info(`[DEBUG] AssignmentsByDestination - Extracted items length: ${items.length}`);
      if (items.length > 0) {
         logger.info(`[DEBUG] AssignmentsByDestination - First item keys: ${Object.keys(items[0]).join(', ')}`);
      }

      const totalRows = items.length > 0 ? items[0].TotalRows : 0;

      res.status(200).json({
        success: true,
        items: items,
        totalItems: totalRows,
        totalPages: Math.ceil(totalRows / limit),
        currentPage: page
      });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Error al obtener el reporte de asignaciones por destino');
    }
  };

  public getStockAlertsReport = async (req: AuthRequest, res: Response) => {
    try {
      const { page, limit } = this.getPaginationParams(req.query);
      const tipoAlerta = req.query.tipoAlerta as string;
      
      // Determinar flags basado en tipoAlerta ('critical', 'low', o null/undefined para ambos)
      const incluirSinStock = !tipoAlerta || tipoAlerta === 'critical' || tipoAlerta === 'all';
      const incluirStockBajo = !tipoAlerta || tipoAlerta === 'low' || tipoAlerta === 'all';

      const [rows] = await this.db.executeStoredProcedure<any>('sp_Report_StockAlerts', [
        req.query.categoriaId ? Number(req.query.categoriaId) : null, // p_CategoriaID
        null, // p_UmbralPersonalizado (no implementado en frontend aún)
        incluirSinStock, // p_IncluirSinStock
        incluirStockBajo, // p_IncluirStockBajo
        page, // p_PageNumber
        limit, // p_PageSize
        req.query.searchTerm || null
      ]);

      // rows[0] son los items, rows[1] es el resumen
      const items = Array.isArray(rows) && rows[0] ? rows[0] : [];
      
      // DEBUG: Log keys of first item to check casing
      if (items.length > 0) {
        logger.info(`[DEBUG] StockAlerts keys: ${Object.keys(items[0]).join(', ')}`);
      }

      const summary = Array.isArray(rows) && rows[1] && rows[1][0] ? rows[1][0] : {};
      
      const totalRows = items.length > 0 ? items[0].TotalRows : 0;

      res.status(200).json({
        success: true,
        items: items,
        summary: summary,
        pagination: {
          page,
          limit,
          totalItems: totalRows,
          totalPages: Math.ceil(totalRows / limit)
        }
      });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Error al obtener el reporte de alertas de stock');
    }
  };

  public getStockAlertsCount = async (req: AuthRequest, res: Response) => {
    try {
      const [results] = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>('sp_Report_GetStockAlertsCount', []);
      const data = Array.isArray(results) && results.length > 0 ? results[0] : { count: 0 };

      res.status(200).json({
        success: true,
        data: data
      });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Error al obtener el conteo de alertas de stock');
    }
  };

  public getRepairHistoryReport = async (req: AuthRequest, res: Response) => {
    try {
      const { page, limit } = this.getPaginationParams(req.query);
      
      const [results] = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>('sp_Report_RepairHistory', [
        req.query.estadoReparacion || null,
        req.query.proveedor || null,
        req.query.fechaDesde || null,
        req.query.fechaHasta || null,
        page,
        limit
      ]);

      const data = Array.isArray(results) ? results : [];
      const totalRows = data.length > 0 ? data[0].TotalRows : 0;

      res.status(200).json({
        success: true,
        data: data,
        pagination: {
          page,
          limit,
          totalRows,
          totalPages: Math.ceil(totalRows / limit)
        }
      });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Error al obtener el reporte de historial de reparaciones');
    }
  };

  public getStockMovements = async (req: AuthRequest, res: Response) => {
    try {
      const { page, limit } = this.getPaginationParams(req.query);
      
      const [results] = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>('sp_Report_StockMovements', [
        req.query.tipoMovimiento || null,
        req.query.productoId ? Number(req.query.productoId) : null,
        req.query.fechaDesde || null,
        req.query.fechaHasta || null,
        page,
        limit
      ]);

      const data = Array.isArray(results) ? results : [];
      const totalRows = data.length > 0 ? data[0].TotalRows : 0;

      res.status(200).json({
        success: true,
        data: data,
        pagination: {
          page,
          limit,
          totalRows,
          totalPages: Math.ceil(totalRows / limit)
        }
      });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Error al obtener el reporte de movimientos de stock');
    }
  };

  /**
   * Exporta reportes a Excel
   */
  public exportReportToExcel = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { reportType, ...queryParams } = req.query;
      
      let reportData: any[] = [];
      let fileName = '';
      
      switch (reportType) {
        case 'inventory':
          const [inventoryRows] = await this.db.executeStoredProcedure<any>('sp_Report_Inventory', [
            1, // PageNumber
            100000, // PageSize
            queryParams.categoriaId ? Number(queryParams.categoriaId) : null,
            queryParams.fechaDesde || null,
            queryParams.fechaHasta || null
          ]);
          
          reportData = (Array.isArray(inventoryRows) && Array.isArray(inventoryRows[0])) ? inventoryRows[0] : inventoryRows;
          fileName = 'Reporte_Inventario';
          break;
          
        case 'assignmentsByDestination':
          const [assignmentsRows] = await this.db.executeStoredProcedure<any>('sp_Report_AssignmentsByDestination', [
            queryParams.tipoDestino || null,
            queryParams.destinoId ? Number(queryParams.destinoId) : null,
            queryParams.estadoAsignacion || null,
            queryParams.fechaDesde || null,
            queryParams.fechaHasta || null,
            1, // PageNumber
            100000, // PageSize
            queryParams.searchTerm || null,
            queryParams.tipoDispositivo || null
          ]);
          
          reportData = (Array.isArray(assignmentsRows) && Array.isArray(assignmentsRows[0])) ? assignmentsRows[0] : assignmentsRows;
          fileName = 'Reporte_Asignaciones_Por_Destino';
          break;
          
        case 'stockAlerts':
          const [stockAlertsRows] = await this.db.executeStoredProcedure<any>('sp_Report_StockAlerts', [
            queryParams.tipoAlerta || null,
            queryParams.categoriaId ? Number(queryParams.categoriaId) : null,
            queryParams.diasParaAgotarse ? Number(queryParams.diasParaAgotarse) : null,
            1, // PageNumber
            100000, // PageSize
            queryParams.searchTerm || null
          ]);
          
          reportData = (Array.isArray(stockAlertsRows) && Array.isArray(stockAlertsRows[0])) ? stockAlertsRows[0] : stockAlertsRows;
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
          if (!res.headersSent) {
            res.status(500).json({ success: false, message: 'Error al enviar el archivo de reporte' });
          }
        }
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) logger.error(`Error al eliminar archivo temporal: ${unlinkErr.message}`);
        });
      });
    } catch (error: any) {
      logger.error(`Error al exportar reporte a Excel: ${error.message}`, { error });
      res.status(500).json({ success: false, message: 'Error al exportar el reporte a Excel', error: error.message });
    }
  };

  /**
   * Exporta reporte de Stock Disponible a Excel
   */
  public exportStockDisponible = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const [rows] = await this.db.executeStoredProcedure<any>('sp_Report_StockDisponible', [
        1, 100000, req.query.FilterType || null, req.query.FilterCategoria || null,
        req.query.SortBy || 'Categoria', req.query.SortOrder || 'ASC'
      ]);
      const data = (Array.isArray(rows) && Array.isArray(rows[0])) ? rows[0] : rows;
      const excelBuffer = ExportService.generateExcel({
        title: 'Reporte de Stock Disponible',
        filename: ExportService.generateFilename('stock_disponible'),
        columns: ExportService.getStockDisponibleColumns(),
        data: data,
        sheetName: 'Stock Disponible'
      });
      const filename = ExportService.generateFilename('stock_disponible');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', excelBuffer.length);
      res.send(excelBuffer);
      logger.info(`Stock Disponible exportado exitosamente por usuario: ${req.user?.id}`);
    } catch (error: any) {
      logger.error(`Error al exportar Stock Disponible: ${error.message}`, { error });
      res.status(500).json({ success: false, message: 'Error al exportar el reporte', error: error.message });
    }
  };

  /**
   * Exporta reporte de Asignaciones por Destino a Excel
   */
  public exportAssignmentsByDestination = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const [rows] = await this.db.executeStoredProcedure<any>('sp_Report_AssignmentsByDestination', [
        req.query.TipoDestino || null,
        req.query.DestinoID ? Number(req.query.DestinoID) : null,
        req.query.EstadoAsignacion || null,
        req.query.FechaDesde || null,
        req.query.FechaHasta || null,
        1,
        10000,
        req.query.searchTerm || null,
        req.query.TipoDispositivo || null
      ]);
      const data = (Array.isArray(rows) && Array.isArray(rows[0])) ? rows[0] : rows;
      const formattedData = data.map((item: any) => ({
        ...item,
        fecha_asignacion: item.fecha_asignacion ? new Date(item.fecha_asignacion).toLocaleDateString('es-ES') : '',
        fecha_devolucion: item.fecha_devolucion ? new Date(item.fecha_devolucion).toLocaleDateString('es-ES') : ''
      }));
      const reportTitle = req.query.TipoDestino ? `Asignaciones por ${req.query.TipoDestino}` : 'Asignaciones por Destino';
      const excelBuffer = ExportService.generateExcel({
        title: reportTitle,
        filename: ExportService.generateFilename('asignaciones_destino'),
        columns: ExportService.getAssignmentColumns(),
        data: formattedData,
        sheetName: 'Asignaciones por Destino'
      });
      const filename = ExportService.generateFilename('asignaciones_destino');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', excelBuffer.length);
      res.send(excelBuffer);
      logger.info(`Asignaciones por Destino exportado exitosamente por usuario: ${req.user?.id}`);
    } catch (error: any) {
      logger.error(`Error al exportar Asignaciones por Destino: ${error.message}`, { error });
      res.status(500).json({ success: false, message: 'Error al exportar el reporte', error: error.message });
    }
  };

  /**
   * Exporta reporte de Historial de Reparaciones a Excel
   */
  public exportRepairHistory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const [results] = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>('sp_Report_RepairHistory', [
        req.query.EstadoReparacion || null, req.query.Proveedor || null,
        req.query.FechaDesde || null, req.query.FechaHasta || null, 1, 10000
      ]);
      const data = Array.isArray(results) ? results : [];
      const formattedData = data.map((item: any) => ({
        ...item,
        fecha_envio: item.fecha_envio ? new Date(item.fecha_envio).toLocaleDateString('es-ES') : '',
        fecha_retorno: item.fecha_retorno ? new Date(item.fecha_retorno).toLocaleDateString('es-ES') : ''
      }));
      const repairColumns = [
        { key: 'id', header: 'ID Reparación', width: 15 },
        { key: 'numero_serie', header: 'Número Serie', width: 20 },
        { key: 'producto_nombre', header: 'Producto', width: 35 },
        { key: 'categoria', header: 'Categoría', width: 15 },
        { key: 'fecha_envio', header: 'Fecha Envío', width: 15 },
        { key: 'fecha_retorno', header: 'Fecha Retorno', width: 15 },
        { key: 'proveedor', header: 'Proveedor', width: 20 },
        { key: 'estado', header: 'Estado', width: 15 },
        { key: 'problema_descripcion', header: 'Problema', width: 30 },
        { key: 'solucion_descripcion', header: 'Solución', width: 30 }
      ];
      const excelBuffer = ExportService.generateExcel({
        title: 'Historial de Reparaciones',
        filename: ExportService.generateFilename('historial_reparaciones'),
        columns: repairColumns,
        data: formattedData,
        sheetName: 'Historial de Reparaciones'
      });
      const filename = ExportService.generateFilename('historial_reparaciones');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', excelBuffer.length);
      res.send(excelBuffer);
      logger.info(`Historial de Reparaciones exportado exitosamente por usuario: ${req.user?.id}`);
    } catch (error: any) {
      logger.error(`Error al exportar Historial de Reparaciones: ${error.message}`, { error });
      res.status(500).json({ success: false, message: 'Error al exportar el reporte', error: error.message });
    }
  };

  /**
   * Exporta reporte de Movimientos de Stock a Excel
   */
  public exportStockMovements = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const [results] = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>('sp_Report_StockMovements', [
        req.query.TipoMovimiento || null, req.query.ProductoID ? Number(req.query.ProductoID) : null,
        req.query.FechaDesde || null, req.query.FechaHasta || null, 1, 10000
      ]);
      const data = Array.isArray(results) ? results as StockMovementReportItem[] : [];
      const formattedData = data.map((item) => ({
        ...item,
        FechaMovimiento: item.FechaMovimiento ? new Date(item.FechaMovimiento).toLocaleDateString('es-ES') : ''
      }));
      const stockMovementsColumns = [
        { key: 'MovimientoId', header: 'ID Movimiento', width: 15 },
        { key: 'FechaMovimiento', header: 'Fecha', width: 15 },
        { key: 'TipoMovimiento', header: 'Tipo', width: 12 },
        { key: 'ProductoNombre', header: 'Producto', width: 25 },
        { key: 'Categoria', header: 'Categoría', width: 15 },
        { key: 'Cantidad', header: 'Cantidad', width: 12 },
        { key: 'UsuarioNombre', header: 'Usuario', width: 15 },
        { key: 'EmpleadoNombre', header: 'Empleado', width: 20 },
        { key: 'SectorNombre', header: 'Sector', width: 20 },
        { key: 'SucursalNombre', header: 'Sucursal', width: 20 },
        { key: 'Motivo', header: 'Motivo', width: 20 },
        { key: 'Observaciones', header: 'Observaciones', width: 30 }
      ];
      const excelBuffer = ExportService.generateExcel({
        title: 'Movimientos de Stock',
        filename: ExportService.generateFilename('movimientos_stock'),
        columns: stockMovementsColumns,
        data: formattedData,
        sheetName: 'Movimientos de Stock'
      });
      const filename = ExportService.generateFilename('movimientos_stock');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', excelBuffer.length);
      res.send(excelBuffer);
      logger.info(`Movimientos de Stock exportado exitosamente por usuario: ${req.user?.id}`);
    } catch (error: any) {
      logger.error(`Error al exportar Movimientos de Stock: ${error.message}`, { error });
      res.status(500).json({ success: false, message: 'Error al exportar el reporte', error: error.message });
    }
  };
}

export default new ReportController();