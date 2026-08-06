import { logger } from '../shared/logger';
import { getOpenApiDocument } from './openapi';

// ============================================================================
// SDK Generator
// SDK code generation for multiple programming languages
// ============================================================================

/**
 * SDK Language
 */
export enum SdkLanguage {
  TYPESCRIPT = 'typescript',
  JAVASCRIPT = 'javascript',
  PYTHON = 'python',
  JAVA = 'java',
  CSHARP = 'csharp',
  PHP = 'php',
}

/**
 * SDK Configuration
 */
export interface SdkConfig {
  language: SdkLanguage;
  packageName: string;
  packageVersion: string;
  baseUrl: string;
  apiKey?: string;
  includeTypes?: boolean;
  includeExamples?: boolean;
}

/**
 * SDK Generator Options
 */
export interface SdkGeneratorOptions {
  config: SdkConfig;
  outputPath?: string;
}

/**
 * Generate SDK
 */
export async function generateSdk(options: SdkGeneratorOptions): Promise<string> {
  const { config, outputPath } = options;
  const openApiDoc = getOpenApiDocument();

  try {
    let sdkCode = '';

    switch (config.language) {
      case SdkLanguage.TYPESCRIPT:
        sdkCode = generateTypeScriptSdk(config, openApiDoc);
        break;
      case SdkLanguage.JAVASCRIPT:
        sdkCode = generateJavaScriptSdk(config, openApiDoc);
        break;
      case SdkLanguage.PYTHON:
        sdkCode = generatePythonSdk(config, openApiDoc);
        break;
      case SdkLanguage.JAVA:
        sdkCode = generateJavaSdk(config, openApiDoc);
        break;
      case SdkLanguage.CSHARP:
        sdkCode = generateCSharpSdk(config, openApiDoc);
        break;
      case SdkLanguage.PHP:
        sdkCode = generatePhpSdk(config, openApiDoc);
        break;
      default:
        throw new Error(`Unsupported SDK language: ${config.language}`);
    }

    logger.info('SDK generated', { language: config.language, packageName: config.packageName });

    return sdkCode;
  } catch (error) {
    logger.error('SDK generation failed', { error, language: config.language });
    throw error;
  }
}

/**
 * Generate TypeScript SDK
 */
function generateTypeScriptSdk(config: SdkConfig, openApiDoc: unknown): string {
  return `
/**
 * ${config.packageName} SDK
 * Version: ${config.packageVersion}
 * Generated SDK for ${config.baseUrl}
 */

export class ${config.packageName.replace(/[^a-zA-Z0-9]/g, '')}Client {
  private baseUrl: string;
  private apiKey?: string;

  constructor(apiKey?: string, baseUrl: string = '${config.baseUrl}') {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['Authorization'] = \`Bearer \${this.apiKey}\`;
      headers['X-API-Key'] = this.apiKey;
    }

    const response = await fetch(\`\${this.baseUrl}\${path}\`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }

    return response.json() as Promise<T>;
  }

  // Add API methods here based on OpenAPI specification
  async get(endpoint: string): Promise<unknown> {
    return this.request('GET', endpoint);
  }

  async post(endpoint: string, data: unknown): Promise<unknown> {
    return this.request('POST', endpoint, data);
  }

  async put(endpoint: string, data: unknown): Promise<unknown> {
    return this.request('PUT', endpoint, data);
  }

  async delete(endpoint: string): Promise<unknown> {
    return this.request('DELETE', endpoint);
  }
}

export const client = new ${config.packageName.replace(/[^a-zA-Z0-9]/g, '')}Client();
  `.trim();
}

/**
 * Generate JavaScript SDK
 */
function generateJavaScriptSdk(config: SdkConfig, openApiDoc: unknown): string {
  return `
/**
 * ${config.packageName} SDK
 * Version: ${config.packageVersion}
 * Generated SDK for ${config.baseUrl}
 */

class ${config.packageName.replace(/[^a-zA-Z0-9]/g, '')}Client {
  constructor(apiKey, baseUrl = '${config.baseUrl}') {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  async request(method, path, body) {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['Authorization'] = \`Bearer \${this.apiKey}\`;
      headers['X-API-Key'] = this.apiKey;
    }

    const response = await fetch(\`\${this.baseUrl}\${path}\`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }

    return response.json();
  }

  async get(endpoint) {
    return this.request('GET', endpoint);
  }

  async post(endpoint, data) {
    return this.request('POST', endpoint, data);
  }

  async put(endpoint, data) {
    return this.request('PUT', endpoint, data);
  }

  async delete(endpoint) {
    return this.request('DELETE', endpoint);
  }
}

const client = new ${config.packageName.replace(/[^a-zA-Z0-9]/g, '')}Client();

module.exports = { client, ${config.packageName.replace(/[^a-zA-Z0-9]/g, '')}Client };
  `.trim();
}

/**
 * Generate Python SDK
 */
