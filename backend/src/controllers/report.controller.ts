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
    const limit = parseInt(query.limit as string) || 25;
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
      const [results] = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>('sp_Report_Inventory_Full', [
        1, // page
        10000, // limit (valor alto para obtener todos)
        req.query.categoriaId || null,
        req.query.estado || null,
        req.query.fechaDesde || null,
        req.query.fechaHasta || null
      ]);

      const data = Array.isArray(results) ? results : [];

      res.status(200).json({
        success: true,
        data: data
      });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Error al obtener el reporte completo de inventario');
    }
  };

  public getAssignmentsByDestinationReport = async (req: AuthRequest, res: Response) => {
    try {
      const { page, limit } = this.getPaginationParams(req.query);
      
      const [results] = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>('sp_Report_AssignmentsByDestination', [
        req.query.tipoDestino || null,
        req.query.destinoId ? Number(req.query.destinoId) : null,
        req.query.estadoAsignacion || null,
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
      this.handleControllerError(res, error, 'Error al obtener el reporte de asignaciones por destino');
    }
  };

  public getStockAlertsReport = async (req: AuthRequest, res: Response) => {
    try {
      const { page, limit } = this.getPaginationParams(req.query);
      
      const [results] = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>('sp_Report_StockAlerts', [
        req.query.tipoAlerta || null,
        req.query.categoriaId ? Number(req.query.categoriaId) : null,
        req.query.diasParaAgotarse ? Number(req.query.diasParaAgotarse) : null,
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
          const [inventoryResults] = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>('sp_Report_Inventory', [
            1, // PageNumber
            10000, // PageSize - valor alto para obtener todos los registros
            queryParams.categoriaId ? Number(queryParams.categoriaId) : null,
            queryParams.fechaDesde || null,
            queryParams.fechaHasta || null
          ]);
          
          reportData = Array.isArray(inventoryResults) ? inventoryResults : [];
          fileName = 'Reporte_Inventario';
          break;
          
        case 'assignmentsByDestination':
          const [assignmentsResults] = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>('sp_Report_AssignmentsByDestination', [
            queryParams.tipoDestino || null,
            queryParams.destinoId ? Number(queryParams.destinoId) : null,
            queryParams.estadoAsignacion || null,
            queryParams.fechaDesde || null,
            queryParams.fechaHasta || null,
            1, // PageNumber
            10000 // PageSize
          ]);
          
          reportData = Array.isArray(assignmentsResults) ? assignmentsResults : [];
          fileName = 'Reporte_Asignaciones_Por_Destino';
          break;
          
        case 'stockAlerts':
          const [stockAlertsResults] = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>('sp_Report_StockAlerts', [
            queryParams.tipoAlerta || null,
            queryParams.categoriaId ? Number(queryParams.categoriaId) : null,
            queryParams.diasParaAgotarse ? Number(queryParams.diasParaAgotarse) : null,
            1, // PageNumber
            10000 // PageSize
          ]);
          
          reportData = Array.isArray(stockAlertsResults) ? stockAlertsResults : [];
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
      const [results] = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>('sp_Report_StockDisponible', [
        1, // PageNumber
        10000, // PageSize - valor alto para obtener todos
        req.query.FilterType || null,
        req.query.FilterCategoria || null,
        req.query.SortBy || 'Categoria',
        req.query.SortOrder || 'ASC'
      ]);

      const data = Array.isArray(results) ? results : [];

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
      const [results] = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>('sp_Report_AssignmentsByDestination', [
        req.query.TipoDestino || null,
        req.query.DestinoID ? Number(req.query.DestinoID) : null,
        req.query.EstadoAsignacion || null,
        req.query.FechaDesde || null,
        req.query.FechaHasta || null,
        1, // PageNumber
        10000 // PageSize - valor alto para obtener todos
      ]);

      const data = Array.isArray(results) ? results : [];

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
        sheetName: 'Asignaciones por Destino'
      });

      const filename = ExportService.generateFilename('asignaciones_destino');

      // Configurar headers para descarga
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', excelBuffer.length);

      // Enviar archivo
      res.send(excelBuffer);

      logger.info(`Asignaciones por Destino exportado exitosamente por usuario: ${req.user?.id}`);

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
   * Exporta reporte de Historial de Reparaciones a Excel
   */
  public exportRepairHistory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      // Obtener todos los datos sin paginación
      const [results] = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>('sp_Report_RepairHistory', [
        req.query.EstadoReparacion || null,
        req.query.Proveedor || null,
        req.query.FechaDesde || null,
        req.query.FechaHasta || null,
        1, // PageNumber
        10000 // PageSize - valor alto para obtener todos
      ]);

      const data = Array.isArray(results) ? results : [];

      // Formatear fechas para mejor presentación
      const formattedData = data.map((item: any) => ({
        ...item,
        fecha_envio: item.fecha_envio ? new Date(item.fecha_envio).toLocaleDateString('es-ES') : '',
        fecha_retorno: item.fecha_retorno ? new Date(item.fecha_retorno).toLocaleDateString('es-ES') : ''
      }));

      // Definir columnas para reparaciones
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

      // Generar Excel
      const excelBuffer = ExportService.generateExcel({
        title: 'Historial de Reparaciones',
        filename: ExportService.generateFilename('historial_reparaciones'),
        columns: repairColumns,
        data: formattedData,
        sheetName: 'Historial de Reparaciones'
      });

      const filename = ExportService.generateFilename('historial_reparaciones');

      // Configurar headers para descarga
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', excelBuffer.length);

      // Enviar archivo
      res.send(excelBuffer);

      logger.info(`Historial de Reparaciones exportado exitosamente por usuario: ${req.user?.id}`);

    } catch (error: any) {
      logger.error(`Error al exportar Historial de Reparaciones: ${error.message}`, { error });
      res.status(500).json({
        success: false,
        message: 'Error al exportar el reporte',
        error: error.message
      });
    }
  };

  /**
   * Exporta reporte de Movimientos de Stock a Excel
   */
  public exportStockMovements = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      // Obtener todos los datos sin paginación
      const [results] = await this.db.executeStoredProcedure<mysql.RowDataPacket[]>('sp_Report_StockMovements', [
        req.query.TipoMovimiento || null,
        req.query.ProductoID ? Number(req.query.ProductoID) : null,
        req.query.FechaDesde || null,
        req.query.FechaHasta || null,
        1, // PageNumber
        10000 // PageSize - valor alto para obtener todos
      ]);

      const data = Array.isArray(results) ? results as StockMovementReportItem[] : [];

      // Formatear fechas para mejor presentación
      const formattedData = data.map((item) => ({
        ...item,
        FechaMovimiento: item.FechaMovimiento ? new Date(item.FechaMovimiento).toLocaleDateString('es-ES') : ''
      }));

      // Definir columnas para movimientos de stock
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

      // Generar Excel
      const excelBuffer = ExportService.generateExcel({
        title: 'Movimientos de Stock',
        filename: ExportService.generateFilename('movimientos_stock'),
        columns: stockMovementsColumns,
        data: formattedData,
        sheetName: 'Movimientos de Stock'
      });

      const filename = ExportService.generateFilename('movimientos_stock');

      // Configurar headers para descarga
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', excelBuffer.length);

      // Enviar archivo
      res.send(excelBuffer);

      logger.info(`Movimientos de Stock exportado exitosamente por usuario: ${req.user?.id}`);

    } catch (error: any) {
      logger.error(`Error al exportar Movimientos de Stock: ${error.message}`, { error });
      res.status(500).json({
        success: false,
        message: 'Error al exportar el reporte',
        error: error.message
      });
    }
  };
}

export default new ReportController();