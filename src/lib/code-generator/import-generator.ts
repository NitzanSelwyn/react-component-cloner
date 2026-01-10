/**
 * Import Generator - Generates smart import statements for components
 *
 * This module analyzes component dependencies and generates
 * appropriate import statements.
 */

export interface ImportGeneratorOptions {
  /** Use TypeScript (.tsx) or JavaScript (.jsx) */
  typescript?: boolean;
  /** Use default imports where possible */
  preferDefaultImports?: boolean;
  /** Group imports by type (React, libraries, local) */
  groupImports?: boolean;
  /** Sort imports alphabetically */
  sortImports?: boolean;
  /** Include React import (needed for JSX) */
  includeReact?: boolean;
  /** React import style: 'namespace' or 'named' */
  reactImportStyle?: 'namespace' | 'named';
}

const DEFAULT_OPTIONS: Required<ImportGeneratorOptions> = {
  typescript: true,
  preferDefaultImports: true,
  groupImports: true,
  sortImports: true,
  includeReact: true,
  reactImportStyle: 'namespace',
};

export interface ImportStatement {
  source: string;
  type: 'react' | 'library' | 'local' | 'style';
  defaultImport?: string;
  namedImports?: string[];
  namespaceImport?: string;
}

/**
 * Generate import statements
 */
export function generateImports(
  imports: ImportStatement[],
  options: ImportGeneratorOptions = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Add React import if needed
  const allImports = [...imports];
  if (opts.includeReact && !imports.some((imp) => imp.type === 'react')) {
    allImports.unshift(generateReactImport(opts.reactImportStyle));
  }

  // Group imports by type
  if (opts.groupImports) {
    const grouped = groupImportsByType(allImports);
    return [
      generateImportGroup(grouped.react, opts),
      generateImportGroup(grouped.library, opts),
      generateImportGroup(grouped.local, opts),
      generateImportGroup(grouped.style, opts),
    ]
      .filter(Boolean)
      .join('\n\n');
  }

  // Generate all imports in order
  return allImports.map((imp) => generateImportStatement(imp, opts)).join('\n');
}

/**
 * Generate React import statement
 */
function generateReactImport(style: 'namespace' | 'named'): ImportStatement {
  if (style === 'named') {
    return {
      source: 'react',
      type: 'react',
      namedImports: ['useState', 'useEffect'],
    };
  }

  return {
    source: 'react',
    type: 'react',
    namespaceImport: 'React',
  };
}

/**
 * Group imports by type
 */
function groupImportsByType(imports: ImportStatement[]): {
  react: ImportStatement[];
  library: ImportStatement[];
  local: ImportStatement[];
  style: ImportStatement[];
} {
  return {
    react: imports.filter((imp) => imp.type === 'react'),
    library: imports.filter((imp) => imp.type === 'library'),
    local: imports.filter((imp) => imp.type === 'local'),
    style: imports.filter((imp) => imp.type === 'style'),
  };
}

/**
 * Generate import group
 */
function generateImportGroup(
  imports: ImportStatement[],
  opts: Required<ImportGeneratorOptions>
): string {
  if (imports.length === 0) {
    return '';
  }

  let sorted = imports;
  if (opts.sortImports) {
    sorted = [...imports].sort((a, b) => a.source.localeCompare(b.source));
  }

  return sorted.map((imp) => generateImportStatement(imp, opts)).join('\n');
}

/**
 * Generate single import statement
 */
function generateImportStatement(
  imp: ImportStatement,
  _opts: Required<ImportGeneratorOptions>
): string {
  const parts: string[] = [];

  // Namespace import (import * as Name)
  if (imp.namespaceImport) {
    return `import * as ${imp.namespaceImport} from '${imp.source}';`;
  }

  // Default import
  if (imp.defaultImport) {
    parts.push(imp.defaultImport);
  }

  // Named imports
  if (imp.namedImports && imp.namedImports.length > 0) {
    const named = `{ ${imp.namedImports.join(', ')} }`;
    parts.push(named);
  }

  // Style imports (no names)
  if (imp.type === 'style') {
    return `import '${imp.source}';`;
  }

  // Combine default and named
  const combined = parts.join(', ');
  return `import ${combined} from '${imp.source}';`;
}

/**
 * Generate imports for hooks used in component
 */
export function generateHookImports(hooks: string[]): ImportStatement {
  const reactHooks = [
    'useState',
    'useEffect',
    'useContext',
    'useReducer',
    'useCallback',
    'useMemo',
    'useRef',
    'useImperativeHandle',
    'useLayoutEffect',
    'useDebugValue',
    'useDeferredValue',
    'useTransition',
    'useId',
  ];

  const usedHooks = hooks.filter((hook) => reactHooks.includes(hook));

  return {
    source: 'react',
    type: 'react',
    namedImports: usedHooks,
  };
}

/**
 * Generate imports for child components
 */
export function generateComponentImports(
  componentNames: string[],
  baseDir: string = './components'
): ImportStatement[] {
  return componentNames.map((name) => ({
    source: `${baseDir}/${name}`,
    type: 'local',
    defaultImport: name,
  }));
}

/**
 * Generate style import
 */
