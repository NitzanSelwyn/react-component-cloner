/**
 * Export Manager - Handles exporting components as multi-file packages
 *
 * This module creates ZIP files with complete component packages including
 * code, styles, types, README, and package.json.
 */

import JSZip from 'jszip';
import type { ReactFiberNode, ComponentInfo } from '@/types';
import { getComponentName } from '@lib/fiber-utils';
import { generateComponentPackage } from '@lib/code-generator';

export interface ExportOptions {
  /** Component name (default: extracted from fiber) */
  componentName?: string;
  /** Use TypeScript (.tsx) or JavaScript (.jsx) */
  typescript?: boolean;
  /** Styling strategy */
  styleStrategy?: 'inline' | 'css-module' | 'styled-components' | 'plain-css' | 'none';
  /** Include comments in generated code */
  includeComments?: boolean;
  /** Include package.json */
  includePackageJson?: boolean;
  /** Include Storybook story */
  includeStorybook?: boolean;
  /** Include test file template */
  includeTests?: boolean;
  /** Extract depth */
  extractDepth?: 'shallow' | 'deep';
}

const DEFAULT_OPTIONS: Required<ExportOptions> = {
  componentName: '',
  typescript: true,
  styleStrategy: 'css-module',
  includeComments: true,
  includePackageJson: true,
  includeStorybook: false,
  includeTests: false,
  extractDepth: 'deep',
};

export class ExportManager {
  /**
   * Export component as ZIP file
   */
  public async exportAsZip(
    fiber: ReactFiberNode,
    componentInfo: ComponentInfo,
    options: ExportOptions = {}
  ): Promise<void> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const componentName = opts.componentName || getComponentName(fiber) || 'Component';

