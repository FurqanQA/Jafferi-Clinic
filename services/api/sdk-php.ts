import { logger } from '../shared/logger';
import { getOpenApiDocument } from './openapi';

// ============================================================================
// PHP SDK
// PHP SDK generation and utilities
// ============================================================================

/**
 * PHP SDK Configuration
 */
export interface PhpSdkConfig {
  packageName: string;
  packageVersion: string;
  baseUrl: string;
  apiKey?: string;
  includeTypes?: boolean;
  includeExamples?: boolean;
  phpVersion?: '7.4' | '8.0' | '8.1' | '8.2' | '8.3';
}

/**
 * Generate PHP SDK
 */
export async function generatePhpSdk(config: PhpSdkConfig): Promise<string> {
  const openApiDoc = getOpenApiDocument();

  try {
    const sdkCode = generateSdkCode(config, openApiDoc);
    logger.info('PHP SDK generated', { packageName: config.packageName });
    return sdkCode;
  } catch (error) {
    logger.error('PHP SDK generation failed', { error });
    throw error;
  }
}

/**
 * Generate SDK code
 */
function generateSdkCode(config: PhpSdkConfig, openApiDoc: unknown): string {
  const className = config.packageName.replace(/[^a-zA-Z0-9]/g, '').replace(/\b\w/g, (l) => l.toUpperCase());

  let code = `
<?php
/**
 * ${config.packageName} PHP SDK
 * Version: ${config.packageVersion}
 * Generated SDK for ${config.baseUrl}
 */

class ${className}Client {
    private $baseUrl;
    private $apiKey;
    private $timeout;

    public function __construct($apiKey = null, $baseUrl = '${config.baseUrl}') {
        $this->baseUrl = $baseUrl;
        $this->apiKey = $apiKey;
        $this->timeout = 30;
    }

    /**
     * Get default headers
     */
    private function getHeaders() {
        $headers = [
            'Content-Type: application/json',
        ];

        if ($this->apiKey) {
            $headers[] = 'Authorization: Bearer ' . $this->apiKey;
            $headers[] = 'X-API-Key: ' . $this->apiKey;
        }

        return $headers;
    }

    /**
     * Make API request
     */
    private function request($method, $path, $body = null) {
        $url = $this->baseUrl . $path;
        $headers = $this->getHeaders();

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_TIMEOUT, $this->timeout);

        if ($body) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
        }

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) {
            throw new Exception("HTTP error! status: $httpCode");
        }

        return json_decode($response, true);
    }

    /**
     * GET request
     */
    public function get($endpoint) {
        return $this->request('GET', $endpoint);
    }

    /**
     * POST request
     */
    public function post($endpoint, $data) {
        return $this->request('POST', $endpoint, $data);
    }

    /**
     * PUT request
     */
    public function put($endpoint, $data) {
        return $this->request('PUT', $endpoint, $data);
    }

    /**
     * PATCH request
     */
    public function patch($endpoint, $data) {
        return $this->request('PATCH', $endpoint, $data);
    }

    /**
     * DELETE request
     */
    public function delete($endpoint) {
        return $this->request('DELETE', $endpoint);
    }

    /**
     * Set API key
     */
    public function setApiKey($apiKey) {
        $this->apiKey = $apiKey;
    }

    /**
     * Set base URL
     */
    public function setBaseUrl($baseUrl) {
        $this->baseUrl = $baseUrl;
    }

    /**
     * Set timeout
     */
    public function setTimeout($timeout) {
        $this->timeout = $timeout;
    }
}

// Create a default client instance
$client = new ${className}Client();
`;

  return code;
}

/**
 * Validate PHP SDK configuration
 */
export function validatePhpSdkConfig(config: PhpSdkConfig): {
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
 * Generate composer.json for PHP SDK
 */
export function generateComposerJson(config: PhpSdkConfig): string {
  const packageName = config.packageName.toLowerCase().replace(/[^a-z0-9]/g, '/');

  const composerData: Record<string, unknown> = {
    name: packageName,
    description: `PHP SDK for ${config.baseUrl}`,
    type: 'library',
    version: config.packageVersion,
    license: 'MIT',
    authors: [],
    require: {
      php: '^7.4 || ^8.0',
      'ext-curl': '*',
      'ext-json': '*',
    },
    autoload: {
      'psr-4': {},
    },
  };

  const namespace = packageName.replace(/\//g, '\\\\') + '\\\\';
  (composerData.autoload as Record<string, unknown>)['psr-4'] = {
    [namespace]: 'src/',
  };

  return JSON.stringify(composerData, null, 2);
}

/**
 * Generate README.md for PHP SDK
 */
export function generateReadme(config: PhpSdkConfig): string {
  const className = config.packageName.replace(/[^a-zA-Z0-9]/g, '').replace(/\b\w/g, (l) => l.toUpperCase());
  const packageName = config.packageName.toLowerCase().replace(/[^a-z0-9]/g, '/');

  return `
# ${config.packageName} PHP SDK

PHP SDK for ${config.baseUrl}

## Installation

\`\`\`bash
composer require ${packageName}
\`\`\`

## Usage

\`\`\`php
require 'vendor/autoload.php';

use ${packageName.replace(/\//g, '\\')}\\${className}Client;

// Initialize with API key
$client = new ${className}Client('your-api-key');

// Make requests
$result = $client->get('/endpoint');
print_r($result);

// POST request
$data = ['key' => 'value'];
$result = $client->post('/endpoint', $data);
print_r($result);
\`\`\`

## API Reference

### ${className}Client

#### Methods

- \`get(endpoint)\` - Make a GET request
- \`post(endpoint, data)\` - Make a POST request
- \`put(endpoint, data)\` - Make a PUT request
- \`patch(endpoint, data)\` - Make a PATCH request
- \`delete(endpoint)\` - Make a DELETE request
- \`setApiKey(apiKey)\` - Set the API key
- \`setBaseUrl(baseUrl)\` - Set the base URL
- \`setTimeout(timeout)\` - Set the request timeout

## License

MIT
`;
}
