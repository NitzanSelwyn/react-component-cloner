/**
 * Style Extractor - Extract styles from DOM elements
 */

import type { ExtractedStyles, StyleStrategy } from '@/types';

/**
 * CSS properties that are safe to ignore if they have default values
 */
const DEFAULT_VALUES: Record<string, string[]> = {
  display: ['inline', 'block'],
  position: ['static'],
  visibility: ['visible'],
  overflow: ['visible'],
  float: ['none'],
  clear: ['none'],
  boxSizing: ['content-box'],
  cursor: ['auto'],
  pointerEvents: ['auto'],
  userSelect: ['auto'],
  textAlign: ['start', 'left'],
  verticalAlign: ['baseline'],
  whiteSpace: ['normal'],
  wordBreak: ['normal'],
  fontWeight: ['400', 'normal'],
  fontStyle: ['normal'],
  textDecoration: ['none'],
  textTransform: ['none'],
  listStyle: ['none'],
  borderStyle: ['none'],
  borderWidth: ['0px'],
  margin: ['0px'],
  padding: ['0px'],
};

/**
 * CSS properties to extract (most commonly styled properties)
 */
const IMPORTANT_PROPERTIES = [
  // Layout
  'display',
  'position',
  'top',
  'right',
  'bottom',
  'left',
  'width',
  'height',
  'min-width',
  'max-width',
  'min-height',
  'max-height',
  'margin',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'padding',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'box-sizing',
  'overflow',
  'overflow-x',
  'overflow-y',
  'z-index',

  // Flexbox
  'flex',
  'flex-direction',
  'flex-wrap',
  'flex-grow',
  'flex-shrink',
  'flex-basis',
  'justify-content',
  'align-items',
  'align-content',
  'align-self',
  'order',
  'gap',
  'row-gap',
  'column-gap',

  // Grid
  'grid',
  'grid-template-columns',
  'grid-template-rows',
  'grid-template-areas',
  'grid-auto-columns',
  'grid-auto-rows',
  'grid-auto-flow',
  'grid-column',
  'grid-row',
  'grid-area',

  // Typography
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'line-height',
  'letter-spacing',
  'text-align',
  'text-decoration',
  'text-transform',
  'white-space',
  'word-break',
  'word-wrap',
  'color',

  // Background
  'background',
  'background-color',
  'background-image',
  'background-size',
  'background-position',
  'background-repeat',
  'background-attachment',

  // Border
  'border',
  'border-width',
  'border-style',
  'border-color',
  'border-radius',
  'border-top',
  'border-right',
  'border-bottom',
  'border-left',
  'border-top-left-radius',
  'border-top-right-radius',
  'border-bottom-right-radius',
  'border-bottom-left-radius',

  // Effects
  'box-shadow',
  'opacity',
  'filter',
  'backdrop-filter',
  'transform',
  'transition',
  'animation',

  // Other
  'cursor',
  'pointer-events',
  'user-select',
  'outline',
];

/**
 * Extract all styles from a DOM element
 */
export function extractStyles(element: HTMLElement): ExtractedStyles {
  const inlineStyles = extractInlineStyles(element);
  const computedStyles = extractComputedStyles(element);
  const classes = extractClasses(element);
  const strategy = detectStyleStrategy(element, classes);

  return {
    inline: inlineStyles,
    computed: computedStyles,
    classes,
    strategy,
  };
}

/**
 * Extract inline styles from element.style
 */
export function extractInlineStyles(element: HTMLElement): Record<string, string> {
  const styles: Record<string, string> = {};
  const inlineStyle = element.style;

  for (let i = 0; i < inlineStyle.length; i++) {
    const property = inlineStyle[i];
    const value = inlineStyle.getPropertyValue(property);
    if (value) {
      styles[property] = value;
    }
  }

  return styles;
}

/**
 * Extract computed styles from the element
 */
