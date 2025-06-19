/**
 * Configuración para JWT (JSON Web Tokens)
 * Este archivo contiene las configuraciones específicas para los tokens de autenticación
 */
import { SignOptions } from 'jsonwebtoken';
import { StringValue } from 'ms';

// Tiempo de expiración del token (en segundos o formato zeit/ms)
export const JWT_EXPIRATION: StringValue = (process.env.JWT_EXPIRATION || '1h') as StringValue;

// Clave secreta para firmar los tokens (debe ser una clave fuerte en producción)
const secretFromEnv = process.env.JWT_SECRET;
const defaultSecret = 'stockit_jwt_secret_key_development';
export const JWT_SECRET = secretFromEnv || defaultSecret;

// Algoritmo de firma para los tokens
export const JWT_ALGORITHM = 'HS256' as const;

// Emisor del token (para validación adicional)
export const JWT_ISSUER = 'stockit-api';

// Audiencia del token (para validación adicional)
export const JWT_AUDIENCE = 'stockit-client';

// --- Refresh Token Configuration ---
// Tiempo de expiración del token de refresco
export const JWT_REFRESH_EXPIRATION: StringValue = (process.env.JWT_REFRESH_EXPIRATION || '7d') as StringValue;

// Clave secreta para firmar los refresh tokens
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'stockit_jwt_refresh_secret_key_development';

/**
 * Opciones para la firma del token de acceso
 */
export const JWT_OPTIONS: SignOptions = {
  expiresIn: JWT_EXPIRATION,
  algorithm: JWT_ALGORITHM,
  issuer: JWT_ISSUER,
  audience: JWT_AUDIENCE
};

/**
 * Opciones para la firma del token de refresco
 */
export const JWT_REFRESH_OPTIONS: SignOptions = {
  expiresIn: JWT_REFRESH_EXPIRATION,
  algorithm: JWT_ALGORITHM, // Podría ser diferente si se desea, pero HS256 es común
  issuer: JWT_ISSUER,
  audience: JWT_AUDIENCE
};

/**
 * Opciones para la verificación de tokens
 */
export const JWT_VERIFY_OPTIONS = {
  algorithms: [JWT_ALGORITHM],
  issuer: JWT_ISSUER,
  audience: JWT_AUDIENCE
};

/**
 * Opciones para la verificación de refresh tokens
 */
export const JWT_REFRESH_VERIFY_OPTIONS = {
  algorithms: [JWT_ALGORITHM],
  issuer: JWT_ISSUER,
  audience: JWT_AUDIENCE
};
