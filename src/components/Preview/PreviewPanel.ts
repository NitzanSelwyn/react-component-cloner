/**
 * Preview Panel - Live preview of extracted components
 *
 * This component renders the extracted component in isolation,
 * providing side-by-side comparison and responsive controls.
 */

import type { ReactFiberNode, ComponentInfo } from '@/types';
import { getComponentName } from '@lib/fiber-utils';
import { quickGenerate } from '@lib/code-generator';

export interface PreviewOptions {
  /** Show side-by-side comparison */
  showComparison?: boolean;
  /** Initial viewport size */
  viewportSize?: 'mobile' | 'tablet' | 'desktop';
  /** Show code alongside preview */
  showCode?: boolean;
}

export class PreviewPanel {
  private panelElement: HTMLDivElement | null = null;
  private previewContainer: HTMLDivElement | null = null;
  private originalContainer: HTMLDivElement | null = null;
  private controlsContainer: HTMLDivElement | null = null;
  private currentFiber: ReactFiberNode | null = null;
  private currentViewport: 'mobile' | 'tablet' | 'desktop' = 'desktop';
  private showComparison: boolean = true;

  constructor() {
    this.createPanelElements();
  }

  /**
   * Create the preview panel DOM elements
   */
  private createPanelElements(): void {
    // Main panel container
    this.panelElement = document.createElement('div');
    this.panelElement.id = 'react-component-cloner-preview-panel';
    this.panelElement.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      z-index: 2147483647;
      display: none;
      padding: 20px;
      box-sizing: border-box;
    `;

    // Controls container (top bar)
    this.controlsContainer = document.createElement('div');
    this.controlsContainer.style.cssText = `
      background: white;
      border-radius: 8px 8px 0 0;
      padding: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    `;

    // Preview container (holds original and preview side-by-side)
    this.previewContainer = document.createElement('div');
    this.previewContainer.style.cssText = `
      background: white;
      border-radius: 0 0 8px 8px;
      height: calc(100% - 80px);
      display: flex;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    `;

    // Original component container
    this.originalContainer = document.createElement('div');
    this.originalContainer.style.cssText = `
      flex: 1;
      padding: 24px;
      overflow: auto;
      border-right: 1px solid #e9ecef;
      background: #f8f9fa;
    `;

    this.previewContainer.appendChild(this.originalContainer);
    this.panelElement.appendChild(this.controlsContainer);
    this.panelElement.appendChild(this.previewContainer);
  }

  /**
   * Show the preview panel
   */
  public show(fiber: ReactFiberNode, componentInfo?: ComponentInfo, options: PreviewOptions = {}): void {
    if (!this.panelElement || !fiber) return;

    this.currentFiber = fiber;
    this.showComparison = options.showComparison !== false;
    this.currentViewport = options.viewportSize || 'desktop';

    // Build controls
    this.buildControls(fiber);

    // Build preview
    this.buildPreview(fiber, componentInfo);

    // Add to document and show
    if (!document.body.contains(this.panelElement)) {
      document.body.appendChild(this.panelElement);
    }
    this.panelElement.style.display = 'block';

    // Add ESC key listener
    document.addEventListener('keydown', this.handleKeyDown);
  }

  /**
   * Hide the preview panel
   */
  public hide(): void {
    if (this.panelElement) {
      this.panelElement.style.display = 'none';
    }
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  /**
   * Check if preview is visible
   */
  public isVisible(): boolean {
    return this.panelElement?.style.display === 'block';
  }

  /**
   * Build the controls bar
   */
  private buildControls(fiber: ReactFiberNode): void {
    if (!this.controlsContainer) return;

    const componentName = getComponentName(fiber);

    this.controlsContainer.innerHTML = `
      <div style="display: flex; align-items: center; gap: 16px;">
        <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #212529; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          Preview: &lt;${componentName} /&gt;
        </h3>
        <div style="display: flex; gap: 8px; align-items: center;">
          <span style="font-size: 12px; color: #6c757d;">Viewport:</span>
          <button id="viewport-mobile" class="viewport-btn" data-viewport="mobile" style="
            padding: 6px 12px;
            border: 1px solid ${this.currentViewport === 'mobile' ? '#61dafb' : '#dee2e6'};
            background: ${this.currentViewport === 'mobile' ? '#e7f9ff' : 'white'};
            border-radius: 4px;
            font-size: 11px;
            cursor: pointer;
            color: #495057;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          ">📱 Mobile</button>
          <button id="viewport-tablet" class="viewport-btn" data-viewport="tablet" style="
            padding: 6px 12px;
            border: 1px solid ${this.currentViewport === 'tablet' ? '#61dafb' : '#dee2e6'};
            background: ${this.currentViewport === 'tablet' ? '#e7f9ff' : 'white'};
            border-radius: 4px;
            font-size: 11px;
            cursor: pointer;
            color: #495057;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          ">💻 Tablet</button>
          <button id="viewport-desktop" class="viewport-btn" data-viewport="desktop" style="
            padding: 6px 12px;
            border: 1px solid ${this.currentViewport === 'desktop' ? '#61dafb' : '#dee2e6'};
            background: ${this.currentViewport === 'desktop' ? '#e7f9ff' : 'white'};
            border-radius: 4px;
            font-size: 11px;
            cursor: pointer;
            color: #495057;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          ">🖥️ Desktop</button>
        </div>
        <button id="toggle-comparison" style="
          padding: 6px 12px;
          border: 1px solid #dee2e6;
          background: white;
          border-radius: 4px;
          font-size: 11px;
          cursor: pointer;
          color: #495057;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        ">${this.showComparison ? '👁️ Hide Original' : '👁️ Show Original'}</button>
      </div>
      <div style="display: flex; gap: 8px;">
        <button id="preview-close" style="
          background: none;
          border: none;
          font-size: 24px;
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
    `;

    // Add event listeners
    const closeBtn = this.controlsContainer.querySelector('#preview-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    }

    const viewportBtns = this.controlsContainer.querySelectorAll('.viewport-btn');
    viewportBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const viewport = target.getAttribute('data-viewport') as 'mobile' | 'tablet' | 'desktop';
        if (viewport) {
          this.setViewport(viewport);
        }
      });
    });

    const toggleBtn = this.controlsContainer.querySelector('#toggle-comparison');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.toggleComparison());
    }
  }

  /**
   * Build the preview content
   */
  private buildPreview(fiber: ReactFiberNode, componentInfo?: ComponentInfo): void {
    if (!this.previewContainer || !this.originalContainer) return;

    // Clear previous preview
    this.originalContainer.innerHTML = '';

    // Show original element
    if (this.showComparison) {
      this.showOriginalElement(fiber);
    }

    // Show generated preview
    this.showGeneratedPreview(fiber, componentInfo);
  }

  /**
   * Show the original element (highlighted in page)
   */
  private showOriginalElement(fiber: ReactFiberNode): void {
    if (!this.originalContainer) return;

    const element = this.findDOMElementForFiber(fiber);
    if (!element) {
      this.originalContainer.innerHTML = `
        <div style="
          padding: 24px;
          text-align: center;
          color: #6c757d;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        ">
          <p style="margin: 0; font-size: 14px;">Original element not found</p>
        </div>
      `;
      return;
    }

    // Clone the element for preview
    const clone = element.cloneNode(true) as HTMLElement;

    const componentName = getComponentName(fiber);

    this.originalContainer.innerHTML = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 2px solid #dee2e6;
        ">
          <h4 style="margin: 0; font-size: 14px; font-weight: 600; color: #212529;">
            Original Component
          </h4>
          <span style="
            padding: 4px 8px;
            background: #e7f9ff;
            color: #0066cc;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
          ">&lt;${componentName} /&gt;</span>
        </div>
        <div id="original-clone-container" style="
          border: 2px dashed #61dafb;
          border-radius: 8px;
          padding: 16px;
          background: white;
        "></div>
        <div style="
          margin-top: 12px;
          padding: 12px;
          background: #fff3cd;
          border-radius: 6px;
          font-size: 12px;
          color: #856404;
        ">
          ⚠️ This is a static snapshot. Interactive features won't work.
        </div>
      </div>
    `;

    const cloneContainer = this.originalContainer.querySelector('#original-clone-container');
    if (cloneContainer) {
      cloneContainer.appendChild(clone);
    }
  }

