/**
 * Metadata Extractor - Extract component metadata from Fiber nodes
 */

import type { ReactFiberNode, ComponentInfo } from '@/types';
import { getComponentName, getElementFromFiber } from './fiber-accessor';
import { identifyComponentType } from './component-identifier';
import { getChildrenFibers } from './fiber-traversal';

/**
 * Extract props from a Fiber node
 * @param fiber - The Fiber node
 * @returns Props object (sanitized)
 */
export function extractProps(fiber: ReactFiberNode): Record<string, any> {
  const props = fiber.memoizedProps || fiber.pendingProps || {};

  // Create a sanitized copy of props
  const sanitizedProps: Record<string, any> = {};

  for (const key in props) {
    if (key === 'children') {
      // Skip children, we'll handle them separately
      continue;
    }

    const value = props[key];

    // Sanitize the value
    sanitizedProps[key] = sanitizeValue(value);
  }

  return sanitizedProps;
}

/**
 * Sanitize a value for safe serialization
 * @param value - The value to sanitize
 * @returns Sanitized value
 */
function sanitizeValue(value: any): any {
  if (value === null || value === undefined) {
    return value;
  }

  // Handle primitives
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }

  // Handle functions
  if (typeof value === 'function') {
    return `[Function: ${value.name || 'anonymous'}]`;
  }

  // Handle arrays
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  // Handle React elements
  if (value && value.$$typeof) {
    return '[React Element]';
  }

  // Handle objects
  if (typeof value === 'object') {
    const sanitized: Record<string, any> = {};
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        sanitized[key] = sanitizeValue(value[key]);
      }
    }
    return sanitized;
  }

  return value;
}

/**
 * Extract children information from props
 * @param fiber - The Fiber node
 * @returns Array of child information
 */
export function extractChildrenFromProps(fiber: ReactFiberNode): any[] {
  const props = fiber.memoizedProps || fiber.pendingProps || {};
  const children = props.children;

  if (children === null || children === undefined) {
    return [];
  }

  if (Array.isArray(children)) {
    return children;
  }

  return [children];
}

/**
 * Extract state from a class component
 * @param fiber - The Fiber node (must be a class component)
 * @returns State object or null
 */
export function extractState(fiber: ReactFiberNode): Record<string, any> | null {
  // Class components have state in stateNode.state
  if (fiber.tag === 1 && fiber.stateNode && fiber.stateNode.state) {
    return sanitizeValue(fiber.stateNode.state);
  }

  return null;
}

/**
 * Extract context values from a Fiber node
 * @param fiber - The Fiber node
 * @returns Context values object
 */
export function extractContextValues(
  fiber: ReactFiberNode
): Record<string, any> {
  const contexts: Record<string, any> = {};

  // Check dependencies for context values
  if (fiber.dependencies) {
    const deps = fiber.dependencies;
    if (deps.firstContext) {
      let context = deps.firstContext;
      let index = 0;
      while (context) {
        contexts[`Context_${index}`] = sanitizeValue(context.memoizedValue);
        context = context.next;
        index++;
      }
    }
  }

  return contexts;
}

/**
 * Extract ref from a Fiber node
 * @param fiber - The Fiber node
 * @returns Ref information or null
 */
export function extractRef(fiber: ReactFiberNode): any {
  if (fiber.ref) {
    if (typeof fiber.ref === 'function') {
      return '[Ref Callback]';
    }
    return '[Ref Object]';
  }
  return null;
}

/**
 * Extract key from a Fiber node
 * @param fiber - The Fiber node
 * @returns Key value or null
 */
export function extractKey(fiber: ReactFiberNode): string | null {
  return fiber.key;
}

/**
 * Extract component source location (if available in dev mode)
 * @param fiber - The Fiber node
 * @returns Source location or null
 */
export function extractSourceLocation(fiber: ReactFiberNode): {
  fileName: string;
  lineNumber: number;
  columnNumber: number;
} | null {
  if (fiber._debugSource) {
    return {
      fileName: fiber._debugSource.fileName,
      lineNumber: fiber._debugSource.lineNumber,
      columnNumber: fiber._debugSource.columnNumber,
    };
  }
  return null;
}

/**
 * Extract owner component (parent that created this component)
 * @param fiber - The Fiber node
 * @returns Owner component name or null
 */
export function extractOwner(fiber: ReactFiberNode): string | null {
  if (fiber._debugOwner) {
    return getComponentName(fiber._debugOwner);
  }
  return null;
}

/**
 * Build complete component information from a Fiber node
 * @param fiber - The Fiber node
 * @param includeChildren - Whether to recursively extract children
 * @param maxDepth - Maximum depth for child extraction
 * @returns ComponentInfo object
 */
export function buildComponentInfo(
  fiber: ReactFiberNode,
  includeChildren: boolean = true,
  maxDepth: number = 3,
  currentDepth: number = 0
): ComponentInfo {
  const componentType = identifyComponentType(fiber);
  const props = extractProps(fiber);
  const domNode = getElementFromFiber(fiber);

  const info: ComponentInfo = {
    name: getComponentName(fiber),
    type: componentType,
    props,
    children: [],
    domNode,
    fiberNode: fiber,
    styles: {
      inline: {},
      computed: {},
      classes: [],
      strategy: 'inline',
    },
  };

  // Extract children if requested and within depth limit
  if (includeChildren && currentDepth < maxDepth) {
    const childFibers = getChildrenFibers(fiber, true);
    info.children = childFibers.map((childFiber) =>
      buildComponentInfo(childFiber, true, maxDepth, currentDepth + 1)
    );
  }

  return info;
}

/**
 * Extract all metadata from a Fiber node
 * @param fiber - The Fiber node
 * @returns Object with all extracted metadata
 */
export function extractAllMetadata(fiber: ReactFiberNode): {
  name: string;
  type: string;
  props: Record<string, any>;
  state: Record<string, any> | null;
  contexts: Record<string, any>;
  ref: any;
  key: string | null;
  source: any;
  owner: string | null;
  tag: number;
} {
  return {
    name: getComponentName(fiber),
    type: identifyComponentType(fiber),
    props: extractProps(fiber),
    state: extractState(fiber),
    contexts: extractContextValues(fiber),
    ref: extractRef(fiber),
    key: extractKey(fiber),
    source: extractSourceLocation(fiber),
    owner: extractOwner(fiber),
    tag: fiber.tag,
  };
}

/**
 * Check if a component has any props
 * @param fiber - The Fiber node
 * @returns True if component has props (excluding children)
 */
export function hasProps(fiber: ReactFiberNode): boolean {
  const props = extractProps(fiber);
  return Object.keys(props).length > 0;
}

/**
 * Check if a component has children
 * @param fiber - The Fiber node
 * @returns True if component has children
 */
export function hasChildren(fiber: ReactFiberNode): boolean {
  return fiber.child !== null;
}

/**
 * Count direct children of a component
 * @param fiber - The Fiber node
 * @returns Number of direct children
 */
export function countChildren(fiber: ReactFiberNode): number {
  let count = 0;
  let child = fiber.child;

  while (child) {
    count++;
    child = child.sibling;
  }

  return count;
}
