/**
 * Fiber Traversal - Utilities to traverse the React Fiber tree
 */

import type { ReactFiberNode } from '@/types';
import { isComponentFiber, isHostFiber } from './fiber-accessor';

/**
 * Traverse the Fiber tree in depth-first order
 * @param fiber - Starting Fiber node
 * @param callback - Function called for each node, return false to stop traversal
 * @param maxDepth - Maximum depth to traverse (default: unlimited)
 */
export function traverseFiberTree(
  fiber: ReactFiberNode | null,
  callback: (fiber: ReactFiberNode, depth: number) => boolean | void,
  maxDepth: number = Infinity
): void {
  if (!fiber) return;

  const traverse = (node: ReactFiberNode, depth: number): boolean => {
    if (depth > maxDepth) return true;

    // Call callback, if it returns false, stop traversal
    const shouldContinue = callback(node, depth);
    if (shouldContinue === false) return false;

    // Traverse children
    if (node.child) {
      if (!traverse(node.child, depth + 1)) return false;
    }

    // Traverse siblings
    if (node.sibling) {
      if (!traverse(node.sibling, depth)) return false;
    }

    return true;
  };

  traverse(fiber, 0);
}

/**
 * Get all children Fiber nodes of a given Fiber
 * @param fiber - Parent Fiber node
 * @param includeHostComponents - Whether to include host components (HTML elements)
 * @returns Array of child Fiber nodes
 */
export function getChildrenFibers(
  fiber: ReactFiberNode | null,
  includeHostComponents: boolean = true
): ReactFiberNode[] {
  if (!fiber || !fiber.child) return [];

  const children: ReactFiberNode[] = [];
  let child: ReactFiberNode | null = fiber.child;

  while (child) {
    if (includeHostComponents || isComponentFiber(child) || isHostFiber(child)) {
      children.push(child);
    }
    child = child.sibling;
  }

  return children;
}

/**
 * Get the parent component Fiber (skips host components if specified)
 * @param fiber - Starting Fiber node
 * @param skipHostComponents - Whether to skip host components and return parent component
 * @returns Parent Fiber node or null
 */
export function getParentFiber(
  fiber: ReactFiberNode | null,
  skipHostComponents: boolean = false
): ReactFiberNode | null {
  if (!fiber || !fiber.return) return null;

  if (!skipHostComponents) {
    return fiber.return;
  }

  // Skip host components and return the nearest component parent
  let parent: ReactFiberNode | null = fiber.return;
  while (parent) {
    if (isComponentFiber(parent)) {
      return parent;
    }
    parent = parent.return;
  }

  return null;
}

/**
 * Get all ancestor Fiber nodes up to the root
 * @param fiber - Starting Fiber node
 * @returns Array of ancestor Fiber nodes (from immediate parent to root)
 */
export function getAncestorFibers(
  fiber: ReactFiberNode | null
): ReactFiberNode[] {
  if (!fiber) return [];

  const ancestors: ReactFiberNode[] = [];
  let current: ReactFiberNode | null = fiber.return;

  while (current) {
    ancestors.push(current);
    current = current.return;
  }

  return ancestors;
}

/**
 * Get the component path (breadcrumb) from root to current fiber
 * @param fiber - Target Fiber node
 * @param componentsOnly - Only include component fibers, skip host components
 * @returns Array of component names from root to current
 */
export function getComponentPath(
  fiber: ReactFiberNode | null,
  componentsOnly: boolean = true
): string[] {
  if (!fiber) return [];

  const ancestors = getAncestorFibers(fiber);
  const path = [...ancestors.reverse(), fiber];

  return path
    .filter((f) => !componentsOnly || isComponentFiber(f))
    .map((f) => {
      if (f.type && typeof f.type === 'string') {
        return f.type;
      }
      if (f.type && f.type.name) {
        return f.type.name;
      }
      if (f.type && f.type.displayName) {
        return f.type.displayName;
      }
      return 'Anonymous';
    });
}

/**
 * Find a Fiber node by predicate function
 * @param startFiber - Starting point for search
 * @param predicate - Function that returns true for the target fiber
 * @param searchDirection - Direction to search: 'down' (children), 'up' (ancestors), 'all'
 * @returns Found Fiber node or null
 */
