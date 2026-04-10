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
        <div style={{padding: '20px', color: 'red', fontFamily: 'sans-serif'}}>
          <h1>Something went wrong</h1>
          <pre>{this.state.error?.message || 'Unknown error'}</pre>
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