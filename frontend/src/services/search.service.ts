// 🔧 SOLUCIÓN BIGINT: Función utilitaria para convertir bigint a number de forma segura
const convertBigIntToNumber = (value: any): number => {
  if (typeof value === 'bigint') {
    if (value > Number.MAX_SAFE_INTEGER || value < Number.MIN_SAFE_INTEGER) {
      console.warn(`BigInt ${value} está fuera del rango seguro de Number, podría perder precisión`);
    }
    return Number(value);
  }
  return typeof value === 'number' ? value : 0;
};

// 🔧 SOLUCIÓN BIGINT: Función para sanitizar objetos con campos numéricos
const sanitizeNumericFields = (obj: any): any => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized: any = Array.isArray(obj) ? [] : {};
  
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    if (typeof value === 'bigint') {
      sanitized[key] = convertBigIntToNumber(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeNumericFields(value);
    } else {
      sanitized[key] = value;
    }
  });
  
  return sanitized;
};

// 🔧 TRANSFORMACIÓN DE PROPIEDADES: Convertir PascalCase del backend a camelCase del frontend
const transformSearchResult = (backendResult: any): SearchResult => {
  return {
    resultType: backendResult.ResultType,
    itemId: backendResult.ItemId,
    title: backendResult.Title,
    description: backendResult.Description,
    status: backendResult.Status,
    dateInfo: backendResult.DateInfo,
    entityType: backendResult.EntityType,
    serialNumber: backendResult.SerialNumber,      // PascalCase → camelCase
    encryptionPassword: backendResult.EncryptionPassword, // PascalCase → camelCase
    relatedInfo: backendResult.RelatedInfo
  };
};

import { SearchResult, PaginatedSearchResponse } from '../types';
import api from './api';

export const globalSearch = async (query: string): Promise<SearchResult[]> => {
  try {
    const response = await api.get<any[]>(`/search/global?query=${encodeURIComponent(query)}`);
    
    // Primero sanitizar bigint, luego transformar propiedades
    const sanitizedData = sanitizeNumericFields(response.data);
    const transformedResults = sanitizedData.map((item: any) => transformSearchResult(item));
    
    return transformedResults;
  } catch (error) {
    console.error('Error en búsqueda global:', error);
    throw error;
  }
};
