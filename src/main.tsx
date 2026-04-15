import { StrictMode, Component, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './contexts/AuthContext';
import { NetworkProvider } from './contexts/NetworkContext';
import { SyncProvider } from './contexts/SyncContext';
import './index.css';

// Error boundary to catch render errors
class ErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{padding: '40px', color: '#b91c1c', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto'}}>
          <h1 style={{fontSize: '24px', marginBottom: '16px'}}>Something went wrong</h1>
          <p style={{marginBottom: '16px'}}>The application encountered an unexpected error. This might be due to a missing component, or invalid data.</p>
          <pre style={{background: '#fee2e2', padding: '16px', borderRadius: '8px', overflowX: 'auto', marginBottom: '24px', fontSize: '14px'}}>{this.state.error?.message || 'Unknown error'}</pre>
          <button 
            onClick={() => window.location.reload()}
            style={{background: '#b91c1c', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'}}
          >
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <NetworkProvider>
          <SyncProvider>
            <App />
          </SyncProvider>
        </NetworkProvider>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>
);