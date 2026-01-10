/**
 * Type Generator - Generates TypeScript interfaces from React components
 *
 * This module infers prop types from runtime values and generates
 * TypeScript interfaces for component props.
 */

import type { ReactFiberNode } from '@/types';
import { extractProps } from '@lib/fiber-utils';

export interface TypeGeneratorOptions {
  /** Include optional props (default: true) */
  includeOptional?: boolean;
  /** Generate detailed JSDoc comments (default: true) */
  includeJSDoc?: boolean;
  /** Interface name (default: ComponentNameProps) */
  interfaceName?: string;
  /** Export the interface (default: true) */
  exportInterface?: boolean;
  /** Use type alias instead of interface (default: false) */
  useTypeAlias?: boolean;
}

const DEFAULT_OPTIONS: Required<TypeGeneratorOptions> = {
  includeOptional: true,
  includeJSDoc: true,
  interfaceName: '',
  exportInterface: true,
  useTypeAlias: false,
};

/**
 * Generate TypeScript interface from component props
 */
export function generatePropsInterface(
  fiber: ReactFiberNode | null,
  componentName: string,
  options: TypeGeneratorOptions = {}
): string {
  if (!fiber) {
    return '';
  }

  const opts = { ...DEFAULT_OPTIONS, ...options };
  const interfaceName = opts.interfaceName || `${componentName}Props`;

  const props = extractProps(fiber);
  if (!props || Object.keys(props).length === 0) {
    // No props - return empty interface
    const exportKeyword = opts.exportInterface ? 'export ' : '';
    const keyword = opts.useTypeAlias ? 'type' : 'interface';
    const equals = opts.useTypeAlias ? ' = ' : ' ';

    if (opts.includeJSDoc) {
      return `/**
 * Props for ${componentName} component
 */
${exportKeyword}${keyword} ${interfaceName}${equals}{}`;
    }

    return `${exportKeyword}${keyword} ${interfaceName}${equals}{}`;
  }

  // Generate prop types
  const propTypes = generatePropTypes(props, opts);
  const exportKeyword = opts.exportInterface ? 'export ' : '';

  if (opts.useTypeAlias) {
    // Type alias format
    const jsdoc = opts.includeJSDoc ? `/**\n * Props for ${componentName} component\n */\n` : '';
    return `${jsdoc}${exportKeyword}type ${interfaceName} = {
${propTypes}
}`;
  }

  // Interface format
  const jsdoc = opts.includeJSDoc ? `/**\n * Props for ${componentName} component\n */\n` : '';
  return `${jsdoc}${exportKeyword}interface ${interfaceName} {
${propTypes}
}`;
}

/**
 * Generate prop type definitions
 */
function generatePropTypes(
  props: Record<string, any>,
  opts: Required<TypeGeneratorOptions>
): string {
  const lines: string[] = [];

  for (const [key, value] of Object.entries(props)) {
    // Skip special React props
    if (key === 'children' || key === 'key' || key === 'ref') {
      continue;
    }

    // Skip internal props
    if (key.startsWith('__')) {
      continue;
    }

    const type = inferType(value);
    const optional = opts.includeOptional ? '?' : '';
    const jsdoc = opts.includeJSDoc ? generatePropJSDoc(key, value) : '';

    lines.push(`${jsdoc}  ${key}${optional}: ${type};`);
  }

  // Add children prop if it exists in original props
  if ('children' in props) {
    const jsdoc = opts.includeJSDoc ? '  /** Child elements */\n' : '';
    const optional = opts.includeOptional ? '?' : '';
    lines.push(`${jsdoc}  children${optional}: React.ReactNode;`);
  }

  return lines.join('\n');
}

/**
 * Infer TypeScript type from runtime value
 */
function inferType(value: any): string {
  // Null/undefined
  if (value === null) {
    return 'null';
  }
  if (value === undefined) {
    return 'undefined';
  }

  // Primitives
  if (typeof value === 'string') {
    return 'string';
  }
  if (typeof value === 'number') {
    return 'number';
  }
  if (typeof value === 'boolean') {
    return 'boolean';
  }

  // Functions
  if (typeof value === 'function') {
    return '() => void';
  }

  // Arrays
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return 'any[]';
    }

    // Infer array element type from first element
    const firstType = inferType(value[0]);
    const allSameType = value.every((item) => inferType(item) === firstType);

    if (allSameType) {
      return `${firstType}[]`;
    }

    return 'any[]';
  }

  // Objects
  if (typeof value === 'object') {
    // React elements
    if (value.$$typeof) {
      return 'React.ReactElement';
    }

    // Style objects
    if (isStyleObject(value)) {
      return 'React.CSSProperties';
    }

    // Plain objects
    return 'Record<string, any>';
  }

  return 'any';
}

/**
 * Check if object is a style object
 */
function isStyleObject(obj: any): boolean {
  const styleProps = [
    'color',
    'backgroundColor',
    'fontSize',
    'margin',
    'padding',
    'display',
    'position',
    'width',
    'height',
  ];

  const keys = Object.keys(obj);
  return keys.some((key) => styleProps.includes(key));
}

/**
 * Generate JSDoc comment for a prop
 */
