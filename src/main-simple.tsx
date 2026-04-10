import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

// Minimal test - just render a div
const TestApp = () => <div style={{padding: 40, fontSize: 24}}>✅ React is rendering!</div>;

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

try {
  createRoot(rootElement).render(
    <StrictMode>
      <TestApp />
    </StrictMode>
  );
  console.log('[main] Rendered successfully');
} catch (error) {
  console.error('[main] Render failed:', error);
  rootElement.innerHTML = `<div style="padding: 40px; color: red;">❌ Render failed: ${error}</div>`;
}
