import * as XLSX from 'xlsx';

export const exportToExcel = (data: any[], fileName: string, sheetName: string = 'Datos') => {
  // Crear libro de trabajo
  const wb = XLSX.utils.book_new();
  
  // Convertir JSON a hoja de trabajo
  const ws = XLSX.utils.json_to_sheet(data);

  // Ajustar ancho de columnas automáticamente
  const columnWidths = Object.keys(data[0] || {}).map(key => {
    const maxContentLength = Math.max(
      key.length,
      ...data.map(row => (row[key] ? row[key].toString().length : 0))
    );
    return { wch: Math.min(maxContentLength + 2, 50) }; // Max ancho 50 caracteres
  });
  ws['!cols'] = columnWidths;

  // Añadir hoja al libro
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Generar archivo y descargar
  XLSX.writeFile(wb, `${fileName}.xlsx`);
};