export function generateStyleImport(
  stylePath: string,
  type: 'css' | 'scss' | 'module' = 'css'
): ImportStatement {
  if (type === 'module') {
    return {
      source: stylePath,
      type: 'style',
      defaultImport: 'styles',
    };
  }

  return {
    source: stylePath,
    type: 'style',
  };
}

/**
 * Generate styled-components import
 */
export function generateStyledComponentsImport(): ImportStatement {
  return {
    source: 'styled-components',
    type: 'library',
    defaultImport: 'styled',
  };
}

/**
 * Detect and generate imports for third-party libraries
 */
export function detectLibraryImports(jsxCode: string): ImportStatement[] {
  const imports: ImportStatement[] = [];

  // Material-UI
  if (/<Mui[A-Z]|<Button|<TextField|<Box|<Grid/.test(jsxCode)) {
    imports.push({
      source: '@mui/material',
      type: 'library',
      namedImports: extractMuiComponents(jsxCode),
    });
  }

  // Ant Design
  if (/<Ant|<Button|<Form|<Input|<Table/.test(jsxCode)) {
    imports.push({
      source: 'antd',
      type: 'library',
      namedImports: extractAntdComponents(jsxCode),
    });
  }

  // Chakra UI
  if (/<Chakra|<Box|<Flex|<Stack|<Button/.test(jsxCode)) {
    imports.push({
      source: '@chakra-ui/react',
      type: 'library',
      namedImports: extractChakraComponents(jsxCode),
    });
  }

  return imports;
}

/**
 * Extract Material-UI component names from JSX
 */
function extractMuiComponents(jsxCode: string): string[] {
  const regex = /<(Mui[A-Z][a-zA-Z]+|Button|TextField|Box|Grid|Container|Paper|Card)/g;
  const matches = jsxCode.match(regex);
  if (!matches) return [];

  return [...new Set(matches.map((m) => m.slice(1)))];
}

/**
 * Extract Ant Design component names from JSX
 */
function extractAntdComponents(jsxCode: string): string[] {
  const regex = /<(Button|Form|Input|Table|Select|Modal|Drawer|Menu|Layout)/g;
  const matches = jsxCode.match(regex);
  if (!matches) return [];

  return [...new Set(matches.map((m) => m.slice(1)))];
}

/**
 * Extract Chakra UI component names from JSX
 */
function extractChakraComponents(jsxCode: string): string[] {
  const regex = /<(Box|Flex|Stack|VStack|HStack|Grid|Container|Button|Input|Text|Heading)/g;
  const matches = jsxCode.match(regex);
  if (!matches) return [];

  return [...new Set(matches.map((m) => m.slice(1)))];
}

/**
 * Generate all imports for a component
 */
export function generateCompleteImports(options: {
  componentNames?: string[];
  hooks?: string[];
  styleType?: 'css' | 'scss' | 'module' | 'styled-components';
  stylePath?: string;
  jsxCode?: string;
  typescript?: boolean;
  reactImportStyle?: 'namespace' | 'named';
}): string {
  const imports: ImportStatement[] = [];

  // React import
  const reactImport = generateReactImport(options.reactImportStyle || 'namespace');
  imports.push(reactImport);

  // Hook imports
  if (options.hooks && options.hooks.length > 0) {
    const hookImport = generateHookImports(options.hooks);
    // Merge with React import if namespace style
    if (reactImport.namespaceImport) {
      imports[0] = {
        ...reactImport,
        namedImports: hookImport.namedImports,
      };
    } else {
      imports.push(hookImport);
    }
  }

  // Library imports (from JSX code)
  if (options.jsxCode) {
    const libraryImports = detectLibraryImports(options.jsxCode);
    imports.push(...libraryImports);
  }

  // Component imports
  if (options.componentNames && options.componentNames.length > 0) {
    const componentImports = generateComponentImports(options.componentNames);
    imports.push(...componentImports);
  }

  // Style imports
  if (options.styleType === 'styled-components') {
    imports.push(generateStyledComponentsImport());
  } else if (options.stylePath) {
    const styleImport = generateStyleImport(
      options.stylePath,
      options.styleType === 'module' ? 'module' : 'css'
    );
    imports.push(styleImport);
  }

  return generateImports(imports, {
    typescript: options.typescript,
    groupImports: true,
    sortImports: true,
  });
}

/**
 * Clean and optimize imports (remove duplicates, merge)
 */
export function optimizeImports(imports: ImportStatement[]): ImportStatement[] {
  const sourceMap = new Map<string, ImportStatement>();

  for (const imp of imports) {
    const existing = sourceMap.get(imp.source);

    if (!existing) {
      sourceMap.set(imp.source, { ...imp });
      continue;
    }

    // Merge named imports
    if (imp.namedImports) {
      const existingNamed = existing.namedImports || [];
      existing.namedImports = [...new Set([...existingNamed, ...imp.namedImports])];
    }

    // Use first default import
    if (imp.defaultImport && !existing.defaultImport) {
      existing.defaultImport = imp.defaultImport;
    }

    // Use first namespace import
    if (imp.namespaceImport && !existing.namespaceImport) {
      existing.namespaceImport = imp.namespaceImport;
    }
  }

  return Array.from(sourceMap.values());
}
