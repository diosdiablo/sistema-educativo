import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

async function subscribeToPush(registration) {
  try {
    const existing = await registration.pushManager.getSubscription();
    if (existing) return existing;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: VAPID_PUBLIC_KEY
    });

    const saved = sessionStorage.getItem('edu_current_user_session');
    if (!saved) return subscription;
    const user = JSON.parse(saved);

    await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription, userId: user.id, userName: user.name })
    });

    return subscription;
  } catch {}
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      if (VAPID_PUBLIC_KEY) subscribeToPush(reg);
    } catch {}
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