function generatePythonSdk(config: SdkConfig, openApiDoc: unknown): string {
  const className = config.packageName.replace(/[^a-zA-Z0-9]/g, '').replace(/\b\w/g, (l) => l.toUpperCase());
  return `
"""
${config.packageName} SDK
Version: ${config.packageVersion}
Generated SDK for ${config.baseUrl}
"""

import requests
import json
from typing import Dict, Any, Optional

class ${className}Client:
    def __init__(self, api_key: Optional[str] = None, base_url: str = '${config.baseUrl}'):
        self.base_url = base_url
        self.api_key = api_key

    def _request(self, method: str, path: str, body: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        headers = {
            'Content-Type': 'application/json',
        }

        if self.api_key:
            headers['Authorization'] = f'Bearer {self.api_key}'
            headers['X-API-Key'] = self.api_key

        url = f'{self.base_url}{path}'
        response = requests.request(method, url, headers=headers, json=body if body else None)

        if not response.ok:
            raise Exception(f'HTTP error! status: {response.status}')

        return response.json()

    def get(self, endpoint: str) -> Dict[str, Any]:
        return self._request('GET', endpoint)

    def post(self, endpoint: str, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._request('POST', endpoint, data)

    def put(self, endpoint: str, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._request('PUT', endpoint, data)

    def delete(self, endpoint: str) -> Dict[str, Any]:
        return self._request('DELETE', endpoint)

# Create a default client instance
client = ${className}Client()
  `.trim();
}

/**
 * Generate Java SDK
 */
function generateJavaSdk(config: SdkConfig, openApiDoc: unknown): string {
  const className = config.packageName.replace(/[^a-zA-Z0-9]/g, '').replace(/\b\w/g, (l) => l.toUpperCase());
  return `
/**
 * ${config.packageName} SDK
 * Version: ${config.packageVersion}
 * Generated SDK for ${config.baseUrl}
 */

package ${config.packageName.toLowerCase().replace(/[^a-z0-9]/g, '.')};

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import com.fasterxml.jackson.databind.ObjectMapper;

public class ${className}Client {
    private final String baseUrl;
    private final String apiKey;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public ${className}Client(String apiKey, String baseUrl) {
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
        this.httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(30))
            .build();
        this.objectMapper = new ObjectMapper();
    }

    private HttpRequest.Builder createRequestBuilder(String path) {
        HttpRequest.Builder builder = HttpRequest.newBuilder()
            .uri(URI.create(baseUrl + path))
            .header("Content-Type", "application/json");

        if (apiKey != null && !apiKey.isEmpty()) {
            builder.header("Authorization", "Bearer " + apiKey);
            builder.header("X-API-Key", apiKey);
        }

        return builder;
    }

    public String get(String endpoint) throws IOException, InterruptedException {
        HttpRequest request = createRequestBuilder(endpoint)
            .GET()
            .build();

        HttpResponse<String> response = httpClient.send(
            request,
            HttpResponse.BodyHandlers.ofString()
        );

        if (response.statusCode() != 200) {
            throw new RuntimeException("HTTP error! status: " + response.statusCode());
        }

        return response.body();
    }

    public String post(String endpoint, String body) throws IOException, InterruptedException {
        HttpRequest request = createRequestBuilder(endpoint)
            .POST(HttpRequest.BodyPublishers.ofString(body))
            .build();

        HttpResponse<String> response = httpClient.send(
            request,
            HttpResponse.BodyHandlers.ofString()
        );

        if (response.statusCode() != 200) {
            throw new RuntimeException("HTTP error! status: " + response.statusCode());
        }

        return response.body();
    }

    public String put(String endpoint, String body) throws IOException, InterruptedException {
        HttpRequest request = createRequestBuilder(endpoint)
            .PUT(HttpRequest.BodyPublishers.ofString(body))
            .build();

        HttpResponse<String> response = httpClient.send(
            request,
            HttpResponse.BodyHandlers.ofString()
        );

        if (response.statusCode() != 200) {
            throw new RuntimeException("HTTP error! status: " + response.statusCode());
        }

        return response.body();
    }

    public String delete(String endpoint) throws IOException, InterruptedException {
        HttpRequest request = createRequestBuilder(endpoint)
            .DELETE()
            .build();

        HttpResponse<String> response = httpClient.send(
            request,
            HttpResponse.BodyHandlers.ofString()
        );

        if (response.statusCode() != 200) {
            throw new RuntimeException("HTTP error! status: " + response.statusCode());
        }

        return response.body();
    }
}
  `.trim();
}

/**
 * Generate C# SDK
 */