export function findFiber(
  startFiber: ReactFiberNode | null,
  predicate: (fiber: ReactFiberNode) => boolean,
  searchDirection: 'down' | 'up' | 'all' = 'down'
): ReactFiberNode | null {
  if (!startFiber) return null;

  if (searchDirection === 'up' || searchDirection === 'all') {
    // Search upwards
    let current: ReactFiberNode | null = startFiber;
    while (current) {
      if (predicate(current)) return current;
      current = current.return;
    }
  }

  if (searchDirection === 'down' || searchDirection === 'all') {
    // Search downwards
    let found: ReactFiberNode | null = null;
    traverseFiberTree(startFiber, (fiber) => {
      if (predicate(fiber)) {
        found = fiber;
        return false; // Stop traversal
      }
    });
    return found;
  }

  return null;
}

/**
 * Find all Fiber nodes matching a predicate
 * @param startFiber - Starting point for search
 * @param predicate - Function that returns true for matching fibers
 * @param maxDepth - Maximum depth to search
 * @returns Array of matching Fiber nodes
 */
export function findAllFibers(
  startFiber: ReactFiberNode | null,
  predicate: (fiber: ReactFiberNode) => boolean,
  maxDepth: number = Infinity
): ReactFiberNode[] {
  const matches: ReactFiberNode[] = [];

  traverseFiberTree(
    startFiber,
    (fiber) => {
      if (predicate(fiber)) {
        matches.push(fiber);
      }
    },
    maxDepth
  );

  return matches;
}

/**
 * Get sibling Fiber nodes
 * @param fiber - Starting Fiber node
 * @returns Array of sibling Fiber nodes (not including the input fiber)
 */
export function getSiblingFibers(
  fiber: ReactFiberNode | null
): ReactFiberNode[] {
  if (!fiber || !fiber.return) return [];

  const siblings: ReactFiberNode[] = [];
  let sibling: ReactFiberNode | null = fiber.return.child;

  while (sibling) {
    if (sibling !== fiber) {
      siblings.push(sibling);
    }
    sibling = sibling.sibling;
  }

  return siblings;
}

/**
 * Count the depth of a Fiber node from root
 * @param fiber - Target Fiber node
 * @returns Depth (0 for root)
 */
export function getFiberDepth(fiber: ReactFiberNode | null): number {
  if (!fiber) return 0;

  let depth = 0;
  let current: ReactFiberNode | null = fiber;

  while (current.return) {
    depth++;
    current = current.return;
  }

  return depth;
}

/**
 * Count total descendants of a Fiber node
 * @param fiber - Parent Fiber node
 * @returns Number of descendant nodes
 */
export function countDescendants(fiber: ReactFiberNode | null): number {
  if (!fiber) return 0;

  let count = 0;
  traverseFiberTree(fiber.child, () => {
    count++;
  });

  return count;
}

/**
 * Get the nearest host component (HTML element) from a component Fiber
 * @param fiber - Component Fiber node
 * @returns Host Fiber node or null
 */
export function findNearestHostFiber(
  fiber: ReactFiberNode | null
): ReactFiberNode | null {
  if (!fiber) return null;

  // If this is already a host component, return it
  if (isHostFiber(fiber)) {
    return fiber;
  }

  // Search children for first host component
  return findFiber(fiber, isHostFiber, 'down');
}

/**
 * Get all host components (HTML elements) under a component
 * @param fiber - Component Fiber node
 * @param maxDepth - Maximum depth to search
 * @returns Array of host Fiber nodes
 */
export function findAllHostFibers(
  fiber: ReactFiberNode | null,
  maxDepth: number = Infinity
): ReactFiberNode[] {
  return findAllFibers(fiber, isHostFiber, maxDepth);
}

/**
 * Check if a Fiber is an ancestor of another Fiber
 * @param potentialAncestor - The potential ancestor Fiber
 * @param fiber - The Fiber to check
 * @returns True if potentialAncestor is an ancestor of fiber
 */
export function isAncestorOf(
  potentialAncestor: ReactFiberNode,
  fiber: ReactFiberNode
): boolean {
  let current: ReactFiberNode | null = fiber.return;

  while (current) {
    if (current === potentialAncestor) {
      return true;
    }
    current = current.return;
  }

  return false;
}

/**
 * Get the common ancestor of two Fiber nodes
 * @param fiber1 - First Fiber node
 * @param fiber2 - Second Fiber node
 * @returns Common ancestor Fiber or null
 */
export function findCommonAncestor(
  fiber1: ReactFiberNode | null,
  fiber2: ReactFiberNode | null
): ReactFiberNode | null {
  if (!fiber1 || !fiber2) return null;

  const ancestors1 = new Set(getAncestorFibers(fiber1));

  let current: ReactFiberNode | null = fiber2;
  while (current) {
    if (ancestors1.has(current)) {
      return current;
    }
    current = current.return;
  }

  return null;
}
