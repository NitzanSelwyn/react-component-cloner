/**
 * Style Extractor - Export all style extraction utilities
 */

// Style extraction
export {
  extractStyles,
  extractInlineStyles,
  extractComputedStyles,
  extractClasses,
  detectStyleStrategy,
  extractBackgroundImages,
  extractImageUrls,
  extractFontFamilies,
  computedToInlineStyles,
  stylesToCSS,
  getImportantStyles,
  extractAssets,
} from './style-extractor';

// CSS generation
export {
  generateCSS,
  generateInlineStyles,
  generateCSSModule,
  generateStyledComponents,
  generatePlainCSS,
  generateNestedCSS,
  generateResponsiveCSS,
  generateTailwindClasses,
  generateCSSInJS,
  optimizeCSS,
  groupCSSProperties,
  camelToKebab,
  type CSSGeneratorOptions,
} from './css-generator';