function generateCSharpSdk(config: SdkConfig, openApiDoc: unknown): string {
  const className = config.packageName.replace(/[^a-zA-Z0-9]/g, '').replace(/\b\w/g, (l) => l.toUpperCase());
  return `
/**
 * ${config.packageName} SDK
 * Version: ${config.packageVersion}
 * Generated SDK for ${config.baseUrl}
 */

using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;

namespace ${config.packageName}
{
    public class ${className}Client
    {
        private readonly HttpClient _httpClient;
        private readonly string _baseUrl;
        private readonly string _apiKey;

        public ${className}Client(string apiKey = null, string baseUrl = "${config.baseUrl}")
        {
            _baseUrl = baseUrl;
            _apiKey = apiKey;
            _httpClient = new HttpClient();
            _httpClient.Timeout = TimeSpan.FromSeconds(30);
        }

        private void SetHeaders(HttpRequestMessage request)
        {
            request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

            if (!string.IsNullOrEmpty(_apiKey))
            {
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
                request.Headers.Add("X-API-Key", _apiKey);
            }
        }

        public async Task<string> GetAsync(string endpoint)
        {
            var request = new HttpRequestMessage(HttpMethod.Get, $"{_baseUrl}{endpoint}");
            SetHeaders(request);

            var response = await _httpClient.SendAsync(request);

            if (!response.IsSuccessStatusCode)
            {
                throw new Exception($"HTTP error! status: {response.StatusCode}");
            }

            return await response.Content.ReadAsStringAsync();
        }

        public async Task<string> PostAsync(string endpoint, object data)
        {
            var request = new HttpRequestMessage(HttpMethod.Post, $"{_baseUrl}{endpoint}");
            SetHeaders(request);

            var json = JsonConvert.SerializeObject(data);
            request.Content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(request);

            if (!response.IsSuccessStatusCode)
            {
                throw new Exception($"HTTP error! status: {response.StatusCode}");
            }

            return await response.Content.ReadAsStringAsync();
        }

        public async Task<string> PutAsync(string endpoint, object data)
        {
            var request = new HttpRequestMessage(HttpMethod.Put, $"{_baseUrl}{endpoint}");
            SetHeaders(request);

            var json = JsonConvert.SerializeObject(data);
            request.Content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(request);

            if (!response.IsSuccessStatusCode)
            {
                throw new Exception($"HTTP error! status: {response.StatusCode}");
            }

            return await response.Content.ReadAsStringAsync();
        }

        public async Task<string> DeleteAsync(string endpoint)
        {
            var request = new HttpRequestMessage(HttpMethod.Delete, $"{_baseUrl}{endpoint}");
            SetHeaders(request);

            var response = await _httpClient.SendAsync(request);

            if (!response.IsSuccessStatusCode)
            {
                throw new Exception($"HTTP error! status: {response.StatusCode}");
            }

            return await response.Content.ReadAsStringAsync();
        }
    }
}
  `.trim();
}

/**
 * Generate PHP SDK
 */
function generatePhpSdk(config: SdkConfig, openApiDoc: unknown): string {
  const className = config.packageName.replace(/[^a-zA-Z0-9]/g, '').replace(/\b\w/g, (l) => l.toUpperCase());
  return `
<?php
/**
 * ${config.packageName} SDK
 * Version: ${config.packageVersion}
 * Generated SDK for ${config.baseUrl}
 */

class ${className}Client {
    private $baseUrl;
    private $apiKey;

    public function __construct($apiKey = null, $baseUrl = '${config.baseUrl}') {
        $this->baseUrl = $baseUrl;
        $this->apiKey = $apiKey;
    }

    private function request($method, $path, $body = null) {
        $headers = [
            'Content-Type: application/json',
        ];

        if ($this->apiKey) {
            $headers[] = 'Authorization: Bearer ' . $this->apiKey;
            $headers[] = 'X-API-Key: ' . $this->apiKey;
        }

        $url = $this->baseUrl . $path;

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

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

    public function get($endpoint) {
        return $this->request('GET', $endpoint);
    }

    public function post($endpoint, $data) {
        return $this->request('POST', $endpoint, $data);
    }

    public function put($endpoint, $data) {
        return $this->request('PUT', $endpoint, $data);
    }

    public function delete($endpoint) {
        return $this->request('DELETE', $endpoint);
    }
}

// Create a default client instance
$client = new ${className}Client();
  `.trim();
}

/**
 * Validate SDK configuration
 */
export function validateSdkConfig(config: SdkConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.language) {
    errors.push('SDK language is required');
  }

  if (!config.packageName) {
    errors.push('Package name is required');
  }

  if (!config.packageVersion) {
    errors.push('Package version is required');
  }

  if (!config.baseUrl) {
    errors.push('Base URL is required');
  }

  const validLanguages = Object.values(SdkLanguage);
  if (config.language && !validLanguages.includes(config.language)) {
    errors.push(`Invalid SDK language: ${config.language}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get supported SDK languages
 */
export function getSupportedSdkLanguages(): SdkLanguage[] {
  return Object.values(SdkLanguage);
}

/**
 * Get SDK language display name
 */
export function getSdkLanguageName(language: SdkLanguage): string {
  const names: Record<SdkLanguage, string> = {
    [SdkLanguage.TYPESCRIPT]: 'TypeScript',
    [SdkLanguage.JAVASCRIPT]: 'JavaScript',
    [SdkLanguage.PYTHON]: 'Python',
    [SdkLanguage.JAVA]: 'Java',
    [SdkLanguage.CSHARP]: 'C#',
    [SdkLanguage.PHP]: 'PHP',
  };

  return names[language] || language;
}
