import { logger } from '../shared/logger';
import { cache } from '../shared/cache';
import { OAuthClient, OAuthGrantType, OAuthToken } from './api-types';

// ============================================================================
// OAuth 2.0
// OAuth 2.0 authorization server implementation
// ============================================================================

/**
 * Authorization Code
 */
interface AuthorizationCode {
  code: string;
  clientId: string;
  userId: string;
  clinicId: string;
  expiresAt: string;
  redirectUri: string;
  scopes: string[];
}

/**
 * OAuth storage
 */
interface OAuthStorage {
  clients: Map<string, OAuthClient>;
  codes: Map<string, AuthorizationCode>;
  tokens: Map<string, OAuthToken>;
  refreshTokens: Map<string, string>; // refreshToken -> tokenId
}

/**
 * OAuth registry
 */
const oauthRegistry: OAuthStorage = {
  clients: new Map(),
  codes: new Map(),
  tokens: new Map(),
  refreshTokens: new Map(),
};

/**
 * Generate authorization code
 */
function generateAuthorizationCode(): string {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generate access token
 */
function generateAccessToken(): string {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generate refresh token
 */
function generateRefreshToken(): string {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Register OAuth client
 */
export async function registerOAuthClient(
  clinicId: string,
  name: string,
  createdBy: string,
  redirectUris: string[],
  grantTypes: OAuthGrantType[],
  scopes: string[]
): Promise<OAuthClient> {
  const clientId = generateAccessToken();
  const clientSecret = generateAccessToken();
  const now = new Date();

  const client: OAuthClient = {
    id: crypto.randomUUID(),
    clientId,
    clientSecret,
    clinicId,
    name,
    redirectUris,
    grantTypes,
    scopes,
    isActive: true,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    createdBy,
  };

  oauthRegistry.clients.set(clientId, client);
  cache.set(`oauth:client:${clientId}`, JSON.stringify(client), 86400000);

  logger.info('OAuth client registered', { clientId, clinicId, name });
  return client;
}

/**
 * Get OAuth client
 */
export async function getOAuthClient(clientId: string): Promise<OAuthClient | null> {
  const cached = cache.get<string>(`oauth:client:${clientId}`);
  if (cached) {
    return JSON.parse(cached);
  }

  const client = oauthRegistry.clients.get(clientId);
  if (client) {
    cache.set(`oauth:client:${clientId}`, JSON.stringify(client), 86400000);
    return client;
  }

  return null;
}

/**
 * Create authorization code
 */
export async function createAuthorizationCode(
  clientId: string,
  userId: string,
  clinicId: string,
  redirectUri: string,
  scopes: string[],
  expiresIn: number = 600000 // 10 minutes
): Promise<string> {
  const code = generateAuthorizationCode();
  const now = new Date();

  const authCode: AuthorizationCode = {
    code,
    clientId,
    userId,
    clinicId,
    expiresAt: new Date(Date.now() + expiresIn).toISOString(),
    redirectUri,
    scopes,
  };

  oauthRegistry.codes.set(code, authCode);
  cache.set(`oauth:code:${code}`, JSON.stringify(authCode), expiresIn);

  logger.info('Authorization code created', { code, clientId, userId });
  return code;
}

/**
 * Validate authorization code
 */
export async function validateAuthorizationCode(
  code: string,
  clientId: string,
  redirectUri: string
): Promise<AuthorizationCode | null> {
  const cached = cache.get<string>(`oauth:code:${code}`);
  if (!cached) {
    return null;
  }

  const authCode: AuthorizationCode = JSON.parse(cached);

  // Validate client ID and redirect URI
  if (authCode.clientId !== clientId || authCode.redirectUri !== redirectUri) {
    return null;
  }

  // Check expiration
  if (new Date(authCode.expiresAt) < new Date()) {
    oauthRegistry.codes.delete(code);
    cache.delete(`oauth:code:${code}`);
    return null;
  }

  return authCode;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeAuthorizationCode(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<OAuthToken | null> {
  const authCode = await validateAuthorizationCode(code, clientId, redirectUri);
  if (!authCode) {
    return null;
  }

  const client = await getOAuthClient(clientId);
  if (!client || client.clientSecret !== clientSecret) {
    return null;
  }

  // Create tokens
  const accessToken = generateAccessToken();
  const refreshToken = generateRefreshToken();
  const now = new Date();
  const expiresIn = 3600; // 1 hour in seconds

  const token: OAuthToken = {
    id: crypto.randomUUID(),
    accessToken,
    refreshToken,
    clientId,
    userId: authCode.userId,
    tokenType: 'Bearer',
    expiresIn,
    scopes: authCode.scopes,
    expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
    createdAt: now.toISOString(),
  };

  oauthRegistry.tokens.set(accessToken, token);
  if (refreshToken) {
    oauthRegistry.refreshTokens.set(refreshToken, accessToken);
    cache.set(`oauth:refresh:${refreshToken}`, accessToken, 2592000000); // 30 days
  }
  cache.set(`oauth:token:${accessToken}`, JSON.stringify(token), expiresIn * 1000);

  // Delete authorization code
  oauthRegistry.codes.delete(code);
  cache.delete(`oauth:code:${code}`);

  logger.info('Authorization code exchanged', { clientId, userId: authCode.userId });
  return token;
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<OAuthToken | null> {
  const tokenId = oauthRegistry.refreshTokens.get(refreshToken);
  if (!tokenId) {
    return null;
  }

  const oldToken = oauthRegistry.tokens.get(tokenId);
  if (!oldToken || oldToken.clientId !== clientId) {
    return null;
  }

  const client = await getOAuthClient(clientId);
  if (!client || client.clientSecret !== clientSecret) {
    return null;
  }

  // Check token expiration
  if (new Date(oldToken.expiresAt) < new Date()) {
    oauthRegistry.tokens.delete(tokenId);
    if (oldToken.refreshToken) {
      oauthRegistry.refreshTokens.delete(oldToken.refreshToken);
    }
    return null;
  }

  // Generate new access token
  const newAccessToken = generateAccessToken();
  const now = new Date();
  const expiresIn = 3600; // 1 hour in seconds

  const newToken: OAuthToken = {
    ...oldToken,
    id: crypto.randomUUID(),
    accessToken: newAccessToken,
    expiresIn,
    expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
    createdAt: now.toISOString(),
  };

  oauthRegistry.tokens.delete(oldToken.accessToken);
  oauthRegistry.tokens.set(newAccessToken, newToken);
  if (refreshToken) {
    oauthRegistry.refreshTokens.set(refreshToken, newAccessToken);
  }
  cache.delete(`oauth:token:${oldToken.accessToken}`);
  cache.set(`oauth:token:${newAccessToken}`, JSON.stringify(newToken), expiresIn * 1000);

  logger.info('Access token refreshed', { clientId, userId: oldToken.userId });
  return newToken;
}

/**
 * Validate access token
 */
export async function validateAccessToken(
  accessToken: string
): Promise<OAuthToken | null> {
  const cached = cache.get<string>(`oauth:token:${accessToken}`);
  if (!cached) {
    return null;
  }

  const token: OAuthToken = JSON.parse(cached);

  // Check expiration
  if (new Date(token.expiresAt) < new Date()) {
    oauthRegistry.tokens.delete(accessToken);
    cache.delete(`oauth:token:${accessToken}`);
    return null;
  }

  return token;
}

/**
 * Revoke token
 */
export async function revokeToken(accessToken: string): Promise<boolean> {
  const token = oauthRegistry.tokens.get(accessToken);
  if (!token) {
    return false;
  }

  oauthRegistry.tokens.delete(accessToken);
  if (token.refreshToken) {
    oauthRegistry.refreshTokens.delete(token.refreshToken);
    cache.delete(`oauth:refresh:${token.refreshToken}`);
  }
  cache.delete(`oauth:token:${accessToken}`);

  logger.info('Token revoked', { accessToken });
  return true;
}

/**
 * Revoke all tokens for user
 */
export async function revokeUserTokens(userId: string): Promise<number> {
  let count = 0;

  for (const [accessToken, token] of oauthRegistry.tokens.entries()) {
    if (token.userId === userId) {
      oauthRegistry.tokens.delete(accessToken);
      if (token.refreshToken) {
        oauthRegistry.refreshTokens.delete(token.refreshToken);
        cache.delete(`oauth:refresh:${token.refreshToken}`);
      }
      cache.delete(`oauth:token:${accessToken}`);
      count++;
    }
  }

  logger.info('User tokens revoked', { userId, count });
  return count;
}

/**
 * Get OAuth client by user
 */
export async function getOAuthClientsByClinic(
  clinicId: string
): Promise<OAuthClient[]> {
  const clients: OAuthClient[] = [];

  for (const client of oauthRegistry.clients.values()) {
    if (client.clinicId === clinicId) {
      clients.push(client);
    }
  }

  return clients;
}

/**
 * Delete OAuth client
 */
export async function deleteOAuthClient(clientId: string): Promise<boolean> {
  const client = oauthRegistry.clients.get(clientId);
  if (!client) {
    return false;
  }

  oauthRegistry.clients.delete(clientId);
  cache.delete(`oauth:client:${clientId}`);

  // Revoke all tokens for this client
  for (const [accessToken, token] of oauthRegistry.tokens.entries()) {
    if (token.clientId === clientId) {
      oauthRegistry.tokens.delete(accessToken);
      if (token.refreshToken) {
        oauthRegistry.refreshTokens.delete(token.refreshToken);
        cache.delete(`oauth:refresh:${token.refreshToken}`);
      }
      cache.delete(`oauth:token:${accessToken}`);
    }
  }

  logger.info('OAuth client deleted', { clientId });
  return true;
}
