import mysql from 'mysql2/promise';
import { logger } from './logger';

/**
 * Tipo para los parámetros que pueden ser pasados a los procedimientos almacenados en MySQL
 * Usaremos un array de valores en orden
 */
type StoredProcedureParams = any[];

/**
 * Clase singleton para gestionar la conexión a la base de datos MySQL
 */
export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private pool: mysql.Pool | null = null;
  private readonly config: mysql.PoolOptions;

  private constructor () {
    this.config = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || '',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || '',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      waitForConnections: true,
      connectionLimit: 20, // Máximo de conexiones en el pool
      queueLimit: 0,
      idleTimeout: 10000, // milisegundos
      connectTimeout: 10000 // timeout para la conexión inicial
    };

    logger.info('Configuración de conexión a MySQL preparada.');
  }

  public static getInstance (): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  private getPool (): mysql.Pool {
    if (this.pool === null) {
      try {
        logger.info(`[DB_GETPOOL_DEBUG] Creando nuevo pool de conexiones para MySQL...`);
        logger.info(`[DB_GETPOOL_DEBUG] Host: ${this.config.host}, DB: ${this.config.database}, User: ${this.config.user}`);
        this.pool = mysql.createPool(this.config);
        logger.info('Pool de conexiones MySQL creado exitosamente.');
      } catch (error) {
        const err = error as Error;
        logger.error(`Error al crear el pool de MySQL: ${err.message}`);
        throw err;
      }
    }
    return this.pool;
  }

  public async testConnection (): Promise<void> {
    logger.info('[DB_TEST_CONNECTION] Probando conexión a la base de datos MySQL...');
    let connection: mysql.PoolConnection | null = null;
    try {
      const pool = this.getPool();
      connection = await pool.getConnection();
      await connection.ping();
      logger.info('[DB_TEST_CONNECTION] La prueba de conexión a la base de datos MySQL fue exitosa.');
    } catch (error) {
      const err = error as Error;
      logger.error(`[DB_TEST_CONNECTION] Falló la prueba de conexión a MySQL: ${err.message}`);
      throw err;
    } finally {
      connection?.release();
    }
  }
  
  public async executeQuery<T extends mysql.RowDataPacket[]>(
    query: string,
    params?: any[]
  ): Promise<[T, mysql.FieldPacket[]]> {
    try {
      const pool = this.getPool();
      const [results, fields] = await pool.query<T>(query, params);
      return [results, fields];
    } catch (error) {
      const err = error as Error;
      logger.error(`Error al ejecutar consulta: ${err.message}`);
      throw err;
    }
  }

  public async executeStoredProcedure<T extends mysql.RowDataPacket[]>(
    procedureName: string,
    params?: StoredProcedureParams
  ): Promise<[T, mysql.FieldPacket[]]> {
    try {
      const pool = this.getPool();
      const queryParams = params?.map(() => '?').join(',') || '';
      const query = `CALL ${procedureName}(${queryParams})`;
      
      logger.info(`[DB_EXEC_SP_DEBUG] Ejecutando SP: ${query} con params: ${JSON.stringify(params)}`);

      const [results, fields] = await pool.query<T>(query, params);
      
      // En mysql2, el resultado de un SP puede venir en un array anidado.
      // El primer elemento suele ser el set de resultados principal.
      logger.info(`[DB_RESULT_DEBUG] Resultado para SP ${procedureName}: ${results.length} recordsets encontrados.`);
      
      return [results, fields];
    } catch (error) {
      const err = error as Error;
      logger.error(`Error al ejecutar procedimiento almacenado ${procedureName}: ${err.message}`);
      throw err;
    }
  }

  public async close (): Promise<void> {
    if (this.pool !== null) {
      try {
        await this.pool.end();
        this.pool = null;
        logger.info('Pool de conexiones MySQL cerrado correctamente');
      } catch (error) {
        const err = error as Error;
        logger.error(`Error al cerrar el pool de MySQL: ${err.message}`);
        throw err;
      }
    }
  }
}
