/* ---------- Money & numbers (UEMOA: FCFA/XOF) ---------- */
export const CURRENCY = 'FCFA';

export function fmtMoney(amount: number, withCurrency = true): string {
  const n = Math.round(amount || 0);
  const s = n.toLocaleString('fr-FR').replace(/\u202f/g, ' ');
  return withCurrency ? `${s} ${CURRENCY}` : s;
}

export function fmtCompact(amount: number): string {
  const n = Math.abs(amount || 0);
  if (n >= 1_000_000) return `${(amount / 1_000_000).toFixed(1).replace('.0', '')}M`;
  if (n >= 1_000) return `${(amount / 1_000).toFixed(0)}k`;
  return String(Math.round(amount));
}

export function fmtNumber(n: number): string {
  return (n || 0).toLocaleString('fr-FR').replace(/\u202f/g, ' ');
}

export function pct(a: number, b: number): number {
  if (!b) return 0;
  return Math.round((a / b) * 100);
}

/* ---------- Dates ---------- */
const MONTHS_FR = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function fmtDate(iso: string, lang = 'fr'): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const months = lang === 'fr' ? MONTHS_FR : MONTHS_EN;
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function fmtDateTime(iso: string, lang = 'fr'): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${fmtDate(iso, lang)} · ${hh}:${mm}`;
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function monthKey(d: Date | string = new Date()): string {
  const dd = typeof d === 'string' ? new Date(d) : d;
  return `${dd.getFullYear()}-${String(dd.getMonth() + 1).padStart(2, '0')}`;
}

export function lastNMonths(n: number): string[] {
  const out: string[] = [];
  const d = new Date();
  d.setDate(1);
  for (let i = n - 1; i >= 0; i--) {
    const x = new Date(d.getFullYear(), d.getMonth() - i, 1);
    out.push(monthKey(x));
  }
  return out;
}

export function monthLabel(mk: string, lang = 'fr'): string {
  const [y, m] = mk.split('-').map(Number);
  const months = lang === 'fr'
    ? ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[m - 1]} ${String(y).slice(2)}`;
}

export function age(birth: string): number {
  if (!birth) return 0;
  const b = new Date(birth);
  const d = new Date();
  let a = d.getFullYear() - b.getFullYear();
  const m = d.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && d.getDate() < b.getDate())) a--;
  return a;
}

/* ---------- Ids & tokens ---------- */
let counter = 0;
export function uid(prefix = ''): string {
  counter = (counter + 1) % 1_000_000;
  return `${prefix}${Date.now().toString(36)}${counter.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function matricule(module: string, seq: number, year = new Date().getFullYear()): string {
  const p = module === 'primary' ? 'P' : module === 'secondary' ? 'S' : 'U';
  return `${p}${year}-${String(seq).padStart(4, '0')}`;
}

/** Simulated JWT (HS-like payload) — demo only, real signing happens server-side. */
export function makeJwt(payload: Record<string, unknown>): string {
  const b64 = (o: unknown) => btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/=+$/, '');
  const header = b64({ alg: 'HS256', typ: 'JWT' });
  const body = b64({ ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 });
  let h = 0;
  const s = `${header}.${body}.ecolecrm-secret`;
  for (let i = 0; i < s.length; i++) { h = (h << 5) - h + s.charCodeAt(i); h |= 0; }
  const sig = Math.abs(h).toString(36);
  return `${header}.${body}.${sig}`;
}

export function readJwt(token: string): Record<string, any> | null {
  try {
    const [, body] = token.split('.');
    return JSON.parse(decodeURIComponent(escape(atob(body))));
  } catch { return null; }
}

export function receiptNo(): string {
  const d = new Date();
  const rand = Date.now().toString(36).toUpperCase().slice(-4) + Math.floor(Math.random() * 1296).toString(36).toUpperCase().padStart(2, '0');
  return `RC-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}-${rand}`;
}

/** Sequential receipt number for bulk seeding (guaranteed unique). */
export function receiptNoSeq(n: number): string {
  const d = new Date();
  return `RC-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}-${String(n).padStart(5, '0')}`;
}
