import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { toast } from 'sonner'

// Register service worker (PWA) with user-prompted update flow
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        const promptUpdate = (worker) => {
          toast("Nouvelle version disponible", {
            duration: Infinity,
            action: {
              label: "Recharger",
              onClick: () => {
                worker.postMessage({ type: 'SKIP_WAITING' });
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                  window.location.reload();
                }, { once: true });
              },
            },
          });
        };

        // SW already waiting (page loaded after background update)
        if (registration.waiting) {
          promptUpdate(registration.waiting);
        }

        // SW becomes waiting while page is open
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              promptUpdate(newWorker);
            }
          });
        });
      })
      .catch((err) => {
        console.warn('Service worker registration failed:', err);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
