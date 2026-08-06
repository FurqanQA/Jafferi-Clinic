import { logger } from '../shared/logger';
import { getOpenApiDocument } from './openapi';

// ============================================================================
// Python SDK
// Python SDK generation and utilities
// ============================================================================

/**
 * Python SDK Configuration
 */
export interface PythonSdkConfig {
  packageName: string;
  packageVersion: string;
  baseUrl: string;
  apiKey?: string;
  includeTypes?: boolean;
  includeExamples?: boolean;
  useRequests?: boolean;
  pythonVersion?: '3.7' | '3.8' | '3.9' | '3.10' | '3.11';
}

/**
 * Generate Python SDK
 */
export async function generatePythonSdk(config: PythonSdkConfig): Promise<string> {
  const openApiDoc = getOpenApiDocument();

  try {
    const sdkCode = generateSdkCode(config, openApiDoc);
    logger.info('Python SDK generated', { packageName: config.packageName });
    return sdkCode;
  } catch (error) {
    logger.error('Python SDK generation failed', { error });
    throw error;
  }
}

/**
 * Generate SDK code
 */
function generateSdkCode(config: PythonSdkConfig, openApiDoc: unknown): string {
  const className = config.packageName.replace(/[^a-zA-Z0-9]/g, '').replace(/\b\w/g, (l) => l.toUpperCase());
  const moduleName = config.packageName.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');

  let code = `
"""
${config.packageName} Python SDK
Version: ${config.packageVersion}
Generated SDK for ${config.baseUrl}
"""

import requests
import json
from typing import Dict, Any, Optional, Union
from dataclasses import dataclass

@dataclass
class ApiResponse:
    """API Response wrapper"""
    data: Any
    status: int
    message: Optional[str] = None

class ApiError(Exception):
    """API Error exception"""
    def __init__(self, message: str, status: Optional[int] = None, code: Optional[str] = None):
        self.message = message
        self.status = status
        self.code = code
        super().__init__(self.message)

class ${className}Client:
    """${config.packageName} API Client"""
    
    def __init__(self, api_key: Optional[str] = None, base_url: str = '${config.baseUrl}'):
        """
        Initialize the API client
        
        Args:
            api_key: API key for authentication
            base_url: Base URL for the API
        """
        self.base_url = base_url
        self.api_key = api_key
        self.default_headers = {
            'Content-Type': 'application/json',
        }
        self.timeout = 30
    
    def _get_headers(self) -> Dict[str, str]:
        """Get default headers with authentication"""
        headers = self.default_headers.copy()
        
        if self.api_key:
            headers['Authorization'] = f'Bearer {self.api_key}'
            headers['X-API-Key'] = self.api_key
        
        return headers
    
    def _request(self, method: str, path: str, body: Optional[Dict[str, Any]] = None) -> ApiResponse:
        """
        Make an API request
        
        Args:
            method: HTTP method (GET, POST, PUT, PATCH, DELETE)
            path: API endpoint path
            body: Request body data
            
        Returns:
            ApiResponse: Response data
            
        Raises:
            ApiError: If the request fails
        """
        url = f'{self.base_url}{path}'
        headers = self._get_headers()
        
        try:
            response = requests.request(
                method=method,
                url=url,
                headers=headers,
                json=body if body else None,
                timeout=self.timeout
            )
            
            if not response.ok:
                raise ApiError(
                    message=f'HTTP error! status: {response.status}',
                    status=response.status
                )
            
            data = response.json()
            
            return ApiResponse(
                data=data,
                status=response.status
            )
            
        except requests.exceptions.RequestException as e:
            raise ApiError(message=str(e))
    
    def get(self, endpoint: str) -> ApiResponse:
        """
        Make a GET request
        
        Args:
            endpoint: API endpoint
            
        Returns:
            ApiResponse: Response data
        """
        return self._request('GET', endpoint)
    
    def post(self, endpoint: str, data: Dict[str, Any]) -> ApiResponse:
        """
        Make a POST request
        
        Args:
            endpoint: API endpoint
            data: Request body data
            
        Returns:
            ApiResponse: Response data
        """
        return self._request('POST', endpoint, data)
    
    def put(self, endpoint: str, data: Dict[str, Any]) -> ApiResponse:
        """
        Make a PUT request
        
        Args:
            endpoint: API endpoint
            data: Request body data
            
        Returns:
            ApiResponse: Response data
        """
        return self._request('PUT', endpoint, data)
    
    def patch(self, endpoint: str, data: Dict[str, Any]) -> ApiResponse:
        """
        Make a PATCH request
        
        Args:
            endpoint: API endpoint
            data: Request body data
            
        Returns:
            ApiResponse: Response data
        """
        return self._request('PATCH', endpoint, data)
    
    def delete(self, endpoint: str) -> ApiResponse:
        """
        Make a DELETE request
        
        Args:
            endpoint: API endpoint
            
        Returns:
            ApiResponse: Response data
        """
        return self._request('DELETE', endpoint)
    
    def set_api_key(self, api_key: str) -> None:
        """
        Set the API key
        
        Args:
            api_key: API key for authentication
        """
        self.api_key = api_key
    
    def set_base_url(self, base_url: str) -> None:
        """
        Set the base URL
        
        Args:
            base_url: Base URL for the API
        """
        self.base_url = base_url
    
    def set_timeout(self, timeout: int) -> None:
        """
        Set the request timeout
        
        Args:
            timeout: Timeout in seconds
        """
        self.timeout = timeout

# Create a default client instance
client = ${className}Client()

__all__ = ['${className}Client', 'client', 'ApiResponse', 'ApiError']
  `.trim();

  return code;
}

