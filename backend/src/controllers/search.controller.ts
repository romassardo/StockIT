import { Response } from 'express';
import mysql from 'mysql2/promise';
import { AuthRequest } from '../types/auth.types';
import { DatabaseConnection } from '../utils/database';
import { logger } from '../utils/logger';
import { SearchType, ResultType, PaginatedSearchResponse, SearchResult } from '../types/search.types';

export class SearchController {
  private db = DatabaseConnection.getInstance();

  /**
   * Realiza una búsqueda global en el sistema
   * @param req Request con parámetros de búsqueda
   * @param res Response
   */
  public globalSearch = async (req: AuthRequest, res: Response): Promise<void> => {
    const { query } = req.query;

    if (!query || typeof query !== 'string' || query.trim().length < 3) {
      res.status(400).json({ 
        message: 'El término de búsqueda es requerido y debe tener al menos 3 caracteres.' 
      });
      return;
    }

    try {
      console.log('🔍 Búsqueda global iniciada:', {
        searchTerm: query.trim(),
        searchType: 'General',
        pageNumber: 1,
        pageSize: 10
      });

      const result = await this.db.executeStoredProcedure<any>('sp_Search_Global', [
        query.trim(),
        'General',
        1,
        10
      ]);

      const [results] = result;
      
      // En MySQL2 con SPs complejos, results es un array de arrays (recordsets) y objetos (OkPackets)
      // Buscamos el array que contiene las filas de datos reales
      let data: any[] = [];
      if (Array.isArray(results)) {
        // Buscamos el primer elemento que sea un array y tenga datos, o el último array vacío si no hay datos
        const recordset = results.find(r => Array.isArray(r));
        data = recordset || [];
      } else {
        data = [];
      }

      console.log('📊 Resultado del SP sp_Search_Global (procesado):', {
        dataLength: data.length,
        sampleData: data.slice(0, 2)
      });

      res.json(data);

    } catch (error: any) {
      console.error('❌ Error en búsqueda global:', error);
      logger.error('Error en búsqueda global:', { 
        message: error.message,
        sqlMessage: error.sqlMessage,
        code: error.code 
      });
      res.status(500).json({ message: 'Error interno del servidor', details: error.message });
    }
  };

  /**
   * Realiza una búsqueda específica por número de serie
   * @param req Request con número de serie en params
   * @param res Response
   */
  public searchBySerialNumber = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { serialNumber } = req.params;

      // Validar número de serie
      if (!serialNumber || serialNumber.trim().length < 3) {
        res.status(400).json({ 
          success: false, 
          error: 'El número de serie debe tener al menos 3 caracteres' 
        });
        return;
      }

      logger.info(`Búsqueda por número de serie iniciada por ${req.user?.email}`, { serialNumber });

      // Ejecutar stored procedure con tipo de búsqueda específico
      const result = await this.db.executeStoredProcedure<any>('sp_Search_Global', [
        serialNumber,
        SearchType.SERIAL_NUMBER,
        1,
        10
      ]);

      const [results] = result;
      
      // Extraer datos reales
      let data: any[] = [];
      if (Array.isArray(results)) {
        const recordset = results.find(r => Array.isArray(r));
        data = recordset || [];
      }

      // Procesar resultados
      if (!data || data.length === 0) {
        res.status(404).json({ 
          success: false,
          error: 'No se encontraron resultados para el número de serie especificado' 
        });
        return;
      }

      // Transformar resultados
      const searchResults: SearchResult[] = data.map((item: any) => ({
        resultType: item.ResultType as ResultType,
        itemId: item.ItemId,
        title: item.Title,
        description: item.Description,
        status: item.Status,
        dateInfo: item.DateInfo,
        entityType: item.EntityType,
        serialNumber: item.SerialNumber,
        encryptionPassword: item.EncryptionPassword,
        relatedInfo: item.RelatedInfo
      }));

      // La información de paginación es la misma para todos los registros devueltos por el SP
      const firstResult = data[0]; 

      res.json({
        success: true,
        results: searchResults,
        pagination: {
          currentPage: firstResult.CurrentPage,
          pageSize: firstResult.PageSize,
          totalItems: firstResult.TotalCount,
          totalPages: firstResult.TotalPages,
        },
      });
    } catch (error: any) {
      logger.error('Error en búsqueda por número de serie:', { 
        errorMessage: error.message, 
        stack: error.stack,
        details: { serialNumber: req.params.serialNumber }
      });
      res.status(500).json({ 
        success: false, 
        error: 'Error interno del servidor al realizar la búsqueda por número de serie' 
      });
    }
  };

  /**
   * Realiza una búsqueda específica por contraseña de encriptación
   * @param req Request con contraseña en params
   * @param res Response
   */
  public searchByEncryptionPassword = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { password } = req.params;

      // Validar contraseña
      if (!password || password.trim().length < 3) {
        res.status(400).json({ 
          success: false,
          error: 'La contraseña de encriptación debe tener al menos 3 caracteres' 
        });
        return;
      }

      logger.info(`Búsqueda por contraseña de encriptación iniciada por ${req.user?.email}`, { password });

      // Ejecutar stored procedure con tipo de búsqueda específico
      const result = await this.db.executeStoredProcedure<any>('sp_Search_Global', [
        password,
        SearchType.ENCRYPTION_PASSWORD,
        1,
        10
      ]);

      const [results] = result;

      // Extraer datos reales
      let data: any[] = [];
      if (Array.isArray(results)) {
        const recordset = results.find(r => Array.isArray(r));
        data = recordset || [];
      }

      // Procesar resultados
      if (!data || data.length === 0) {
        res.status(404).json({ 
          success: false,
          error: 'No se encontraron resultados para la contraseña de encriptación especificada' 
        });
        return;
      }

      // Transformar resultados
      const searchResults: SearchResult[] = data.map((item: any) => ({
        resultType: item.ResultType as ResultType,
        itemId: item.ItemId,
        title: item.Title,
        description: item.Description,
        status: item.Status,
        dateInfo: item.DateInfo,
        entityType: item.EntityType,
        serialNumber: item.SerialNumber,
        encryptionPassword: item.EncryptionPassword,
        relatedInfo: item.RelatedInfo
      }));

      // La información de paginación es la misma para todos los registros devueltos por el SP
      const firstResult = data[0]; 

      res.json({
        success: true,
        results: searchResults,
        pagination: {
          currentPage: firstResult.CurrentPage,
          pageSize: firstResult.PageSize,
          totalItems: firstResult.TotalCount,
          totalPages: firstResult.TotalPages,
        },
      });

    } catch (error: any) {
      logger.error('Error en búsqueda por contraseña de encriptación:', { 
        errorMessage: error.message, 
        stack: error.stack,
        details: { password: req.params.password }
      });
      res.status(500).json({ 
        success: false,
        error: 'Error interno del servidor al realizar la búsqueda por contraseña de encriptación' 
      });
    }
  };
}
