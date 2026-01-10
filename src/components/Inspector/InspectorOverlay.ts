/**
 * Inspector Overlay - Visual component inspector with hover highlighting and selection
 */

import {
  getFiberFromElement,
  getComponentName,
  getNearestComponentFiber,
  getParentFiber,
  getChildrenFibers,
  buildComponentInfo,
} from '@lib/fiber-utils';
import { quickGenerate } from '@lib/code-generator';
import { PreviewPanel } from '@/components/Preview/PreviewPanel';
import type { ReactFiberNode } from '@/types';

interface InspectorState {
  active: boolean;
  hoveredElement: HTMLElement | null;
  hoveredFiber: ReactFiberNode | null;
  selectedElement: HTMLElement | null;
  selectedFiber: ReactFiberNode | null;
}

export class InspectorOverlay {
  private state: InspectorState = {
    active: false,
    hoveredElement: null,
    hoveredFiber: null,
    selectedElement: null,
    selectedFiber: null,
  };

  private overlayElement: HTMLDivElement | null = null;
  private tooltipElement: HTMLDivElement | null = null;
  private infoPanelElement: HTMLDivElement | null = null;
  private previewPanel: PreviewPanel;

  private boundHandlers = {
    handleMouseMove: this.handleMouseMove.bind(this),
    handleClick: this.handleClick.bind(this),
    handleKeyDown: this.handleKeyDown.bind(this),
  };

  constructor() {
    this.createOverlayElements();
    this.previewPanel = new PreviewPanel();
  }

