// Content script - injected into web pages
import {
  getFiberFromElement,
  hasReactDevTools,
  getReactVersion,
} from '@lib/fiber-utils';
import { InspectorOverlay } from '@components/Inspector/InspectorOverlay';

console.log('React Component Cloner: Content script loaded');

// Create inspector instance
const inspector = new InspectorOverlay();

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === 'CHECK_REACT') {
    // Try to detect React immediately
    let reactDetected = checkReactOnPage();

    // If not detected, wait a bit and try again (React might still be loading)
    if (!reactDetected) {
      console.log('React Component Cloner: First check failed, retrying in 500ms...');
      setTimeout(() => {
        reactDetected = checkReactOnPage();
        sendResponse({ reactDetected });
      }, 500);
      return true; // Keep message channel open for async response
    }

    sendResponse({ reactDetected });
    return true;
  }

  if (request.type === 'TOGGLE_INSPECTOR') {
    if (request.enabled) {
      inspector.activate();
      showTemporaryNotification('Inspector activated! Hover over elements to inspect.');
    } else {
      inspector.deactivate();
      showTemporaryNotification('Inspector deactivated');
    }
    sendResponse({ success: true });
    return true;
  }

  return false;
});

// Check if React is present on the page
function checkReactOnPage(): boolean {
  console.log('React Component Cloner: Checking for React...');

  // Method 1: Check for React DevTools hook (using fiber-utils)
  if (hasReactDevTools()) {
    const version = getReactVersion();
    console.log('React Component Cloner: ✅ React detected via DevTools hook!', version ? `Version: ${version}` : '');
    return true;
  }

  // Method 2: Check for React on window object
  if ((window as any).React || (window as any).ReactDOM) {
    console.log('React Component Cloner: ✅ React detected on window object!');
    return true;
  }

  // Method 3: Check DOM nodes for React Fiber properties
  const allElements = document.querySelectorAll('*');
  console.log(`React Component Cloner: Checking ${Math.min(allElements.length, 200)} elements for Fiber...`);

  for (let i = 0; i < Math.min(allElements.length, 200); i++) {
    const element = allElements[i];
    const fiber = getFiberFromElement(element as HTMLElement);

    if (fiber) {
      console.log('React Component Cloner: ✅ React detected via Fiber on element:', element);
      return true;
    }
  }

  // Method 4: Check for React root containers (legacy)
  const reactRootElements = document.querySelectorAll('[data-reactroot]');
  if (reactRootElements.length > 0) {
    console.log('React Component Cloner: ✅ React detected via data-reactroot!');
    return true;
  }

  // Method 5: Check for React 18+ root containers
  const rootElements = document.querySelectorAll('[id*="root"], [class*="root"]');
  for (const rootEl of Array.from(rootElements)) {
    const fiber = getFiberFromElement(rootEl as HTMLElement);
    if (fiber) {
      console.log('React Component Cloner: ✅ React detected via root element!', rootEl);
      return true;
    }
  }

  console.log('React Component Cloner: ❌ No React detected');
  return false;
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
  // Ctrl+Shift+C or Cmd+Shift+C to toggle inspector
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
    e.preventDefault();

    if (inspector.isActive()) {
      inspector.deactivate();
      showTemporaryNotification('Inspector deactivated');
    } else {
      inspector.activate();
      showTemporaryNotification('Inspector activated! Hover over elements to inspect.');
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
