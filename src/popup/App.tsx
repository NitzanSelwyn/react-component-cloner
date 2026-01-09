import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [reactDetected, setReactDetected] = useState<boolean | null>(null);
  const [inspectorActive, setInspectorActive] = useState(false);

  useEffect(() => {
    // Check if React is detected on the current tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { type: 'CHECK_REACT' },
          (response) => {
            if (chrome.runtime.lastError) {
              setReactDetected(false);
              return;
            }
            setReactDetected(response?.reactDetected || false);
          }
        );
      }
    });
  }, []);

  const toggleInspector = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'TOGGLE_INSPECTOR',
          enabled: !inspectorActive
        });
        setInspectorActive(!inspectorActive);
      }
    });
  };

  return (
    <div className="popup-container">
      <header className="popup-header">
        <h1>React Component Cloner</h1>
      </header>

      <main className="popup-main">
        <div className="status-section">
          <div className="status-item">
            <span className="status-label">React Detected:</span>
            <span className={`status-value ${reactDetected ? 'success' : 'error'}`}>
              {reactDetected === null ? '...' : reactDetected ? 'Yes' : 'No'}
            </span>
          </div>

          {reactDetected === false && (
            <div className="warning-message">
              No React detected on this page. This extension only works on pages using React.
            </div>
          )}
        </div>

        <div className="actions-section">
          <button
            className={`primary-button ${inspectorActive ? 'active' : ''}`}
            onClick={toggleInspector}
            disabled={!reactDetected}
          >
            {inspectorActive ? 'Stop Inspector' : 'Start Inspector'}
          </button>

          <div className="keyboard-hint">
            Keyboard shortcut: <kbd>Ctrl+Shift+C</kbd>
          </div>
        </div>

        <div className="info-section">
          <h3>How to use:</h3>
          <ol>
            <li>Click "Start Inspector" or press <kbd>Ctrl+Shift+C</kbd></li>
            <li>Hover over elements on the page</li>
            <li>Click to select a component</li>
            <li>Preview and copy the generated code</li>
          </ol>
        </div>
      </main>

      <footer className="popup-footer">
        <span>v0.1.0</span>
      </footer>
    </div>
  );
}

export default App;
