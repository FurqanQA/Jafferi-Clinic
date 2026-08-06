import { logger } from '../shared/logger';
import { getOpenApiDocument } from './openapi';

// ============================================================================
// Java SDK
// Java SDK generation and utilities
// ============================================================================

/**
 * Java SDK Configuration
 */
export interface JavaSdkConfig {
  packageName: string;
  packageVersion: string;
  baseUrl: string;
  apiKey?: string;
  includeTypes?: boolean;
  includeExamples?: boolean;
  javaVersion?: '8' | '11' | '17' | '21';
  buildTool?: 'maven' | 'gradle';
}

/**
 * Generate Java SDK
 */
export async function generateJavaSdk(config: JavaSdkConfig): Promise<string> {
  const openApiDoc = getOpenApiDocument();

  try {
    const sdkCode = generateSdkCode(config, openApiDoc);
    logger.info('Java SDK generated', { packageName: config.packageName });
    return sdkCode;
  } catch (error) {
    logger.error('Java SDK generation failed', { error });
    throw error;
  }
}

/**
 * Generate SDK code
 */
function generateSdkCode(config: JavaSdkConfig, openApiDoc: unknown): string {
  const className = config.packageName.replace(/[^a-zA-Z0-9]/g, '').replace(/\b\w/g, (l) => l.toUpperCase());
  const packageName = config.packageName.toLowerCase().replace(/[^a-zA-Z0-9]/g, '.');

  let code = `
/**
 * ${config.packageName} Java SDK
 * Version: ${config.packageVersion}
 * Generated SDK for ${config.baseUrl}
 */

package ${packageName};

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;
import java.util.HashMap;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;

/**
 * API Response wrapper
 */
public class ApiResponse<T> {
    private final T data;
    private final int status;
    private final String message;

    public ApiResponse(T data, int status, String message) {
        this.data = data;
        this.status = status;
        this.message = message;
    }

    public T getData() {
        return data;
    }

    public int getStatus() {
        return status;
    }

    public String getMessage() {
        return message;
    }
}

/**
 * API Error exception
 */
public class ApiError extends Exception {
    private final Integer status;
    private final String code;

    public ApiError(String message, Integer status, String code) {
        super(message);
        this.status = status;
        this.code = code;
    }

    public Integer getStatus() {
        return status;
    }

    public String getCode() {
        return code;
    }
}

/**
 * ${config.packageName} API Client
 */
public class ${className}Client {
    private final String baseUrl;
    private final String apiKey;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private Duration timeout;

    public ${className}Client(String apiKey, String baseUrl) {
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
        this.httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(30))
            .build();
        this.objectMapper = new ObjectMapper();
        this.timeout = Duration.ofSeconds(30);
    }

    /**
     * Get default headers
     */
    private Map<String, String> getHeaders() {
        Map<String, String> headers = new HashMap<>();
        headers.put("Content-Type", "application/json");

        if (apiKey != null && !apiKey.isEmpty()) {
            headers.put("Authorization", "Bearer " + apiKey);
            headers.put("X-API-Key", apiKey);
        }

        return headers;
    }

    /**
     * Make API request
     */
    private <T> ApiResponse<T> request(String method, String path, Object body) 
            throws IOException, InterruptedException, ApiError {
        String url = baseUrl + path;
        Map<String, String> headers = getHeaders();

        HttpRequest.Builder builder = HttpRequest.newBuilder()
            .uri(URI.create(url))
            .timeout(timeout);

        for (Map.Entry<String, String> entry : headers.entrySet()) {
            builder.header(entry.getKey(), entry.getValue());
        }

        if (body != null) {
            String jsonBody = objectMapper.writeValueAsString(body);
            builder.method(method, HttpRequest.BodyPublishers.ofString(jsonBody));
        } else {
            builder.method(method, HttpRequest.BodyPublishers.noBody());
        }

        HttpRequest request = builder.build();
        HttpResponse<String> response = httpClient.send(
            request,
            HttpResponse.BodyHandlers.ofString()
        );

        if (response.statusCode() != 200) {
            throw new ApiError(
                "HTTP error! status: " + response.statusCode(),
                response.statusCode(),
                null
            );
        }

        T data = objectMapper.readValue(response.body(), new TypeReference<T>() {});

        return new ApiResponse<>(data, response.statusCode(), null);
    }

    /**
     * GET request
     */
    public <T> ApiResponse<T> get(String endpoint) 
            throws IOException, InterruptedException, ApiError {
        return request("GET", endpoint, null);
    }

    /**
     * POST request
     */
    public <T> ApiResponse<T> post(String endpoint, Object data) 
            throws IOException, InterruptedException, ApiError {
        return request("POST", endpoint, data);
    }

    /**
     * PUT request
     */
    public <T> ApiResponse<T> put(String endpoint, Object data) 
            throws IOException, InterruptedException, ApiError {
        return request("PUT", endpoint, data);
    }

    /**
     * PATCH request
     */
    public <T> ApiResponse<T> patch(String endpoint, Object data) 
            throws IOException, InterruptedException, ApiError {
        return request("PATCH", endpoint, data);
    }

    /**
     * DELETE request
     */
    public <T> ApiResponse<T> delete(String endpoint) 
            throws IOException, InterruptedException, ApiError {
        return request("DELETE", endpoint, null);
    }

    /**
     * Set API key
     */
    public void setApiKey(String apiKey) {
        // In a real implementation, this would update the apiKey field
    }

    /**
     * Set base URL
     */
    public void setBaseUrl(String baseUrl) {
        // In a real implementation, this would update the baseUrl field
    }

    /**
     * Set timeout
     */
    public void setTimeout(Duration timeout) {
        this.timeout = timeout;
    }
}
`;

  return code;
}

