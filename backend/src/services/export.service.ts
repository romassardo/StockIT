import * as XLSX from 'xlsx';

export interface ExportColumn {
  key: string;
  header: string;
  width?: number;
}

export interface ExportOptions {
  title: string;
  filename: string;
  columns: ExportColumn[];
  data: any[];
  sheetName?: string;
}

export class ExportService {
  /**
   * Genera un archivo Excel a partir de datos tabulares
   */
  static generateExcel(options: ExportOptions): Buffer {
    const { title, columns, data, sheetName = 'Reporte' } = options;

    // Crear libro de trabajo
    const workbook = XLSX.utils.book_new();

    // Preparar datos para el worksheet
    const worksheetData = [];

    // Agregar título como primera fila
    const titleRow: any = {};
    titleRow[columns[0].key] = title;
    worksheetData.push(titleRow);

    // Agregar fila vacía
    worksheetData.push({});

    // Agregar encabezados
    const headerRow: any = {};
    columns.forEach(col => {
      headerRow[col.key] = col.header;
    });
    worksheetData.push(headerRow);

    // Agregar datos
    data.forEach(item => {
      const row: any = {};
      columns.forEach(col => {
        let value = item[col.key];
        
        // Formatear valores especiales
        if (value === null || value === undefined) {
          value = '';
        } else if (typeof value === 'boolean') {
          value = value ? 'Sí' : 'No';
        } else if (value instanceof Date) {
          value = value.toLocaleDateString('es-ES');
        } else if (typeof value === 'number' && col.key.includes('fecha')) {
          // Si es un timestamp, convertir a fecha
          value = new Date(value).toLocaleDateString('es-ES');
        }
        
        row[col.key] = value;
      });
      worksheetData.push(row);
    });

    // Crear worksheet
    const worksheet = XLSX.utils.json_to_sheet(worksheetData, { skipHeader: true });

    // Configurar anchos de columna
    const colWidths = columns.map(col => ({ wch: col.width || 15 }));
    worksheet['!cols'] = colWidths;

    // Merge del título (primera fila)
    const titleRange = {
      s: { c: 0, r: 0 }, // start cell
      e: { c: columns.length - 1, r: 0 } // end cell
    };
    worksheet['!merges'] = [titleRange];

    // Agregar worksheet al workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generar buffer
    const excelBuffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx',
      compression: true 
    });

    return excelBuffer;
  }

  /**
   * Genera nombre de archivo con timestamp
   */
  static generateFilename(baseName: string, extension: string = 'xlsx'): string {
    const timestamp = new Date().toISOString()
      .replace(/:/g, '-')
      .replace(/\./g, '-')
      .split('T')[0]; // Solo fecha YYYY-MM-DD
    
    return `${baseName}_${timestamp}.${extension}`;
  }

  /**
   * Configuraciones predefinidas para reportes específicos
   */
  static getStockDisponibleColumns(): ExportColumn[] {
    return [
      { key: 'TipoInventario', header: 'Tipo', width: 12 },
      { key: 'Categoria', header: 'Categoría', width: 20 },
      { key: 'marca', header: 'Marca', width: 15 },
      { key: 'modelo', header: 'Modelo', width: 25 },
      { key: 'descripcion', header: 'Descripción', width: 35 },
      { key: 'cantidad_disponible', header: 'Cantidad Disponible', width: 18 }
    ];
  }

  static getAssignmentColumns(): ExportColumn[] {
    return [
      { key: 'tipo_asignacion', header: 'Tipo Destino', width: 12 },
      { key: 'destino_nombre', header: 'Destino', width: 25 },
      { key: 'numero_serie', header: 'Número Serie', width: 20 },
      { key: 'producto_nombre', header: 'Producto', width: 35 },
      { key: 'estado', header: 'Estado', width: 12 },
      { key: 'fecha_asignacion', header: 'Fecha Asignación', width: 15 },
      { key: 'fecha_devolucion', header: 'Fecha Devolución', width: 15 },
      { key: 'usuario_asigna', header: 'Usuario Asigna', width: 20 },
      { key: 'dias_asignado', header: 'Días Asignado', width: 12 }
    ];
  }
}