    try {
      // Generate component package
      const files = generateComponentPackage(componentInfo, {
        componentName,
        typescript: opts.typescript,
        includeTypes: opts.typescript,
        styleStrategy: opts.styleStrategy,
        includeComments: opts.includeComments,
        extractDepth: opts.extractDepth,
      });

      // Create ZIP
      const zip = new JSZip();

      // Add component files to ZIP
      files.forEach((content, filename) => {
        zip.file(filename, content);
      });

      // Add package.json
      if (opts.includePackageJson) {
        const packageJson = this.generatePackageJson(componentName, componentInfo, opts);
        zip.file('package.json', packageJson);
      }

      // Add Storybook story
      if (opts.includeStorybook) {
        const story = this.generateStorybookStory(componentName, opts);
        const ext = opts.typescript ? 'tsx' : 'jsx';
        zip.file(`${componentName}.stories.${ext}`, story);
      }

      // Add test template
      if (opts.includeTests) {
        const test = this.generateTestTemplate(componentName, opts);
        const ext = opts.typescript ? 'tsx' : 'jsx';
        zip.file(`${componentName}.test.${ext}`, test);
      }

      // Generate ZIP blob
      const blob = await zip.generateAsync({ type: 'blob' });

      // Trigger download
      this.downloadBlob(blob, `${componentName}.zip`);

      console.log('React Component Cloner: ZIP export successful', {
        componentName,
        fileCount: files.size + (opts.includePackageJson ? 1 : 0) + (opts.includeStorybook ? 1 : 0) + (opts.includeTests ? 1 : 0),
      });
    } catch (error) {
      console.error('React Component Cloner: Error exporting ZIP', error);
      throw error;
    }
  }

  /**
   * Generate package.json for component
   */
  private generatePackageJson(
    componentName: string,
    componentInfo: ComponentInfo,
    opts: Required<ExportOptions>
  ): string {
    const dependencies = this.detectDependencies(componentInfo);

    const packageJson = {
      name: componentName.toLowerCase().replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`),
      version: '1.0.0',
      description: `${componentName} component extracted from React application`,
      main: opts.typescript ? `${componentName}.tsx` : `${componentName}.jsx`,
      scripts: {
        ...(opts.includeTests && { test: 'jest' }),
        ...(opts.includeStorybook && { storybook: 'start-storybook -p 6006' }),
      },
      keywords: ['react', 'component', componentName.toLowerCase()],
      author: '',
      license: 'MIT',
      peerDependencies: {
        react: '^18.0.0',
        'react-dom': '^18.0.0',
      },
      dependencies: dependencies,
      devDependencies: {
        ...(opts.typescript && {
          '@types/react': '^18.0.0',
          '@types/react-dom': '^18.0.0',
          typescript: '^5.0.0',
        }),
        ...(opts.includeTests && {
          '@testing-library/react': '^14.0.0',
          '@testing-library/jest-dom': '^6.0.0',
          jest: '^29.0.0',
        }),
        ...(opts.includeStorybook && {
          '@storybook/react': '^7.0.0',
          '@storybook/addon-essentials': '^7.0.0',
        }),
      },
    };

    return JSON.stringify(packageJson, null, 2);
  }

  /**
   * Detect dependencies from component info
   */
  private detectDependencies(componentInfo: ComponentInfo): Record<string, string> {
    const dependencies: Record<string, string> = {};

    // Check for styled-components
    if (componentInfo.styles?.strategy === 'styled-components') {
      dependencies['styled-components'] = '^6.0.0';
    }

    // Check for CSS module dependencies
    if (componentInfo.styles?.strategy === 'css-module') {
      // CSS modules work out of the box with most bundlers
    }

    // TODO: Detect third-party libraries from props/children
    // This could be enhanced to scan for MUI, Ant Design, etc.

    return dependencies;
  }

  /**
   * Generate Storybook story
   */
  private generateStorybookStory(componentName: string, opts: Required<ExportOptions>): string {
    const typeAnnotation = opts.typescript ? ': Meta<typeof Component>' : '';

    return `import type { Meta, StoryObj } from '@storybook/react';
import ${componentName} from './${componentName}';

const meta${typeAnnotation} = {
  title: 'Components/${componentName}',
  component: ${componentName},
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    // Add prop controls here
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // Add default props here
  },
};

export const Example: Story = {
  args: {
    // Add example props here
  },
};
`;
  }

  /**
   * Generate test template
   */
  private generateTestTemplate(componentName: string, _opts: Required<ExportOptions>): string {
    return `import { render, screen } from '@testing-library/react';
import ${componentName} from './${componentName}';

describe('${componentName}', () => {
  it('renders without crashing', () => {
    render(<${componentName} />);
  });

  it('matches snapshot', () => {
    const { container } = render(<${componentName} />);
    expect(container).toMatchSnapshot();
  });

  // Add more tests here
});
`;
  }

  /**
   * Download blob as file
   */
  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Export individual file
   */
  public downloadFile(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    this.downloadBlob(blob, filename);
  }

  /**
   * Get list of files that will be exported
   */
  public getExportFileList(
    componentName: string,
    options: ExportOptions = {}
  ): string[] {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const ext = opts.typescript ? 'tsx' : 'jsx';
    const files: string[] = [];

    // Main component file
    files.push(`${componentName}.${ext}`);

    // Style files
    if (opts.styleStrategy === 'css-module') {
      files.push(`${componentName}.module.css`);
    } else if (opts.styleStrategy === 'plain-css') {
      files.push(`${componentName}.css`);
    }

    // Type definition (TypeScript only)
    if (opts.typescript) {
      files.push(`${componentName}.types.ts`);
    }

    // Index file
    files.push('index.ts');

    // README
    files.push('README.md');

    // Optional files
    if (opts.includePackageJson) {
      files.push('package.json');
    }

    if (opts.includeStorybook) {
      files.push(`${componentName}.stories.${ext}`);
    }

    if (opts.includeTests) {
      files.push(`${componentName}.test.${ext}`);
    }

    return files;
  }

  /**
   * Get estimated package size (in KB)
   */
  public estimatePackageSize(_componentInfo: ComponentInfo, options: ExportOptions = {}): number {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    let sizeKB = 0;

    // Component file: ~2-5 KB
    sizeKB += 3;

    // Style file: ~1-2 KB
    if (opts.styleStrategy !== 'none' && opts.styleStrategy !== 'inline') {
      sizeKB += 1.5;
    }

    // Types file: ~1 KB
    if (opts.typescript) {
      sizeKB += 1;
    }

    // README: ~2 KB
    sizeKB += 2;

    // package.json: ~0.5 KB
    if (opts.includePackageJson) {
      sizeKB += 0.5;
    }

    // Storybook: ~1 KB
    if (opts.includeStorybook) {
      sizeKB += 1;
    }

    // Tests: ~1 KB
    if (opts.includeTests) {
      sizeKB += 1;
    }

    return Math.round(sizeKB * 10) / 10;
  }
}

// Singleton instance
export const exportManager = new ExportManager();
