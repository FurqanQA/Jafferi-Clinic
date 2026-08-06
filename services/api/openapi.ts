import { logger } from '../shared/logger';

// ============================================================================
// OpenAPI Specification
// OpenAPI (Swagger) specification generation and management
// ============================================================================

/**
 * OpenAPI Document
 */
export interface OpenApiDocument {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
    termsOfService?: string;
    contact?: {
      name?: string;
      url?: string;
      email?: string;
    };
    license?: {
      name: string;
      url?: string;
    };
  };
  servers?: Array<{
    url: string;
    description?: string;
    variables?: Record<string, {
      enum?: string[];
      default: string;
      description?: string;
    }>;
  }>;
  paths: Record<string, PathItem>;
  components?: {
    schemas?: Record<string, Schema>;
    responses?: Record<string, Response>;
    parameters?: Record<string, Parameter>;
    examples?: Record<string, Example>;
    requestBodies?: Record<string, RequestBody>;
    securitySchemes?: Record<string, SecurityScheme>;
    links?: Record<string, Link>;
    callbacks?: Record<string, Callback>;
  };
  security?: Array<Record<string, string[]>>;
  tags?: Array<{
    name: string;
    description?: string;
    externalDocs?: {
      description?: string;
      url: string;
    };
  }>;
  externalDocs?: {
    description?: string;
    url: string;
  };
}

/**
 * Path Item
 */
export interface PathItem {
  summary?: string;
  description?: string;
  get?: Operation;
  put?: Operation;
  post?: Operation;
  delete?: Operation;
  options?: Operation;
  head?: Operation;
  patch?: Operation;
  trace?: Operation;
  servers?: Array<{
    url: string;
    description?: string;
  }>;
  parameters?: Parameter[];
}

/**
 * Operation
 */
export interface Operation {
  tags?: string[];
  summary?: string;
  description?: string;
  externalDocs?: {
    description?: string;
    url: string;
  };
  operationId?: string;
  parameters?: Parameter[];
  requestBody?: RequestBody;
  responses: Record<string, Response>;
  callbacks?: Record<string, Callback>;
  deprecated?: boolean;
  security?: Array<Record<string, string[]>>;
  servers?: Array<{
    url: string;
    description?: string;
  }>;
}

/**
 * Parameter
 */
export interface Parameter {
  name: string;
  in: 'query' | 'header' | 'path' | 'cookie';
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  style?: 'matrix' | 'label' | 'form' | 'simple' | 'spaceDelimited' | 'pipeDelimited' | 'deepObject';
  explode?: boolean;
  allowReserved?: boolean;
  schema: Schema;
  example?: unknown;
  examples?: Record<string, Example>;
  content?: Record<string, MediaType>;
}

/**
 * Request Body
 */
export interface RequestBody {
  description?: string;
  content: Record<string, MediaType>;
  required?: boolean;
}

/**
 * Response
 */
export interface Response {
  description: string;
  headers?: Record<string, Parameter>;
  content?: Record<string, MediaType>;
  links?: Record<string, Link>;
}

/**
 * Media Type
 */
export interface MediaType {
  schema?: Schema;
  example?: unknown;
  examples?: Record<string, Example>;
  encoding?: Record<string, {
    contentType?: string;
    headers?: Record<string, Parameter>;
    style?: 'matrix' | 'label' | 'form' | 'simple' | 'spaceDelimited' | 'pipeDelimited' | 'deepObject';
    explode?: boolean;
    allowReserved?: boolean;
  }>;
}

/**
 * Schema
 */
export interface Schema {
  type?: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object';
  format?: string;
  description?: string;
  nullable?: boolean;
  enum?: string[];
  default?: unknown;
  example?: unknown;
  allOf?: Schema[];
  anyOf?: Schema[];
  oneOf?: Schema[];
  not?: Schema;
  items?: Schema;
  properties?: Record<string, Schema>;
  additionalProperties?: Schema | boolean;
  required?: string[];
  minItems?: number;
  maxItems?: number;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  pattern?: string;
  multipleOf?: number;
  uniqueItems?: boolean;
  minProperties?: number;
  maxProperties?: number;
  title?: string;
  externalDocs?: {
    description?: string;
    url: string;
  };
}

/**
 * Security Scheme
 */