  /**
   * Create the overlay DOM elements
   */
  private createOverlayElements(): void {
    // Create highlight overlay
    this.overlayElement = document.createElement('div');
    this.overlayElement.id = 'react-component-cloner-overlay';
    this.overlayElement.style.cssText = `
      position: absolute;
      pointer-events: none;
      z-index: 2147483646;
      border: 2px solid #61dafb;
      background: rgba(97, 218, 251, 0.1);
      box-shadow: 0 0 0 2px rgba(97, 218, 251, 0.3);
      transition: all 0.1s ease-out;
      display: none;
    `;

    // Create tooltip
    this.tooltipElement = document.createElement('div');
    this.tooltipElement.id = 'react-component-cloner-tooltip';
    this.tooltipElement.style.cssText = `
      position: absolute;
      pointer-events: none;
      z-index: 2147483647;
      background: linear-gradient(135deg, #61dafb 0%, #4fa3c7 100%);
      color: white;
      padding: 6px 12px;
      border-radius: 4px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 12px;
      font-weight: 600;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      display: none;
      white-space: nowrap;
    `;

    // Create info panel (will be shown when component is selected)
    this.infoPanelElement = document.createElement('div');
    this.infoPanelElement.id = 'react-component-cloner-info-panel';
    this.infoPanelElement.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 350px;
      max-height: 80vh;
      overflow-y: auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      z-index: 2147483647;
      display: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `;
  }

  /**
   * Activate the inspector
   */
  public activate(): void {
    if (this.state.active) return;

    this.state.active = true;

    // Append elements to body
    if (this.overlayElement) document.body.appendChild(this.overlayElement);
    if (this.tooltipElement) document.body.appendChild(this.tooltipElement);
    if (this.infoPanelElement) document.body.appendChild(this.infoPanelElement);

    // Add event listeners
    document.addEventListener('mousemove', this.boundHandlers.handleMouseMove, true);
    document.addEventListener('click', this.boundHandlers.handleClick, true);
    document.addEventListener('keydown', this.boundHandlers.handleKeyDown, true);

    console.log('React Component Cloner: Inspector activated');
  }

  /**
   * Deactivate the inspector
   */
  public deactivate(): void {
    if (!this.state.active) return;

    this.state.active = false;

    // Remove elements from DOM
    if (this.overlayElement) this.overlayElement.remove();
    if (this.tooltipElement) this.tooltipElement.remove();
    if (this.infoPanelElement) this.infoPanelElement.remove();

    // Remove event listeners
    document.removeEventListener('mousemove', this.boundHandlers.handleMouseMove, true);
    document.removeEventListener('click', this.boundHandlers.handleClick, true);
    document.removeEventListener('keydown', this.boundHandlers.handleKeyDown, true);

    // Clear state
    this.state.hoveredElement = null;
    this.state.hoveredFiber = null;
    this.state.selectedElement = null;
    this.state.selectedFiber = null;

    console.log('React Component Cloner: Inspector deactivated');
  }

  /**
   * Handle mouse move to highlight elements
   */
  private handleMouseMove(e: MouseEvent): void {
    if (!this.state.active) return;

    // Don't highlight our own elements
    const target = e.target as HTMLElement;
    if (this.isInspectorElement(target)) return;

    // Get fiber from element
    const fiber = getFiberFromElement(target);
    if (!fiber) {
      this.hideOverlay();
      return;
    }

    // Get nearest component fiber
    const componentFiber = getNearestComponentFiber(fiber) || fiber;

    // Update state
    this.state.hoveredElement = target;
    this.state.hoveredFiber = componentFiber;

    // Update overlay
    this.updateOverlay(target, componentFiber);
  }

  /**
   * Handle click to select element
   */
  private handleClick(e: MouseEvent): void {
    if (!this.state.active) return;

    const target = e.target as HTMLElement;
    if (this.isInspectorElement(target)) return;

    e.preventDefault();
    e.stopPropagation();

    // Get fiber from element
    const fiber = getFiberFromElement(target);
    if (!fiber) return;

    // Get nearest component fiber
    const componentFiber = getNearestComponentFiber(fiber) || fiber;

    // Update selected state
    this.state.selectedElement = target;
    this.state.selectedFiber = componentFiber;

    // Show info panel
    this.showInfoPanel(componentFiber);

    console.log('React Component Cloner: Component selected', {
      name: getComponentName(componentFiber),
      fiber: componentFiber,
    });
  }

  /**
   * Handle keyboard shortcuts
   */
  private handleKeyDown(e: KeyboardEvent): void {
    if (!this.state.active) return;

    switch (e.key) {
      case 'Escape':
        // Close selection or deactivate inspector
        if (this.state.selectedFiber) {
          this.clearSelection();
        } else {
          this.deactivate();
        }
        e.preventDefault();
        break;

      case 'ArrowUp':
        // Select parent component
        if (this.state.selectedFiber) {
          this.selectParentComponent();
          e.preventDefault();
        }
        break;

      case 'ArrowDown':
        // Select first child component
        if (this.state.selectedFiber) {
          this.selectChildComponent();
          e.preventDefault();
        }
        break;
    }
  }

  /**
   * Update the overlay highlight
   */
  private updateOverlay(element: HTMLElement, fiber: ReactFiberNode): void {
    if (!this.overlayElement || !this.tooltipElement) return;

    // Get element bounding box
    const rect = element.getBoundingClientRect();

    // Update overlay position and size
    this.overlayElement.style.display = 'block';
    this.overlayElement.style.left = `${rect.left + window.scrollX}px`;
    this.overlayElement.style.top = `${rect.top + window.scrollY}px`;
    this.overlayElement.style.width = `${rect.width}px`;
    this.overlayElement.style.height = `${rect.height}px`;

    // Update tooltip
    const componentName = getComponentName(fiber);
    this.tooltipElement.textContent = `<${componentName} />`;
    this.tooltipElement.style.display = 'block';

    // Position tooltip above element
    const tooltipX = rect.left + window.scrollX;
    const tooltipY = rect.top + window.scrollY - 30;

    this.tooltipElement.style.left = `${tooltipX}px`;
    this.tooltipElement.style.top = `${tooltipY}px`;
  }

  /**
   * Hide the overlay
   */
  private hideOverlay(): void {
    if (this.overlayElement) {
      this.overlayElement.style.display = 'none';
    }
    if (this.tooltipElement) {
      this.tooltipElement.style.display = 'none';
    }
  }

  /**
   * Show the info panel for selected component
   */
  private showInfoPanel(fiber: ReactFiberNode): void {
    if (!this.infoPanelElement) return;

    const componentName = getComponentName(fiber);

    // Build info panel HTML
    const html = `
      <div style="padding: 16px; border-bottom: 1px solid #e9ecef;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #212529;">
            &lt;${componentName} /&gt;
          </h3>
          <button id="close-info-panel" style="
            background: none;
            border: none;
            font-size: 20px;
            cursor: pointer;
            color: #6c757d;
            padding: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
          ">&times;</button>
        </div>
        <div style="margin-top: 8px; font-size: 12px; color: #6c757d;">
          Type: ${fiber.type?.name || typeof fiber.type || 'Unknown'}
        </div>
      </div>

      <div style="padding: 16px;">
        <div style="margin-bottom: 16px;">
          <div style="font-size: 12px; font-weight: 600; color: #495057; margin-bottom: 8px;">
            NAVIGATION
          </div>
          <div style="display: flex; gap: 8px;">
            <button id="select-parent" style="
              flex: 1;
              padding: 8px;
              background: #f8f9fa;
              border: 1px solid #dee2e6;
              border-radius: 4px;
              font-size: 12px;
              cursor: pointer;
              color: #495057;
            ">↑ Parent</button>
            <button id="select-child" style="
              flex: 1;
              padding: 8px;
              background: #f8f9fa;
              border: 1px solid #dee2e6;
              border-radius: 4px;
              font-size: 12px;
              cursor: pointer;
              color: #495057;
            ">↓ Child</button>
          </div>
        </div>

        <div style="margin-bottom: 16px;">
          <div style="font-size: 12px; font-weight: 600; color: #495057; margin-bottom: 8px;">
            ACTIONS
          </div>
          <div style="display: flex; gap: 8px; flex-direction: column;">
            <button id="preview-component" style="
              width: 100%;
              padding: 12px;
              background: linear-gradient(135deg, #9945ff 0%, #7b2cbf 100%);
              border: none;
              border-radius: 6px;
              font-size: 14px;
              font-weight: 600;
              cursor: pointer;
              color: white;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            ">👁️ Preview Component</button>
            <button id="extract-component" style="
              width: 100%;
              padding: 12px;
              background: linear-gradient(135deg, #61dafb 0%, #4fa3c7 100%);
              border: none;
              border-radius: 6px;
              font-size: 14px;
              font-weight: 600;
              cursor: pointer;
              color: white;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            ">📝 Extract Code</button>
          </div>
        </div>

        <div style="font-size: 11px; color: #6c757d; text-align: center;">
          Press ESC to close • Arrow keys to navigate
        </div>
      </div>
    `;

    this.infoPanelElement.innerHTML = html;
    this.infoPanelElement.style.display = 'block';

    // Add event listeners to buttons
    const closeBtn = this.infoPanelElement.querySelector('#close-info-panel');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.clearSelection());
    }

    const parentBtn = this.infoPanelElement.querySelector('#select-parent');
    if (parentBtn) {
      parentBtn.addEventListener('click', () => this.selectParentComponent());
    }

    const childBtn = this.infoPanelElement.querySelector('#select-child');
    if (childBtn) {
      childBtn.addEventListener('click', () => this.selectChildComponent());
    }

    const previewBtn = this.infoPanelElement.querySelector('#preview-component');
    if (previewBtn) {
      previewBtn.addEventListener('click', () => this.previewComponent());
    }

    const extractBtn = this.infoPanelElement.querySelector('#extract-component');
    if (extractBtn) {
      extractBtn.addEventListener('click', () => this.extractComponent());
    }
  }

  /**
   * Preview component in preview panel
   */
  private previewComponent(): void {
    if (!this.state.selectedFiber) return;

    const componentName = getComponentName(this.state.selectedFiber);

    console.log('React Component Cloner: Previewing component', {
      name: componentName,
      fiber: this.state.selectedFiber,
    });

    try {
      // Build component info
      const componentInfo = buildComponentInfo(this.state.selectedFiber, true, 3);

      // Show preview panel
      this.previewPanel.show(this.state.selectedFiber, componentInfo, {
        showComparison: true,
        viewportSize: 'desktop',
      });

      console.log('React Component Cloner: Preview opened successfully');
    } catch (error) {
      console.error('React Component Cloner: Error opening preview', error);
      alert(`Error opening preview. Check console for details.`);
    }
  }

  /**
   * Clear selection
   */
  private clearSelection(): void {
    this.state.selectedElement = null;
    this.state.selectedFiber = null;

    if (this.infoPanelElement) {
      this.infoPanelElement.style.display = 'none';
    }
  }

  /**
   * Select parent component
   */
  private selectParentComponent(): void {
    if (!this.state.selectedFiber) return;

    const parentFiber = getParentFiber(this.state.selectedFiber, true);
    if (!parentFiber) {
      console.log('React Component Cloner: No parent component found');
      return;
    }

    // Find DOM element for parent
    const parentElement = this.findDOMElementForFiber(parentFiber);
    if (parentElement) {
      this.state.selectedElement = parentElement;
      this.state.selectedFiber = parentFiber;
      this.showInfoPanel(parentFiber);

      // Update overlay to show parent
      this.updateOverlay(parentElement, parentFiber);
    }
  }

  /**
   * Select first child component
   */
  private selectChildComponent(): void {
    if (!this.state.selectedFiber) return;

    const children = getChildrenFibers(this.state.selectedFiber, true);
    if (children.length === 0) {
      console.log('React Component Cloner: No child components found');
      return;
    }

    const childFiber = children[0];

    // Find DOM element for child
    const childElement = this.findDOMElementForFiber(childFiber);
    if (childElement) {
      this.state.selectedElement = childElement;
      this.state.selectedFiber = childFiber;
      this.showInfoPanel(childFiber);

      // Update overlay to show child
      this.updateOverlay(childElement, childFiber);
    }
  }

  /**
   * Extract component and generate code
   */
  private extractComponent(): void {
    if (!this.state.selectedFiber) return;

    const componentName = getComponentName(this.state.selectedFiber);

    console.log('React Component Cloner: Extracting component', {
      name: componentName,
      fiber: this.state.selectedFiber,
    });

    try {
      // Generate component code
      const code = quickGenerate(this.state.selectedFiber);

      // Show code in a modal
      this.showCodeModal(componentName, code);

      console.log('React Component Cloner: Code generated successfully');
      console.log(code);
    } catch (error) {
      console.error('React Component Cloner: Error generating code', error);
      alert(`Error generating component code. Check console for details.`);
    }
  }

  /**
   * Show generated code in a modal
   */
  private showCodeModal(componentName: string, code: string): void {
    // Create modal backdrop
    const backdrop = document.createElement('div');
    backdrop.id = 'react-component-cloner-modal-backdrop';
    backdrop.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 2147483648;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    // Create modal
    const modal = document.createElement('div');
    modal.style.cssText = `
      background: white;
      border-radius: 12px;
      width: 90%;
      max-width: 800px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    `;

    // Modal header
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 20px 24px;
      border-bottom: 1px solid #e9ecef;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;

    const title = document.createElement('h2');
    title.style.cssText = `
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: #212529;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `;
    title.textContent = `${componentName} Component`;

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = `
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
    `;
    closeBtn.onclick = () => document.body.removeChild(backdrop);

    header.appendChild(title);
    header.appendChild(closeBtn);

    // Code container
    const codeContainer = document.createElement('div');
    codeContainer.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 24px;
      background: #f8f9fa;
    `;

    const pre = document.createElement('pre');
    pre.style.cssText = `
      margin: 0;
      padding: 16px;
      background: #1e1e1e;
      color: #d4d4d4;
      border-radius: 6px;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      font-size: 13px;
      line-height: 1.6;
      overflow-x: auto;
      white-space: pre-wrap;
      word-wrap: break-word;
    `;
    pre.textContent = code;

    codeContainer.appendChild(pre);

    // Footer with actions
    const footer = document.createElement('div');
    footer.style.cssText = `
      padding: 16px 24px;
      border-top: 1px solid #e9ecef;
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    `;

    const copyBtn = document.createElement('button');
    copyBtn.textContent = 'Copy to Clipboard';
    copyBtn.style.cssText = `
      padding: 10px 20px;
      background: linear-gradient(135deg, #61dafb 0%, #4fa3c7 100%);
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `;
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(code).then(() => {
        copyBtn.textContent = '✓ Copied!';
        setTimeout(() => {
          copyBtn.textContent = 'Copy to Clipboard';
        }, 2000);
      });
    };

    footer.appendChild(copyBtn);

    // Assemble modal
    modal.appendChild(header);
    modal.appendChild(codeContainer);
    modal.appendChild(footer);
    backdrop.appendChild(modal);

    // Add to document
    document.body.appendChild(backdrop);

    // Close on backdrop click
    backdrop.onclick = (e) => {
      if (e.target === backdrop) {
        document.body.removeChild(backdrop);
      }
    };

    // Close on ESC key
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        document.body.removeChild(backdrop);
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  }

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
   * Check if element is part of inspector UI
   */
  private isInspectorElement(element: HTMLElement): boolean {
    const inspectorIds = [
      'react-component-cloner-overlay',
      'react-component-cloner-tooltip',
      'react-component-cloner-info-panel',
    ];

    let current: HTMLElement | null = element;
    while (current) {
      if (inspectorIds.includes(current.id)) {
        return true;
      }
      current = current.parentElement;
    }

    return false;
  }

  /**
   * Check if inspector is active
   */
  public isActive(): boolean {
    return this.state.active;
  }

  /**
   * Get current selected fiber
   */
  public getSelectedFiber(): ReactFiberNode | null {
    return this.state.selectedFiber;
  }
}
