import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, Navigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  LayoutDashboard, Users, GraduationCap, Wallet, UserCog, ShieldAlert, MessageSquare,
  BarChart3, Settings, Menu, X, Globe, Moon, Sun, Bell, LogOut, Wifi, WifiOff,
  RefreshCw, Download, ChevronDown,
} from 'lucide-react';
import { db } from '@/db/database';
import { useI18n } from '@/i18n/I18nContext';
import { useAuth, ROLE_PORTAL } from '@/state/auth';
import { useTheme, toggleTheme } from '@/utils/theme';
import { useOnline, useSync, flushQueue } from '@/state/sync';
import { Avatar } from '@/components/ui';

const GRA = 'bg-gradient-to-br from-primary to-orange-600';

interface NavItem { to: string; labelKey: string; icon: any }

const NAV: Record<string, NavItem[]> = {
  admin: [
    { to: '/app/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
    { to: '/app/students', labelKey: 'nav.students', icon: Users },
    { to: '/app/academic', labelKey: 'nav.academic', icon: GraduationCap },
    { to: '/app/finance', labelKey: 'nav.finance', icon: Wallet },
    { to: '/app/staff', labelKey: 'nav.staff', icon: UserCog },
    { to: '/app/discipline', labelKey: 'nav.discipline', icon: ShieldAlert },
    { to: '/app/messages', labelKey: 'nav.messages', icon: MessageSquare },
    { to: '/app/reports', labelKey: 'nav.reports', icon: BarChart3 },
    { to: '/app/settings', labelKey: 'nav.settings', icon: Settings },
  ],
  director: [
    { to: '/app/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
    { to: '/app/students', labelKey: 'nav.students', icon: Users },
    { to: '/app/academic', labelKey: 'nav.academic', icon: GraduationCap },
    { to: '/app/finance', labelKey: 'nav.finance', icon: Wallet },
    { to: '/app/staff', labelKey: 'nav.staff', icon: UserCog },
    { to: '/app/discipline', labelKey: 'nav.discipline', icon: ShieldAlert },
    { to: '/app/messages', labelKey: 'nav.messages', icon: MessageSquare },
    { to: '/app/reports', labelKey: 'nav.reports', icon: BarChart3 },
  ],
  censor: [
    { to: '/app/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
    { to: '/app/students', labelKey: 'nav.students', icon: Users },
    { to: '/app/academic', labelKey: 'nav.academic', icon: GraduationCap },
    { to: '/app/discipline', labelKey: 'nav.discipline', icon: ShieldAlert },
    { to: '/app/reports', labelKey: 'nav.reports', icon: BarChart3 },
  ],
  discipline: [
    { to: '/app/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
    { to: '/app/discipline', labelKey: 'nav.discipline', icon: ShieldAlert },
    { to: '/app/students', labelKey: 'nav.students', icon: Users },
  ],
  accountant: [
    { to: '/app/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
    { to: '/app/finance', labelKey: 'nav.finance', icon: Wallet },
    { to: '/app/reports', labelKey: 'nav.reports', icon: BarChart3 },
    { to: '/app/messages', labelKey: 'nav.messages', icon: MessageSquare },
  ],
  secretary: [
    { to: '/app/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
    { to: '/app/students', labelKey: 'nav.students', icon: Users },
    { to: '/app/academic', labelKey: 'nav.academic', icon: GraduationCap },
    { to: '/app/messages', labelKey: 'nav.messages', icon: MessageSquare },
  ],
  teacher: [
    { to: '/app/teaching', labelKey: 'portal.teacher', icon: LayoutDashboard },
    { to: '/app/academic', labelKey: 'nav.myClasses', icon: GraduationCap },
    { to: '/app/students', labelKey: 'nav.students', icon: Users },
    { to: '/app/discipline', labelKey: 'nav.discipline', icon: ShieldAlert },
  ],
  parent: [
    { to: '/app/family', labelKey: 'nav.myChildren', icon: LayoutDashboard },
    { to: '/app/finance', labelKey: 'nav.payments', icon: Wallet },
    { to: '/app/messages', labelKey: 'nav.messages', icon: MessageSquare },
  ],
  staff: [
    { to: '/app/tasks', labelKey: 'nav.myTasks', icon: LayoutDashboard },
    { to: '/app/messages', labelKey: 'nav.messages', icon: MessageSquare },
  ],
};

/* ---------------- Sidebar ---------------- */
function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const items = NAV[user?.role || 'staff'] || NAV.staff;
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-border/60 px-5">
        <span className={`grid h-9 w-9 place-items-center rounded-xl ${GRA} text-lg font-black text-white shadow`}>E</span>
        <div>
          <p className="text-[15px] font-extrabold leading-none tracking-tight">Ecole<span className="text-primary">CRM</span></p>
          <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{user ? t(ROLE_PORTAL[user.role]?.key || 'portal.admin') : ''}</p>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`
            }
          >
            <item.icon className="h-[17px] w-[17px] shrink-0" />
            {t(item.labelKey)}
          </NavLink>
        ))}
      </nav>
      <div className="shrink-0 border-t border-border/60 p-3">
        <div className="rounded-xl bg-muted/60 p-3">
          <p className="text-[11px] font-semibold text-muted-foreground">UEMOA · FCFA (XOF)</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground/70">EcoleCRM v1.0 · PWA</p>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Notification bell ---------------- */
function NotifBell() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const notifs = useLiveQuery(() => db.notifications.orderBy('date').reverse().limit(8).toArray(), []) || [];
  const unread = notifs.filter((n) => !n.read).length;
  return (
    <div className="relative">
      <button className="btn btn-ghost btn-sm relative px-2" onClick={() => setOpen(!open)} aria-label="Notifications">
        <Bell className="h-[17px] w-[17px]" />
        {unread > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-white">{unread}</span>}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 max-w-[92vw] animate-fade-up overflow-hidden rounded-xl border border-border/70 bg-card shadow-pop">
            <div className="flex items-center justify-between border-b border-border/70 px-4 py-2.5">
            <p className="text-[13px] font-bold">Notifications</p>
              <button
                className="text-[11px] font-semibold text-primary hover:underline"
                onClick={async () => { await Promise.all(notifs.map((n) => db.notifications.update(n.id!, { read: 1 }))); }}
              >
                ✓ Tout marquer lu
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifs.length === 0 && <p className="px-4 py-8 text-center text-[12px] text-muted-foreground">Aucune notification</p>}
              {notifs.map((n) => (
                <div key={n.id} className={`border-b border-border/50 px-4 py-3 last:border-0 ${n.read ? 'opacity-60' : ''}`}>
                  <div className="flex items-start gap-2">
                    {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                    <div>
                      <p className="text-[12.5px] font-semibold leading-snug">{n.title}</p>
                      <p className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">{n.body}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground/70">{n.date}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------- Install prompt ---------------- */
function useInstallPrompt() {
  const [deferred, setDeferred] = useState<any>(null);
  useEffect(() => {
    const h = (e: Event) => { e.preventDefault(); setDeferred(e); };
    window.addEventListener('beforeinstallprompt', h);
    return () => window.removeEventListener('beforeinstallprompt', h);
  }, []);
  const install = async () => {
    if (!deferred) return false;
    deferred.prompt();
    const res = await deferred.userChoice;
    setDeferred(null);
    return res?.outcome === 'accepted';
  };
  return { canInstall: !!deferred, install };
}

/* ---------------- Topbar ---------------- */
function Topbar({ onMenu }: { onMenu: () => void }) {
  const { user, logout } = useAuth();
  const { t, lang, setLang } = useI18n();
  const theme = useTheme();
  const online = useOnline();
  const { queue } = useSync();
  const nav = useNavigate();
  const { canInstall, install } = useInstallPrompt();
  const [menuOpen, setMenuOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const doSync = async () => {
    setSyncing(true);
    await flushQueue();
    setTimeout(() => setSyncing(false), 600);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border/60 bg-background/85 px-4 backdrop-blur-xl sm:px-6">
      <button className="btn btn-ghost btn-sm px-2 lg:hidden" onClick={onMenu} aria-label="Menu">
        <Menu className="h-5 w-5" />
      </button>

      {/* status */}
      <div className="flex items-center gap-2">
        <span className={`badge ${online ? 'border-success/30 bg-success/10 text-success' : 'border-warn/40 bg-warn/10 text-[#a16207] dark:text-warn'}`}>
          {online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          <span className="hidden sm:inline">{online ? t('nav.online') : t('nav.offline')}</span>
        </span>
        {(queue > 0 || syncing) && (
          <button onClick={doSync} className="badge border-primary/30 bg-primary/10 text-primary hover:bg-primary/15">
            <RefreshCw className={`h-3 w-3 ${syncing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{syncing ? '…' : `${t('nav.sync')} (${queue})`}</span>
            <span className="sm:hidden">{queue}</span>
          </button>
        )}
      </div>

      <div className="ml-auto flex items-center gap-1">
        {canInstall && (
          <button onClick={install} className="btn btn-outline btn-sm mr-1 hidden gap-1.5 sm:inline-flex">
            <Download className="h-3.5 w-3.5" /> {t('nav.install')}
          </button>
        )}
        <button onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')} className="btn btn-ghost btn-sm gap-1 px-2 text-muted-foreground" title="FR / EN">
          <Globe className="h-4 w-4" /><span className="text-[11px] font-bold uppercase">{lang}</span>
        </button>
        <button onClick={toggleTheme} className="btn btn-ghost btn-sm px-2" aria-label="Theme">
          {theme === 'dark' ? <Sun className="h-[17px] w-[17px]" /> : <Moon className="h-[17px] w-[17px]" />}
        </button>
        <NotifBell />

        {/* user menu */}
        <div className="relative">
          <button className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 transition hover:bg-muted" onClick={() => setMenuOpen(!menuOpen)}>
            <Avatar name={user?.name || '?'} color={user?.avatarColor} size={32} />
            <span className="hidden text-left md:block">
              <span className="block max-w-36 truncate text-[13px] font-semibold leading-tight">{user?.name}</span>
              <span className="block text-[11px] leading-tight text-muted-foreground">{user ? t(`role.${user.role}`) : ''}</span>
            </span>
            <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground md:block" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-50 mt-2 w-56 animate-fade-up overflow-hidden rounded-xl border border-border/70 bg-card shadow-pop">
                <div className="border-b border-border/60 px-4 py-3">
                  <p className="text-[13px] font-bold">{user?.name}</p>
                  <p className="truncate text-[11.5px] text-muted-foreground">{user?.email}</p>
                </div>
                <button
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[13px] font-medium text-danger hover:bg-danger/5"
                  onClick={() => { setMenuOpen(false); logout(); nav('/login'); }}
                >
                  <LogOut className="h-4 w-4" /> {t('auth.logout')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

/* ---------------- AppShell ---------------- */
export default function AppShell() {
  const { user, ready } = useAuth();
  const { t } = useI18n();
  const online = useOnline();
  const { queue } = useSync();
  const [drawer, setDrawer] = useState(false);

  // Auto-flush the offline queue when connectivity returns
  useEffect(() => {
    if (online && queue > 0) {
      const id = setTimeout(() => { flushQueue(); }, 1200);
      return () => clearTimeout(id);
    }
  }, [online, queue]);

  if (!ready) return <div className="grid min-h-dvh place-items-center bg-background"><span className="h-8 w-8 animate-spin rounded-full border-[3px] border-primary/20 border-t-primary" /></div>;
  if (!user) return <Navigate to="/login" replace />;

  const allowed = NAV[user.role] || [];
  return (
    <div className="min-h-dvh bg-background">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-border/60 bg-card lg:block">
        <SidebarContent />
      </aside>

      {/* mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDrawer(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 animate-fade-up bg-card shadow-pop">
            <SidebarContent onNavigate={() => setDrawer(false)} />
          </aside>
        </div>
      )}

      {/* offline banner */}
      {!online && (
        <div className="sticky top-16 z-20 flex items-center justify-center gap-2 bg-warn/15 px-4 py-1.5 text-[12px] font-semibold text-[#a16207] dark:text-warn">
          <WifiOff className="h-3.5 w-3.5" /> {t('pwa.goOfflineHint')}
        </div>
      )}

      <div className="lg:pl-64">
        <Topbar onMenu={() => setDrawer(true)} />
        <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
        <footer className="border-t border-border/60 px-6 py-4 text-center text-[11px] text-muted-foreground">
          EcoleCRM · {t('footer.made')}
        </footer>
      </div>
    </div>
  );
}
