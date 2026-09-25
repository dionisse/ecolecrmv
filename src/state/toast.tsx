import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, WifiOff, X } from 'lucide-react';

type ToastKind = 'success' | 'error' | 'offline';
interface Toast { id: number; kind: ToastKind; msg: string; }
interface ToastCtx { toast: (msg: string, kind?: ToastKind) => void; }

const Ctx = createContext<ToastCtx>({ toast: () => {} });
let seq = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const toast = useCallback((msg: string, kind: ToastKind = 'success') => {
    const id = seq++;
    setItems((s) => [...s, { id, kind, msg }]);
    setTimeout(() => setItems((s) => s.filter((t) => t.id !== id)), 3800);
  }, []);

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-[92vw] sm:max-w-sm">
        {items.map((t) => (
          <div
            key={t.id}
            role="status"
            className="animate-fade-up flex items-start gap-3 rounded-xl border border-border/70 bg-card px-4 py-3 shadow-pop"
          >
            {t.kind === 'success' && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />}
            {t.kind === 'error' && <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />}
            {t.kind === 'offline' && <WifiOff className="mt-0.5 h-4 w-4 shrink-0 text-warn" />}
            <p className="text-[13px] leading-snug text-foreground/90">{t.msg}</p>
            <button
              className="ml-1 shrink-0 rounded p-0.5 text-muted-foreground hover:bg-muted"
              onClick={() => setItems((s) => s.filter((x) => x.id !== t.id))}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