export function extractComputedStyles(element: HTMLElement): Record<string, string> {
  const computed = window.getComputedStyle(element);
  const styles: Record<string, string> = {};

  for (const property of IMPORTANT_PROPERTIES) {
    const value = computed.getPropertyValue(property);

    if (value && !isDefaultValue(property, value)) {
      styles[property] = value;
    }
  }

  return styles;
}

/**
 * Check if a CSS value is a default value
 */
function isDefaultValue(property: string, value: string): boolean {
  const defaults = DEFAULT_VALUES[property];
  if (!defaults) return false;

  return defaults.includes(value);
}

/**
 * Extract class names from element
 */
export function extractClasses(element: HTMLElement): string[] {
  return Array.from(element.classList);
}

/**
 * Detect the styling strategy used
 */
export function detectStyleStrategy(
  element: HTMLElement,
  classes: string[]
): StyleStrategy {
  // Check for Tailwind (lots of utility classes)
  if (isTailwindElement(classes)) {
    return 'tailwind';
  }

  // Check for CSS Modules (hashed class names)
  if (isCSSModulesElement(classes)) {
    return 'css-module';
  }

  // Check for styled-components / Emotion
  if (isStyledComponentsElement(element, classes)) {
    return 'styled-components';
  }

  // Check for inline styles
  if (element.style.length > 0) {
    return 'inline';
  }

  // Default to plain CSS
  return 'plain-css';
}

/**
 * Check if element uses Tailwind CSS
 */
function isTailwindElement(classes: string[]): boolean {
  const tailwindPatterns = [
    /^(flex|grid|block|inline|hidden)$/,
    /^(w|h|m|p|px|py|mx|my|mt|mr|mb|ml|pt|pr|pb|pl)-/,
    /^(text|font|leading|tracking)-/,
    /^(bg|border|rounded|shadow)-/,
    /^(hover|focus|active|disabled):/,
    /^(sm|md|lg|xl|2xl):/,
  ];

  const tailwindCount = classes.filter((cls) =>
    tailwindPatterns.some((pattern) => pattern.test(cls))
  ).length;

  // If more than 30% of classes look like Tailwind, it's probably Tailwind
  return tailwindCount > 0 && tailwindCount / classes.length > 0.3;
}

/**
 * Check if element uses CSS Modules
 */
function isCSSModulesElement(classes: string[]): boolean {
  // CSS Modules typically have hashed class names like: Button_button__2x3y4
  const cssModulePattern = /^[A-Za-z]+_[A-Za-z]+__[A-Za-z0-9]+$/;

  const hashedCount = classes.filter((cls) =>
    cssModulePattern.test(cls)
  ).length;

  return hashedCount > 0;
}

/**
 * Check if element uses styled-components or Emotion
 */
function isStyledComponentsElement(
  element: HTMLElement,
  classes: string[]
): boolean {
  // styled-components uses class names like: sc-bdVaJa, sc-bwzfXH
  // Emotion uses class names like: css-1234abc
  const styledComponentsPattern = /^(sc-|css-)[A-Za-z0-9]+$/;

  const styledCount = classes.filter((cls) =>
    styledComponentsPattern.test(cls)
  ).length;

  // Also check for data-styled attribute (styled-components)
  const hasStyledAttr = element.hasAttribute('data-styled');

  return styledCount > 0 || hasStyledAttr;
}

/**
 * Extract background images and URLs from styles
 */
export function extractBackgroundImages(element: HTMLElement): string[] {
  const computed = window.getComputedStyle(element);
  const backgroundImage = computed.backgroundImage;

  if (!backgroundImage || backgroundImage === 'none') {
    return [];
  }

  // Extract URLs from background-image
  const urlPattern = /url\(['"]?([^'"]+)['"]?\)/g;
  const matches = backgroundImage.matchAll(urlPattern);

  return Array.from(matches).map((match) => match[1]);
}

/**
 * Extract all image URLs from element and children
 */
