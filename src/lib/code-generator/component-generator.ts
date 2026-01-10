/**
 * Component Generator - Generates complete React component files
 *
 * This module combines JSX generation, type generation, and import generation
 * to create production-ready component files.
 */

import type { ReactFiberNode, ComponentInfo } from '@/types';
import {
  getComponentName,
  extractHooks,
  identifyComponentType,
  extractProps,
} from '@lib/fiber-utils';
import { generateCSS, generateInlineStyles, generateStyledComponents } from '@lib/style-extractor';
import { generateJSX } from './jsx-generator';
import { generatePropsInterface, generateCompleteTypes } from './type-generator';
import { generateCompleteImports } from './import-generator';

export interface ComponentGeneratorOptions {
  /** Component name (default: extracted from fiber) */
  componentName?: string;
  /** Use TypeScript (.tsx) or JavaScript (.jsx) */
  typescript?: boolean;
  /** Include prop types/interfaces */
  includeTypes?: boolean;
  /** Styling strategy */
  styleStrategy?: 'inline' | 'css-module' | 'styled-components' | 'plain-css' | 'none';
  /** Include comments explaining the code */
  includeComments?: boolean;
  /** Format code with Prettier (placeholder) */
  formatCode?: boolean;
  /** Function component or class component */
  componentType?: 'function' | 'class' | 'auto';
  /** Include useState initial values */
  includeState?: boolean;
  /** JSX extraction depth */
  extractDepth?: 'shallow' | 'deep';
  /** Include export statement */
  includeExport?: boolean;
}

const DEFAULT_OPTIONS: Required<ComponentGeneratorOptions> = {
  componentName: '',
  typescript: true,
  includeTypes: true,
  styleStrategy: 'css-module',
  includeComments: true,
  formatCode: true,
  componentType: 'auto',
  includeState: false,
  extractDepth: 'deep',
  includeExport: true,
};

/**
 * Generate complete component file
 */
export function generateComponent(
  fiber: ReactFiberNode | null,
  componentInfo?: ComponentInfo,
  options: ComponentGeneratorOptions = {}
): string {
  if (!fiber) {
    return '';
  }

  const opts = { ...DEFAULT_OPTIONS, ...options };
  const componentName = opts.componentName || getComponentName(fiber) || 'Component';

  // Extract component information
  const componentType = identifyComponentType(fiber);

  // Determine component type
  const useClassComponent =
    opts.componentType === 'class' ||
    (opts.componentType === 'auto' && componentType === 'class');

  // Generate sections
  const imports = generateImportSection(fiber, componentInfo, opts);
  const types = opts.includeTypes && opts.typescript
    ? generateTypeSection(fiber, componentName, opts)
    : '';
  const component = useClassComponent
    ? generateClassComponent(fiber, componentName, componentInfo, opts)
    : generateFunctionComponent(fiber, componentName, componentInfo, opts);
  const styles = generateStyleSection(componentInfo, componentName, opts);
  const exportStatement = opts.includeExport ? generateExportStatement(componentName) : '';

  // Combine sections
  const sections = [imports, types, component, styles, exportStatement].filter(Boolean);

  return sections.join('\n\n');
}

/**
 * Generate import section
 */
function generateImportSection(
  fiber: ReactFiberNode,
  _componentInfo: ComponentInfo | undefined,
  opts: Required<ComponentGeneratorOptions>
): string {
  const hooks = extractHooks(fiber);
  const usedHooks: string[] = [];

  // Extract unique hook types
  const hookTypes = new Set(hooks.map((hook) => hook.type));
  hookTypes.forEach((type) => {
    if (type !== 'unknown') {
      usedHooks.push(type);
    }
  });

  // Generate JSX to detect libraries
  const jsxCode = generateJSX(fiber, { maxDepth: 2 });

  // Map style strategy to import style type
  let styleType: 'css' | 'scss' | 'module' | 'styled-components' | undefined;
  if (opts.styleStrategy === 'css-module') {
    styleType = 'module';
  } else if (opts.styleStrategy === 'plain-css') {
    styleType = 'css';
  } else if (opts.styleStrategy === 'styled-components') {
    styleType = 'styled-components';
  }

  const imports = generateCompleteImports({
    hooks: usedHooks,
    styleType,
    stylePath:
      opts.styleStrategy === 'css-module'
        ? './Component.module.css'
        : opts.styleStrategy === 'plain-css'
          ? './Component.css'
          : undefined,
    jsxCode,
    typescript: opts.typescript,
    reactImportStyle: 'namespace',
  });

  return imports;
}

/**
 * Generate type definitions section
 */
