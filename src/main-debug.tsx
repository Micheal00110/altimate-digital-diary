import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

console.log('[DEBUG] main-debug.tsx loading...');

const DebugApp = () => {
  console.log('[DEBUG] DebugApp rendering');
  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif' }}>
      <h1>✅ React Debug Mode</h1>
      <p>If you see this, React is working!</p>
      <button onClick={() => window.location.reload()}>Reload</button>
    </div>
  );
};

const rootElement = document.getElementById('root');
console.log('[DEBUG] root element:', rootElement ? 'found' : 'NOT FOUND');

if (!rootElement) {
  document.body.innerHTML = '<div style="padding: 40px; color: red;">❌ Root element not found</div>';
} else {
  try {
    console.log('[DEBUG] Creating root...');
    const root = createRoot(rootElement);
    console.log('[DEBUG] Root created, rendering...');
    root.render(
      <StrictMode>
        <DebugApp />
      </StrictMode>
    );
    console.log('[DEBUG] Render called successfully');
  } catch (error: any) {
    console.error('[DEBUG] Render failed:', error);
    rootElement.innerHTML = `<div style="padding: 40px; color: red;">❌ React Error: ${error?.message || 'Unknown error'}</div>`;
  }
}
