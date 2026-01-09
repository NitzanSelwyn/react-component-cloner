/**
 * CSS Generator - Generate CSS code in different formats
 */

import type { StyleStrategy } from '@/types';

export interface CSSGeneratorOptions {
  strategy: StyleStrategy;
  componentName: string;
  includeComments?: boolean;
  prettify?: boolean;
}

/**
 * Generate CSS code based on strategy
 */
export function generateCSS(
  styles: Record<string, string>,
  options: CSSGeneratorOptions
): string {
  const { strategy, componentName, includeComments = true } = options;

  switch (strategy) {
    case 'inline':
      return generateInlineStyles(styles, componentName, includeComments);
    case 'css-module':
      return generateCSSModule(styles, componentName, includeComments);
    case 'styled-components':
      return generateStyledComponents(styles, componentName, includeComments);
    case 'tailwind':
      return ''; // Tailwind uses utility classes, no CSS generation needed
    case 'plain-css':
    default:
      return generatePlainCSS(styles, componentName, includeComments);
  }
}

/**
 * Generate inline styles object
 */
export function generateInlineStyles(
  styles: Record<string, string>,
  componentName: string,
  includeComments: boolean
): string {
  const styleEntries = Object.entries(styles).map(([property, value]) => {
    const camelCase = kebabToCamel(property);
    return `  ${camelCase}: '${value}'`;
  });

  const comment = includeComments
    ? `// Inline styles for ${componentName}\n`
    : '';

  return `${comment}const styles = {\n${styleEntries.join(',\n')}\n};`;
}

/**
 * Generate CSS Module
 */
export function generateCSSModule(
  styles: Record<string, string>,
  componentName: string,
  includeComments: boolean
): string {
  const className = componentName.toLowerCase();
  const comment = includeComments
    ? `/* ${componentName}.module.css */\n\n`
    : '';

  const cssProperties = Object.entries(styles)
    .map(([property, value]) => `  ${property}: ${value};`)
    .join('\n');

  return `${comment}.${className} {\n${cssProperties}\n}`;
}

/**
 * Generate styled-components code
 */
export function generateStyledComponents(
  styles: Record<string, string>,
  componentName: string,
  includeComments: boolean
): string {
  const comment = includeComments
    ? `// Styled component for ${componentName}\n`
    : '';

  const cssProperties = Object.entries(styles)
    .map(([property, value]) => `  ${property}: ${value};`)
    .join('\n');

  return `${comment}const Styled${componentName} = styled.div\`\n${cssProperties}\n\`;`;
}

/**
 * Generate plain CSS
 */
export function generatePlainCSS(
  styles: Record<string, string>,
  componentName: string,
  includeComments: boolean
): string {
  const className = componentName.toLowerCase();
  const comment = includeComments ? `/* ${componentName} styles */\n\n` : '';

  const cssProperties = Object.entries(styles)
    .map(([property, value]) => `  ${property}: ${value};`)
    .join('\n');

  return `${comment}.${className} {\n${cssProperties}\n}`;
}

/**
 * Generate CSS for multiple elements (component with children)
 */
export function generateNestedCSS(
  componentStyles: Record<string, string>,
  childStyles: Array<{ selector: string; styles: Record<string, string> }>,
  componentName: string
): string {
  const className = componentName.toLowerCase();
  let css = '';

  // Main component styles
  if (Object.keys(componentStyles).length > 0) {
    const mainProperties = Object.entries(componentStyles)
      .map(([property, value]) => `  ${property}: ${value};`)
      .join('\n');

    css += `.${className} {\n${mainProperties}\n}\n\n`;
  }

  // Child styles
  for (const child of childStyles) {
    const childProperties = Object.entries(child.styles)
      .map(([property, value]) => `  ${property}: ${value};`)
      .join('\n');

    css += `.${className} ${child.selector} {\n${childProperties}\n}\n\n`;
  }

  return css.trim();
}

/**
 * Convert kebab-case to camelCase
 */
