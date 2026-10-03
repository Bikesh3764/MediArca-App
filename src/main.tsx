import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
// Google OAuth requires authorized origin (http://localhost:5173).
// If developer opens via 127.0.0.1, seamlessly redirect to localhost to avoid origin_mismatch error.
if (typeof window !== 'undefined' && window.location.hostname === '127.0.0.1') {
  const url = new URL(window.location.href);
  url.hostname = 'localhost';
  window.location.replace(url.href);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
