import { useEffect, useState, type ReactNode } from 'react';
import { X, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';

/* ---------- Avatar with initials ---------- */
export function Avatar({ name, color, size = 36 }: { name: string; color?: string; size?: number }) {
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const c = color || '#f97316';
  return (
    <span
      className="inline-flex shrink-0 select-none items-center justify-center rounded-full font-bold text-white"
      style={{ width: size, height: size, background: `linear-gradient(135deg, ${c}, ${c}cc)`, fontSize: size * 0.38 }}
      aria-hidden
    >
      {initials}
    </span>
  );
}

/* ---------- Stat card (AdminCN style) ---------- */
export function StatCard({ label, value, delta, deltaUp, icon, hint, accent }: {
  label: string; value: string; delta?: string; deltaUp?: boolean; icon?: ReactNode; hint?: string; accent?: boolean;
}) {
  return (
    <div className={`card p-4 transition-shadow hover:shadow-pop ${accent ? 'ring-1 ring-primary/25' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        {icon && <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${accent ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>{icon}</span>}
      </div>
      <div className="mt-2 flex items-end gap-2">
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        {delta && (
          <span className={`mb-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${deltaUp ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
            {delta}
          </span>
        )}
      </div>
      {hint && <p className="mt-1 text-[12px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

/* ---------- Modal ---------- */
export function Modal({ open, onClose, title, children, footer, wide }: {
  open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode; wide?: boolean;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    if (open) window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal className={`animate-fade-up max-h-[92vh] w-full ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'} overflow-hidden rounded-t-2xl bg-card shadow-pop sm:rounded-2xl`}>
        <div className="flex items-center justify-between border-b border-border/70 px-5 py-3.5">
          <h3 className="text-[15px] font-semibold">{title}</h3>
          <button className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[64vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 border-t border-border/70 bg-muted/40 px-5 py-3 safe-bottom">{footer}</div>}
      </div>
    </div>
  );
}

/* ---------- Confirm dialog ---------- */
export function Confirm({ open, onClose, onConfirm, title, message, danger = true }: {
  open: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; danger?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button className="btn btn-outline btn-md" onClick={onClose}>Annuler</button>
          <button className={`btn btn-md ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={() => { onConfirm(); onClose(); }}>Confirmer</button>
        </>
      }
    >
      <p className="text-sm text-muted-foreground">{message}</p>
    </Modal>
  );
}

/* ---------- Form fields ---------- */
export function Field({ label, children, required, hint, className = '' }: { label: string; children: ReactNode; required?: boolean; hint?: string; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="label mb-1 block">
        {label} {required && <span className="text-danger">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-muted-foreground">{hint}</span>}
    </label>
  );
}

export function Select({ value, onChange, options, className = '', placeholder }: {
  value: string | number; onChange: (v: string) => void; options: Array<{ value: string | number; label: string }>; className?: string; placeholder?: string;
}) {
  return (
    <select className={`input ${className}`} value={value} onChange={(e) => onChange(e.target.value)}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

/* ---------- Status chips ---------- */
const CHIP_STYLES: Record<string, string> = {
  paid: 'bg-success/10 text-success', active: 'bg-success/10 text-success', present: 'bg-success/10 text-success', resolved: 'bg-success/10 text-success', low: 'bg-success/10 text-success',
  pending: 'bg-warn/15 text-[#a16207] dark:text-warn', partial: 'bg-warn/15 text-[#a16207] dark:text-warn', late: 'bg-warn/15 text-[#a16207] dark:text-warn', moderate: 'bg-warn/15 text-[#a16207] dark:text-warn',
  failed: 'bg-danger/10 text-danger', absent: 'bg-danger/10 text-danger', serious: 'bg-danger/10 text-danger', open: 'bg-danger/10 text-danger', exclusion: 'bg-danger/10 text-danger',
  inactive: 'bg-muted text-muted-foreground', left: 'bg-muted text-muted-foreground', graduated: 'bg-primary/10 text-primary', none: 'bg-muted text-muted-foreground',
  warning: 'bg-primary/10 text-primary', detention: 'bg-secondary text-secondary-foreground', council: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
};

export function Chip({ value, label }: { value: string; label?: string }) {
  const cls = CHIP_STYLES[value] || 'bg-muted text-muted-foreground';
  return <span className={`chip ${cls}`}>{label ?? value}</span>;
}

/* ---------- Tabs ---------- */
export function Tabs({ tabs, active, onChange, className = '' }: {
  tabs: Array<{ id: string; label: string; count?: number }>; active: string; onChange: (id: string) => void; className?: string;
}) {
  return (
    <div className={`no-scrollbar flex gap-1 overflow-x-auto rounded-xl bg-muted p-1 ${className}`} role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={active === t.id}
          onClick={() => onChange(t.id)}
          className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-all ${
            active === t.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {t.label}
          {typeof t.count === 'number' && (
            <span className={`rounded-full px-1.5 text-[10px] font-bold ${active === t.id ? 'bg-primary/15 text-primary' : 'bg-muted-foreground/10'}`}>{t.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ---------- Pagination ---------- */
export function Pagination({ page, pages, onPage, total, perPage }: { page: number; pages: number; onPage: (p: number) => void; total: number; perPage: number }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-[12px] text-muted-foreground">
      <span>
        {total === 0 ? '0' : (page - 1) * perPage + 1}–{Math.min(page * perPage, total)} · {total}
      </span>
      <div className="flex items-center gap-1">
        <button className="btn btn-ghost btn-sm h-7 px-2" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous">
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <span className="min-w-14 text-center font-medium">{page} / {Math.max(pages, 1)}</span>
        <button className="btn btn-ghost btn-sm h-7 px-2" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Next">
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ---------- Empty state ---------- */
export function Empty({ title = 'Aucune donnée', desc, icon, action }: { title?: string; desc?: string; icon?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
        {icon || <Inbox className="h-6 w-6" />}
      </div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        {desc && <p className="mt-1 max-w-xs text-[12px] text-muted-foreground">{desc}</p>}
      </div>
      {action}
    </div>
  );
}

/* ---------- Page header ---------- */
export function PageHeader({ title, sub, actions }: { title: string; sub?: string; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
        {sub && <p className="mt-0.5 text-[13px] text-muted-foreground">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ---------- Search input ---------- */
export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [focus, setFocus] = useState(false);
  return (
    <div className={`relative ${focus ? 'ring-2 ring-ring/40' : ''} rounded-lg`}>
      <input className="input pl-8" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} />
      <svg className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
      </svg>
    </div>
  );
}

/* ---------- Simple bar (progress) ---------- */
export function Progress({ value, className = '', barClass = 'bg-primary' }: { value: number; className?: string; barClass?: string }) {
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-muted ${className}`}>
      <div className={`h-full rounded-full ${barClass} transition-all duration-500`} style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }} />
    </div>
  );
}

/* ---------- Table wrapper ---------- */
export function TableWrap({ children }: { children: ReactNode }) {
  return <div className="card overflow-hidden">{children}</div>;
}