function generateTypeSection(
  fiber: ReactFiberNode,
  componentName: string,
  opts: Required<ComponentGeneratorOptions>
): string {
  return generatePropsInterface(fiber, componentName, {
    includeJSDoc: opts.includeComments,
    exportInterface: true,
  });
}

/**
 * Generate function component
 */
function generateFunctionComponent(
  fiber: ReactFiberNode,
  componentName: string,
  componentInfo: ComponentInfo | undefined,
  opts: Required<ComponentGeneratorOptions>
): string {
  const lines: string[] = [];

  // JSDoc comment
  if (opts.includeComments) {
    lines.push(`/**`);
    lines.push(` * ${componentName} component`);
    if (componentInfo?.type) {
      lines.push(` * Type: ${componentInfo.type}`);
    }
    lines.push(` */`);
  }

  // Function signature
  const propsParam = opts.includeTypes && opts.typescript ? `: ${componentName}Props` : '';
  lines.push(`function ${componentName}(props${propsParam}) {`);

  // Destructure props (if any)
  const props = extractProps(fiber);
  if (props && Object.keys(props).length > 0) {
    const propNames = Object.keys(props)
      .filter((key) => key !== 'children' && !key.startsWith('__'))
      .slice(0, 5); // Limit to first 5 props
    if (propNames.length > 0) {
      lines.push(`  const { ${propNames.join(', ')} } = props;`);
      lines.push('');
    }
  }

  // State hooks (placeholder)
  if (opts.includeState) {
    const hooks = extractHooks(fiber);
    const stateHooks = hooks.filter((hook) => hook.type === 'useState');
    if (stateHooks.length > 0) {
      if (opts.includeComments) {
        lines.push('  // State');
      }
      stateHooks.forEach((state, index) => {
        const stateName = `state${index}`;
        const initialValue = JSON.stringify(state.value);
        lines.push(`  const [${stateName}, set${capitalize(stateName)}] = React.useState(${initialValue});`);
      });
      lines.push('');
    }
  }

  // Event handlers (placeholder)
  if (opts.includeComments) {
    lines.push('  // TODO: Implement event handlers');
    lines.push('  const handleEvent = () => {');
    lines.push('    // Handle events');
    lines.push('  };');
    lines.push('');
  }

  // JSX return
  const jsx = generateJSX(fiber, {
    prettify: true,
    maxDepth: opts.extractDepth === 'shallow' ? 3 : 10,
    extractDepth: opts.extractDepth,
    indentLevel: 2,
  });

  lines.push('  return (');
  if (jsx) {
    // Indent JSX
    const indentedJsx = jsx
      .split('\n')
      .map((line) => '    ' + line)
      .join('\n');
    lines.push(indentedJsx);
  } else {
    lines.push('    <div>');
    lines.push('      {/* Component content */}');
    lines.push('    </div>');
  }
  lines.push('  );');

  lines.push('}');

  return lines.join('\n');
}

/**
 * Generate class component
 */
function generateClassComponent(
  fiber: ReactFiberNode,
  componentName: string,
  _componentInfo: ComponentInfo | undefined,
  opts: Required<ComponentGeneratorOptions>
): string {
  const lines: string[] = [];

  // JSDoc comment
  if (opts.includeComments) {
    lines.push(`/**`);
    lines.push(` * ${componentName} component (Class)`);
    lines.push(` */`);
  }

  // Class signature
  const propsType = opts.includeTypes && opts.typescript ? `<${componentName}Props>` : '';
  lines.push(`class ${componentName} extends React.Component${propsType} {`);

  // Constructor
  if (opts.includeState) {
    lines.push('  constructor(props) {');
    lines.push('    super(props);');
    lines.push('    this.state = {};');
    lines.push('  }');
    lines.push('');
  }

  // Event handlers
  if (opts.includeComments) {
    lines.push('  handleEvent = () => {');
    lines.push('    // TODO: Implement event handlers');
    lines.push('  };');
    lines.push('');
  }

  // Render method
  lines.push('  render() {');

  const jsx = generateJSX(fiber, {
    prettify: true,
    maxDepth: opts.extractDepth === 'shallow' ? 3 : 10,
    extractDepth: opts.extractDepth,
    indentLevel: 3,
  });

  lines.push('    return (');
  if (jsx) {
    const indentedJsx = jsx
      .split('\n')
      .map((line) => '      ' + line)
      .join('\n');
    lines.push(indentedJsx);
  } else {
    lines.push('      <div>');
    lines.push('        {/* Component content */}');
    lines.push('      </div>');
  }
  lines.push('    );');
  lines.push('  }');

  lines.push('}');

  return lines.join('\n');
}

/**
 * Generate style section
 */
