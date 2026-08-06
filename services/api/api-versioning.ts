import { logger } from '../shared/logger';
import { ApiVersion } from './api-types';

// ============================================================================
// API Versioning
// API version management and compatibility
// ============================================================================

/**
 * Version Information
 */
export interface VersionInfo {
  version: ApiVersion;
  status: 'stable' | 'beta' | 'deprecated' | 'alpha';
  releaseDate: string;
  sunsetDate?: string;
  supportedUntil?: string;
  features: string[];
  breakingChanges: string[];
}

/**
 * Version Registry
 */
const VERSION_REGISTRY: Record<ApiVersion, VersionInfo> = {
  [ApiVersion.V1]: {
    version: ApiVersion.V1,
    status: 'stable',
    releaseDate: '2024-01-01',
    supportedUntil: '2025-12-31',
    features: [
      'Basic CRUD operations',
      'Authentication with API keys',
      'Webhooks',
      'Rate limiting',
    ],
    breakingChanges: [],
  },
  [ApiVersion.V2]: {
    version: ApiVersion.V2,
    status: 'stable',
    releaseDate: '2024-06-01',
    features: [
      'All V1 features',
      'OAuth2 support',
      'GraphQL endpoints',
      'Advanced filtering',
      'Batch operations',
      'FHIR R4 support',
    ],
    breakingChanges: [
      'Changed response format for list endpoints',
      'Updated webhook payload structure',
    ],
  },
  [ApiVersion.V3]: {
    version: ApiVersion.V3,
    status: 'beta',
    releaseDate: '2025-01-01',
    features: [
      'All V2 features',
      'Real-time subscriptions',
      'AI-powered endpoints',
      'Advanced analytics',
      'HL7 v2.x support',
    ],
    breakingChanges: [],
  },
};

/**
 * Get version information
 */
export function getVersionInfo(version: ApiVersion): VersionInfo | undefined {
  return VERSION_REGISTRY[version];
}

/**
 * Get all versions
 */
export function getAllVersions(): VersionInfo[] {
  return Object.values(VERSION_REGISTRY);
}

/**
 * Get stable versions
 */
export function getStableVersions(): ApiVersion[] {
  return Object.values(VERSION_REGISTRY)
    .filter((info) => info.status === 'stable')
    .map((info) => info.version);
}

/**
 * Get latest stable version
 */
export function getLatestStableVersion(): ApiVersion {
  const stableVersions = getStableVersions();
  return stableVersions[stableVersions.length - 1] || ApiVersion.V2;
}

/**
 * Check if version is supported
 */
export function isVersionSupported(version: ApiVersion): boolean {
  const info = getVersionInfo(version);
  if (!info) {
    return false;
  }

  if (info.status === 'deprecated') {
    if (info.supportedUntil) {
      const supportedUntil = new Date(info.supportedUntil);
      return new Date() < supportedUntil;
    }
    return false;
  }

  return info.status !== 'alpha';
}

/**
 * Check if version is deprecated
 */
export function isVersionDeprecated(version: ApiVersion): boolean {
  const info = getVersionInfo(version);
  return info?.status === 'deprecated' || false;
}

/**
 * Parse version from request header
 */
export function parseVersionFromHeader(header: string | undefined): ApiVersion {
  if (!header) {
    return getLatestStableVersion();
  }

  const version = header.replace(/^\/?v/i, '') as ApiVersion;
  if (Object.values(ApiVersion).includes(version)) {
    return version;
  }

  logger.warn('Invalid API version requested', { requestedVersion: header });
  return getLatestStableVersion();
}

/**
 * Parse version from URL path
 */
export function parseVersionFromPath(path: string): ApiVersion {
  const match = path.match(/^\/v(\d+)/);
  if (match) {
    const version = `v${match[1]}` as ApiVersion;
    if (Object.values(ApiVersion).includes(version)) {
      return version;
    }
  }

  return getLatestStableVersion();
}

/**
 * Add version to path
 */
export function addVersionToPath(path: string, version: ApiVersion): string {
  if (path.startsWith('/v')) {
    return path;
  }
  return `/v${version.replace('v', '')}${path}`;
}

/**
 * Remove version from path
 */
export function removeVersionFromPath(path: string): string {
  return path.replace(/^\/v\d+/, '');
}

/**
 * Get version compatibility matrix
 */
export function getVersionCompatibilityMatrix(): Record<
  ApiVersion,
  {
    compatibleWith: ApiVersion[];
    migrationPath: ApiVersion[];
  }
> {
  return {
    [ApiVersion.V1]: {
      compatibleWith: [ApiVersion.V1],
      migrationPath: [ApiVersion.V2],
    },
    [ApiVersion.V2]: {
      compatibleWith: [ApiVersion.V1, ApiVersion.V2],
      migrationPath: [ApiVersion.V3],
    },
    [ApiVersion.V3]: {
      compatibleWith: [ApiVersion.V2, ApiVersion.V3],
      migrationPath: [],
    },
  };
}

/**
 * Validate version compatibility
 */
export function validateVersionCompatibility(
  requestedVersion: ApiVersion,
  clientVersion?: ApiVersion
): boolean {
  if (!clientVersion) {
    return isVersionSupported(requestedVersion);
  }

  const matrix = getVersionCompatibilityMatrix();
  const compatibility = matrix[clientVersion];

  return compatibility.compatibleWith.includes(requestedVersion);
}

/**
 * Get migration guide
 */
export function getMigrationGuide(fromVersion: ApiVersion, toVersion: ApiVersion): {
  steps: string[];
  breakingChanges: string[];
  deprecations: string[];
} {
  const fromInfo = getVersionInfo(fromVersion);
  const toInfo = getVersionInfo(toVersion);

  return {
    steps: [
      `Update API base path to use /v${toVersion.replace('v', '')}`,
      'Review breaking changes below',
      'Update request/response handling',
      'Test in staging environment',
      'Deploy to production',
    ],
    breakingChanges: toInfo?.breakingChanges || [],
    deprecations: fromInfo?.status === 'deprecated' ? [`Version ${fromVersion} is deprecated`] : [],
  };
}