export function extractImageUrls(element: HTMLElement): string[] {
  const urls: string[] = [];

  // Background images
  urls.push(...extractBackgroundImages(element));

  // <img> src
  if (element.tagName === 'IMG') {
    const src = (element as HTMLImageElement).src;
    if (src) urls.push(src);
  }

  // <source> srcset
  if (element.tagName === 'SOURCE') {
    const srcset = (element as HTMLSourceElement).srcset;
    if (srcset) {
      const srcsetUrls = srcset.split(',').map((s) => s.trim().split(' ')[0]);
      urls.push(...srcsetUrls);
    }
  }

  return urls;
}

/**
 * Extract font families used
 */
export function extractFontFamilies(element: HTMLElement): string[] {
  const computed = window.getComputedStyle(element);
  const fontFamily = computed.fontFamily;

  if (!fontFamily) return [];

  // Split by comma and clean up
  return fontFamily
    .split(',')
    .map((font) => font.trim().replace(/['"]/g, ''));
}

/**
 * Convert computed styles to inline style object
 */
export function computedToInlineStyles(
  computed: Record<string, string>
): Record<string, string> {
  const inline: Record<string, string> = {};

  for (const [property, value] of Object.entries(computed)) {
    // Convert kebab-case to camelCase
    const camelCase = property.replace(/-([a-z])/g, (_, letter) =>
      letter.toUpperCase()
    );
    inline[camelCase] = value;
  }

  return inline;
}

/**
 * Generate CSS string from styles
 */
export function stylesToCSS(
  styles: Record<string, string>,
  selector: string = '.component'
): string {
  if (Object.keys(styles).length === 0) return '';

  const cssProperties = Object.entries(styles)
    .map(([property, value]) => `  ${property}: ${value};`)
    .join('\n');

  return `${selector} {\n${cssProperties}\n}`;
}

/**
 * Get important styles only (filter out noise)
 */
export function getImportantStyles(
  computed: Record<string, string>
): Record<string, string> {
  const important: Record<string, string> = {};

  // Layout properties
  if (computed.display && computed.display !== 'block') {
    important.display = computed.display;
  }

  if (computed.position && computed.position !== 'static') {
    important.position = computed.position;
  }

  // Sizing
  ['width', 'height', 'max-width', 'max-height', 'min-width', 'min-height'].forEach((prop) => {
    if (computed[prop] && computed[prop] !== 'auto' && computed[prop] !== 'none') {
      important[prop] = computed[prop];
    }
  });

  // Spacing
  ['margin', 'padding', 'gap'].forEach((prop) => {
    if (computed[prop] && computed[prop] !== '0px') {
      important[prop] = computed[prop];
    }
  });

  // Colors
  ['color', 'background-color'].forEach((prop) => {
    if (computed[prop] && computed[prop] !== 'rgba(0, 0, 0, 0)') {
      important[prop] = computed[prop];
    }
  });

  // Typography
  ['font-size', 'font-weight', 'font-family', 'line-height', 'text-align'].forEach((prop) => {
    if (computed[prop]) {
      important[prop] = computed[prop];
    }
  });

  // Border
  if (computed['border-width'] && computed['border-width'] !== '0px') {
    important.border = `${computed['border-width']} ${computed['border-style']} ${computed['border-color']}`;
  }

  if (computed['border-radius'] && computed['border-radius'] !== '0px') {
    important['border-radius'] = computed['border-radius'];
  }

  // Effects
  ['box-shadow', 'opacity', 'transform', 'transition'].forEach((prop) => {
    if (computed[prop] && computed[prop] !== 'none') {
      important[prop] = computed[prop];
    }
  });

  return important;
}

/**
 * Extract all assets (images, fonts, etc.) from element
 */
export function extractAssets(element: HTMLElement): {
  images: string[];
  fonts: string[];
  backgroundImages: string[];
} {
  return {
    images: extractImageUrls(element),
    fonts: extractFontFamilies(element),
    backgroundImages: extractBackgroundImages(element),
  };
}
