import { logger } from '../shared/logger';
import { cache } from '../shared/cache';
import { getOpenApiDocument, generateOpenApiJson, generateOpenApiYaml } from './openapi';
import { generateSwaggerUiHtml, getSwaggerConfig } from './swagger';

// ============================================================================
// API Documentation
// API documentation generation and management
// ============================================================================

/**
 * Documentation Format
 */
export enum DocumentationFormat {
  HTML = 'html',
  JSON = 'json',
  YAML = 'yaml',
  MARKDOWN = 'markdown',
}

/**
 * Documentation Configuration
 */
export interface DocumentationConfig {
  format: DocumentationFormat;
  includeExamples?: boolean;
  includeSchemas?: boolean;
  includeAuth?: boolean;
  baseUrl?: string;
}

/**
 * Generate API documentation
 */
export function generateApiDocumentation(config: DocumentationConfig): string {
  try {
    switch (config.format) {
      case DocumentationFormat.HTML:
        return generateHtmlDocumentation(config);
      case DocumentationFormat.JSON:
        return generateOpenApiJson();
      case DocumentationFormat.YAML:
        return generateOpenApiYaml();
      case DocumentationFormat.MARKDOWN:
        return generateMarkdownDocumentation(config);
      default:
        throw new Error(`Unsupported documentation format: ${config.format}`);
    }
  } catch (error) {
    logger.error('API documentation generation failed', { error, format: config.format });
    throw error;
  }
}

/**
 * Generate HTML documentation
 */
function generateHtmlDocumentation(config: DocumentationConfig): string {
  const swaggerConfig = getSwaggerConfig();
  if (config.baseUrl) {
    swaggerConfig.url = config.baseUrl;
  }

  return generateSwaggerUiHtml();
}

/**
 * Generate Markdown documentation
 */
function generateMarkdownDocumentation(config: DocumentationConfig): string {
  const openApiDoc = getOpenApiDocument();

  let markdown = `# ${openApiDoc.info.title}\n\n`;
  markdown += `**Version:** ${openApiDoc.info.version}\n\n`;
  markdown += `${openApiDoc.info.description || ''}\n\n`;

  if (config.includeAuth) {
    markdown += `## Authentication\n\n`;
    markdown += `This API uses API keys for authentication. Include your API key in the request headers:\n\n`;
    markdown += `\`\`\`\nAuthorization: Bearer YOUR_API_KEY\nX-API-Key: YOUR_API_KEY\n\`\`\`\n\n`;
  }

  markdown += `## Base URL\n\n`;
  markdown += `${config.baseUrl || openApiDoc.servers?.[0]?.url || 'https://api.example.com'}\n\n`;

  markdown += `## Endpoints\n\n`;

  for (const [path, pathItem] of Object.entries(openApiDoc.paths)) {
    markdown += `### ${path}\n\n`;

    for (const [method, operation] of Object.entries(pathItem)) {
      if (operation && typeof operation === 'object' && 'summary' in operation) {
        markdown += `#### ${method.toUpperCase()} - ${operation.summary || path}\n\n`;
        markdown += `${operation.description || ''}\n\n`;

        if (config.includeExamples && 'requestBody' in operation) {
          markdown += `**Example Request:**\n\n`;
          markdown += `\`\`\`json\n${JSON.stringify(operation.requestBody, null, 2)}\n\`\`\`\n\n`;
        }
      }
    }
  }

  if (config.includeSchemas && openApiDoc.components?.schemas) {
    markdown += `## Data Models\n\n`;

    for (const [schemaName, schema] of Object.entries(openApiDoc.components.schemas)) {
      markdown += `### ${schemaName}\n\n`;
      markdown += `\`\`\`json\n${JSON.stringify(schema, null, 2)}\n\`\`\`\n\n`;
    }
  }

  return markdown;
}

/**
 * Get documentation endpoint
 */
export function getDocumentationEndpoint(format: DocumentationFormat = DocumentationFormat.HTML): string {
  switch (format) {
    case DocumentationFormat.HTML:
      return '/api/docs';
    case DocumentationFormat.JSON:
      return '/api/openapi.json';
    case DocumentationFormat.YAML:
      return '/api/openapi.yaml';
    case DocumentationFormat.MARKDOWN:
      return '/api/docs.md';
    default:
      return '/api/docs';
  }
}

/**
 * Validate documentation configuration
 */
export function validateDocumentationConfig(config: DocumentationConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.format) {
    errors.push('Documentation format is required');
  }

  const validFormats = Object.values(DocumentationFormat);
  if (config.format && !validFormats.includes(config.format)) {
    errors.push(`Invalid documentation format: ${config.format}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get supported documentation formats
 */
export function getSupportedDocumentationFormats(): DocumentationFormat[] {
  return Object.values(DocumentationFormat);
}

/**
 * Generate documentation index
 */
export function generateDocumentationIndex(): string {
  const formats = getSupportedDocumentationFormats();

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Documentation</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 50px auto;
      padding: 20px;
    }
    h1 {
      color: #333;
    }
    .format-list {
      list-style: none;
      padding: 0;
    }
    .format-list li {
      margin: 10px 0;
    }
    .format-list a {
      display: inline-block;
      padding: 10px 20px;
      background-color: #007bff;
      color: white;
      text-decoration: none;
      border-radius: 5px;
      transition: background-color 0.3s;
    }
    .format-list a:hover {
      background-color: #0056b3;
    }
  </style>
</head>
<body>
  <h1>API Documentation</h1>
  <p>Select a documentation format:</p>
  <ul class="format-list">
`;

  for (const format of formats) {
    const endpoint = getDocumentationEndpoint(format);
    html += `    <li><a href="${endpoint}">${format.toUpperCase()}</a></li>\n`;
  }

  html += `  </ul>
</body>
</html>`;

  return html;
}

/**
 * Cache documentation
 */
export function cacheDocumentation(format: DocumentationFormat, documentation: string, ttl: number = 3600000): void {
  const cacheKey = `api-docs:${format}`;
  cache.set(cacheKey, documentation, ttl);
  logger.info('API documentation cached', { format });
}

/**
 * Get cached documentation
 */
export function getCachedDocumentation(format: DocumentationFormat): string | null {
  const cacheKey = `api-docs:${format}`;
  return cache.get<string>(cacheKey) || null;
}

/**
 * Clear documentation cache
 */
export function clearDocumentationCache(): void {
  logger.info('API documentation cache cleared');
}

/**
 * Get documentation statistics
 */
export function getDocumentationStatistics(): {
  totalEndpoints: number;
  totalSchemas: number;
  totalSecuritySchemes: number;
} {
  const openApiDoc = getOpenApiDocument();

  let totalEndpoints = 0;
  for (const pathItem of Object.values(openApiDoc.paths)) {
    for (const operation of Object.values(pathItem)) {
      if (operation && typeof operation === 'object') {
        totalEndpoints++;
      }
    }
  }

  const totalSchemas = openApiDoc.components?.schemas
    ? Object.keys(openApiDoc.components.schemas).length
    : 0;

  const totalSecuritySchemes = openApiDoc.components?.securitySchemes
    ? Object.keys(openApiDoc.components.securitySchemes).length
    : 0;

  return {
    totalEndpoints,
    totalSchemas,
    totalSecuritySchemes,
  };
}
