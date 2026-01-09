/**
 * Fiber Accessor - Utilities to access React Fiber nodes from DOM elements
 */

import type { ReactFiberNode } from '@/types';

/**
 * React Fiber keys that might be present on DOM elements
 * These keys change between React versions
 */
const REACT_FIBER_KEY_PATTERNS = [
  '__reactFiber',
  '__reactInternalInstance',
  '_reactInternal',
  '_reactInternals',
];

/**
 * Get the React Fiber node from a DOM element
 * @param element - The DOM element to get the fiber from
 * @returns The React Fiber node or null if not found
 */
export function getFiberFromElement(
  element: HTMLElement | Element | null
): ReactFiberNode | null {
  if (!element) return null;

  const keys = Object.keys(element);

  // Look for React Fiber key
  for (const pattern of REACT_FIBER_KEY_PATTERNS) {
    const fiberKey = keys.find((key) => key.startsWith(pattern));
    if (fiberKey) {
      const fiber = (element as any)[fiberKey];
      if (fiber && typeof fiber === 'object') {
        return fiber as ReactFiberNode;
      }
    }
  }

  return null;
}

/**
 * Get the DOM element from a React Fiber node
 * @param fiber - The React Fiber node
 * @returns The DOM element or null if not found
 */
export function getElementFromFiber(
  fiber: ReactFiberNode | null
): HTMLElement | null {
  if (!fiber) return null;

  // For host components (HTML elements), stateNode is the DOM element
  if (fiber.tag === 5 && fiber.stateNode instanceof HTMLElement) {
    return fiber.stateNode;
  }

  // For class components, stateNode is the component instance
  // We need to find the nearest host component
  let node: ReactFiberNode | null = fiber;
  while (node) {
    if (node.tag === 5 && node.stateNode instanceof HTMLElement) {
      return node.stateNode;
    }
    node = node.child;
  }

  return null;
}

/**
 * Find the root Fiber node from any Fiber node
 * @param fiber - Any React Fiber node
 * @returns The root Fiber node
 */
export function findRootFiber(fiber: ReactFiberNode): ReactFiberNode {
  let root = fiber;
  while (root.return) {
    root = root.return;
  }
  return root;
}

/**
 * Get the nearest component Fiber (function or class component)
 * Skips host components (HTML elements) and returns the nearest React component
 * @param fiber - Starting Fiber node
 * @returns The nearest component Fiber or the original fiber if it's already a component
 */
export function getNearestComponentFiber(
  fiber: ReactFiberNode | null
): ReactFiberNode | null {
  if (!fiber) return null;

  let current: ReactFiberNode | null = fiber;

  while (current) {
    // Check if this is a component fiber
    if (isComponentFiber(current)) {
      return current;
    }
    // Move up the tree
    current = current.return;
  }

  return fiber; // Return original if no component found
}

/**
 * Check if a Fiber node represents a component (not a host element)
 * @param fiber - The Fiber node to check
 * @returns True if the fiber represents a component
 */
export function isComponentFiber(fiber: ReactFiberNode): boolean {
  // Fiber tags:
  // 0: FunctionComponent
  // 1: ClassComponent
  // 2: IndeterminateComponent
  // 11: MemoComponent
  // 12: SimpleMemoComponent
  // 15: ForwardRef
  const componentTags = [0, 1, 2, 11, 12, 15];
  return componentTags.includes(fiber.tag);
}

/**
 * Check if a Fiber node represents a host element (HTML element)
 * @param fiber - The Fiber node to check
 * @returns True if the fiber represents a host element
 */
export function isHostFiber(fiber: ReactFiberNode): boolean {
  // Tag 5 is HostComponent (HTML elements like div, span, etc.)
  return fiber.tag === 5;
}

/**
 * Get the component name from a Fiber node
 * @param fiber - The Fiber node
 * @returns The component name or a default name
 */
export function getComponentName(fiber: ReactFiberNode): string {
  if (!fiber) return 'Unknown';

  // Check displayName first
  if (fiber.type && fiber.type.displayName) {
    return fiber.type.displayName;
  }

  // Check function/class name
  if (fiber.type && fiber.type.name) {
    return fiber.type.name;
  }

  // For host components (HTML elements)
  if (typeof fiber.type === 'string') {
    return fiber.type;
  }

  // Check elementType
  if (fiber.elementType) {
    if (typeof fiber.elementType === 'string') {
      return fiber.elementType;
    }
    if (fiber.elementType.displayName) {
      return fiber.elementType.displayName;
    }
    if (fiber.elementType.name) {
      return fiber.elementType.name;
    }
  }

  // Fallback to fiber tag name
  return getFiberTagName(fiber.tag);
}

/**
 * Get a human-readable name for a Fiber tag
 * @param tag - The Fiber tag number
 * @returns The tag name
 */
export function getFiberTagName(tag: number): string {
  const tagNames: Record<number, string> = {
    0: 'FunctionComponent',
    1: 'ClassComponent',
    2: 'IndeterminateComponent',
    3: 'HostRoot',
    4: 'HostPortal',
    5: 'HostComponent',
    6: 'HostText',
    7: 'Fragment',
    8: 'Mode',
    9: 'ContextConsumer',
    10: 'ContextProvider',
    11: 'ForwardRef',
    12: 'Profiler',
    13: 'SuspenseComponent',
    14: 'MemoComponent',
    15: 'SimpleMemoComponent',
    16: 'LazyComponent',
    17: 'IncompleteClassComponent',
    18: 'DehydratedFragment',
    19: 'SuspenseListComponent',
    22: 'OffscreenComponent',
    23: 'LegacyHiddenComponent',
    24: 'CacheComponent',
    25: 'TracingMarkerComponent',
  };

  return tagNames[tag] || `Unknown(${tag})`;
}

/**
 * Check if React DevTools is available
 * @returns True if React DevTools hook is present
 */
export function hasReactDevTools(): boolean {
  return !!(window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
}

/**
 * Get React version from the page if available
 * @returns React version string or null
 */
export function getReactVersion(): string | null {
  try {
    const hook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (hook && hook.renderers) {
      const renderers = Array.from(hook.renderers.values()) as any[];
      if (renderers.length > 0 && renderers[0].version) {
        return renderers[0].version;
      }
    }
  } catch (error) {
    console.warn('Failed to get React version:', error);
  }
  return null;
}

/**
 * Find all Fiber nodes in the current page
 * @returns Array of all root Fiber nodes found
 */
export function findAllFiberRoots(): ReactFiberNode[] {
  const roots: ReactFiberNode[] = [];
  const allElements = document.querySelectorAll('*');

  const processedFibers = new Set<ReactFiberNode>();

  for (const element of Array.from(allElements)) {
    const fiber = getFiberFromElement(element as HTMLElement);
    if (fiber) {
      const root = findRootFiber(fiber);
      if (!processedFibers.has(root)) {
        processedFibers.add(root);
        roots.push(root);
      }
    }
  }

  return roots;
}
