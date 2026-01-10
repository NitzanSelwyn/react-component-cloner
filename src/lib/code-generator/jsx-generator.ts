/**
 * JSX Generator - Converts React Fiber nodes to JSX code
 *
 * This module handles the core conversion from Fiber tree to JSX strings.
 * It recursively traverses the Fiber tree and generates clean, formatted JSX.
 */

import type { ReactFiberNode } from '@/types';
import {
  getComponentName,
  isHostFiber,
  isTextNode,
  isFragment,
} from '@lib/fiber-utils';

export interface JSXGeneratorOptions {
  /** Maximum depth to traverse (default: 5) */
  maxDepth?: number;
  /** Current depth level (internal) */
  currentDepth?: number;
  /** Whether to include children (default: true) */
  includeChildren?: boolean;
  /** Stop at custom components or go deeper (default: 'deep') */
  extractDepth?: 'shallow' | 'deep';
  /** Pretty print with indentation (default: true) */
  prettify?: boolean;
  /** Current indentation level (internal) */
  indentLevel?: number;
  /** Include data- attributes (default: false) */
  includeDataAttributes?: boolean;
  /** Include aria- attributes (default: true) */
  includeAriaAttributes?: boolean;
  /** Include event handlers as placeholders (default: true) */
  includeEventHandlers?: boolean;
  /** Replace children with placeholder comments (default: false) */
  useChildPlaceholders?: boolean;
}

const DEFAULT_OPTIONS: Required<JSXGeneratorOptions> = {
  maxDepth: 5,
  currentDepth: 0,
  includeChildren: true,
  extractDepth: 'deep',
  prettify: true,
  indentLevel: 0,
  includeDataAttributes: false,
  includeAriaAttributes: true,
  includeEventHandlers: true,
  useChildPlaceholders: false,
};

/**
 * Generate JSX code from a React Fiber node
 */
export function generateJSX(
  fiber: ReactFiberNode | null,
  options: JSXGeneratorOptions = {}
): string {
  if (!fiber) {
    return '';
  }

  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Check depth limit
  if (opts.currentDepth >= opts.maxDepth) {
    return opts.prettify ? indent(opts.indentLevel) + '{/* Max depth reached */}' : '';
  }

  // Handle different fiber types
  if (isTextNode(fiber)) {
    return generateTextNode(fiber, opts);
  }

  if (isFragment(fiber)) {
    return generateFragment(fiber, opts);
  }

  if (isHostFiber(fiber)) {
    return generateHostElement(fiber, opts);
  }

  // Custom component
  return generateComponent(fiber, opts);
}

/**
 * Generate JSX for a text node
 */
function generateTextNode(fiber: ReactFiberNode, opts: Required<JSXGeneratorOptions>): string {
  const text = fiber.memoizedProps;
  if (!text || typeof text !== 'string') {
    return '';
  }

  const escapedText = escapeJSXText(text.trim());
  if (!escapedText) {
    return '';
  }

  return opts.prettify ? indent(opts.indentLevel) + escapedText : escapedText;
}

/**
 * Generate JSX for a Fragment
 */
function generateFragment(fiber: ReactFiberNode, opts: Required<JSXGeneratorOptions>): string {
  const children = generateChildren(fiber, opts);
  if (!children) {
    return '';
  }

  const ind = opts.prettify ? indent(opts.indentLevel) : '';
  const newline = opts.prettify ? '\n' : '';

  return `${ind}<>${newline}${children}${newline}${ind}</>`;
}

/**
 * Generate JSX for a host element (HTML tag)
 */
function generateHostElement(fiber: ReactFiberNode, opts: Required<JSXGeneratorOptions>): string {
  const tag = fiber.type as string;
  if (!tag || typeof tag !== 'string') {
    return '';
  }

  const props = fiber.memoizedProps || {};
  const attributes = propsToJSXAttributes(props, opts);
  const children = generateChildren(fiber, opts);

  const ind = opts.prettify ? indent(opts.indentLevel) : '';
  const newline = opts.prettify ? '\n' : '';

  // Self-closing tags
  if (!children && isSelfClosingTag(tag)) {
    return `${ind}<${tag}${attributes} />`;
  }

  // Empty element
  if (!children) {
    return `${ind}<${tag}${attributes}></${tag}>`;
  }

  // Element with children
  const needsNewlines = children.includes('\n') || children.length > 60;
  if (needsNewlines && opts.prettify) {
    return `${ind}<${tag}${attributes}>${newline}${children}${newline}${ind}</${tag}>`;
  }

  return `${ind}<${tag}${attributes}>${children}</${tag}>`;
}

/**
 * Generate JSX for a custom component
 */
function generateComponent(fiber: ReactFiberNode, opts: Required<JSXGeneratorOptions>): string {
  const componentName = getComponentName(fiber);
  if (!componentName) {
    return '';
  }

  // Check if we should stop at this component (shallow extraction)
  if (opts.extractDepth === 'shallow' && opts.currentDepth > 0) {
    const ind = opts.prettify ? indent(opts.indentLevel) : '';
    return `${ind}<${componentName} {/* TODO: Extract this component separately */} />`;
  }

  const props = fiber.memoizedProps || {};
  const attributes = propsToJSXAttributes(props, opts);
  const children = generateChildren(fiber, opts);

  const ind = opts.prettify ? indent(opts.indentLevel) : '';
  const newline = opts.prettify ? '\n' : '';

  // Self-closing if no children
  if (!children) {
    return `${ind}<${componentName}${attributes} />`;
  }

  // Component with children
  const needsNewlines = children.includes('\n') || children.length > 60;
  if (needsNewlines && opts.prettify) {
    return `${ind}<${componentName}${attributes}>${newline}${children}${newline}${ind}</${componentName}>`;
  }

  return `${ind}<${componentName}${attributes}>${children}</${componentName}>`;
}

