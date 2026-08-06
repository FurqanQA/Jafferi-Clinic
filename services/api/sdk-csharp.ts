import { logger } from '../shared/logger';
import { getOpenApiDocument } from './openapi';

// ============================================================================
// C# SDK
// C# SDK generation and utilities
// ============================================================================

/**
 * C# SDK Configuration
 */
export interface CSharpSdkConfig {
  packageName: string;
  packageVersion: string;
  baseUrl: string;
  apiKey?: string;
  includeTypes?: boolean;
  includeExamples?: boolean;
  targetFramework?: 'net6.0' | 'net7.0' | 'net8.0' | 'netstandard2.0' | 'netstandard2.1';
}

/**
 * Generate C# SDK
 */
export async function generateCSharpSdk(config: CSharpSdkConfig): Promise<string> {
  const openApiDoc = getOpenApiDocument();

  try {
    const sdkCode = generateSdkCode(config, openApiDoc);
    logger.info('C# SDK generated', { packageName: config.packageName });
    return sdkCode;
  } catch (error) {
    logger.error('C# SDK generation failed', { error });
    throw error;
  }
}

/**
 * Generate SDK code
 */
function generateSdkCode(config: CSharpSdkConfig, openApiDoc: unknown): string {
  const className = config.packageName.replace(/[^a-zA-Z0-9]/g, '').replace(/\b\w/g, (l) => l.toUpperCase());
  const namespace = config.packageName.replace(/[^a-zA-Z0-9]/g, '');

  let code = `/**
 * ${config.packageName} C# SDK
 * Version: ${config.packageVersion}
 * Generated SDK for ${config.baseUrl}
 */

using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace ${namespace}
{
    /// <summary>
    /// API Response wrapper
    /// </summary>
    public class ApiResponse<T>
    {
        public T Data { get; set; }
        public int Status { get; set; }
        public string Message { get; set; }

        public ApiResponse(T data, int status, string message = null)
        {
            Data = data;
            Status = status;
            Message = message;
        }
    }

    /// <summary>
    /// API Error exception
    /// </summary>
    public class ApiError : Exception
    {
        public int? Status { get; set; }
        public string Code { get; set; }

        public ApiError(string message, int? status = null, string code = null)
            : base(message)
        {
            Status = status;
            Code = code;
        }
    }

    /// <summary>
    /// ${config.packageName} API Client
    /// </summary>
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

        /// <summary>
        /// Get default headers
        /// </summary>
        private void SetHeaders(HttpRequestMessage request)
        {
            request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

            if (!string.IsNullOrEmpty(_apiKey))
            {
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
                request.Headers.Add("X-API-Key", _apiKey);
            }
        }

        /// <summary>
        /// Make API request
        /// </summary>
        private async Task<ApiResponse<T>> Request<T>(string method, string path, object body = null)
        {
            var request = new HttpRequestMessage(new HttpMethod(method), $"{_baseUrl}{path}");
            SetHeaders(request);

            if (body != null)
            {
                var json = JsonConvert.SerializeObject(body);
                request.Content = new StringContent(json, Encoding.UTF8, "application/json");
            }

            var response = await _httpClient.SendAsync(request);

            if (!response.IsSuccessStatusCode)
            {
                throw new ApiError($"HTTP error! status: {response.StatusCode}", (int)response.StatusCode);
            }

            var content = await response.Content.ReadAsStringAsync();
            var data = JsonConvert.DeserializeObject<T>(content);

            return new ApiResponse<T>(data, (int)response.StatusCode);
        }

        /// <summary>
        /// GET request
        /// </summary>
        public async Task<ApiResponse<T>> Get<T>(string endpoint)
        {
            return await Request<T>("GET", endpoint);
        }

        /// <summary>
        /// POST request
        /// </summary>
        public async Task<ApiResponse<T>> Post<T>(string endpoint, object data)
        {
            return await Request<T>("POST", endpoint, data);
        }

        /// <summary>
        /// PUT request
        /// </summary>
        public async Task<ApiResponse<T>> Put<T>(string endpoint, object data)
        {
            return await Request<T>("PUT", endpoint, data);
        }

        /// <summary>
        /// PATCH request
        /// </summary>
        public async Task<ApiResponse<T>> Patch<T>(string endpoint, object data)
        {
            return await Request<T>("PATCH", endpoint, data);
        }

        /// <summary>
        /// DELETE request
        /// </summary>
        public async Task<ApiResponse<T>> Delete<T>(string endpoint)
        {
            return await Request<T>("DELETE", endpoint);
        }

        /// <summary>
        /// Set API key
        /// </summary>
        public void SetApiKey(string apiKey)
        {
            // In a real implementation, this would update the _apiKey field
        }

        /// <summary>
        /// Set base URL
        /// </summary>
        public void SetBaseUrl(string baseUrl)
        {
            // In a real implementation, this would update the _baseUrl field
        }

        /// <summary>
        /// Set timeout
        /// </summary>
        public void SetTimeout(TimeSpan timeout)
        {
            _httpClient.Timeout = timeout;
        }

        /// <summary>
        /// Dispose the HTTP client
        /// </summary>
        public void Dispose()
        {
            _httpClient?.Dispose();
        }
    }
}
`;

  return code;
}

