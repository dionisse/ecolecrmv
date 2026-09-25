import { createContext, useContext, useState, type ReactNode } from 'react';
import { db, type User } from '@/db/database';
import { ensureSeeded } from '@/db/seed';
import { makeJwt, readJwt } from '@/utils/format';

const TOKEN_KEY = 'ecolecrm.token';

interface AuthCtx {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; user?: User; error?: string }>;
  loginAs: (role: string) => Promise<void>;
  logout: () => void;
  ready: boolean;
}

const Ctx = createContext<AuthCtx>(null as any);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  // restore session from simulated JWT (after seeding local database)
  useState(() => {
    (async () => {
      try {
        await ensureSeeded();
        const token = localStorage.getItem(TOKEN_KEY);
        if (token) {
          const payload = readJwt(token);
          if (payload?.email) {
            const u = await db.users.where('email').equals(payload.email as string).first();
            if (u) setUser(u);
          }
        }
      } catch {}
      setReady(true);
    })();
    return null;
  });

  const login: AuthCtx['login'] = async (email, password) => {
    const e = email.trim().toLowerCase();
    const u = await db.users.where('email').equals(e).first();
    if (!u || u.password !== password) return { ok: false, error: 'invalid' };
    const token = makeJwt({ sub: u.email, role: u.role, name: u.name });
    localStorage.setItem(TOKEN_KEY, token);
    setUser(u);
    return { ok: true, user: u };
  };

  const loginAs = async (emailOrRole: string) => {
    const u = await db.users.where('email').equals(emailOrRole).first();
    if (u) {
      const token = makeJwt({ sub: u.email, role: u.role, name: u.name });
      localStorage.setItem(TOKEN_KEY, token);
      setUser(u);
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  return <Ctx.Provider value={{ user, token: typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null, login, loginAs, logout, ready }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);

/* Role → portal key & default landing route */
export const ROLE_PORTAL: Record<string, { key: string; route: string; landing?: string }> = {
  admin: { key: 'portal.admin', route: '/app/dashboard' },
  director: { key: 'portal.admin', route: '/app/dashboard' },
  teacher: { key: 'portal.teacher', route: '/app/teaching' },
  parent: { key: 'portal.parent', route: '/app/family' },
  accountant: { key: 'portal.accounting', route: '/app/finance/payments' },
  secretary: { key: 'portal.secretariat', route: '/app/students' },
  discipline: { key: 'portal.discipline', route: '/app/discipline' },
  censor: { key: 'portal.censor', route: '/app/students' },
  staff: { key: 'portal.staffp', route: '/app/tasks' },
};