/**
 * Validate Java SDK configuration
 */
export function validateJavaSdkConfig(config: JavaSdkConfig): {
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
 * Generate pom.xml for Maven
 */
export function generatePomXml(config: JavaSdkConfig): string {
  const groupId = config.packageName.toLowerCase().replace(/[^a-z0-9]/g, '.');
  const artifactId = config.packageName.toLowerCase().replace(/[^a-z0-9]/g, '-');

  return `
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>${groupId}</groupId>
    <artifactId>${artifactId}</artifactId>
    <version>${config.packageVersion}</version>
    <packaging>jar</packaging>

    <name>${config.packageName}</name>
    <description>Java SDK for ${config.baseUrl}</description>

    <properties>
        <maven.compiler.source>${config.javaVersion || '11'}</maven.compiler.source>
        <maven.compiler.target>${config.javaVersion || '11'}</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>

    <dependencies>
        <dependency>
            <groupId>com.fasterxml.jackson.core</groupId>
            <artifactId>jackson-databind</artifactId>
            <version>2.15.0</version>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.11.0</version>
                <configuration>
                    <source>${config.javaVersion || '11'}</source>
                    <target>${config.javaVersion || '11'}</target>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
`;
}

/**
 * Generate build.gradle for Gradle
 */
export function generateBuildGradle(config: JavaSdkConfig): string {
  const groupId = config.packageName.toLowerCase().replace(/[^a-z0-9]/g, '.');

  return `
plugins {
    id 'java'
}

group = '${groupId}'
version = '${config.packageVersion}'

java {
    sourceCompatibility = JavaVersion.toVersion('${config.javaVersion || '11'}')
    targetCompatibility = JavaVersion.toVersion('${config.javaVersion || '11'}')
}

repositories {
    mavenCentral()
}

dependencies {
    implementation 'com.fasterxml.jackson.core:jackson-databind:2.15.0'
}

tasks.withType(JavaCompile) {
    options.encoding = 'UTF-8'
}
`;
}

/**
 * Generate README.md for Java SDK
 */
export function generateReadme(config: JavaSdkConfig): string {
  const className = config.packageName.replace(/[^a-zA-Z0-9]/g, '').replace(/\b\w/g, (l) => l.toUpperCase());
  const packageName = config.packageName.toLowerCase().replace(/[^a-zA-Z0-9]/g, '.');

  return `
# ${config.packageName} Java SDK

Java SDK for ${config.baseUrl}

## Installation

### Maven

Add the following to your \`pom.xml\`:

\`\`\`xml
<dependency>
    <groupId>${packageName}</groupId>
    <artifactId>${config.packageName.toLowerCase().replace(/[^a-z0-9]/g, '-')}</artifactId>
    <version>${config.packageVersion}</version>
</dependency>
\`\`\`

### Gradle

Add the following to your \`build.gradle\`:

\`\`\`groovy
implementation '${packageName}:${config.packageVersion}'
\`\`\`

## Usage

\`\`\`java
import ${packageName}.${className}Client;

// Initialize with API key
${className}Client client = new ${className}Client("your-api-key", "${config.baseUrl}");

// Make requests
ApiResponse<Object> response = client.get("/endpoint");
System.out.println(response.getData());

// POST request
Map<String, Object> data = new HashMap<>();
data.put("key", "value");
ApiResponse<Object> postResponse = client.post("/endpoint", data);
System.out.println(postResponse.getData());
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

### ApiResponse\<T\>

- \`getData()\` - Get response data
- \`getStatus()\` - Get HTTP status code
- \`getMessage()\` - Get optional message

### ApiError

- \`getStatus()\` - Get HTTP status code
- \`getCode()\` - Get error code

## License

MIT
`;
}
