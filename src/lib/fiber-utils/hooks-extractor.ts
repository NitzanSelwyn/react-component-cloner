/**
 * Hooks Extractor - Extract React hooks state from function components
 */

import type { ReactFiberNode, HookState } from '@/types';
import { isFunctionComponent } from './component-identifier';

/**
 * Internal hook structure (based on React internals)
 */
interface Hook {
  memoizedState: any;
  baseState: any;
  baseQueue: any;
  queue: any;
  next: Hook | null;
}

/**
 * Extract all hooks from a function component
 * @param fiber - The Fiber node (must be a function component)
 * @returns Array of hook states
 */
export function extractHooks(fiber: ReactFiberNode): HookState[] {
  if (!isFunctionComponent(fiber)) {
    return [];
  }

  const hooks: HookState[] = [];
  let currentHook: Hook | null = fiber.memoizedState as Hook | null;
  let index = 0;

  while (currentHook) {
    const hookState = analyzeHook(currentHook, index);
    if (hookState) {
      hooks.push(hookState);
    }
    currentHook = currentHook.next;
    index++;
  }

  return hooks;
}

/**
 * Analyze a single hook and determine its type and value
 * @param hook - The hook object
 * @param _index - Index of the hook (unused but kept for future use)
 * @returns HookState object
 */
function analyzeHook(hook: Hook, _index: number): HookState | null {
  if (!hook) return null;

  const state = hook.memoizedState;

  // Detect hook type based on structure
  const hookType = detectHookType(hook, state);

  return {
    type: hookType,
    value: sanitizeHookValue(state, hookType),
  };
}

/**
 * Detect the type of hook based on its structure
 * @param hook - The hook object
 * @param state - The memoized state
 * @returns Hook type name
 */
function detectHookType(hook: Hook, state: any): string {
  // useState/useReducer - state is the actual value
  if (hook.queue && hook.queue.dispatch) {
    return 'useState';
  }

  // useEffect/useLayoutEffect - state has destroy/create/deps
  if (
    state &&
    typeof state === 'object' &&
    ('create' in state || 'destroy' in state || 'deps' in state)
  ) {
    return 'useEffect';
  }

  // useMemo - state has a value property
  if (state && typeof state === 'object' && state.hasOwnProperty('_source')) {
    return 'useMemo';
  }

  // useCallback - similar to useMemo
  if (typeof state === 'function') {
    return 'useCallback';
  }

  // useRef - state is an object with current property
  if (state && typeof state === 'object' && 'current' in state) {
    return 'useRef';
  }

  // useContext - state is the context value
  if (state && typeof state === 'object' && !hook.queue) {
    return 'useContext';
  }

  return 'unknown';
}

/**
 * Sanitize hook value for safe serialization
 * @param value - The hook value
 * @param hookType - The type of hook
 * @returns Sanitized value
 */
function sanitizeHookValue(value: any, hookType: string): any {
  if (value === null || value === undefined) {
    return value;
  }

  switch (hookType) {
    case 'useState':
      return sanitizeValue(value);

    case 'useEffect':
    case 'useLayoutEffect':
      if (value && typeof value === 'object') {
        return {
          hasDeps: !!value.deps,
          deps: value.deps ? sanitizeValue(value.deps) : null,
          hasCleanup: !!value.destroy,
        };
      }
      return value;

    case 'useMemo':
    case 'useCallback':
      if (typeof value === 'function') {
        return `[Function]`;
      }
      return sanitizeValue(value);

    case 'useRef':
      if (value && typeof value === 'object' && 'current' in value) {
        return {
          current: sanitizeValue(value.current),
        };
      }
      return sanitizeValue(value);

    case 'useContext':
      return sanitizeValue(value);

    default:
      return sanitizeValue(value);
  }
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

  // Handle DOM elements
  if (value instanceof Element || value instanceof HTMLElement) {
    return `[${value.tagName}]`;
  }

  // Handle objects
  if (typeof value === 'object') {
    const sanitized: Record<string, any> = {};
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        try {
          sanitized[key] = sanitizeValue(value[key]);
        } catch (e) {
          sanitized[key] = '[Error reading value]';
        }
      }
    }
    return sanitized;
  }

  return value;
}

/**
 * Extract useState hooks specifically
 * @param fiber - The Fiber node
 * @returns Array of state values
 */
export function extractStateHooks(fiber: ReactFiberNode): any[] {
  const hooks = extractHooks(fiber);
  return hooks.filter((h) => h.type === 'useState').map((h) => h.value);
}

/**
 * Extract useEffect hooks specifically
 * @param fiber - The Fiber node
 * @returns Array of effect information
 */
export function extractEffectHooks(fiber: ReactFiberNode): any[] {
  const hooks = extractHooks(fiber);
  return hooks
    .filter((h) => h.type === 'useEffect' || h.type === 'useLayoutEffect')
    .map((h) => h.value);
}

/**
 * Extract useRef hooks specifically
 * @param fiber - The Fiber node
 * @returns Array of ref values
 */
export function extractRefHooks(fiber: ReactFiberNode): any[] {
  const hooks = extractHooks(fiber);
  return hooks.filter((h) => h.type === 'useRef').map((h) => h.value);
}

/**
 * Extract useContext hooks specifically
 * @param fiber - The Fiber node
 * @returns Array of context values
 */
export function extractContextHooks(fiber: ReactFiberNode): any[] {
  const hooks = extractHooks(fiber);
  return hooks.filter((h) => h.type === 'useContext').map((h) => h.value);
}

/**
 * Count hooks of a specific type
 * @param fiber - The Fiber node
 * @param hookType - Type of hook to count
 * @returns Number of hooks of that type
 */
export function countHooksByType(
  fiber: ReactFiberNode,
  hookType: string
): number {
  const hooks = extractHooks(fiber);
  return hooks.filter((h) => h.type === hookType).length;
}

/**
 * Get a summary of all hooks used in a component
 * @param fiber - The Fiber node
 * @returns Object with hook type counts
 */
export function getHooksSummary(
  fiber: ReactFiberNode
): Record<string, number> {
  const hooks = extractHooks(fiber);
  const summary: Record<string, number> = {};

  for (const hook of hooks) {
    summary[hook.type] = (summary[hook.type] || 0) + 1;
  }

  return summary;
}

/**
 * Check if a component uses a specific hook type
 * @param fiber - The Fiber node
 * @param hookType - Type of hook to check for
 * @returns True if the component uses that hook
 */
export function usesHookType(fiber: ReactFiberNode, hookType: string): boolean {
  const hooks = extractHooks(fiber);
  return hooks.some((h) => h.type === hookType);
}

/**
 * Extract initial state values for code generation
 * This is useful for generating useState initial values
 * @param fiber - The Fiber node
 * @returns Array of state initial values
 */
export function extractStateInitialValues(fiber: ReactFiberNode): any[] {
  const stateHooks = extractStateHooks(fiber);
  // For code generation, we use the current values as initial values
  return stateHooks;
}