export interface SecurityScheme {
  type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect' | 'mutualTLS';
  description?: string;
  name?: string;
  in?: 'query' | 'header' | 'cookie';
  scheme?: string;
  bearerFormat?: string;
  flows?: {
    implicit?: {
      authorizationUrl: string;
      tokenUrl?: string;
      refreshUrl?: string;
      scopes: Record<string, string>;
    };
    password?: {
      tokenUrl: string;
      refreshUrl?: string;
      scopes: Record<string, string>;
    };
    clientCredentials?: {
      tokenUrl: string;
      refreshUrl?: string;
      scopes: Record<string, string>;
    };
    authorizationCode?: {
      authorizationUrl: string;
      tokenUrl: string;
      refreshUrl?: string;
      scopes: Record<string, string>;
    };
  };
  openIdConnectUrl?: string;
}

/**
 * Example
 */
export interface Example {
  summary?: string;
  description?: string;
  value?: unknown;
  externalValue?: string;
}

/**
 * Link
 */
export interface Link {
  operationId?: string;
  operationRef?: string;
  description?: string;
  parameters?: Record<string, unknown>;
  requestBody?: unknown;
  server?: {
    url: string;
    description?: string;
  };
}

/**
 * Callback
 */
export interface Callback {
  expression: string;
  operationRef?: string;
  operationId?: string;
  description?: string;
  parameters?: Record<string, unknown>;
  requestBody?: unknown;
  server?: {
    url: string;
    description?: string;
  };
}

/**
 * Default OpenAPI document
 */
