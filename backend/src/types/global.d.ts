/**
 * Declaraciones de tipos para el proyecto StockIT
 * 
 * Este archivo contiene las declaraciones de tipos necesarias para los módulos
 * externos utilizados en el proyecto. Las declaraciones son mínimas y se centran
 * en resolver los problemas de tipos encontrados durante el desarrollo.
 */

// Declaración para winston
declare module 'winston' {
  export const format: any;
  export const transports: any;
  export function createLogger(options: any): any;

  export interface Logger {
    debug: (message: string, meta?: any) => void;
    info: (message: string, meta?: any) => void;
    warn: (message: string, meta?: any) => void;
    error: (message: string, meta?: any) => void;
    add: (transport: any) => void;
  }
}

// Declaración para winston-daily-rotate-file
declare module 'winston-daily-rotate-file' {
  function DailyRotateFile(config: any): any;
  export = DailyRotateFile;
}

// Declaración para cors
declare module 'cors' {
  import { RequestHandler } from 'express';
  
  interface CorsOptions {
    origin?: boolean | string | string[] | RegExp | ((origin: string, callback: (err: Error | null, allow?: boolean) => void) => void);
    methods?: string | string[];
    allowedHeaders?: string | string[];
    exposedHeaders?: string | string[];
    credentials?: boolean;
    maxAge?: number;
    preflightContinue?: boolean;
    optionsSuccessStatus?: number;
  }
  
  function cors(options?: CorsOptions): RequestHandler;
  export = cors;
}

// Declaración para helmet
declare module 'helmet' {
  import { RequestHandler } from 'express';
  
  interface HelmetOptions {
    contentSecurityPolicy?: boolean | object;
    crossOriginEmbedderPolicy?: boolean | object;
    crossOriginOpenerPolicy?: boolean | object;
    crossOriginResourcePolicy?: boolean | object;
    dnsPrefetchControl?: boolean | object;
    expectCt?: boolean | object;
    frameguard?: boolean | object;
    hidePoweredBy?: boolean | object;
    hsts?: boolean | object;
    ieNoOpen?: boolean | object;
    noSniff?: boolean | object;
    originAgentCluster?: boolean | object;
    permittedCrossDomainPolicies?: boolean | object;
    referrerPolicy?: boolean | object;
    xssFilter?: boolean | object;
  }
  
  function helmet(options?: HelmetOptions): RequestHandler;
  export = helmet;
}

// Declaración para bcryptjs
declare module 'bcryptjs' {
  export function genSalt(rounds?: number): Promise<string>;
  export function hash(data: string, salt: string | number): Promise<string>;
  export function compare(data: string, encrypted: string): Promise<boolean>;
  
  export function genSaltSync(rounds?: number): string;
  export function hashSync(data: string, salt: string | number): string;
  export function compareSync(data: string, encrypted: string): boolean;
}

// Declaración para jsonwebtoken
declare module 'jsonwebtoken' {
  export interface SignOptions {
    algorithm?: string;
    expiresIn?: string | number;
    notBefore?: string | number;
    audience?: string | string[];
    issuer?: string;
    jwtid?: string;
    subject?: string;
    noTimestamp?: boolean;
    header?: object;
    keyid?: string;
  }
  
  export function sign(
    payload: string | Buffer | object,
    secretOrPrivateKey: string | Buffer,
    options?: SignOptions
  ): string;
  
  export function verify(
    token: string,
    secretOrPublicKey: string | Buffer,
    options?: object
  ): object | string;
  
  export function decode(
    token: string,
    options?: { complete?: boolean; json?: boolean }
  ): null | object | string;
}
