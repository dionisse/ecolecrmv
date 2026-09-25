import { useSyncExternalStore } from 'react';
import { db } from '@/db/database';

/* ---------- Online status ---------- */
const netListeners = new Set<() => void>();
let online = typeof navigator !== 'undefined' ? navigator.onLine : true;
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => { online = true; netListeners.forEach((l) => l()); });
  window.addEventListener('offline', () => { online = false; netListeners.forEach((l) => l()); });
}
export function useOnline() {
  return useSyncExternalStore(
    (cb) => { netListeners.add(cb); return () => netListeners.delete(cb); },
    () => online,
    () => true
  );
}

/* ---------- Sync queue (operations done offline) ---------- */
const QUEUE_KEY = 'ecolecrm.syncQueue';
const SYNC_KEY = 'ecolecrm.lastSync';
const qListeners = new Set<() => void>();
let queueCount = 0;
let lastSync: string | null = null;
let snapshot = { queue: queueCount, lastSync };

try {
  queueCount = Number(localStorage.getItem(QUEUE_KEY) || 0);
  lastSync = localStorage.getItem(SYNC_KEY);
  snapshot = { queue: queueCount, lastSync };
} catch {}

function emitQ() {
  snapshot = { queue: queueCount, lastSync };
  qListeners.forEach((l) => l());
}

export function queueOperation() {
  queueCount++;
  try { localStorage.setItem(QUEUE_KEY, String(queueCount)); } catch {}
  emitQ();
}

export async function flushQueue() {
  // Simulated server round-trip: in a real deployment this pushes the
  // queued mutations to the backend and pulls fresh data.
  await new Promise((r) => setTimeout(r, 700));
  queueCount = 0;
  lastSync = new Date().toISOString();
  try {
    localStorage.setItem(QUEUE_KEY, '0');
    localStorage.setItem(SYNC_KEY, lastSync);
    await db.meta.put({ key: 'lastSync', value: lastSync });
  } catch {}
  emitQ();
}

export function useSync() {
  return useSyncExternalStore(
    (cb) => { qListeners.add(cb); return () => qListeners.delete(cb); },
    () => snapshot,
    () => ({ queue: 0, lastSync: null })
  );
}

/* ---------- Push permission (simulated push server) ---------- */
export async function enablePush(): Promise<'granted' | 'denied' | 'unsupported'> {
  if (!('Notification' in window)) return 'unsupported';
  try {
    const res = await Notification.requestPermission();
    if (res === 'granted') {
      new Notification('EcoleCRM', {
        body: 'Notifications activées ✔ — vous recevrez les alertes de l’école.',
        icon: './icons/icon-192.png',
      });
      return 'granted';
    }
    return 'denied';
  } catch {
    return 'denied';
  }
}
