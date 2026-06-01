import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Unregister all service workers to clear PWA cache issues
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
    }
  });
}

// Global error logger to render errors to DOM
if (typeof window !== 'undefined') {
  window.onerror = function(message, source, lineno, colno, error) {
    const div = document.createElement('div');
    div.style.color = 'red';
    div.style.background = '#fee2e2';
    div.style.border = '2px solid #ef4444';
    div.style.padding = '20px';
    div.style.margin = '20px';
    div.style.borderRadius = '8px';
    div.style.fontFamily = 'monospace';
    div.innerHTML = `<h3>Frontend Runtime Error:</h3><p>${message}</p><small>at ${source}:${lineno}:${colno}</small>`;
    if (error && error.stack) {
      div.innerHTML += `<pre style="margin-top: 10px; font-size: 11px; white-space: pre-wrap;">${error.stack}</pre>`;
    }
    document.body.appendChild(div);
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
