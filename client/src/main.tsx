import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Register service worker for PWA / iPhone Add to Home Screen
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

// When running as a standalone PWA on iOS, intercept any anchor clicks
// that would normally open Safari and keep navigation inside the app shell
if ((navigator as any).standalone) {
  document.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest('a');
    if (!target) return;
    const href = target.getAttribute('href');
    if (!href) return;
    // Only intercept relative/same-origin links
    try {
      const url = new URL(href, window.location.href);
      if (url.origin === window.location.origin) {
        e.preventDefault();
        window.location.assign(url.href);
      }
    } catch {}
  });
}

createRoot(document.getElementById("root")!).render(<App />);