function generateStyleSection(
  componentInfo: ComponentInfo | undefined,
  componentName: string,
  opts: Required<ComponentGeneratorOptions>
): string {
  if (opts.styleStrategy === 'none' || !componentInfo?.styles) {
    return '';
  }

  const { computed, strategy } = componentInfo.styles;

  if (!computed || Object.keys(computed).length === 0) {
    return '';
  }

  const lines: string[] = [];

  if (opts.includeComments) {
    lines.push('/**');
    lines.push(` * Styles for ${componentName}`);
    lines.push(` * Strategy: ${strategy}`);
    lines.push(' */');
  }

  switch (opts.styleStrategy) {
    case 'inline':
      const inlineStyles = generateInlineStyles(computed, componentName, opts.includeComments);
      lines.push(inlineStyles);
      break;

    case 'styled-components':
      const styledComponent = generateStyledComponents(computed, componentName, opts.includeComments);
      lines.push(styledComponent);
      break;

    case 'css-module':
    case 'plain-css':
      const plainCSS = generateCSS(computed, {
        strategy: 'plain-css',
        componentName,
        includeComments: opts.includeComments,
      });
      const css = plainCSS;
      if (opts.includeComments) {
        lines.push('/*');
        lines.push(' * Save this CSS in a separate file:');
        lines.push(
          ` * ${opts.styleStrategy === 'css-module' ? 'Component.module.css' : 'Component.css'}`
        );
        lines.push(' */');
      }
      lines.push('/*');
      lines.push(css);
      lines.push('*/');
      break;
  }

  return lines.join('\n');
}

/**
 * Generate export statement
 */
function generateExportStatement(componentName: string): string {
  return `export default ${componentName};`;
}

/**
 * Capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Generate component file with all sections
 */
export function generateCompleteFile(
  componentInfo: ComponentInfo,
  options: ComponentGeneratorOptions = {}
): string {
  return generateComponent(componentInfo.fiberNode, componentInfo, options);
}

/**
 * Generate multiple component files (for nested extraction)
 */
export function generateComponentPackage(
  componentInfo: ComponentInfo,
  options: ComponentGeneratorOptions = {}
): Map<string, string> {
  const files = new Map<string, string>();

  const opts = { ...DEFAULT_OPTIONS, ...options };
  const componentName = opts.componentName || componentInfo.name || 'Component';

  // Main component file
  const ext = opts.typescript ? 'tsx' : 'jsx';
  const componentFile = generateComponent(componentInfo.fiberNode, componentInfo, options);
  files.set(`${componentName}.${ext}`, componentFile);

  // Style file (if needed)
  if (opts.styleStrategy === 'css-module' && componentInfo.styles?.computed) {
    const cssModule = generateCSS(componentInfo.styles.computed, {
      strategy: 'css-module',
      componentName,
      includeComments: opts.includeComments,
    });
    files.set(`${componentName}.module.css`, cssModule);
  } else if (opts.styleStrategy === 'plain-css' && componentInfo.styles?.computed) {
    const plainCSS = generateCSS(componentInfo.styles.computed, {
      strategy: 'plain-css',
      componentName,
      includeComments: opts.includeComments,
    });
    files.set(`${componentName}.css`, plainCSS);
  }

  // Type definition file (if TypeScript and separate types requested)
  if (opts.typescript && opts.includeTypes) {
    const types = generateCompleteTypes(componentInfo.fiberNode, componentName);
    files.set(`${componentName}.types.ts`, types);
  }

  // Index file (barrel export)
  files.set(
    'index.ts',
    `export { default } from './${componentName}';\nexport * from './${componentName}.types';`
  );

  // README with usage example
  const readme = generateComponentReadme(componentName, componentInfo, opts);
  files.set('README.md', readme);

  return files;
}

/**
 * Generate README for component
 */
function generateComponentReadme(
  componentName: string,
  _componentInfo: ComponentInfo,
  opts: Required<ComponentGeneratorOptions>
): string {
  const ext = opts.typescript ? 'tsx' : 'jsx';

  return `# ${componentName}

## Description

${componentName} component extracted from React application.

## Usage

\`\`\`${ext}
import ${componentName} from './${componentName}';

function App() {
  return (
    <${componentName} />
  );
}
\`\`\`

## Props

See \`${componentName}.types.ts\` for full prop definitions.

## Styling

This component uses ${opts.styleStrategy} for styling.

## Notes

- This component was auto-generated from a live React application
- You may need to adjust event handlers and dynamic data
- Review and test the component before using in production

## Generated by

React Component Cloner Chrome Extension
`;
}

/**
 * Quick generate with sensible defaults
 */
export function quickGenerate(fiber: ReactFiberNode): string {
  return generateComponent(fiber, undefined, {
    typescript: true,
    includeTypes: true,
    styleStrategy: 'css-module',
    includeComments: true,
    extractDepth: 'deep',
  });
}
