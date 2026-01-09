/**
 * Component Identifier - Utilities to identify React component types
 */

import type { ReactFiberNode, ComponentType } from '@/types';

/**
 * Identify the type of a React component from its Fiber node
 * @param fiber - The Fiber node to identify
 * @returns The component type
 */
export function identifyComponentType(fiber: ReactFiberNode): ComponentType {
  const tag = fiber.tag;

  // Fiber tags reference:
  // https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactWorkTags.js
  switch (tag) {
    case 0:
      return 'function';
    case 1:
      return 'class';
    case 5:
      return 'html';
    case 7:
      return 'fragment';
    case 9:
      return 'context.consumer';
    case 10:
      return 'context.provider';
    case 11:
      // ForwardRef
      return 'forwardRef';
    case 14:
    case 15:
      // MemoComponent
      return 'memo';
    default:
      // Default to function component for unknown types
      return 'function';
  }
}

/**
 * Check if a component is a function component
 * @param fiber - The Fiber node
 * @returns True if the component is a function component
 */
export function isFunctionComponent(fiber: ReactFiberNode): boolean {
  return fiber.tag === 0;
}

/**
 * Check if a component is a class component
 * @param fiber - The Fiber node
 * @returns True if the component is a class component
 */
export function isClassComponent(fiber: ReactFiberNode): boolean {
  return fiber.tag === 1;
}

/**
 * Check if a component is wrapped with React.memo
 * @param fiber - The Fiber node
 * @returns True if the component is memoized
 */
export function isMemoComponent(fiber: ReactFiberNode): boolean {
  return fiber.tag === 14 || fiber.tag === 15;
}

/**
 * Check if a component is a forwardRef component
 * @param fiber - The Fiber node
 * @returns True if the component uses forwardRef
 */
export function isForwardRefComponent(fiber: ReactFiberNode): boolean {
  return fiber.tag === 11;
}

/**
 * Check if a component is a context provider
 * @param fiber - The Fiber node
 * @returns True if the component is a context provider
 */
export function isContextProvider(fiber: ReactFiberNode): boolean {
  return fiber.tag === 10;
}

/**
 * Check if a component is a context consumer
 * @param fiber - The Fiber node
 * @returns True if the component is a context consumer
 */
export function isContextConsumer(fiber: ReactFiberNode): boolean {
  return fiber.tag === 9;
}

/**
 * Check if a component is a Fragment
 * @param fiber - The Fiber node
 * @returns True if the component is a Fragment
 */
export function isFragment(fiber: ReactFiberNode): boolean {
  return fiber.tag === 7;
}

/**
 * Check if a component is a host component (HTML element)
 * @param fiber - The Fiber node
 * @returns True if the component is an HTML element
 */
export function isHostComponent(fiber: ReactFiberNode): boolean {
  return fiber.tag === 5;
}

/**
 * Check if a component is a text node
 * @param fiber - The Fiber node
 * @returns True if the component is a text node
 */
export function isTextNode(fiber: ReactFiberNode): boolean {
  return fiber.tag === 6;
}

/**
 * Check if a component uses hooks
 * A component uses hooks if it has memoizedState
 * @param fiber - The Fiber node
 * @returns True if the component uses hooks
 */
export function usesHooks(fiber: ReactFiberNode): boolean {
  return (
    isFunctionComponent(fiber) &&
    fiber.memoizedState !== null &&
    fiber.memoizedState !== undefined
  );
}

/**
 * Get the unwrapped component type for memo and forwardRef
 * @param fiber - The Fiber node
 * @returns The unwrapped type or the original type
 */
export function getUnwrappedType(fiber: ReactFiberNode): any {
  if (isMemoComponent(fiber)) {
    // For memo components, type is the memoized component
    return fiber.type?.type || fiber.type;
  }

  if (isForwardRefComponent(fiber)) {
    // For forwardRef components, type.render is the actual component
    return fiber.type?.render || fiber.type;
  }

  return fiber.type;
}

/**
 * Check if a component is a native HTML element (not a React component)
 * @param fiber - The Fiber node
 * @returns True if it's a native HTML element
 */
export function isNativeElement(fiber: ReactFiberNode): boolean {
  return isHostComponent(fiber) && typeof fiber.type === 'string';
}

/**
 * Get detailed component information
 * @param fiber - The Fiber node
 * @returns Object with detailed type information
 */
export function getComponentTypeInfo(fiber: ReactFiberNode): {
  type: ComponentType;
  isFunction: boolean;
  isClass: boolean;
  isMemo: boolean;
  isForwardRef: boolean;
  isFragment: boolean;
  isHost: boolean;
  isNative: boolean;
  usesHooks: boolean;
  tag: number;
  tagName: string;
} {
  return {
    type: identifyComponentType(fiber),
    isFunction: isFunctionComponent(fiber),
    isClass: isClassComponent(fiber),
    isMemo: isMemoComponent(fiber),
    isForwardRef: isForwardRefComponent(fiber),
    isFragment: isFragment(fiber),
    isHost: isHostComponent(fiber),
    isNative: isNativeElement(fiber),
    usesHooks: usesHooks(fiber),
    tag: fiber.tag,
    tagName: getFiberTagName(fiber.tag),
  };
}

/**
 * Get a human-readable name for a Fiber tag
 * @param tag - The Fiber tag number
 * @returns The tag name
 */
function getFiberTagName(tag: number): string {
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
 * Check if a Fiber represents a custom component (user-defined)
 * vs built-in React component or HTML element
 * @param fiber - The Fiber node
 * @returns True if it's a custom component
 */
export function isCustomComponent(fiber: ReactFiberNode): boolean {
  // Class or function components with a type that's a function
  return (
    (isFunctionComponent(fiber) || isClassComponent(fiber)) &&
    typeof fiber.type === 'function'
  );
}

/**
 * Check if a component is likely from a third-party library
 * (checks for common library naming patterns)
 * @param fiber - The Fiber node
 * @returns True if likely a third-party component
 */
export function isLikelyThirdPartyComponent(fiber: ReactFiberNode): boolean {
  const type = getUnwrappedType(fiber);
  const name =
    type?.displayName || type?.name || (typeof type === 'string' ? type : '');

  // Check for common third-party prefixes
  const thirdPartyPrefixes = [
    'Mui',
    'Material',
    'Ant',
    'Chakra',
    'Bootstrap',
    'Styled',
    'Emotion',
    'Framer',
  ];

  return thirdPartyPrefixes.some((prefix) =>
    name.toLowerCase().startsWith(prefix.toLowerCase())
  );
}