function kebabToCamel(str: string): string {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert camelCase to kebab-case
 */
export function camelToKebab(str: string): string {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase();
}

/**
 * Generate CSS with media queries
 */
export function generateResponsiveCSS(
  baseStyles: Record<string, string>,
  responsiveStyles: Array<{
    breakpoint: string;
    styles: Record<string, string>;
  }>,
  componentName: string
): string {
  const className = componentName.toLowerCase();
  let css = '';

  // Base styles
  const baseProperties = Object.entries(baseStyles)
    .map(([property, value]) => `  ${property}: ${value};`)
    .join('\n');

  css += `.${className} {\n${baseProperties}\n}\n\n`;

  // Responsive styles
  for (const responsive of responsiveStyles) {
    const mediaProperties = Object.entries(responsive.styles)
      .map(([property, value]) => `    ${property}: ${value};`)
      .join('\n');

    css += `@media ${responsive.breakpoint} {\n  .${className} {\n${mediaProperties}\n  }\n}\n\n`;
  }

  return css.trim();
}

/**
 * Generate Tailwind classes approximation
 */
export function generateTailwindClasses(
  styles: Record<string, string>
): string[] {
  const classes: string[] = [];

  // Map common CSS properties to Tailwind classes
  const tailwindMap: Record<string, (value: string) => string | null> = {
    display: (v) => {
      const map: Record<string, string> = {
        flex: 'flex',
        'inline-flex': 'inline-flex',
        block: 'block',
        'inline-block': 'inline-block',
        grid: 'grid',
        hidden: 'hidden',
      };
      return map[v] || null;
    },
    'flex-direction': (v) => {
      const map: Record<string, string> = {
        row: 'flex-row',
        'row-reverse': 'flex-row-reverse',
        column: 'flex-col',
        'column-reverse': 'flex-col-reverse',
      };
      return map[v] || null;
    },
    'justify-content': (v) => {
      const map: Record<string, string> = {
        'flex-start': 'justify-start',
        'flex-end': 'justify-end',
        center: 'justify-center',
        'space-between': 'justify-between',
        'space-around': 'justify-around',
      };
      return map[v] || null;
    },
    'align-items': (v) => {
      const map: Record<string, string> = {
        'flex-start': 'items-start',
        'flex-end': 'items-end',
        center: 'items-center',
        baseline: 'items-baseline',
        stretch: 'items-stretch',
      };
      return map[v] || null;
    },
    'text-align': (v) => {
      const map: Record<string, string> = {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right',
        justify: 'text-justify',
      };
      return map[v] || null;
    },
    'font-weight': (v) => {
      const map: Record<string, string> = {
        '100': 'font-thin',
        '200': 'font-extralight',
        '300': 'font-light',
        '400': 'font-normal',
        '500': 'font-medium',
        '600': 'font-semibold',
        '700': 'font-bold',
        '800': 'font-extrabold',
        '900': 'font-black',
      };
      return map[v] || null;
    },
    'border-radius': (v) => {
      if (v === '0px') return null;
      if (v === '0.25rem') return 'rounded';
      if (v === '0.375rem') return 'rounded-md';
      if (v === '0.5rem') return 'rounded-lg';
      if (v === '9999px') return 'rounded-full';
      return null;
    },
  };

  for (const [property, mapper] of Object.entries(tailwindMap)) {
    const value = styles[property];
    if (value) {
      const tailwindClass = mapper(value);
      if (tailwindClass) {
        classes.push(tailwindClass);
      }
    }
  }

  return classes;
}

/**
 * Generate CSS-in-JS object (for React)
 */
export function generateCSSInJS(
  styles: Record<string, string>,
  componentName: string
): string {
  const styleEntries = Object.entries(styles).map(([property, value]) => {
    const camelCase = kebabToCamel(property);
    // Handle numeric values
    const formattedValue = /^\d+$/.test(value) ? value : `'${value}'`;
    return `  ${camelCase}: ${formattedValue}`;
  });

  return `const ${componentName}Styles = {\n${styleEntries.join(',\n')}\n};`;
}

/**
 * Optimize CSS by removing redundant properties
 */
export function optimizeCSS(styles: Record<string, string>): Record<string, string> {
  const optimized = { ...styles };

  // If shorthand exists, remove longhand properties
  if (optimized.margin) {
    delete optimized['margin-top'];
    delete optimized['margin-right'];
    delete optimized['margin-bottom'];
    delete optimized['margin-left'];
  }

  if (optimized.padding) {
    delete optimized['padding-top'];
    delete optimized['padding-right'];
    delete optimized['padding-bottom'];
    delete optimized['padding-left'];
  }

  if (optimized.border) {
    delete optimized['border-width'];
    delete optimized['border-style'];
    delete optimized['border-color'];
  }

  if (optimized.background) {
    delete optimized['background-color'];
    delete optimized['background-image'];
    delete optimized['background-size'];
    delete optimized['background-position'];
    delete optimized['background-repeat'];
  }

  return optimized;
}

/**
 * Group related CSS properties
 */
export function groupCSSProperties(styles: Record<string, string>): {
  layout: Record<string, string>;
  spacing: Record<string, string>;
  typography: Record<string, string>;
  colors: Record<string, string>;
  effects: Record<string, string>;
  other: Record<string, string>;
} {
  const groups = {
    layout: {} as Record<string, string>,
    spacing: {} as Record<string, string>,
    typography: {} as Record<string, string>,
    colors: {} as Record<string, string>,
    effects: {} as Record<string, string>,
    other: {} as Record<string, string>,
  };

  const layoutProps = ['display', 'position', 'top', 'right', 'bottom', 'left', 'width', 'height', 'flex', 'grid', 'z-index'];
  const spacingProps = ['margin', 'padding', 'gap'];
  const typographyProps = ['font-family', 'font-size', 'font-weight', 'line-height', 'text-align', 'text-decoration'];
  const colorProps = ['color', 'background', 'background-color', 'border-color'];
  const effectProps = ['box-shadow', 'opacity', 'transform', 'transition', 'filter'];

  for (const [property, value] of Object.entries(styles)) {
    if (layoutProps.some(p => property.startsWith(p))) {
      groups.layout[property] = value;
    } else if (spacingProps.some(p => property.startsWith(p))) {
      groups.spacing[property] = value;
    } else if (typographyProps.some(p => property.startsWith(p))) {
      groups.typography[property] = value;
    } else if (colorProps.some(p => property.startsWith(p))) {
      groups.colors[property] = value;
    } else if (effectProps.some(p => property.startsWith(p))) {
      groups.effects[property] = value;
    } else {
      groups.other[property] = value;
    }
  }

  return groups;
}
