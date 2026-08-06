import { logger } from '../shared/logger';
import { getOpenApiDocument, generateOpenApiJson, generateOpenApiYaml } from './openapi';

// ============================================================================
// Swagger UI
// Swagger UI integration for API documentation
// ============================================================================

/**
 * Swagger UI Configuration
 */
export interface SwaggerUiConfig {
  url: string;
  domId?: string;
  deepLinking?: boolean;
  presets?: string[];
  plugins?: string[];
  layout?: string;
  defaultModelsExpandDepth?: number;
  defaultModelExpandDepth?: number;
  docExpansion?: string;
  maxDisplayedTags?: number;
  filter?: boolean | string;
  persistAuthorization?: boolean;
  displayOperationId?: boolean;
  displayRequestDuration?: boolean;
  tryItOutEnabled?: boolean;
  requestInterceptor?: (request: unknown) => unknown;
  responseInterceptor?: (response: unknown) => unknown;
}

/**
 * Default Swagger UI configuration
 */
const DEFAULT_SWAGGER_CONFIG: SwaggerUiConfig = {
  url: '/api/openapi.json',
  domId: '#swagger-ui',
  deepLinking: true,
  presets: ['SwaggerUIStandalonePreset', 'SwaggerUIBundlePreset'],
  plugins: ['SwaggerUIPlugin'],
  layout: 'BaseLayout',
  defaultModelsExpandDepth: 1,
  defaultModelExpandDepth: 1,
  docExpansion: 'list',
  maxDisplayedTags: 10,
  filter: false,
  persistAuthorization: true,
  displayOperationId: false,
  displayRequestDuration: false,
  tryItOutEnabled: true,
};

/**
 * Get Swagger UI configuration
 */
export function getSwaggerConfig(): SwaggerUiConfig {
  return { ...DEFAULT_SWAGGER_CONFIG };
}

/**
 * Update Swagger UI configuration
 */
export function updateSwaggerConfig(config: Partial<SwaggerUiConfig>): SwaggerUiConfig {
  Object.assign(DEFAULT_SWAGGER_CONFIG, config);
  logger.info('Swagger UI configuration updated', { config: DEFAULT_SWAGGER_CONFIG });
  return { ...DEFAULT_SWAGGER_CONFIG };
}

/**
 * Generate Swagger UI HTML
 */
export function generateSwaggerUiHtml(): string {
  const config = getSwaggerConfig();
  const openapiJson = generateOpenApiJson();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Jafferi Clinic API Documentation</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@4/swagger-ui.css" />
  <style>
    html {
      box-sizing: border-box;
      overflow: -moz-scrollbars-vertical;
      overflow-y: scroll;
    }
    *, *:before, *:after {
      box-sizing: inherit;
    }
    body {
      margin:0;
      background: #fafafa;
    }
  </style>
</head>
<body>
  <div id="${config.domId || 'swagger-ui'}"></div>
  <script src="https://unpkg.com/swagger-ui-dist@4/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@4/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        url: "${config.url}",
        dom_id: "${config.domId || '#swagger-ui'}",
        deepLinking: ${config.deepLinking},
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
        layout: "${config.layout || 'BaseLayout'}",
        defaultModelsExpandDepth: ${config.defaultModelsExpandDepth || 1},
        defaultModelExpandDepth: ${config.defaultModelExpandDepth || 1},
        docExpansion: "${config.docExpansion || 'list'}",
        maxDisplayedTags: ${config.maxDisplayedTags || 10},
        filter: ${config.filter},
        persistAuthorization: ${config.persistAuthorization},
        displayOperationId: ${config.displayOperationId},
        displayRequestDuration: ${config.displayRequestDuration},
        tryItOutEnabled: ${config.tryItOutEnabled},
        spec: ${openapiJson}
      });
      window.ui = ui;
    }
  </script>
</body>
</html>
  `.trim();
}

/**
 * Generate Swagger UI configuration JSON
 */
export function generateSwaggerConfigJson(): string {
  return JSON.stringify(getSwaggerConfig(), null, 2);
}

/**
 * Add custom CSS to Swagger UI
 */
export function addCustomCss(css: string): string {
  return `
<style>
  ${css}
</style>
  `.trim();
}

/**
 * Add custom JavaScript to Swagger UI
 */
export function addCustomJs(js: string): string {
  return `
<script>
  ${js}
