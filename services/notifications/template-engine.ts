import { logger } from '../shared/logger';

// ============================================================================
// Template Engine
// Handles template rendering with variables and localization
// ============================================================================

/**
 * Render template with variables
 * Replaces {{variable}} placeholders with actual values
 */
export function renderTemplate(template: string, variables: Record<string, any>): string {
  if (!template) {
    return '';
  }

  if (!variables || Object.keys(variables).length === 0) {
    return template;
  }

  let result = template;

  // Replace all {{variable}} placeholders
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    const regex = new RegExp(placeholder, 'g');
    result = result.replace(regex, String(value ?? ''));
  }

  // Replace any remaining placeholders with empty string
  result = result.replace(/{{[^}]+}}/g, '');

  return result;
}

/**
 * Render template with conditional logic
 * Supports {{#if condition}}...{{/if}} syntax
 */
export function renderTemplateWithConditionals(template: string, variables: Record<string, any>): string {
  if (!template) {
    return '';
  }

  let result = template;

  // Handle {{#if condition}}...{{/if}} blocks
  const ifRegex = /{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g;
  result = result.replace(ifRegex, (match, condition, content) => {
    const value = variables[condition];
    if (value) {
      return content;
    }
    return '';
  });

  // Handle {{#unless condition}}...{{/unless}} blocks
  const unlessRegex = /{{#unless\s+(\w+)}}([\s\S]*?){{\/unless}}/g;
  result = result.replace(unlessRegex, (match, condition, content) => {
    const value = variables[condition];
    if (!value) {
      return content;
    }
    return '';
  });

  // Replace remaining variables
  result = renderTemplate(result, variables);

  return result;
}

/**
 * Render template with loops
 * Supports {{#each array}}...{{/each}} syntax
 */
export function renderTemplateWithLoops(template: string, variables: Record<string, any>): string {
  if (!template) {
    return '';
  }

  let result = template;

  // Handle {{#each array}}...{{/each}} blocks
  const eachRegex = /{{#each\s+(\w+)}}([\s\S]*?){{\/each}}/g;
  result = result.replace(eachRegex, (match, arrayName, content) => {
    const array = variables[arrayName];
    if (!Array.isArray(array)) {
      return '';
    }

    return array.map((item, index) => {
      let itemContent = content;
      // Replace {{this}} with current item
      itemContent = itemContent.replace(/{{this}}/g, String(item));
      // Replace {{@index}} with current index
      itemContent = itemContent.replace(/{{@index}}/g, String(index));
      // Replace item properties if item is an object
      if (typeof item === 'object' && item !== null) {
        for (const [key, value] of Object.entries(item)) {
          itemContent = itemContent.replace(new RegExp(`{{${key}}}`, 'g'), String(value ?? ''));
        }
      }
      return itemContent;
    }).join('\n');
  });

  // Replace remaining variables
  result = renderTemplate(result, variables);

  return result;
}

/**
 * Render template with all features (conditionals, loops, variables)
 */
export function renderAdvancedTemplate(template: string, variables: Record<string, any>): string {
  if (!template) {
    return '';
  }

  let result = template;

  // Process loops first
  result = renderTemplateWithLoops(result, variables);

  // Process conditionals
  result = renderTemplateWithConditionals(result, variables);

  // Process remaining variables
  result = renderTemplate(result, variables);

  return result;
}

/**
 * Validate template variables
 * Checks if all required variables are present
 */
export function validateTemplateVariables(template: string, requiredVariables: string[], providedVariables: Record<string, any>): {
  valid: boolean;
  missing: string[];
} {
  const missing: string[] = [];

  for (const variable of requiredVariables) {
    if (!(variable in providedVariables) || providedVariables[variable] === undefined || providedVariables[variable] === null) {
      missing.push(variable);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Extract variables from template
 * Finds all {{variable}} placeholders in a template
 */
export function extractTemplateVariables(template: string): string[] {
  if (!template) {
    return [];
  }

  const regex = /{{(\w+)}}/g;
  const variables = new Set<string>();
  let match;

  while ((match = regex.exec(template)) !== null) {
    variables.add(match[1]);
  }

  return Array.from(variables);
}

/**
 * Preview template rendering
 * Renders template with sample data for preview
 */
export function previewTemplate(template: string, variables: Record<string, any>): {
  subject: string;
  body: string;
  html?: string;
} {
  return {
    subject: renderTemplate(template, variables),
    body: renderTemplate(template, variables),
  };
}

/**
 * Create template version
 * Placeholder for template versioning
 */
export function createTemplateVersion(templateId: string, content: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  return `v${timestamp}${random}`;
}

/**
 * Compare template versions
 * Placeholder for template diff functionality
 */
export function compareTemplateVersions(version1: string, version2: string): {
  added: string[];
  removed: string[];
  changed: string[];
} {
  // Placeholder for template comparison
  return {
    added: [],
    removed: [],
    changed: [],
  };
}

/**
 * Minify template
 * Removes unnecessary whitespace from template
 */
export function minifyTemplate(template: string): string {
  if (!template) {
    return '';
  }

  return template
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .trim();
}

/**
 * Escape template variables
 * Escapes HTML entities in variable values
 */
export function escapeTemplateVariables(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);
  return stringValue
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Render template with HTML escaping
 * Renders template and escapes variable values for HTML
 */
export function renderTemplateWithEscaping(template: string, variables: Record<string, any>): string {
  if (!template) {
    return '';
  }

  const escapedVariables: Record<string, any> = {};
  for (const [key, value] of Object.entries(variables)) {
    escapedVariables[key] = escapeTemplateVariables(value);
  }

  return renderTemplate(template, escapedVariables);
}

/**
 * Sanitize template
 * Removes potentially dangerous content from template
 */
export function sanitizeTemplate(template: string): string {
  if (!template) {
    return '';
  }

  // Remove script tags
  let result = template.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove on* event handlers
  result = result.replace(/\s+on\w+="[^"]*"/gi, '');

  // Remove javascript: protocol
  result = result.replace(/javascript:/gi, '');

  return result;
}

/**
 * Get template statistics
 */
export function getTemplateStatistics(template: string): {
  variableCount: number;
  characterCount: number;
  wordCount: number;
  lineCount: number;
} {
  if (!template) {
    return {
      variableCount: 0,
      characterCount: 0,
      wordCount: 0,
      lineCount: 0,
    };
  }

  const variables = extractTemplateVariables(template);
  const characterCount = template.length;
  const wordCount = template.split(/\s+/).filter(word => word.length > 0).length;
  const lineCount = template.split('\n').length;

  return {
    variableCount: variables.length,
    characterCount,
    wordCount,
    lineCount,
  };
}
