// services/cache.service.ts - Sistema de caché para StockIT
import { DatabaseConnection } from '../utils/database';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live en milisegundos
}

export class CacheService {
  private cache: Map<string, CacheItem<any>>;
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    this.cache = new Map();
    
    // Limpieza automática cada 5 minutos
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Obtener datos del caché
   */
  public get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Verificar si expiró
    const now = Date.now();
    if (now > item.timestamp + item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  /**
   * Guardar datos en el caché
   */
  public set<T>(key: string, data: T, ttlMinutes: number = 5): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000
    };

    this.cache.set(key, item);
  }

  /**
   * Eliminar una entrada específica
   */
  public delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Limpiar caché completo
   */
  public clear(): void {
    this.cache.clear();
  }

  /**
   * Invalidar caché por patrón
   */
  public invalidatePattern(pattern: string): number {
    let deleted = 0;
    const regex = new RegExp(pattern);
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deleted++;
      }
    }
    
    return deleted;
  }

  /**
   * Limpieza automática de elementos expirados
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now > item.timestamp + item.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cache cleanup: ${cleaned} elementos eliminados`);
    }
  }

  /**
   * Obtener estadísticas del caché
   */
  public getStats(): object {
    const now = Date.now();
    let validItems = 0;
    let expiredItems = 0;

    for (const item of this.cache.values()) {
      if (now > item.timestamp + item.ttl) {
        expiredItems++;
      } else {
        validItems++;
      }
    }

    return {
      totalItems: this.cache.size,
      validItems,
      expiredItems,
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024 + ' MB'
    };
  }

  // ==============================================
  // MÉTODOS ESPECÍFICOS PARA STOCKIT
  // ==============================================

  /**
   * Cache para categorías (rara vez cambian)
   */
  public async getCategories(): Promise<any[]> {
    const cacheKey = 'categories_all';
    let categories = this.get<any[]>(cacheKey);

    if (!categories) {
      const db = DatabaseConnection.getInstance();
      const result = await db.executeStoredProcedure('sp_Categoria_GetAll', {});
      categories = Array.isArray(result) ? result : (result as any).recordset || [];
      this.set(cacheKey, categories, 60); // 1 hora
    }

    return categories || [];
  }

  /**
   * Cache para productos activos
   */
  public async getProducts(): Promise<any[]> {
    const cacheKey = 'products_active';
    let products = this.get<any[]>(cacheKey);

    if (!products) {
      const db = DatabaseConnection.getInstance();
      const result = await db.executeStoredProcedure('sp_Producto_GetAll', {});
      const allProducts = Array.isArray(result) ? result : (result as any).recordset || [];
      products = allProducts.filter((p: any) => p.activo === true);
      this.set(cacheKey, products, 30); // 30 minutos
    }

    return products || [];
  }

  /**
   * Cache para empleados activos
   */
  public async getEmployees(): Promise<any[]> {
    const cacheKey = 'employees_active';
    let employees = this.get<any[]>(cacheKey);

    if (!employees) {
      const db = DatabaseConnection.getInstance();
      const result = await db.executeStoredProcedure('sp_Employee_GetAll', {});
      const allEmployees = Array.isArray(result) ? result : (result as any).recordset || [];
      employees = allEmployees.filter((e: any) => e.activo === true);
      this.set(cacheKey, employees, 15); // 15 minutos
    }

    return employees || [];
  }

  /**
   * Cache para sectores activos
   */
  public async getSectors(): Promise<any[]> {
    const cacheKey = 'sectors_active';
    let sectors = this.get<any[]>(cacheKey);

    if (!sectors) {
      const db = DatabaseConnection.getInstance();
      const result = await db.executeStoredProcedure('sp_Sector_GetAll', {});
      const allSectors = Array.isArray(result) ? result : (result as any).recordset || [];
      sectors = allSectors.filter((s: any) => s.activo === true);
      this.set(cacheKey, sectors, 30); // 30 minutos
    }

    return sectors || [];
  }

  /**
   * Cache para sucursales activas
   */
  public async getBranches(): Promise<any[]> {
    const cacheKey = 'branches_active';
    let branches = this.get<any[]>(cacheKey);

    if (!branches) {
      const db = DatabaseConnection.getInstance();
      const result = await db.executeStoredProcedure('sp_Branch_GetAll', {});
      const allBranches = Array.isArray(result) ? result : (result as any).recordset || [];
      branches = allBranches.filter((b: any) => b.activo === true);
      this.set(cacheKey, branches, 30); // 30 minutos
    }

    return branches || [];
  }

  /**
   * Cache para estadísticas del dashboard
   */
  public async getDashboardStats(): Promise<any> {
    const cacheKey = 'dashboard_stats';
    let stats = this.get<any>(cacheKey);

    if (!stats) {
      try {
        const db = DatabaseConnection.getInstance();
        // Ejecutar SPs del dashboard de forma segura
        const inventoryStats = await db.executeStoredProcedure('sp_Report_Inventory', {});
        const stockAlerts = await db.executeStoredProcedure('sp_Report_GetStockAlertsCount', {});
        
        stats = {
          inventory: Array.isArray(inventoryStats) ? inventoryStats : (inventoryStats as any).recordset || [],
          alerts: Array.isArray(stockAlerts) ? stockAlerts : (stockAlerts as any).recordset || [],
          lastUpdate: new Date().toISOString()
        };
        
        this.set(cacheKey, stats, 5); // 5 minutos para stats
      } catch (error) {
        console.warn('Error loading dashboard stats for cache:', error);
        stats = { inventory: [], alerts: [], lastUpdate: new Date().toISOString() };
      }
    }

    return stats;
  }

  /**
   * Invalidar caché cuando se modifican datos críticos
   */
  public invalidateRelatedCache(entityType: string): void {
    switch (entityType) {
      case 'product':
        this.invalidatePattern('products_.*');
        this.invalidatePattern('dashboard_.*');
        break;
      case 'category':
        this.invalidatePattern('categories_.*');
        this.invalidatePattern('products_.*');
        break;
      case 'employee':
        this.invalidatePattern('employees_.*');
        break;
      case 'sector':
        this.invalidatePattern('sectors_.*');
        break;
      case 'branch':
        this.invalidatePattern('branches_.*');
        break;
      case 'inventory':
        this.invalidatePattern('dashboard_.*');
        break;
      case 'assignment':
        this.invalidatePattern('dashboard_.*');
        break;
      default:
        // Por seguridad, limpiar todo si no se reconoce el tipo
        this.clear();
    }
  }

  /**
   * Destructor - limpiar interval
   */
  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

// Singleton instance
export const cacheService = new CacheService(); 