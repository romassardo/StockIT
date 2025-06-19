import * as sql from 'mssql';
import { logger } from './logger';

/**
 * Interfaz para manejar parámetros con tipo explícito para SQL Server
 */
interface SqlParameterWithType {
  type: any; // Puede ser sql.ISqlTypeFactory o cualquier tipo válido para sql.Request.input
  value?: any; // El valor para el parámetro. Opcional si isOutput es true y el SP no requiere un valor inicial.
  isOutput?: boolean; // Indica si es un parámetro de salida
  length?: number; // Longitud para tipos como VARCHAR, NVARCHAR
  precision?: number; // Precisión para tipos numéricos
  scale?: number; // Escala para tipos numéricos
}

/**
 * Tipo para los parámetros que pueden ser pasados a los procedimientos almacenados
 */
type SqlParameter = any | SqlParameterWithType;

/**
 * Clase singleton para gestionar la conexión a la base de datos SQL Server
 * Implementa un patrón Singleton para mantener una única instancia de conexión
 */
export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private pool: sql.ConnectionPool | null = null;
  private poolPromise: Promise<sql.ConnectionPool> | null = null;
  private readonly config: sql.config;

  /**
   * Constructor privado para evitar la creación de instancias fuera de la clase
   */
  private constructor () {
    // Determinar si usar autenticación integrada de Windows
    logger.info(`[DB_DEBUG] process.env.DB_INTEGRATED: '${process.env.DB_INTEGRATED}' (Type: ${typeof process.env.DB_INTEGRATED})`);
    const useIntegrated = process.env.DB_INTEGRATED === 'true';
    logger.info(`[DB_DEBUG] useIntegrated flag set to: ${useIntegrated}`);
    
    // Configuración base
    const baseConfig: sql.config = {
      server: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || '',
      port: parseInt(process.env.DB_PORT || '1433', 10),
      options: {
        encrypt: true,
        trustServerCertificate: process.env.NODE_ENV !== 'production',
        enableArithAbort: true
      },
      pool: {
        max: 20,      // Máximo de conexiones en el pool (requisito: max 20)
        min: 5,       // Mínimo de conexiones en el pool (requisito: min 5)
        idleTimeoutMillis: 10000,
        acquireTimeoutMillis: 10000
      },
      connectionTimeout: 15000, // Timeout para la conexión inicial
      requestTimeout: 30000     // Timeout para las consultas
    };
    
    // Configurar autenticación según el modo seleccionado
    if (useIntegrated) {
      // Autenticación integrada de Windows
      if (!baseConfig.options) { // Asegurar que options exista
        baseConfig.options = {};
      }
      baseConfig.options.trustServerCertificate = true; // Asegurar que trustServerCertificate esté en options
      baseConfig.authentication = { // 'authentication' es una propiedad de primer nivel de sql.config
        type: 'ntlm',
        options: { // estas son las opciones para ntlm
          domain: process.env.DOMAIN || '', // Asegúrate de que DOMAIN esté en .env si es necesario
          userName: process.env.DB_WINDOWS_USER || '',
          password: process.env.DB_WINDOWS_PASSWORD || ''
        }
      };
      delete baseConfig.user; // Eliminar credenciales de SQL Auth si estaban presentes por defecto
      delete baseConfig.password;
      logger.info('Usando autenticación integrada de Windows para SQL Server');
    } else {
      // Autenticación con usuario y contraseña
      baseConfig.user = process.env.DB_USER || '';
      baseConfig.password = process.env.DB_PASSWORD || '';
      // Opcional: si para SQL auth también necesitas trustServerCertificate en dev/test
      // if (process.env.NODE_ENV !== 'production') {
      //   baseConfig.options.trustServerCertificate = true;
      // }
      logger.info('Usando autenticación con credenciales para SQL Server');
    }
    
    this.config = baseConfig;
  }

  /**
   * Método para obtener la instancia única de la clase (patrón Singleton)
   * @returns Instancia única de DatabaseConnection
   */
  public static getInstance (): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  /**
   * Método para obtener el pool de conexiones
   * @returns Promise que resuelve al pool de conexiones
   */
  private async getPool (): Promise<sql.ConnectionPool> {
    logger.info(`[DB_GETPOOL_DEBUG] Intentando obtener pool. Config actual: User='${this.config.user}', DB_INTEGRATED='${process.env.DB_INTEGRATED}'`);
    if (this.pool == null) {
      try {
        if (this.poolPromise == null) {
          logger.info('[DB_GETPOOL_DEBUG] Pool es null y poolPromise es null. Creando nueva ConnectionPool...');
          logger.info(`[DB_GETPOOL_DEBUG] Config para nueva ConnectionPool: Server='${this.config.server}', Database='${this.config.database}', User='${this.config.user}', Password Present: ${!!this.config.password}, Integrated Security: ${this.config.authentication?.type === 'ntlm'}`);
          this.poolPromise = new sql.ConnectionPool(this.config).connect();
        }
        this.pool = await this.poolPromise;
        logger.info('Conexión a la base de datos establecida correctamente (dentro de getPool)');
      } catch (error) {
        const err = error as Error;
        logger.error(`Error al conectar a la base de datos: ${err.message}`);
        throw err;
      }
    }
    return this.pool;
  }

  /**
   * Método para probar la conexión a la base de datos.
   * Intenta obtener el pool, lo que establece la conexión.
   */
  public async testConnection(): Promise<void> {
    logger.info('[DB_TEST_CONNECTION] Probando conexión a la base de datos...');
    try {
      await this.getPool(); // Intentar obtener el pool establece la conexión
      logger.info('[DB_TEST_CONNECTION] La prueba de conexión a la base de datos fue exitosa.');
    } catch (error) {
      const err = error as Error;
      logger.error(`[DB_TEST_CONNECTION] Falló la prueba de conexión a la base de datos: ${err.message}`);
      throw err; // Relanzar para que startServer lo capture
    }
  }

  /**
   * Método para ejecutar una consulta SQL
   * @param query Consulta SQL a ejecutar
   * @param params Parámetros para la consulta (opcional)
   * @returns Promise que resuelve con el resultado de la consulta
   */
  public async executeQuery<T>(query: string, params?: Record<string, any>): Promise<sql.IResult<T>> {
    try {
      const pool = await this.getPool();
      const request = pool.request();

      // Añadir parámetros si existen
      if (params != null) {
        Object.entries(params).forEach(([key, value]) => {
          request.input(key, value);
        });
      }

      return await request.query<T>(query);
    } catch (error) {
      const err = error as Error;
      logger.error(`Error al ejecutar consulta: ${err.message}`);
      throw err;
    }
  }

  /**
   * Método para ejecutar un procedimiento almacenado
   * @param procedureName Nombre del procedimiento almacenado
   * @param params Parámetros para el procedimiento (opcional)
   * @returns Promise que resuelve con el resultado del procedimiento
   */
  public async executeStoredProcedure<T>(procedureName: string, params?: Record<string, SqlParameter>): Promise<sql.IResult<T>> {
    try {
      logger.info(`[DB_EXEC_SP_DEBUG] Ejecutando SP: ${procedureName}. Obteniendo pool...`);
      const pool = await this.getPool();
      logger.info(`[DB_EXEC_SP_DEBUG] Pool obtenido. Config que debería usarse (this.config): User='${this.config.user}', DB='${this.config.database}'. Creando request...`);
      const request = pool.request();

      // Añadir parámetros si existen
      if (params != null) {
        Object.entries(params).forEach(([key, paramValue]) => {
          if (paramValue !== undefined && paramValue !== null) {
            // Verificar si es un parámetro con tipo explícito
            if (typeof paramValue === 'object' && 'type' in paramValue) {
              const typedParam = paramValue as SqlParameterWithType;
              if (typedParam.isOutput) {
                // Para parámetros de salida, el valor inicial es opcional o puede ser nulo
                // La librería mssql puede requerir que se pase un valor, incluso si es undefined/null para OUTPUT puros.
                // Si el SP tiene un valor DEFAULT para el OUTPUT, ese se usará si no se pasa nada.
                // Para tipos como VARCHAR, es común pasar la longitud.
                if (typedParam.length) {
                  request.output(key, typedParam.type(typedParam.length), typedParam.value); // ej. sql.NVarChar(500)
                } else {
                  request.output(key, typedParam.type, typedParam.value); // ej. sql.Int, sql.Bit
                }
              } else {
                // Parámetro de entrada con tipo explícito
                if (typedParam.value === undefined) {
                  logger.warn(`[DB_EXEC_SP_DEBUG] Parámetro de entrada '${key}' para SP '${procedureName}' tiene 'type' pero 'value' es undefined. Se pasará null.`);
                  request.input(key, typedParam.type, null);
                } else {
                  request.input(key, typedParam.type, typedParam.value);
                }
              }
            } else {
              // Si no tiene tipo explícito, asumir que es un parámetro de entrada simple
              request.input(key, paramValue);
            }
          }
        });
      }

      const result = await request.execute<T>(procedureName);

      // LOG DE DEPURACIÓN CRÍTICO
      logger.info(`[DB_RESULT_DEBUG] Resultado para SP ${procedureName}:`);
      logger.info(`  - Recordsets: ${result.recordsets.length}`);
      logger.info(`  - Recordset[0] Rows: ${result.recordsets[0] ? result.recordsets[0].length : 'N/A'}`);
      logger.info(`  - Output: ${JSON.stringify(result.output)}`);
      logger.info(`  - Rows Affected: ${JSON.stringify(result.rowsAffected)}`);

      return result;
    } catch (error) {
      const err = error as Error;
      logger.error(`Error al ejecutar procedimiento almacenado ${procedureName}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Método para cerrar la conexión con la base de datos
   * @returns Promise que resuelve cuando se cierra la conexión
   */
  public async close (): Promise<void> {
    if (this.pool != null) {
      try {
        await this.pool.close();
        this.pool = null;
        this.poolPromise = null;
        logger.info('Conexión a la base de datos cerrada correctamente');
      } catch (error) {
        const err = error as Error;
        logger.error(`Error al cerrar la conexión a la base de datos: ${err.message}`);
        throw err;
      }
    }
  }

  /**
   * Método para verificar el estado de la conexión a la base de datos
   * @returns Promise que resuelve con un objeto que contiene el estado de la conexión
   */
  public async checkConnectionStatus (): Promise<{
    connected: boolean;
    poolSize?: number;
    idleCount?: number;
    availableCount?: number;
    pending?: number;
  }> {
    try {
      if (!this.pool) {
        return { connected: false };
      }

      // Intentar ejecutar una consulta simple para verificar la conexión
      await this.executeQuery('SELECT 1 AS test');

      // Obtener estadísticas del pool de conexiones
      return {
        connected: true,
        poolSize: this.pool.size,
        idleCount: this.pool.available,
        availableCount: this.pool.available,
        pending: this.pool.pending
      };
    } catch (error) {
      logger.error(`Error al verificar estado de la conexión: ${(error as Error).message}`);
      return { connected: false };
    }
  }

  /**
   * Método para generar un diagnóstico de la conexión
   * Utilizar en caso de problemas para obtener información detallada
   * @returns Promise que resuelve con un objeto que contiene información de diagnóstico
   */
  public async getDiagnostics (): Promise<{
    connectionStatus: boolean;
    serverInfo?: any;
    poolStats?: any;
    lastError?: string;
    envVars: {
      dbHost: string;
      dbPort: string;
      dbName: string;
      hasUser: boolean;
      hasPassword: boolean;
    };
  }> {
    let lastError = '';
    let connectionStatus = false;
    let serverInfo = null;
    let poolStats = null;

    try {
      // Intentar obtener la conexión y estadísticas
      const pool = await this.getPool();
      connectionStatus = true;
      
      // Obtener información del servidor
      const result = await pool.request().query('SELECT @@VERSION AS version, SERVERPROPERTY(\'Edition\') AS edition');
      serverInfo = result.recordset[0];
      
      // Estadísticas del pool
      poolStats = {
        size: pool.size,
        available: pool.available,
        pending: pool.pending,
        borrowed: pool.borrowed
      };
    } catch (error) {
      lastError = (error as Error).message;
      logger.error(`Error durante el diagnóstico de la BD: ${lastError}`);
    }

    // Información sobre variables de entorno (sin revelar credenciales)
    const envVars = {
      dbHost: process.env.DB_HOST || 'no configurado',
      dbPort: process.env.DB_PORT || 'no configurado',
      dbName: process.env.DB_NAME || 'no configurado',
      hasUser: Boolean(process.env.DB_USER),
      hasPassword: Boolean(process.env.DB_PASSWORD)
    };

    return {
      connectionStatus,
      serverInfo,
      poolStats,
      lastError: lastError || undefined,
      envVars
    };
  }
}
