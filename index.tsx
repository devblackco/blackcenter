import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { EnvError } from './components/EnvError';
import { supabaseConfigError } from './lib/supabase';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      {supabaseConfigError ? <EnvError message={supabaseConfigError} /> : <App />}
    </ErrorBoundary>
  </React.StrictMode>
);