const DEFAULT_OPENAPI_DOC: OpenApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Jafferi Clinic API',
    version: '1.0.0',
    description: 'Enterprise API Gateway & Integration Platform for Jafferi Clinic',
    contact: {
      name: 'API Support',
      email: 'api@jafferclinic.com',
    },
  },
  servers: [
    {
      url: 'https://api.jafferclinic.com/v1',
      description: 'Production server',
    },
    {
      url: 'https://staging-api.jafferclinic.com/v1',
      description: 'Staging server',
    },
    {
      url: 'http://localhost:3000/v1',
      description: 'Development server',
    },
  ],
  paths: {},
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT authentication',
      },
      apiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'API key authentication',
      },
      oauth2Auth: {
        type: 'oauth2',
        flows: {
          authorizationCode: {
            authorizationUrl: 'https://api.jafferclinic.com/oauth/authorize',
            tokenUrl: 'https://api.jafferclinic.com/oauth/token',
            scopes: {
              'read:patients': 'Read patient data',
              'write:patients': 'Write patient data',
              'read:appointments': 'Read appointment data',
              'write:appointments': 'Write appointment data',
            },
          },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  tags: [
    {
      name: 'Patients',
      description: 'Patient management endpoints',
    },
    {
      name: 'Appointments',
      description: 'Appointment management endpoints',
    },
    {
      name: 'Doctors',
      description: 'Doctor management endpoints',
    },
    {
      name: 'Prescriptions',
      description: 'Prescription management endpoints',
    },
    {
      name: 'Invoices',
      description: 'Invoice management endpoints',
    },
    {
      name: 'Payments',
      description: 'Payment processing endpoints',
    },
    {
      name: 'Webhooks',
      description: 'Webhook management endpoints',
    },
    {
      name: 'Integrations',
      description: 'Third-party integration endpoints',
    },
  ],
};

/**
 * Get OpenAPI document
 */
export function getOpenApiDocument(): OpenApiDocument {
  return JSON.parse(JSON.stringify(DEFAULT_OPENAPI_DOC));
}

/**
 * Update OpenAPI document
 */
export function updateOpenApiDocument(updates: Partial<OpenApiDocument>): OpenApiDocument {
  Object.assign(DEFAULT_OPENAPI_DOC, updates);
  logger.info('OpenAPI document updated');
  return getOpenApiDocument();
}

/**
 * Add path to OpenAPI document
 */
export function addPath(path: string, pathItem: PathItem): void {
  DEFAULT_OPENAPI_DOC.paths[path] = pathItem;
  logger.info('Path added to OpenAPI document', { path });
}

/**
 * Remove path from OpenAPI document
 */
export function removePath(path: string): void {
  delete DEFAULT_OPENAPI_DOC.paths[path];
  logger.info('Path removed from OpenAPI document', { path });
}

/**
 * Add schema to components
 */
export function addSchema(name: string, schema: Schema): void {
  if (!DEFAULT_OPENAPI_DOC.components) {
    DEFAULT_OPENAPI_DOC.components = {};
  }
  if (!DEFAULT_OPENAPI_DOC.components.schemas) {
    DEFAULT_OPENAPI_DOC.components.schemas = {};
  }
  DEFAULT_OPENAPI_DOC.components.schemas[name] = schema;
  logger.info('Schema added to OpenAPI document', { name });
}

/**
 * Add security scheme to components
 */
export function addSecurityScheme(name: string, scheme: SecurityScheme): void {
  if (!DEFAULT_OPENAPI_DOC.components) {
    DEFAULT_OPENAPI_DOC.components = {};
  }
  if (!DEFAULT_OPENAPI_DOC.components.securitySchemes) {
    DEFAULT_OPENAPI_DOC.components.securitySchemes = {};
  }
  DEFAULT_OPENAPI_DOC.components.securitySchemes[name] = scheme;
  logger.info('Security scheme added to OpenAPI document', { name });
}

/**
 * Generate OpenAPI JSON
 */
export function generateOpenApiJson(): string {
  return JSON.stringify(DEFAULT_OPENAPI_DOC, null, 2);
}

/**
 * Generate OpenAPI YAML
 */
export function generateOpenApiYaml(): string {
  // Simple YAML generator (for production, use a proper YAML library)
  let yaml = `openapi: ${DEFAULT_OPENAPI_DOC.openapi}\n`;
  yaml += `info:\n`;
  yaml += `  title: ${DEFAULT_OPENAPI_DOC.info.title}\n`;
  yaml += `  version: ${DEFAULT_OPENAPI_DOC.info.version}\n`;
  if (DEFAULT_OPENAPI_DOC.info.description) {
    yaml += `  description: ${DEFAULT_OPENAPI_DOC.info.description}\n`;
  }
  return yaml;
}

/**
 * Validate OpenAPI document
 */
export function validateOpenApiDocument(): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!DEFAULT_OPENAPI_DOC.openapi) {
    errors.push('OpenAPI version is required');
  }

  if (!DEFAULT_OPENAPI_DOC.info) {
    errors.push('Info section is required');
  } else {
    if (!DEFAULT_OPENAPI_DOC.info.title) {
      errors.push('Info title is required');
    }
    if (!DEFAULT_OPENAPI_DOC.info.version) {
      errors.push('Info version is required');
    }
  }

  if (!DEFAULT_OPENAPI_DOC.paths || Object.keys(DEFAULT_OPENAPI_DOC.paths).length === 0) {
    errors.push('At least one path is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Create operation object
 */
export function createOperation(
  operationId: string,
  summary: string,
  responses: Record<string, Response>,
  method: 'get' | 'post' | 'put' | 'delete' | 'patch' = 'get'
): Operation {
  return {
    operationId,
    summary,
    responses,
  };
}

/**
 * Create parameter object
 */
export function createParameter(
  name: string,
  inType: 'query' | 'header' | 'path' | 'cookie',
  schema: Schema,
  required: boolean = false
): Parameter {
  return {
    name,
    in: inType,
    schema,
    required,
  };
}

/**
 * Create schema object
 */
export function createSchema(
  type: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object',
  properties?: Record<string, Schema>,
  required?: string[]
): Schema {
  const schema: Schema = { type };

  if (properties) {
    schema.properties = properties;
  }
  if (required) {
    schema.required = required;
  }

  return schema;
}

/**
 * Get all paths
 */
export function getAllPaths(): Record<string, PathItem> {
  return { ...DEFAULT_OPENAPI_DOC.paths };
}

/**
 * Get path by name
 */
export function getPath(path: string): PathItem | null {
  return DEFAULT_OPENAPI_DOC.paths[path] || null;
}

/**
 * Add server
 */
export function addServer(url: string, description?: string): void {
  if (!DEFAULT_OPENAPI_DOC.servers) {
    DEFAULT_OPENAPI_DOC.servers = [];
  }
  DEFAULT_OPENAPI_DOC.servers.push({ url, description });
  logger.info('Server added to OpenAPI document', { url });
}

/**
 * Remove server
 */
export function removeServer(url: string): void {
  if (DEFAULT_OPENAPI_DOC.servers) {
    DEFAULT_OPENAPI_DOC.servers = DEFAULT_OPENAPI_DOC.servers.filter((s) => s.url !== url);
    logger.info('Server removed from OpenAPI document', { url });
  }
}

/**
 * Add tag
 */
export function addTag(name: string, description?: string): void {
  if (!DEFAULT_OPENAPI_DOC.tags) {
    DEFAULT_OPENAPI_DOC.tags = [];
  }
  if (!DEFAULT_OPENAPI_DOC.tags.find((t) => t.name === name)) {
    DEFAULT_OPENAPI_DOC.tags.push({ name, description });
    logger.info('Tag added to OpenAPI document', { name });
  }
}

/**
 * Remove tag
 */
export function removeTag(name: string): void {
  if (DEFAULT_OPENAPI_DOC.tags) {
    DEFAULT_OPENAPI_DOC.tags = DEFAULT_OPENAPI_DOC.tags.filter((t) => t.name !== name);
    logger.info('Tag removed from OpenAPI document', { name });
  }
}