/**
 * Validate Python SDK configuration
 */
export function validatePythonSdkConfig(config: PythonSdkConfig): {
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
 * Generate setup.py for Python SDK
 */
export function generateSetupPy(config: PythonSdkConfig): string {
  const moduleName = config.packageName.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
  const displayName = config.packageName.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-');

  return `
from setuptools import setup, find_packages

setup(
    name='${displayName}',
    version='${config.packageVersion}',
    description='Python SDK for ${config.baseUrl}',
    author='',
    author_email='',
    url='https://github.com/yourusername/${displayName}',
    packages=find_packages(),
    install_requires=[
        'requests>=2.28.0',
    ],
    python_requires='>=3.7',
    classifiers=[
        'Development Status :: 4 - Beta',
        'Intended Audience :: Developers',
        'License :: OSI Approved :: MIT License',
        'Programming Language :: Python :: 3',
        'Programming Language :: Python :: 3.7',
        'Programming Language :: Python :: 3.8',
        'Programming Language :: Python :: 3.9',
        'Programming Language :: Python :: 3.10',
        'Programming Language :: Python :: 3.11',
    ],
)
`;
}

/**
 * Generate pyproject.toml for Python SDK
 */
export function generatePyprojectToml(config: PythonSdkConfig): string {
  const displayName = config.packageName.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-');

  return `
[build-system]
requires = ["setuptools>=45", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "${displayName}"
version = "${config.packageVersion}"
description = "Python SDK for ${config.baseUrl}"
authors = []
license = {text = "MIT"}
requires-python = ">=3.7"
dependencies = [
    "requests>=2.28.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.0.0",
    "black>=22.0.0",
    "flake8>=4.0.0",
    "mypy>=0.950",
]

[tool.black]
line-length = 88
target-version = ['py37', 'py38', 'py39', 'py310', 'py311']

[tool.mypy]
python_version = "3.7"
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true
`;
}

/**
 * Generate README.md for Python SDK
 */
export function generateReadme(config: PythonSdkConfig): string {
  const moduleName = config.packageName.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
  const displayName = config.packageName.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-');
  const className = config.packageName.replace(/[^a-zA-Z0-9]/g, '').replace(/\b\w/g, (l) => l.toUpperCase());

  return `
# ${config.packageName} Python SDK

Python SDK for ${config.baseUrl}

## Installation

\`\`\`bash
pip install ${displayName}
\`\`\`

## Usage

\`\`\`python
from ${moduleName} import ${className}Client, client

# Initialize with API key
api_client = ${className}Client(api_key='your-api-key')

# Make requests
result = api_client.get('/endpoint')
print(result.data)

# POST request
data = {'key': 'value'}
result = api_client.post('/endpoint', data)
print(result.data)
\`\`\`

## API Reference

### ${className}Client

#### Methods

- \`get(endpoint)\` - Make a GET request
- \`post(endpoint, data)\` - Make a POST request
- \`put(endpoint, data)\` - Make a PUT request
- \`patch(endpoint, data)\` - Make a PATCH request
- \`delete(endpoint)\` - Make a DELETE request
- \`set_api_key(api_key)\` - Set the API key
- \`set_base_url(base_url)\` - Set the base URL
- \`set_timeout(timeout)\` - Set the request timeout

### ApiResponse

- \`data\` - Response data
- \`status\` - HTTP status code
- \`message\` - Optional message

### ApiError

- \`message\` - Error message
- \`status\` - HTTP status code
- \`code\` - Error code

## License

MIT
`;
}

/**
 * Generate requirements.txt for Python SDK
 */
export function generateRequirementsTxt(): string {
  return `
requests>=2.28.0
`;
}

/**
 * Generate .gitignore for Python SDK
 */
export function generateGitignore(): string {
  return `
# Byte-compiled / optimized / DLL files
__pycache__/
*.py[cod]
*$py.class

# C extensions
*.so

# Distribution / packaging
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# PyInstaller
*.manifest
*.spec

# Unit test / coverage reports
htmlcov/
.tox/
.coverage
.coverage.*
.cache
nosetests.xml
coverage.xml
*.cover
.hypothesis/
.pytest_cache/

# Virtual environments
venv/
ENV/
env/

# IDEs
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db
`;
}
