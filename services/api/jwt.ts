import { logger } from '../shared/logger';
import { cache } from '../shared/cache';

// ============================================================================
// JWT (JSON Web Tokens)
// JWT token generation, validation, and management
// ============================================================================

/**
 * JWT Payload
 */
export interface JwtPayload {
  sub: string; // Subject (user ID)
  clinicId: string;
  userId: string;
  role: string;
  scopes: string[];
  iat: number; // Issued at
  exp: number; // Expiration
  iss?: string; // Issuer
  aud?: string; // Audience
}

/**
 * JWT Header
 */
interface JwtHeader {
  alg: string;
  typ: string;
}

/**
 * JWT Configuration
 */
export interface JwtConfig {
  secret: string;
  expiresIn: string;
  issuer: string;
  audience: string;
}

/**
 * Default JWT configuration
 */
const DEFAULT_JWT_CONFIG: JwtConfig = {
  secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
  expiresIn: '1h',
  issuer: 'jafferi-clinic',
  audience: 'jafferi-api',
};

/**
 * Base64 URL encode
 */
function base64UrlEncode(str: string): string {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Base64 URL decode
 */
function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return atob(str);
}

/**
 * HMAC-SHA256 sign
 */
async function hmacSha256(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(data);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  const signatureArray = Array.from(new Uint8Array(signature));
  const signatureHex = signatureArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return signatureHex;
}

/**
 * Verify HMAC-SHA256 signature
 */
async function verifyHmacSha256(
  data: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const expectedSignature = await hmacSha256(data, secret);
  return expectedSignature === signature;
}

/**
 * Create JWT token
 */
export async function createJwtToken(
  payload: Omit<JwtPayload, 'iat' | 'exp'>,
  expiresIn: string = DEFAULT_JWT_CONFIG.expiresIn
): Promise<string> {
  const header: JwtHeader = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const exp = now + parseExpiration(expiresIn);

  const fullPayload: JwtPayload = {
    ...payload,
    iat: now,
    exp,
    iss: DEFAULT_JWT_CONFIG.issuer,
    aud: DEFAULT_JWT_CONFIG.audience,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = await hmacSha256(data, DEFAULT_JWT_CONFIG.secret);

  const token = `${data}.${signature}`;

  // Cache the token
  cache.set(`jwt:${token}`, JSON.stringify(fullPayload), exp * 1000 - Date.now());

  logger.info('JWT token created', { userId: payload.userId, clinicId: payload.clinicId });
  return token;
}

/**
 * Parse expiration string to seconds
 */
function parseExpiration(expiration: string): number {
  const match = expiration.match(/^(\d+)([smhd])$/);
  if (!match) {
    return 3600; // Default 1 hour
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 3600;
    case 'd':
      return value * 86400;
    default:
      return 3600;
  }
}

/**
 * Verify JWT token
 */
export async function verifyJwtToken(token: string): Promise<JwtPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const [encodedHeader, encodedPayload, signature] = parts;
    const data = `${encodedHeader}.${encodedPayload}`;

    // Verify signature
    const isValid = await verifyHmacSha256(data, signature, DEFAULT_JWT_CONFIG.secret);
    if (!isValid) {
      return null;
    }

    // Decode payload
    const payload: JwtPayload = JSON.parse(base64UrlDecode(encodedPayload));

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null;
    }

    // Check issuer and audience
    if (payload.iss && payload.iss !== DEFAULT_JWT_CONFIG.issuer) {
      return null;
    }
    if (payload.aud && payload.aud !== DEFAULT_JWT_CONFIG.audience) {
      return null;
    }

    return payload;
  } catch (error) {
    logger.error('JWT verification error', { error });
    return null;
  }
}

/**
 * Decode JWT token without verification
 */
export function decodeJwtToken(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const encodedPayload = parts[1];
    const payload: JwtPayload = JSON.parse(base64UrlDecode(encodedPayload));

    return payload;
  } catch (error) {
    logger.error('JWT decode error', { error });
    return null;
  }
}

/**
 * Refresh JWT token
 */
export async function refreshJwtToken(token: string): Promise<string | null> {
  const payload = await verifyJwtToken(token);
  if (!payload) {
    return null;
  }

  // Create new token with same payload
  const { iat, exp, ...restPayload } = payload;
  return await createJwtToken(restPayload);
}

/**
 * Revoke JWT token
 */
export async function revokeJwtToken(token: string): Promise<boolean> {
  const payload = decodeJwtToken(token);
  if (!payload) {
    return false;
  }

  // Add to revoked list
  const revokedKey = `jwt:revoked:${payload.sub}:${payload.iat}`;
  cache.set(revokedKey, 'true', (payload.exp || 0) * 1000 - Date.now());

  logger.info('JWT token revoked', { userId: payload.sub });
  return true;
}

/**
 * Check if token is revoked
 */
export async function isTokenRevoked(token: string): Promise<boolean> {
  const payload = decodeJwtToken(token);
  if (!payload) {
    return false;
  }

  const revokedKey = `jwt:revoked:${payload.sub}:${payload.iat}`;
  return cache.has(revokedKey);
}

/**
 * Get JWT configuration
 */
export function getJwtConfig(): JwtConfig {
  return { ...DEFAULT_JWT_CONFIG };
}

/**
 * Update JWT configuration
 */
export function updateJwtConfig(config: Partial<JwtConfig>): JwtConfig {
  Object.assign(DEFAULT_JWT_CONFIG, config);
  logger.info('JWT configuration updated');
  return { ...DEFAULT_JWT_CONFIG };
}

/**
 * Create JWT token for user
 */
export async function createUserToken(
  userId: string,
  clinicId: string,
  role: string,
  scopes: string[],
  expiresIn?: string
): Promise<string> {
  return await createJwtToken(
    {
      sub: userId,
      userId,
      clinicId,
      role,
      scopes,
    },
    expiresIn
  );
}

/**
 * Validate token scopes
 */
export function validateTokenScopes(
  payload: JwtPayload,
  requiredScopes: string[]
): boolean {
  if (!requiredScopes || requiredScopes.length === 0) {
    return true;
  }

  return requiredScopes.every((scope) => payload.scopes.includes(scope));
}

/**
 * Get token expiration time
 */
export function getTokenExpiration(token: string): Date | null {
  const payload = decodeJwtToken(token);
  if (!payload || !payload.exp) {
    return null;
  }

  return new Date(payload.exp * 1000);
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJwtToken(token);
  if (!payload || !payload.exp) {
    return true;
  }

  return payload.exp < Math.floor(Date.now() / 1000);
}

/**
 * Get time until token expiration
 */
export function getTimeUntilExpiration(token: string): number | null {
  const payload = decodeJwtToken(token);
  if (!payload || !payload.exp) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  return Math.max(0, payload.exp - now);
}