  /**
   * Show the generated component preview
   */
  private showGeneratedPreview(fiber: ReactFiberNode, _componentInfo?: ComponentInfo): void {
    if (!this.previewContainer) return;

    // Remove existing preview container
    const existingPreview = this.previewContainer.querySelector('#generated-preview-container');
    if (existingPreview) {
      existingPreview.remove();
    }

    // Create new preview container
    const previewDiv = document.createElement('div');
    previewDiv.id = 'generated-preview-container';
    previewDiv.style.cssText = `
      flex: 1;
      padding: 24px;
      overflow: auto;
      background: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `;

    try {
      // Generate code
      const code = quickGenerate(fiber);

      // Get viewport width
      const width = this.getViewportWidth();

      previewDiv.innerHTML = `
        <div>
          <div style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 2px solid #dee2e6;
          ">
            <h4 style="margin: 0; font-size: 14px; font-weight: 600; color: #212529;">
              Generated Preview
            </h4>
            <span style="
              padding: 4px 8px;
              background: #d4edda;
              color: #155724;
              border-radius: 4px;
              font-size: 11px;
              font-weight: 600;
            ">Generated Code</span>
          </div>
          <div style="
            border: 2px solid #28a745;
            border-radius: 8px;
            padding: 16px;
            background: #f8f9fa;
            max-width: ${width}px;
            margin: 0 auto;
            transition: max-width 0.3s ease;
          ">
            <div style="
              padding: 24px;
              background: white;
              border-radius: 6px;
              min-height: 100px;
              display: flex;
              align-items: center;
              justify-content: center;
              text-align: center;
              color: #6c757d;
            ">
              <div>
                <div style="font-size: 48px; margin-bottom: 12px;">📝</div>
                <h5 style="margin: 0 0 8px 0; font-size: 16px; color: #212529;">
                  Code Generated Successfully
                </h5>
                <p style="margin: 0; font-size: 14px; line-height: 1.6;">
                  The component code has been generated.<br/>
                  Live rendering requires React runtime.
                </p>
              </div>
            </div>
          </div>
          <div style="
            margin-top: 16px;
            padding: 12px;
            background: #d1ecf1;
            border-radius: 6px;
            font-size: 12px;
            color: #0c5460;
          ">
            💡 <strong>Note:</strong> Full live preview requires React runtime.<br/>
            For now, the generated code is available in the modal.
          </div>
          <details style="margin-top: 16px;">
            <summary style="
              cursor: pointer;
              padding: 8px;
              background: #f8f9fa;
              border-radius: 4px;
              font-size: 13px;
              font-weight: 600;
              color: #495057;
            ">
              📄 View Generated Code
            </summary>
            <pre style="
              margin: 8px 0 0 0;
              padding: 16px;
              background: #1e1e1e;
              color: #d4d4d4;
              border-radius: 6px;
              font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.6;
              overflow-x: auto;
              white-space: pre-wrap;
              word-wrap: break-word;
            ">${this.escapeHtml(code)}</pre>
          </details>
        </div>
      `;
    } catch (error) {
      console.error('Preview Panel: Error generating preview', error);
      previewDiv.innerHTML = `
        <div style="
          padding: 24px;
          text-align: center;
          color: #721c24;
          background: #f8d7da;
          border-radius: 8px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        ">
          <div style="font-size: 48px; margin-bottom: 12px;">⚠️</div>
          <h5 style="margin: 0 0 8px 0; font-size: 16px;">Error Generating Preview</h5>
          <p style="margin: 0; font-size: 14px;">
            ${error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      `;
    }

    this.previewContainer.appendChild(previewDiv);
  }

