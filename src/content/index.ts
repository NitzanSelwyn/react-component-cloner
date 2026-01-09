// Content script - injected into web pages
import {
  getFiberFromElement,
  hasReactDevTools,
  getReactVersion,
  getComponentName,
  extractAllMetadata,
  extractHooks,
  buildComponentInfo,
} from '@lib/fiber-utils';

console.log('React Component Cloner: Content script loaded');

let inspectorActive = false;

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === 'CHECK_REACT') {
    const reactDetected = checkReactOnPage();
    sendResponse({ reactDetected });
    return true;
  }

  if (request.type === 'TOGGLE_INSPECTOR') {
    inspectorActive = request.enabled;
    if (inspectorActive) {
      activateInspector();
    } else {
      deactivateInspector();
    }
    sendResponse({ success: true });
    return true;
  }

  return false;
});

// Check if React is present on the page
function checkReactOnPage(): boolean {
  // Method 1: Check for React DevTools hook (using fiber-utils)
  if (hasReactDevTools()) {
    const version = getReactVersion();
    console.log('React Component Cloner: React detected!', version ? `Version: ${version}` : '');
    return true;
  }

  // Method 2: Check DOM nodes for React Fiber properties
  const allElements = document.querySelectorAll('*');
  for (let i = 0; i < Math.min(allElements.length, 100); i++) {
    const element = allElements[i];
    const fiber = getFiberFromElement(element as HTMLElement);

    if (fiber) {
      console.log('React Component Cloner: React detected via Fiber!');
      return true;
    }
  }

  // Method 3: Check for React root containers
  const reactRootElements = document.querySelectorAll('[data-reactroot]');
  if (reactRootElements.length > 0) {
    return true;
  }

  return false;
}

// Activate the inspector mode
function activateInspector() {
  console.log('React Component Cloner: Inspector activated');

  // Test fiber utilities - Click any element to see its fiber info
  document.addEventListener('click', handleElementClick, true);

  showTemporaryNotification('Inspector activated! Click any element to see component info in console.');
}

// Handle element click to demonstrate fiber extraction
function handleElementClick(e: MouseEvent) {
  if (!inspectorActive) return;

  e.preventDefault();
  e.stopPropagation();

  const element = e.target as HTMLElement;
  console.log('React Component Cloner: Clicked element:', element);

  // Get fiber from element
  const fiber = getFiberFromElement(element);
  if (!fiber) {
    console.log('React Component Cloner: No fiber found for this element');
    showTemporaryNotification('No React component found for this element');
    return;
  }

  // Extract component information
  console.log('React Component Cloner: Fiber found!', fiber);

  const componentName = getComponentName(fiber);
  console.log('React Component Cloner: Component name:', componentName);

  const metadata = extractAllMetadata(fiber);
  console.log('React Component Cloner: Component metadata:', metadata);

  const hooks = extractHooks(fiber);
  console.log('React Component Cloner: Hooks:', hooks);

  const componentInfo = buildComponentInfo(fiber, true, 2);
  console.log('React Component Cloner: Full component info:', componentInfo);

  showTemporaryNotification(`Component: ${componentName} (see console for details)`);
}

// Deactivate the inspector mode
function deactivateInspector() {
  console.log('React Component Cloner: Inspector deactivated');

  // Remove click event listener
  document.removeEventListener('click', handleElementClick, true);

  showTemporaryNotification('Inspector deactivated');
}

// Show a temporary notification (placeholder)
function showTemporaryNotification(message: string) {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #61dafb 0%, #4fa3c7 100%);
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 999999;
    animation: slideIn 0.3s ease-out;
  `;

  // Add animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.transition = 'opacity 0.3s, transform 0.3s';
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Listen for keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Ctrl+Shift+C or Cmd+Shift+C
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
    e.preventDefault();
    inspectorActive = !inspectorActive;

    if (inspectorActive) {
      activateInspector();
    } else {
      deactivateInspector();
    }
  }
});

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('React Component Cloner: Page loaded');
  });
} else {
  console.log('React Component Cloner: Page already loaded');
}
