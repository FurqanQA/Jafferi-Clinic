import { logger } from '../shared/logger';
import { getOpenApiDocument } from './openapi';

// ============================================================================
// TypeScript SDK
// TypeScript SDK generation and utilities
// ============================================================================

/**
 * TypeScript SDK Configuration
 */
export interface TypeScriptSdkConfig {
  packageName: string;
  packageVersion: string;
  baseUrl: string;
  apiKey?: string;
  includeTypes?: boolean;
  includeExamples?: boolean;
  useAxios?: boolean;
}

/**
 * Generate TypeScript SDK
 */
export async function generateTypeScriptSdk(config: TypeScriptSdkConfig): Promise<string> {
  const openApiDoc = getOpenApiDocument();

  try {
    const sdkCode = generateSdkCode(config, openApiDoc);
    logger.info('TypeScript SDK generated', { packageName: config.packageName });
    return sdkCode;
  } catch (error) {
    logger.error('TypeScript SDK generation failed', { error });
    throw error;
  }
}

/**
 * Generate SDK code
 */
function generateSdkCode(config: TypeScriptSdkConfig, openApiDoc: unknown): string {
  const className = config.packageName.replace(/[^a-zA-Z0-9]/g, '');
  const capitalizedClassName = className.replace(/\b\w/g, (l) => l.toUpperCase());

  let code = `
/**
 * ${config.packageName} TypeScript SDK
 * Version: ${config.packageVersion}
 * Generated SDK for ${config.baseUrl}
 */

${config.useAxios ? generateAxiosImports() : generateFetchImports()}

/**
 * API Response interface
 */
export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  message?: string;
}

/**
 * API Error interface
 */
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

/**
 * ${capitalizedClassName} Client
 */
export class ${capitalizedClassName}Client {
  private baseUrl: string;
  private apiKey?: string;
  private defaultHeaders: Record<string, string>;

  constructor(apiKey?: string, baseUrl: string = '${config.baseUrl}') {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Get default headers
   */
  private getHeaders(): Record<string, string> {
    const headers = { ...this.defaultHeaders };

    if (this.apiKey) {
      headers['Authorization'] = \`Bearer \${this.apiKey}\`;
      headers['X-API-Key'] = this.apiKey;
    }

    return headers;
  }

  /**
   * Make API request
   */
  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<ApiResponse<T>> {
    const headers = this.getHeaders();
    const url = \`\${this.baseUrl}\${path}\`;

    try {
${config.useAxios ? generateAxiosRequest() : generateFetchRequest()}
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Handle API error
   */
  private handleError(error: unknown): ApiError {
    if (error instanceof Error) {
      return {
        message: error.message,
      };
    }
    return {
      message: 'An unknown error occurred',
    };
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint);
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data: unknown): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, data);
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data: unknown): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, data);
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, data: unknown): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', endpoint, data);
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint);
  }

  /**
   * Set API key
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  /**
   * Set base URL
   */
  setBaseUrl(baseUrl: string): void {
    this.baseUrl = baseUrl;
  }
}

/**
 * Create default client instance
 */
export const client = new ${capitalizedClassName}Client();

/**
 * Export default client
 */
export default client;
  `.trim();

  return code;
}

/**
 * Generate fetch imports
 */
function generateFetchImports(): string {
  return `
// No external dependencies required - uses native fetch API
`;
}

/**
 * Generate axios imports
 */
function generateAxiosImports(): string {
  return `
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
`;
}

/**
 * Generate fetch request
 */
function generateFetchRequest(): string {
  return `
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        throw new Error(\`HTTP error! status: \${response.status}\`);
      }

      const data = await response.json();

      return {
        data,
        status: response.status,
      };
`;
}

/**
 * Generate axios request
 */
function generateAxiosRequest(): string {
  return `
      const config: AxiosRequestConfig = {
        method,
        url,
        headers,
        data: body,
      };

      const response: AxiosResponse = await axios(config);

      return {
        data: response.data,
        status: response.status,
      };
`;
}

/**
 * Generate TypeScript types from OpenAPI schema
 */
export function generateTypesFromOpenApi(): string {
  const openApiDoc = getOpenApiDocument();

  let types = `
/**
 * Generated TypeScript types from OpenAPI specification
 */

`;

  // Generate types from schemas if available
  if (openApiDoc.components && openApiDoc.components.schemas) {
    for (const [schemaName, schema] of Object.entries(openApiDoc.components.schemas)) {
      types += generateTypeFromSchema(schemaName, schema);
    }
  }

  return types;
}

/**
 * Generate type from schema
 */
function generateTypeFromSchema(name: string, schema: unknown): string {
  // Placeholder for actual type generation
  return `
export interface ${name} {
  // Add properties based on schema
}
`;
}

/**
 * Validate TypeScript SDK configuration
 */
export function validateTypeScriptSdkConfig(config: TypeScriptSdkConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.packageName) {
    errors.push('Package name is required');
  }

  if (!config.packageVersion) {
    errors.push('Package version is required');
  }

  if (!config.baseUrl) {
    errors.push('Base URL is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate package.json for TypeScript SDK
 */
export function generatePackageJson(config: TypeScriptSdkConfig): string {
  const packageName = config.packageName.toLowerCase().replace(/[^a-z0-9]/g, '-');

  return JSON.stringify(
    {
      name: packageName,
      version: config.packageVersion,
      description: `TypeScript SDK for ${config.baseUrl}`,
      main: 'dist/index.js',
      types: 'dist/index.d.ts',
      scripts: {
        build: 'tsc',
        test: 'jest',
        lint: 'eslint src/**/*.ts',
      },
      keywords: ['sdk', 'api', 'typescript'],
      author: '',
      license: 'MIT',
      devDependencies: {
        typescript: '^5.0.0',
        '@types/node': '^20.0.0',
      },
      dependencies: config.useAxios ? { axios: '^1.6.0' } : {},
    },
    null,
    2
  );
}

/**
 * Generate tsconfig.json for TypeScript SDK
 */
export function generateTsConfigJson(): string {
  return JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2020',
        module: 'commonjs',
        lib: ['ES2020'],
        declaration: true,
        outDir: './dist',
        rootDir: './src',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist'],
    },
    null,
    2
  );
}

/**
 * Generate README.md for TypeScript SDK
 */
export function generateReadme(config: TypeScriptSdkConfig): string {
  return `
# ${config.packageName} TypeScript SDK

TypeScript SDK for ${config.baseUrl}

## Installation

\`\`\`bash
npm install ${config.packageName.toLowerCase().replace(/[^a-z0-9]/g, '-')}
\`\`\`

## Usage

\`\`\`typescript
import { client } from '${config.packageName.toLowerCase().replace(/[^a-z0-9]/g, '-')}';

// Initialize with API key
const apiClient = new ${config.packageName.replace(/[^a-zA-Z0-9]/g, '').replace(/\b\w/g, (l) => l.toUpperCase())}Client('your-api-key');

// Make requests
const result = await apiClient.get('/endpoint');
\`\`\`

## API Reference

### Methods

- \`get(endpoint)\` - Make a GET request
- \`post(endpoint, data)\` - Make a POST request
- \`put(endpoint, data)\` - Make a PUT request
- \`patch(endpoint, data)\` - Make a PATCH request
- \`delete(endpoint)\` - Make a DELETE request

## License

MIT
  `.trim();
}
