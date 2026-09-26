import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Globe, Eye, EyeOff, ShieldCheck, WifiOff, ArrowRight, School } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { useAuth, ROLE_PORTAL } from '@/state/auth';
import { useToast } from '@/state/toast';

const DEMO = [
  { email: 'admin@ecole.cm', password: 'admin123', roleKey: 'portal.admin', color: '#1ea75f' },
  { email: 'prof@ecole.cm', password: 'prof123', roleKey: 'portal.teacher', color: '#24446b' },
  { email: 'parent@ecole.cm', password: 'parent123', roleKey: 'portal.parent', color: '#f2a90f' },
  { email: 'compta@ecole.cm', password: 'compta123', roleKey: 'portal.accounting', color: '#0d9488' },
  { email: 'secretariat@ecole.cm', password: 'secretaire123', roleKey: 'portal.secretariat', color: '#d97706' },
  { email: 'discipline@ecole.cm', password: 'discipline123', roleKey: 'portal.discipline', color: '#ef4444' },
  { email: 'censeur@ecole.cm', password: 'censeur123', roleKey: 'portal.censor', color: '#5b6cf5' },
];

export default function Login() {
  const { t, lang, setLang } = useI18n();
  const { login, ready } = useAuth();
  const nav = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('admin@ecole.cm');
  const [password, setPassword] = useState('admin123');
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e?: React.FormEvent, creds?: { email: string; password: string }) => {
    e?.preventDefault();
    setBusy(true);
    setErr('');
    const c = creds || { email, password };
    const res = await login(c.email, c.password);
    setBusy(false);
    if (!res.ok) {
      setErr(t('auth.error'));
      return;
    }
    const portal = ROLE_PORTAL[res.user!.role];
    toast(`${t('dash.welcome')}, ${res.user!.name} 👋`);
    nav(portal?.route || '/app/dashboard');
  };

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.1fr]">
      {/* ------- Left: dark brand panel ------- */}
      <div className="relative hidden overflow-hidden bg-[#0d241a] p-10 text-white lg:flex lg:flex-col">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 -left-20 h-96 w-96 rounded-full bg-primary/25 blur-[120px]" />
          <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-amber-400/10 blur-[100px]" />
          <div className="absolute inset-0 opacity-[0.13]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,.4) 1px, transparent 0)', backgroundSize: '26px 26px' }} />
        </div>
        <Link to="/" className="relative flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-emerald-600 text-xl font-black shadow-lg">E</span>
          <span className="text-xl font-extrabold tracking-tight">Ecole<span className="text-primary">CRM</span></span>
        </Link>

        <div className="relative my-auto max-w-md">
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight">
            {t('tagline')} —<br />
            <span className="text-amber-300">Primaire · Secondaire · Universitaire</span>
          </h1>
          <p className="mt-4 text-[13.5px] leading-relaxed text-emerald-100/70">
            {t('hero.desc').slice(0, 150)}…
          </p>
          <ul className="mt-7 space-y-3.5">
            {[
              [WifiOff, t('f.offline.d')],
              [ShieldCheck, t('f.security.d')],
              [GraduationCap, t('portals.desc')],
            ].map(([Icon, text]: any, i) => (
              <li key={i} className="flex items-start gap-3 text-[13px] text-emerald-100/90">
                <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/10 text-amber-300 ring-1 ring-white/10">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative flex items-center gap-2 text-[11.5px] text-emerald-100/50">
          <School className="h-3.5 w-3.5" /> {t('footer.made')}
        </p>
      </div>

      {/* ------- Right: form ------- */}
      <div className="relative flex flex-col bg-background">
        <div className="flex items-center justify-between p-5 sm:p-7">
          <Link to="/" className="flex items-center gap-2 lg:invisible">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-emerald-600 text-base font-black text-white">E</span>
            <span className="font-extrabold tracking-tight">Ecole<span className="text-primary">CRM</span></span>
          </Link>
          <button onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')} className="btn btn-ghost btn-sm gap-1.5 text-muted-foreground">
            <Globe className="h-4 w-4" />
            <span className="text-[12px] font-bold uppercase">{lang}</span>
          </button>
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 pb-10 sm:px-8">
          <div className="card p-6 sm:p-8">
            <h2 className="text-xl font-extrabold tracking-tight">{t('auth.title')}</h2>
            <p className="mt-1 text-[13px] text-muted-foreground">{t('auth.subtitle')}</p>

            <form className="mt-6 space-y-4" onSubmit={submit}>
              <label className="block">
                <span className="label mb-1 block">{t('auth.email')}</span>
                <input className="input h-10" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </label>
              <label className="block">
                <span className="label mb-1 block">{t('auth.password')}</span>
                <div className="relative">
                  <input className="input h-10 pr-10" type={show ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  <button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted" aria-label="Show password">
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>

              <div className="flex items-center justify-between text-[12.5px]">
                <label className="flex cursor-pointer items-center gap-2 text-muted-foreground">
                  <input type="checkbox" defaultChecked className="h-3.5 w-3.5 accent-primary" />
                  {t('auth.remember')}
                </label>
                <button type="button" className="font-medium text-primary hover:underline">{t('auth.forgot')}</button>
              </div>

              {err && (
                <p className="rounded-lg bg-danger/10 px-3 py-2 text-[12.5px] font-medium text-danger">{err}</p>
              )}

              <button type="submit" disabled={busy} className="btn btn-primary btn-lg w-full gap-2 bg-gradient-to-r from-primary to-emerald-600">
                {busy ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <ShieldCheck className="h-4 w-4" />}
                {t('auth.login')}
              </button>
            </form>

            <div className="my-5 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> {t('auth.selectRole')} <span className="h-px flex-1 bg-border" />
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {DEMO.map((d) => (
                <button
                  key={d.email}
                  type="button"
                  onClick={() => submit(undefined, d)}
                  className="group flex flex-col items-center gap-1.5 rounded-xl border border-border/70 p-2.5 text-center transition hover:-translate-y-0.5 hover:shadow-card"
                  title={d.email}
                >
                  <span className="grid h-8 w-8 place-items-center rounded-full text-[11px] font-black text-white" style={{ background: d.color }}>
                    {t(d.roleKey).split(' ')[1]?.[0]?.toUpperCase() || 'P'}
                  </span>
                  <span className="text-[10px] font-semibold leading-tight text-muted-foreground group-hover:text-foreground">
                    {t(d.roleKey)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-[11.5px] text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-success" /> {t('auth.secure')}
          </p>
          <Link to="/" className="mt-2 flex items-center justify-center gap-1 text-[12px] font-medium text-muted-foreground hover:text-primary">
            ← {t('nav.back')} <ArrowRight className="h-3 w-3 rotate-180" />
          </Link>
        </div>
      </div>
    </div>
  );
}
