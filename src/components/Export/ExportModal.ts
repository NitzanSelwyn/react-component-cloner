/**
 * Export Modal - Options dialog for exporting components
 *
 * This modal allows users to configure export options before downloading
 * the component package as a ZIP file.
 */

import type { ReactFiberNode, ComponentInfo } from '@/types';
import { getComponentName } from '@lib/fiber-utils';
import { exportManager, type ExportOptions } from '@lib/export';

export class ExportModal {
  private modalElement: HTMLDivElement | null = null;
  private currentFiber: ReactFiberNode | null = null;
  private currentComponentInfo: ComponentInfo | null = null;
  private options: ExportOptions = {
    typescript: true,
    styleStrategy: 'css-module',
    includeComments: true,
    includePackageJson: true,
    includeStorybook: false,
    includeTests: false,
    extractDepth: 'deep',
  };

  constructor() {
    this.createModalElements();
  }

  /**
   * Create the modal DOM elements
   */
  private createModalElements(): void {
    this.modalElement = document.createElement('div');
    this.modalElement.id = 'react-component-cloner-export-modal';
    this.modalElement.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 2147483648;
      display: none;
      align-items: center;
      justify-content: center;
    `;
  }

  /**
   * Show the export modal
   */
  public show(fiber: ReactFiberNode, componentInfo: ComponentInfo): void {
    if (!this.modalElement || !fiber) return;

    this.currentFiber = fiber;
    this.currentComponentInfo = componentInfo;

    const componentName = getComponentName(fiber);

    // Build modal content
    this.modalElement.innerHTML = this.buildModalHTML(componentName);
    this.modalElement.style.display = 'flex';

    // Add to document
    if (!document.body.contains(this.modalElement)) {
      document.body.appendChild(this.modalElement);
    }

    // Add event listeners
    this.attachEventListeners();

    // Update preview
    this.updatePreview();
  }

  /**
   * Hide the modal
   */
  public hide(): void {
    if (this.modalElement) {
      this.modalElement.style.display = 'none';
    }
  }

  /**
   * Build modal HTML
   */
  private buildModalHTML(componentName: string): string {
    return `
      <div style="
        background: white;
        border-radius: 12px;
        width: 90%;
        max-width: 600px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      ">
        <!-- Header -->
        <div style="
          padding: 24px;
          border-bottom: 1px solid #e9ecef;
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <h2 style="
            margin: 0;
            font-size: 20px;
            font-weight: 600;
            color: #212529;
          ">
            📦 Export ${componentName}
          </h2>
          <button id="export-modal-close" style="
            background: none;
            border: none;
            font-size: 28px;
            cursor: pointer;
            color: #6c757d;
            padding: 0;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
          ">&times;</button>
        </div>

        <!-- Body -->
        <div style="padding: 24px;">
          <!-- Language -->
          <div style="margin-bottom: 20px;">
            <label style="
              display: block;
              font-size: 14px;
              font-weight: 600;
              color: #495057;
              margin-bottom: 8px;
            ">Language</label>
            <div style="display: flex; gap: 12px;">
              <label style="
                flex: 1;
                padding: 12px;
                border: 2px solid ${this.options.typescript ? '#61dafb' : '#dee2e6'};
                background: ${this.options.typescript ? '#e7f9ff' : 'white'};
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                text-align: center;
                transition: all 0.2s;
              ">
                <input type="radio" name="language" value="typescript" ${this.options.typescript ? 'checked' : ''} style="margin-right: 8px;">
                TypeScript (.tsx)
              </label>
              <label style="
                flex: 1;
                padding: 12px;
                border: 2px solid ${!this.options.typescript ? '#61dafb' : '#dee2e6'};
                background: ${!this.options.typescript ? '#e7f9ff' : 'white'};
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                text-align: center;
                transition: all 0.2s;
              ">
                <input type="radio" name="language" value="javascript" ${!this.options.typescript ? 'checked' : ''} style="margin-right: 8px;">
                JavaScript (.jsx)
              </label>
            </div>
          </div>

          <!-- Style Strategy -->
          <div style="margin-bottom: 20px;">
            <label style="
              display: block;
              font-size: 14px;
              font-weight: 600;
              color: #495057;
              margin-bottom: 8px;
            ">Style Strategy</label>
            <select id="style-strategy" style="
              width: 100%;
              padding: 10px 12px;
              border: 1px solid #dee2e6;
              border-radius: 6px;
              font-size: 14px;
              cursor: pointer;
              background: white;
            ">
              <option value="css-module" ${this.options.styleStrategy === 'css-module' ? 'selected' : ''}>CSS Modules (.module.css)</option>
              <option value="styled-components" ${this.options.styleStrategy === 'styled-components' ? 'selected' : ''}>Styled Components</option>
              <option value="plain-css" ${this.options.styleStrategy === 'plain-css' ? 'selected' : ''}>Plain CSS (.css)</option>
              <option value="inline" ${this.options.styleStrategy === 'inline' ? 'selected' : ''}>Inline Styles</option>
              <option value="none" ${this.options.styleStrategy === 'none' ? 'selected' : ''}>No Styles</option>
            </select>
          </div>

          <!-- Extract Depth -->
          <div style="margin-bottom: 20px;">
            <label style="
              display: block;
              font-size: 14px;
              font-weight: 600;
              color: #495057;
              margin-bottom: 8px;
            ">Extract Depth</label>
            <div style="display: flex; gap: 12px;">
              <label style="
                flex: 1;
                padding: 12px;
                border: 2px solid ${this.options.extractDepth === 'shallow' ? '#61dafb' : '#dee2e6'};
                background: ${this.options.extractDepth === 'shallow' ? '#e7f9ff' : 'white'};
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                text-align: center;
              ">
                <input type="radio" name="depth" value="shallow" ${this.options.extractDepth === 'shallow' ? 'checked' : ''} style="margin-right: 8px;">
                Shallow
              </label>
              <label style="
                flex: 1;
                padding: 12px;
                border: 2px solid ${this.options.extractDepth === 'deep' ? '#61dafb' : '#dee2e6'};
                background: ${this.options.extractDepth === 'deep' ? '#e7f9ff' : 'white'};
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                text-align: center;
              ">
                <input type="radio" name="depth" value="deep" ${this.options.extractDepth === 'deep' ? 'checked' : ''} style="margin-right: 8px;">
                Deep
              </label>
            </div>
          </div>

          <!-- Options -->
          <div style="margin-bottom: 20px;">
            <label style="
              display: block;
              font-size: 14px;
              font-weight: 600;
              color: #495057;
              margin-bottom: 8px;
            ">Additional Files</label>
            <div style="display: flex; flex-direction: column; gap: 10px;">
              <label style="
                padding: 10px 12px;
                border: 1px solid #dee2e6;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                display: flex;
                align-items: center;
              ">
                <input type="checkbox" id="include-comments" ${this.options.includeComments ? 'checked' : ''} style="margin-right: 10px;">
                Include code comments
              </label>
              <label style="
                padding: 10px 12px;
                border: 1px solid #dee2e6;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                display: flex;
                align-items: center;
              ">
                <input type="checkbox" id="include-package-json" ${this.options.includePackageJson ? 'checked' : ''} style="margin-right: 10px;">
                Include package.json
              </label>
              <label style="
                padding: 10px 12px;
                border: 1px solid #dee2e6;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                display: flex;
                align-items: center;
              ">
                <input type="checkbox" id="include-storybook" ${this.options.includeStorybook ? 'checked' : ''} style="margin-right: 10px;">
                Include Storybook story
              </label>
              <label style="
                padding: 10px 12px;
                border: 1px solid #dee2e6;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                display: flex;
                align-items: center;
              ">
                <input type="checkbox" id="include-tests" ${this.options.includeTests ? 'checked' : ''} style="margin-right: 10px;">
                Include test template
              </label>
            </div>
          </div>

          <!-- Preview -->
          <div style="
            padding: 12px;
            background: #f8f9fa;
            border-radius: 6px;
            font-size: 13px;
            color: #495057;
          ">
            <div style="font-weight: 600; margin-bottom: 6px;">Package Contents:</div>
            <div id="file-list" style="line-height: 1.8;"></div>
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #dee2e6;">
              <span style="font-weight: 600;">Estimated size:</span>
              <span id="estimated-size"></span>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div style="
          padding: 16px 24px;
          border-top: 1px solid #e9ecef;
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        ">
          <button id="export-cancel" style="
            padding: 10px 20px;
            background: white;
            border: 1px solid #dee2e6;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            color: #495057;
          ">Cancel</button>
          <button id="export-download" style="
            padding: 10px 20px;
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            color: white;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          ">📥 Download ZIP</button>
        </div>
      </div>
    `;
  }

  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    if (!this.modalElement) return;

    // Close button
    const closeBtn = this.modalElement.querySelector('#export-modal-close');
    closeBtn?.addEventListener('click', () => this.hide());

    // Cancel button
    const cancelBtn = this.modalElement.querySelector('#export-cancel');
    cancelBtn?.addEventListener('click', () => this.hide());

    // Download button
    const downloadBtn = this.modalElement.querySelector('#export-download');
    downloadBtn?.addEventListener('click', () => this.handleExport());

    // Language radio buttons
    const languageRadios = this.modalElement.querySelectorAll('input[name="language"]');
    languageRadios.forEach((radio) => {
      radio.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        this.options.typescript = target.value === 'typescript';
        this.updatePreview();
        this.show(this.currentFiber!, this.currentComponentInfo!);
      });
    });

    // Style strategy
    const styleSelect = this.modalElement.querySelector('#style-strategy') as HTMLSelectElement;
    styleSelect?.addEventListener('change', (e) => {
      this.options.styleStrategy = (e.target as HTMLSelectElement).value as any;
      this.updatePreview();
    });

    // Depth radio buttons
    const depthRadios = this.modalElement.querySelectorAll('input[name="depth"]');
    depthRadios.forEach((radio) => {
      radio.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        this.options.extractDepth = target.value as 'shallow' | 'deep';
        this.updatePreview();
      });
    });

    // Checkboxes
    const commentsCheck = this.modalElement.querySelector('#include-comments') as HTMLInputElement;
    commentsCheck?.addEventListener('change', (e) => {
      this.options.includeComments = (e.target as HTMLInputElement).checked;
      this.updatePreview();
    });

    const packageCheck = this.modalElement.querySelector('#include-package-json') as HTMLInputElement;
    packageCheck?.addEventListener('change', (e) => {
      this.options.includePackageJson = (e.target as HTMLInputElement).checked;
      this.updatePreview();
    });

    const storybookCheck = this.modalElement.querySelector('#include-storybook') as HTMLInputElement;
    storybookCheck?.addEventListener('change', (e) => {
      this.options.includeStorybook = (e.target as HTMLInputElement).checked;
      this.updatePreview();
    });

    const testsCheck = this.modalElement.querySelector('#include-tests') as HTMLInputElement;
    testsCheck?.addEventListener('change', (e) => {
      this.options.includeTests = (e.target as HTMLInputElement).checked;
      this.updatePreview();
    });

    // Click backdrop to close
    this.modalElement.addEventListener('click', (e) => {
      if (e.target === this.modalElement) {
        this.hide();
      }
    });
  }

  /**
   * Update preview
   */
  private updatePreview(): void {
    if (!this.modalElement || !this.currentFiber || !this.currentComponentInfo) return;

    const componentName = getComponentName(this.currentFiber);

    // Update file list
    const fileList = exportManager.getExportFileList(componentName, this.options);
    const fileListEl = this.modalElement.querySelector('#file-list');
    if (fileListEl) {
      fileListEl.innerHTML = fileList.map((file) => `📄 ${file}`).join('<br>');
    }

    // Update estimated size
    const size = exportManager.estimatePackageSize(this.currentComponentInfo, this.options);
    const sizeEl = this.modalElement.querySelector('#estimated-size');
    if (sizeEl) {
      sizeEl.textContent = `~${size} KB`;
    }
  }

  /**
   * Handle export
   */
  private async handleExport(): Promise<void> {
    if (!this.currentFiber || !this.currentComponentInfo) return;

    const downloadBtn = this.modalElement?.querySelector('#export-download') as HTMLButtonElement;
    if (downloadBtn) {
      downloadBtn.textContent = '⏳ Exporting...';
      downloadBtn.disabled = true;
    }

    try {
      await exportManager.exportAsZip(
        this.currentFiber,
        this.currentComponentInfo,
        this.options
      );

      // Success
      if (downloadBtn) {
        downloadBtn.textContent = '✓ Downloaded!';
        setTimeout(() => {
          this.hide();
        }, 1000);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Check console for details.');

      if (downloadBtn) {
        downloadBtn.textContent = '📥 Download ZIP';
        downloadBtn.disabled = false;
      }
    }
  }

  /**
   * Destroy the modal
   */
  public destroy(): void {
    if (this.modalElement && document.body.contains(this.modalElement)) {
      document.body.removeChild(this.modalElement);
    }
  }
}
