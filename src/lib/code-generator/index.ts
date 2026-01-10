/**
 * Code Generator - Main export file
 *
 * This module provides a complete code generation system for React components.
 * It combines JSX generation, TypeScript types, imports, and styling to create
 * production-ready component files.
 */

// JSX Generation
export {
  generateJSX,
  generateCleanJSX,
  generateShallowJSX,
  type JSXGeneratorOptions,
} from './jsx-generator';

// Type Generation
export {
  generatePropsInterface,
  generatePropsWithChildren,
  generateStateInterface,
  generateCompleteTypes,
  generateUnionType,
  generateEventHandlerType,
  type TypeGeneratorOptions,
} from './type-generator';

// Import Generation
export {
  generateImports,
  generateHookImports,
  generateComponentImports,
  generateStyleImport,
  generateStyledComponentsImport,
  generateCompleteImports,
  detectLibraryImports,
  optimizeImports,
  type ImportStatement,
  type ImportGeneratorOptions,
} from './import-generator';

// Component Generation
export {
  generateComponent,
  generateCompleteFile,
  generateComponentPackage,
  quickGenerate,
  type ComponentGeneratorOptions,
} from './component-generator';