</script>
  `.trim();
}

/**
 * Create custom Swagger UI theme
 */
export function createCustomTheme(colors: {
  primary?: string;
  secondary?: string;
  background?: string;
  text?: string;
}): string {
  const {
    primary = '#3b82f6',
    secondary = '#64748b',
    background = '#ffffff',
    text = '#1e293b',
  } = colors;

  return `
<style>
  .swagger-ui .topbar {
    background-color: ${primary};
  }
  .swagger-ui .info {
    margin: 20px 0;
  }
  .swagger-ui .info .title {
    color: ${text};
  }
  .swagger-ui .opblock {
    border-color: ${secondary};
  }
  .swagger-ui .opblock .opblock-summary {
    border-color: ${secondary};
  }
  .swagger-ui .opblock .opblock-summary-description {
    color: ${text};
  }
  .swagger-ui .opblock-tag {
    background-color: ${background};
    border-color: ${secondary};
  }
  .swagger-ui .opblock-tag:hover {
    background-color: ${primary};
    color: white;
  }
  .swagger-ui .opblock-tag .nostyle {
    color: ${text};
  }
  .swagger-ui .scheme-container {
    background-color: ${background};
  }
  .swagger-ui .loading-container {
    color: ${primary};
  }
</style>
  `.trim();
}

/**
 * Validate Swagger configuration
 */
export function validateSwaggerConfig(config: SwaggerUiConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.url) {
    errors.push('Swagger UI URL is required');
  }

  if (config.defaultModelsExpandDepth !== undefined && config.defaultModelsExpandDepth < 0) {
    errors.push('defaultModelsExpandDepth must be non-negative');
  }

  if (config.defaultModelExpandDepth !== undefined && config.defaultModelExpandDepth < 0) {
    errors.push('defaultModelExpandDepth must be non-negative');
  }

  if (config.maxDisplayedTags !== undefined && config.maxDisplayedTags < 0) {
    errors.push('maxDisplayedTags must be non-negative');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get Swagger UI bundle URL
 */
export function getSwaggerBundleUrl(): string {
  return 'https://unpkg.com/swagger-ui-dist@4/swagger-ui-bundle.js';
}

/**
 * Get Swagger UI standalone preset URL
 */
export function getSwaggerStandalonePresetUrl(): string {
  return 'https://unpkg.com/swagger-ui-dist@4/swagger-ui-standalone-preset.js';
}

/**
 * Get Swagger UI CSS URL
 */
export function getSwaggerCssUrl(): string {
  return 'https://unpkg.com/swagger-ui-dist@4/swagger-ui.css';
}

/**
 * Generate embedded Swagger UI
 */
export function generateEmbeddedSwaggerUi(): string {
  return `
<div id="swagger-ui"></div>
<script src="${getSwaggerBundleUrl()}"></script>
<script src="${getSwaggerStandalonePresetUrl()}"></script>
<script>
  SwaggerUIBundle({
    url: "/api/openapi.json",
    dom_id: "#swagger-ui",
    presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
    layout: "BaseLayout",
    deepLinking: true,
    tryItOutEnabled: true,
  });
</script>
  `.trim();
}

/**
 * Generate Swagger UI with custom authentication
 */
export function generateSwaggerUiWithAuth(authConfig: {
  apiKey: string;
  apiKeyName: string;
  type: 'apiKey' | 'bearer';
}): string {
  const { apiKey, apiKeyName, type } = authConfig;

  return `
<script>
  window.onload = function() {
    const ui = SwaggerUIBundle({
      url: "/api/openapi.json",
      dom_id: "#swagger-ui",
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
      layout: "BaseLayout",
      deepLinking: true,
      persistAuthorization: true,
      requestInterceptor: (request) => {
        request.headers['${apiKeyName}'] = '${apiKey}';
        return request;
      },
    });
    window.ui = ui;
  }
</script>
  `.trim();
}

/**
 * Export Swagger specification as JSON
 */
export function exportSwaggerJson(): string {
  return generateOpenApiJson();
}

/**
 * Export Swagger specification as YAML
 */
export function exportSwaggerYaml(): string {
  return generateOpenApiYaml();
}

/**
 * Get API documentation endpoint
 */
export function getApiDocsEndpoint(): string {
  return '/api/docs';
}

/**
 * Get OpenAPI JSON endpoint
 */
export function getOpenApiJsonEndpoint(): string {
  return '/api/openapi.json';
}

/**
 * Get OpenAPI YAML endpoint
 */
export function getOpenApiYamlEndpoint(): string {
  return '/api/openapi.yaml';
}