function generatePropJSDoc(key: string, value: any): string {
  const type = typeof value;
  let description = '';

  // Generate description based on prop name and type
  if (key.startsWith('on') && /^on[A-Z]/.test(key)) {
    const eventName = key.slice(2);
    description = `Handler for ${eventName} event`;
  } else if (key.endsWith('Ref')) {
    description = 'React ref object';
  } else if (key === 'className' || key === 'class') {
    description = 'CSS class name';
  } else if (key === 'style') {
    description = 'Inline styles';
  } else if (key === 'id') {
    description = 'Element ID';
  } else if (key.startsWith('aria-')) {
    description = 'Accessibility attribute';
  } else if (key.startsWith('data-')) {
    description = 'Data attribute';
  } else if (type === 'boolean') {
    description = `Whether to ${key}`;
  } else if (type === 'string') {
    description = `${capitalize(key)} value`;
  } else if (type === 'number') {
    description = `${capitalize(key)} value`;
  } else {
    description = `${capitalize(key)} prop`;
  }

  return `  /** ${description} */\n`;
}

/**
 * Capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Generate props interface with children
 */
export function generatePropsWithChildren(
  fiber: ReactFiberNode | null,
  componentName: string,
  options: TypeGeneratorOptions = {}
): string {
  const propsInterface = generatePropsInterface(fiber, componentName, options);

  // If interface already has children, return as-is
  if (propsInterface.includes('children')) {
    return propsInterface;
  }

  // Add children prop
  const lines = propsInterface.split('\n');
  const closingBrace = lines[lines.length - 1];
  const interfaceBody = lines.slice(0, -1);

  const jsdoc = options.includeJSDoc !== false ? '  /** Child elements */\n' : '';
  const optional = options.includeOptional !== false ? '?' : '';

  return [...interfaceBody, `${jsdoc}  children${optional}: React.ReactNode;`, closingBrace].join(
    '\n'
  );
}

/**
 * Generate state interface for components with useState
 */
export function generateStateInterface(
  stateValues: Record<string, any>,
  componentName: string,
  options: TypeGeneratorOptions = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const interfaceName = opts.interfaceName || `${componentName}State`;

  if (Object.keys(stateValues).length === 0) {
    return '';
  }

  const stateTypes: string[] = [];

  for (const [key, value] of Object.entries(stateValues)) {
    const type = inferType(value);
    const jsdoc = opts.includeJSDoc ? `  /** ${capitalize(key)} state value */\n` : '';
    stateTypes.push(`${jsdoc}  ${key}: ${type};`);
  }

  const exportKeyword = opts.exportInterface ? 'export ' : '';
  const jsdoc = opts.includeJSDoc ? `/**\n * State for ${componentName} component\n */\n` : '';

  if (opts.useTypeAlias) {
    return `${jsdoc}${exportKeyword}type ${interfaceName} = {
${stateTypes.join('\n')}
}`;
  }

  return `${jsdoc}${exportKeyword}interface ${interfaceName} {
${stateTypes.join('\n')}
}`;
}

/**
 * Generate union type from possible values
 */
export function generateUnionType(values: any[], typeName: string): string {
  const uniqueTypes = [...new Set(values.map((v) => inferType(v)))];

  if (uniqueTypes.length === 0) {
    return `type ${typeName} = any;`;
  }

  if (uniqueTypes.length === 1) {
    return `type ${typeName} = ${uniqueTypes[0]};`;
  }

  return `type ${typeName} = ${uniqueTypes.join(' | ')};`;
}

/**
 * Generate event handler type
 */
export function generateEventHandlerType(eventName: string): string {
  const eventMap: Record<string, string> = {
    onClick: 'MouseEvent',
    onChange: 'ChangeEvent',
    onSubmit: 'FormEvent',
    onKeyDown: 'KeyboardEvent',
    onKeyUp: 'KeyboardEvent',
    onKeyPress: 'KeyboardEvent',
    onFocus: 'FocusEvent',
    onBlur: 'FocusEvent',
    onMouseEnter: 'MouseEvent',
    onMouseLeave: 'MouseEvent',
    onMouseMove: 'MouseEvent',
    onMouseDown: 'MouseEvent',
    onMouseUp: 'MouseEvent',
    onTouchStart: 'TouchEvent',
    onTouchEnd: 'TouchEvent',
    onTouchMove: 'TouchEvent',
    onScroll: 'UIEvent',
    onWheel: 'WheelEvent',
    onDrag: 'DragEvent',
    onDrop: 'DragEvent',
  };

  const eventType = eventMap[eventName] || 'SyntheticEvent';
  return `(event: React.${eventType}) => void`;
}

/**
 * Generate complete type definitions for a component
 */
export function generateCompleteTypes(
  fiber: ReactFiberNode | null,
  componentName: string,
  stateValues: Record<string, any> = {},
  options: TypeGeneratorOptions = {}
): string {
  const parts: string[] = [];

  // Props interface
  const propsInterface = generatePropsInterface(fiber, componentName, options);
  if (propsInterface) {
    parts.push(propsInterface);
  }

  // State interface (if component has state)
  if (Object.keys(stateValues).length > 0) {
    const stateInterface = generateStateInterface(stateValues, componentName, options);
    if (stateInterface) {
      parts.push('');
      parts.push(stateInterface);
    }
  }

  return parts.join('\n');
}
