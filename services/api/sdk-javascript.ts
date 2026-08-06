import { logger } from '../shared/logger';
import { getOpenApiDocument } from './openapi';

// ============================================================================
// JavaScript SDK
// JavaScript SDK generation and utilities
// ============================================================================

/**
 * JavaScript SDK Configuration
 */
export interface JavaScriptSdkConfig {
  packageName: string;
  packageVersion: string;
  baseUrl: string;
  apiKey?: string;
  includeTypes?: boolean;
  includeExamples?: boolean;
  useAxios?: boolean;
  target?: 'es5' | 'es6' | 'es2015' | 'es2017' | 'es2020';
}

/**
 * Generate JavaScript SDK
 */
export async function generateJavaScriptSdk(config: JavaScriptSdkConfig): Promise<string> {
  const openApiDoc = getOpenApiDocument();

  try {
    const sdkCode = generateSdkCode(config, openApiDoc);
    logger.info('JavaScript SDK generated', { packageName: config.packageName });
    return sdkCode;
  } catch (error) {
    logger.error('JavaScript SDK generation failed', { error });
    throw error;
  }
}

/**
 * Generate SDK code
 */
function generateSdkCode(config: JavaScriptSdkConfig, openApiDoc: unknown): string {
  const className = config.packageName.replace(/[^a-zA-Z0-9]/g, '');
  const capitalizedClassName = className.replace(/\b\w/g, (l) => l.toUpperCase());

  let code = `
/**
 * ${config.packageName} JavaScript SDK
 * Version: ${config.packageVersion}
 * Generated SDK for ${config.baseUrl}
 */

${config.useAxios ? generateAxiosImports() : generateFetchImports()}

/**
 * ${capitalizedClassName} Client
 */
class ${capitalizedClassName}Client {
  constructor(apiKey, baseUrl = '${config.baseUrl}') {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Get default headers
   */
  getHeaders() {
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
  async request(method, path, body) {
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
  handleError(error) {
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
  async get(endpoint) {
    return this.request('GET', endpoint);
  }

  /**
   * POST request
   */
  async post(endpoint, data) {
    return this.request('POST', endpoint, data);
  }

  /**
   * PUT request
   */
  async put(endpoint, data) {
    return this.request('PUT', endpoint, data);
  }

  /**
   * PATCH request
   */
  async patch(endpoint, data) {
    return this.request('PATCH', endpoint, data);
  }

  /**
   * DELETE request
   */
  async delete(endpoint) {
    return this.request('DELETE', endpoint);
  }

  /**
   * Set API key
   */
  setApiKey(apiKey) {
    this.apiKey = apiKey;
  }

  /**
   * Set base URL
   */
  setBaseUrl(baseUrl) {
    this.baseUrl = baseUrl;
  }
}

/**
 * Create default client instance
 */
const client = new ${capitalizedClassName}Client();

/**
 * Export for Node.js
 */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { client, ${capitalizedClassName}Client };
}

/**
 * Export for browsers
 */
if (typeof window !== 'undefined') {
  window.${capitalizedClassName}Client = ${capitalizedClassName}Client;
  window.${className}Client = client;
}
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
const axios = require('axios');
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
      const config = {
        method,
        url,
        headers,
        data: body,
      };

      const response = await axios(config);

      return {
        data: response.data,
        status: response.status,
      };
`;
}

/**
 * Validate JavaScript SDK configuration
 */
export function validateJavaScriptSdkConfig(config: JavaScriptSdkConfig): {
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
 * Generate package.json for JavaScript SDK
 */
export function generatePackageJson(config: JavaScriptSdkConfig): string {
  const packageName = config.packageName.toLowerCase().replace(/[^a-z0-9]/g, '-');

  return JSON.stringify(
    {
      name: packageName,
      version: config.packageVersion,
      description: `JavaScript SDK for ${config.baseUrl}`,
      main: 'dist/index.js',
      scripts: {
        build: 'webpack --mode production',
        test: 'jest',
        lint: 'eslint src/**/*.js',
      },
      keywords: ['sdk', 'api', 'javascript'],
      author: '',
      license: 'MIT',
      devDependencies: {
        webpack: '^5.0.0',
        'webpack-cli': '^5.0.0',
        eslint: '^8.0.0',
        jest: '^29.0.0',
      },
      dependencies: config.useAxios ? { axios: '^1.6.0' } : {},
    },
    null,
    2
  );
}

/**
 * Generate webpack.config.js for JavaScript SDK
 */
export function generateWebpackConfig(config: JavaScriptSdkConfig): string {
  const packageName = config.packageName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  return `
module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'dist/index.js',
    library: '${packageName}',
    libraryTarget: 'umd',
    globalObject: 'this',
  },
  module: {
    rules: [
      {
        test: /\\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
    ],
  },
  resolve: {
    extensions: ['.js'],
  },
  target: 'node',
};
`;
}

/**
 * Generate .babelrc for JavaScript SDK
 */
export function generateBabelConfig(): string {
  return JSON.stringify(
    {
      presets: ['@babel/preset-env'],
    },
    null,
    2
  );
}

/**
 * Generate README.md for JavaScript SDK
 */
export function generateReadme(config: JavaScriptSdkConfig): string {
  return `
# ${config.packageName} JavaScript SDK

JavaScript SDK for ${config.baseUrl}

## Installation

\`\`\`bash
npm install ${config.packageName.toLowerCase().replace(/[^a-z0-9]/g, '-')}
\`\`\`

## Usage

### Node.js

\`\`\`javascript
const { client } = require('${config.packageName.toLowerCase().replace(/[^a-z0-9]/g, '-')}');

// Initialize with API key
const apiClient = new ${config.packageName.replace(/[^a-zA-Z0-9]/g, '').replace(/\b\w/g, (l) => l.toUpperCase())}Client('your-api-key');

// Make requests
const result = await apiClient.get('/endpoint');
\`\`\`

### Browser

\`\`\`html
<script src="node_modules/${config.packageName.toLowerCase().replace(/[^a-z0-9]/g, '-')}/dist/index.js"></script>
<script>
  const apiClient = new ${config.packageName.replace(/[^a-zA-Z0-9]/g, '').replace(/\b\w/g, (l) => l.toUpperCase())}Client('your-api-key');
  
  apiClient.get('/endpoint').then(result => {
    console.log(result);
  });
</script>
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

/**
 * Generate UMD build for browser compatibility
 */
export function generateUmdBuild(config: JavaScriptSdkConfig): string {
  const className = config.packageName.replace(/[^a-zA-Z0-9]/g, '');
  const capitalizedClassName = className.replace(/\b\w/g, (l) => l.toUpperCase());
  const sdkCode = generateSdkCode(config, null);

  return `
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.${capitalizedClassName}Client = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  ${sdkCode.replace(/export /g, '').replace(/import /g, 'const ')}
  return ${capitalizedClassName}Client;
}));
`;
}