  /**
   * Set viewport size
   */
  private setViewport(viewport: 'mobile' | 'tablet' | 'desktop'): void {
    this.currentViewport = viewport;

    if (this.currentFiber) {
      this.buildControls(this.currentFiber);
      this.buildPreview(this.currentFiber);
    }
  }

  /**
   * Get viewport width based on current setting
   */
  private getViewportWidth(): number {
    switch (this.currentViewport) {
      case 'mobile':
        return 375;
      case 'tablet':
        return 768;
      case 'desktop':
        return 1200;
      default:
        return 1200;
    }
  }

  /**
   * Toggle comparison view
   */
  private toggleComparison(): void {
    this.showComparison = !this.showComparison;

    if (!this.showComparison && this.originalContainer) {
      this.originalContainer.style.display = 'none';
    } else if (this.originalContainer) {
      this.originalContainer.style.display = 'block';
    }

    if (this.currentFiber) {
      this.buildControls(this.currentFiber);
      if (this.showComparison) {
        this.buildPreview(this.currentFiber);
      }
    }
  }

  /**
   * Handle keyboard shortcuts
   */
  private handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      this.hide();
      e.preventDefault();
    }
  };

  /**
   * Find DOM element for a fiber node
   */
  private findDOMElementForFiber(fiber: ReactFiberNode): HTMLElement | null {
    // For host components (HTML elements), stateNode is the DOM element
    if (fiber.tag === 5 && fiber.stateNode instanceof HTMLElement) {
      return fiber.stateNode;
    }

    // For composite components, find the first host component child
    let current: ReactFiberNode | null = fiber.child;
    while (current) {
      if (current.tag === 5 && current.stateNode instanceof HTMLElement) {
        return current.stateNode;
      }
      current = current.child;
    }

    return null;
  }

  /**
   * Escape HTML for safe display
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Destroy the preview panel
   */
  public destroy(): void {
    if (this.panelElement && document.body.contains(this.panelElement)) {
      document.body.removeChild(this.panelElement);
    }
    document.removeEventListener('keydown', this.handleKeyDown);
  }
}
