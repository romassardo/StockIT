import * as path from 'path';
import * as fs from 'fs';
import { DatabaseConnection } from '../utils/database';
import { logger } from '../utils/logger';
import mysql from 'mysql2/promise';

/**
 * Clase para gestionar migraciones de base de datos MySQL
 * Permite ejecutar migraciones de forma ordenada y mantener un registro de las ya aplicadas
 */
export class MigrationManager {
  private db: DatabaseConnection;
  private migrationsDir: string;

  constructor() {
    this.db = DatabaseConnection.getInstance();
    this.migrationsDir = path.join(__dirname, 'migrations');
  }

  /**
   * Ejecuta todas las migraciones pendientes
   */
  public async runMigrations(): Promise<void> {
    try {
      // Verificar que existe la tabla de migraciones, si no crearla
      await this.ensureMigrationsTable();

      // Obtener migraciones ya aplicadas
      const appliedMigrations = await this.getAppliedMigrations();
      
      // Obtener todos los archivos de migración
      const migrationFiles = this.getMigrationFiles();

      // Filtrar migraciones pendientes
      const pendingMigrations = migrationFiles.filter(file => 
        !appliedMigrations.includes(path.basename(file, '.sql'))
      );

      if (pendingMigrations.length === 0) {
        logger.info('No hay migraciones pendientes para aplicar');
        return;
      }

      logger.info(`Se aplicarán ${pendingMigrations.length} migraciones pendientes`);

      // Ejecutar migraciones pendientes en orden
      for (const migrationFile of pendingMigrations) {
        const migrationName = path.basename(migrationFile, '.sql');
        try {
          const sql = fs.readFileSync(migrationFile, 'utf8');
          
          // Dividir el archivo en consultas separadas por punto y coma
          const queries = sql.split(';').filter(q => q.trim());
          
          for (const query of queries) {
            if (query.trim()) {
              await this.db.executeQuery(query.trim());
            }
          }
          
          // Registrar la migración como aplicada
          await this.markMigrationAsApplied(migrationName);
          
          logger.info(`Migración aplicada: ${migrationName}`);
        } catch (error) {
          logger.error(`Error al aplicar migración ${migrationName}: ${(error as Error).message}`);
          throw error;
        }
      }

      logger.info('Migraciones completadas correctamente');
    } catch (error) {
      logger.error(`Error al ejecutar migraciones: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Crea la tabla de migraciones si no existe (MySQL)
   */
  private async ensureMigrationsTable(): Promise<void> {
    try {
      const query = `
        CREATE TABLE IF NOT EXISTS MigracionesDB (
          id INT AUTO_INCREMENT PRIMARY KEY,
          nombre VARCHAR(255) NOT NULL UNIQUE,
          fecha_aplicacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `;
      await this.db.executeQuery(query);
    } catch (error) {
      logger.error(`Error al crear tabla de migraciones: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Obtiene la lista de migraciones ya aplicadas
   */
  private async getAppliedMigrations(): Promise<string[]> {
    try {
      const query = 'SELECT nombre FROM MigracionesDB ORDER BY id';
      const result = await this.db.executeQuery<mysql.RowDataPacket[]>(query);
      const [data] = result;
      return data.map((record: any) => record.nombre);
    } catch (error) {
      logger.error(`Error al obtener migraciones aplicadas: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Obtiene la lista de archivos de migración
   */
  private getMigrationFiles(): string[] {
    const files = fs.readdirSync(this.migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .map(file => path.join(this.migrationsDir, file))
      .sort(); // Ordenamos alfabéticamente (por eso es importante el formato de nombre)
    return files;
  }

  /**
   * Marca una migración como aplicada
   */
  private async markMigrationAsApplied(migrationName: string): Promise<void> {
    try {
      const query = `INSERT INTO MigracionesDB (nombre) VALUES (?)`;
      await this.db.executeQuery(query, [migrationName]);
    } catch (error) {
      logger.error(`Error al marcar migración como aplicada: ${(error as Error).message}`);
      throw error;
    }
  }
}