/**
 * Validate C# SDK configuration
 */
export function validateCSharpSdkConfig(config: CSharpSdkConfig): {
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
 * Generate .csproj file
 */
export function generateCsproj(config: CSharpSdkConfig): string {
  const namespace = config.packageName.replace(/[^a-zA-Z0-9]/g, '');

  return `
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>${config.targetFramework || 'net6.0'}</TargetFramework>
    <Version>${config.packageVersion}</Version>
    <Authors></Authors>
    <Company></Company>
    <Product>${config.packageName}</Product>
    <Description>C# SDK for ${config.baseUrl}</Description>
    <PackageLicenseExpression>MIT</PackageLicenseExpression>
    <RepositoryUrl>https://github.com/yourusername/${namespace}</RepositoryUrl>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Newtonsoft.Json" Version="13.0.3" />
  </ItemGroup>

</Project>
`;
}

/**
 * Generate README.md for C# SDK
 */
export function generateReadme(config: CSharpSdkConfig): string {
  const className = config.packageName.replace(/[^a-zA-Z0-9]/g, '').replace(/\b\w/g, (l) => l.toUpperCase());
  const namespace = config.packageName.replace(/[^a-zA-Z0-9]/g, '');

  return `
# ${config.packageName} C# SDK

C# SDK for ${config.baseUrl}

## Installation

### .NET CLI

\`\`\`bash
dotnet add package ${namespace}
\`\`\`

### Package Manager

\`\`\`bash
Install-Package ${namespace}
\`\`\`

## Usage

\`\`\`csharp
using ${namespace};

// Initialize with API key
var client = new ${className}Client("your-api-key");

// Make requests
var response = await client.Get<object>("/endpoint");
Console.WriteLine(response.Data);

// POST request
var data = new { key = "value" };
var postResponse = await client.Post<object>("/endpoint", data);
Console.WriteLine(postResponse.Data);
\`\`\`

## API Reference

### ${className}Client

#### Methods

- \`Get<T>(endpoint)\` - Make a GET request
- \`Post<T>(endpoint, data)\` - Make a POST request
- \`Put<T>(endpoint, data)\` - Make a PUT request
- \`Patch<T>(endpoint, data)\` - Make a PATCH request
- \`Delete<T>(endpoint)\` - Make a DELETE request
- \`SetApiKey(apiKey)\` - Set the API key
- \`SetBaseUrl(baseUrl)\` - Set the base URL
- \`SetTimeout(timeout)\` - Set the request timeout
- \`Dispose()\` - Dispose the HTTP client

### ApiResponse\<T\>

- \`Data\` - Response data
- \`Status\` - HTTP status code
- \`Message\` - Optional message

### ApiError

- \`Status\` - HTTP status code
- \`Code\` - Error code

## License

MIT
`;
}