/**
 * Generate JSX for children
 */
function generateChildren(fiber: ReactFiberNode, opts: Required<JSXGeneratorOptions>): string {
  if (!opts.includeChildren) {
    return '';
  }

  if (opts.useChildPlaceholders) {
    return opts.prettify ? indent(opts.indentLevel + 1) + '{/* Children */}' : '';
  }

  const children: string[] = [];
  let child = fiber.child;

  while (child) {
    const childJSX = generateJSX(child, {
      ...opts,
      currentDepth: opts.currentDepth + 1,
      indentLevel: opts.indentLevel + 1,
    });

    if (childJSX) {
      children.push(childJSX);
    }

    child = child.sibling;
  }

  return children.join(opts.prettify ? '\n' : '');
}

/**
 * Convert props object to JSX attributes string
 */
function propsToJSXAttributes(
  props: Record<string, any>,
  opts: Required<JSXGeneratorOptions>
): string {
  const attributes: string[] = [];

  for (const [key, value] of Object.entries(props)) {
    // Skip special React props
    if (key === 'children' || key === 'key' || key === 'ref') {
      continue;
    }

    // Skip __reactProps and other internal props
    if (key.startsWith('__')) {
      continue;
    }

    // Handle data- attributes
    if (key.startsWith('data-') && !opts.includeDataAttributes) {
      continue;
    }

    // Handle aria- attributes
    if (key.startsWith('aria-') && !opts.includeAriaAttributes) {
      continue;
    }

    // Handle event handlers
    if (key.startsWith('on') && isEventHandler(key)) {
      if (opts.includeEventHandlers) {
        attributes.push(`${key}={handleEvent}`);
      }
      continue;
    }

    // Convert prop value to JSX attribute
    const attr = propToJSXAttribute(key, value);
    if (attr) {
      attributes.push(attr);
    }
  }

  if (attributes.length === 0) {
    return '';
  }

  return ' ' + attributes.join(' ');
}

/**
 * Convert a single prop to JSX attribute string
 */
function propToJSXAttribute(key: string, value: any): string | null {
  // Null/undefined
  if (value === null || value === undefined) {
    return null;
  }

  // Boolean props
  if (typeof value === 'boolean') {
    return value ? key : null;
  }

  // String props
  if (typeof value === 'string') {
    // Empty string
    if (value === '') {
      return `${key}=""`;
    }
    // String with quotes/special chars
    const escaped = value.replace(/"/g, '&quot;').replace(/\n/g, '\\n');
    return `${key}="${escaped}"`;
  }

  // Number props
  if (typeof value === 'number') {
    return `${key}={${value}}`;
  }

  // Object/Array props (use placeholder)
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return `${key}={[/* array */]}`;
    }
    // Style object
    if (key === 'style') {
      return `${key}={{${objectToStyleString(value)}}}`;
    }
    // className object (for libraries like classnames)
    if (key === 'className' && typeof value === 'object') {
      return null; // Skip object classNames
    }
    return `${key}={{/* object */}}`;
  }

  // Function props (event handlers, callbacks)
  if (typeof value === 'function') {
    return `${key}={handleEvent}`;
  }

  return null;
}

/**
 * Convert style object to inline string
 */
function objectToStyleString(style: Record<string, any>): string {
  const entries = Object.entries(style)
    .filter(([_, value]) => value !== null && value !== undefined)
    .map(([key, value]) => {
      const kebabKey = camelToKebab(key);
      const strValue = typeof value === 'number' && needsPixelUnit(kebabKey)
        ? `${value}px`
        : String(value);
      return `${kebabKey}: '${strValue}'`;
    });

  return entries.length > 0 ? ' ' + entries.join(', ') + ' ' : '';
}

/**
 * Convert camelCase to kebab-case
 */
function camelToKebab(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

/**
 * Check if CSS property needs px unit
 */
function needsPixelUnit(property: string): boolean {
  const noUnitProps = [
    'opacity',
    'z-index',
    'font-weight',
    'line-height',
    'flex',
    'flex-grow',
    'flex-shrink',
    'order',
  ];
  return !noUnitProps.includes(property);
}

/**
 * Escape special characters in JSX text
 */
function escapeJSXText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/{/g, '&#123;')
    .replace(/}/g, '&#125;');
}

/**
 * Check if prop key is an event handler
 */
function isEventHandler(key: string): boolean {
  return /^on[A-Z]/.test(key);
}

/**
 * Check if tag is self-closing
 */
function isSelfClosingTag(tag: string): boolean {
  const selfClosing = [
    'area',
    'base',
    'br',
    'col',
    'embed',
    'hr',
    'img',
    'input',
    'link',
    'meta',
    'param',
    'source',
    'track',
    'wbr',
  ];
  return selfClosing.includes(tag.toLowerCase());
}

/**
 * Generate indentation string
 */
function indent(level: number): string {
  return '  '.repeat(level);
}

/**
 * Generate JSX with default options (utility)
 */
export function generateCleanJSX(fiber: ReactFiberNode | null): string {
  return generateJSX(fiber, {
    prettify: true,
    maxDepth: 10,
    includeChildren: true,
    extractDepth: 'deep',
  });
}

/**
 * Generate shallow JSX (stop at components)
 */
export function generateShallowJSX(fiber: ReactFiberNode | null): string {
  return generateJSX(fiber, {
    prettify: true,
    maxDepth: 3,
    includeChildren: true,
    extractDepth: 'shallow',
  });
}
