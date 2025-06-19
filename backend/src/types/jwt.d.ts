/**
 * Declaraciones de tipo para el módulo jsonwebtoken
 * Esto extiende las definiciones de tipos existentes para solucionar problemas de compatibilidad
 */

declare module 'jsonwebtoken' {
  type JwtPayload = Record<string, any>;

  // Extender la función sign para asegurar que acepta opciones con expiresIn
  export function sign (
    payload: string | Buffer | object,
    secretOrPrivateKey: string | Buffer,
    options?: {
      expiresIn?: string | number
      [key: string]: any
    }
  ): string;

  // Agregar la función verify para validar tokens
  export function verify (
    token: string,
    secretOrPublicKey: string | Buffer,
    options?: {
      complete?: boolean
      algorithms?: string[]
      audience?: string | string[]
      clockTimestamp?: number
      clockTolerance?: number
      issuer?: string | string[]
      ignoreExpiration?: boolean
      ignoreNotBefore?: boolean
      jwtid?: string
      subject?: string
      maxAge?: string | number
      [key: string]: any
    }
  ): JwtPayload | string;
}
