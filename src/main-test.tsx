import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

const TestApp = () => (
  <div style={{ padding: 40, fontFamily: 'sans-serif' }}>
    <h1>✅ React is working!</h1>
    <p>If you see this, React is mounting correctly.</p>
  </div>
);

const rootElement = document.getElementById('root');
if (!rootElement) {
  document.body.innerHTML = '<div style="padding: 40px; color: red;">❌ Root element not found</div>';
} else {
  try {
    createRoot(rootElement).render(
      <StrictMode>
        <TestApp />
      </StrictMode>
    );
    console.log('[TEST] React rendered successfully');
  } catch (error) {
    rootElement.innerHTML = `<div style="padding: 40px; color: red;">❌ React error: ${error}</div>`;
    console.error('[TEST] React render failed:', error);
  }
}
