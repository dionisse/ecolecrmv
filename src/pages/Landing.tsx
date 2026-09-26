import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, GraduationCap, Wallet, WifiOff, Bell, BarChart3, ShieldCheck, Languages,
  School, BookOpen, Library, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Globe, Moon, Sun, Menu, X,
  Smartphone, Receipt, ArrowRight, Star, Quote,
} from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { useTheme, toggleTheme } from '@/utils/theme';
import { fmtNumber } from '@/utils/format';

const GRA = 'bg-gradient-to-br from-primary/90 to-orange-600';

/* ============================ Phone mockup (pure CSS) ============================ */
function PhoneMock() {
  const bars = [42, 65, 38, 78, 55, 90, 62];
  return (
    <div className="relative mx-auto w-[240px] sm:w-[270px]">
      {/* main phone */}
      <div className="rounded-[2.4rem] border-[7px] border-zinc-800 bg-zinc-900 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]">
        <div className="relative overflow-hidden rounded-[1.9rem] bg-white dark:bg-zinc-950">
          {/* notch */}
          <div className="mx-auto mt-1.5 h-4 w-20 rounded-full bg-zinc-800" />
          {/* app header */}
          <div className="flex items-center justify-between px-4 pt-3">
            <div className="flex items-center gap-1.5">
              <span className={`grid h-6 w-6 place-items-center rounded-lg ${GRA} text-[11px] font-black text-white`}>E</span>
              <span className="text-[11px] font-bold text-zinc-900 dark:text-white">EcoleCRM</span>
            </div>
            <span className="h-4 w-4 rounded-full bg-zinc-200 dark:bg-zinc-800" />
          </div>
          {/* KPIs */}
          <div className="grid grid-cols-2 gap-2 px-4 pt-3">
            <div className="rounded-xl bg-orange-50 p-2.5 dark:bg-orange-500/10">
              <p className="text-[8px] font-semibold uppercase text-orange-600/80">Élèves</p>
              <p className="text-sm font-extrabold text-zinc-900 dark:text-white">1 240</p>
              <p className="text-[8px] font-semibold text-emerald-600">+8,2%</p>
            </div>
            <div className="rounded-xl bg-zinc-50 p-2.5 dark:bg-zinc-900">
              <p className="text-[8px] font-semibold uppercase text-zinc-500">Recouvré</p>
              <p className="text-sm font-extrabold text-zinc-900 dark:text-white">87%</p>
              <div className="mt-1 h-1 rounded-full bg-zinc-200 dark:bg-zinc-800">
                <div className="h-1 w-[87%] rounded-full bg-emerald-500" />
              </div>
            </div>
          </div>
          {/* chart */}
          <div className="mx-4 mt-2 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-900">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[8px] font-bold uppercase text-zinc-500">Recettes · FCFA</p>
              <span className="rounded-full bg-emerald-100 px-1.5 text-[8px] font-bold text-emerald-700 dark:bg-emerald-500/15">+12%</span>
            </div>
            <div className="flex h-16 items-end gap-1.5">
              {bars.map((h, i) => (
                <div key={i} className={`flex-1 rounded-t-sm ${i === 5 ? 'bg-orange-500' : 'bg-zinc-300 dark:bg-zinc-700'}`} style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
          {/* list */}
          <div className="mx-4 mb-4 mt-2 space-y-1.5">
            {[
              ['Aminata D.', 'Wave', '15 000'],
              ['Ibrahima K.', 'Orange Money', '25 000'],
            ].map(([n, m, a]) => (
              <div key={n} className="flex items-center gap-2 rounded-xl border border-zinc-100 p-2 dark:border-zinc-800">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-orange-100 text-[9px] font-bold text-orange-600">{n[0]}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[9px] font-bold text-zinc-900 dark:text-white">{n}</p>
                  <p className="text-[8px] text-zinc-500">{m}</p>
                </div>
                <p className="text-[9px] font-extrabold text-emerald-600">{a}</p>
              </div>
            ))}
            <div className={`flex items-center justify-center gap-1 rounded-xl ${GRA} py-2 text-[9px] font-bold text-white`}>
              <Receipt className="h-3 w-3" /> Encaisser un paiement
            </div>
          </div>
        </div>
      </div>

      {/* floating notifications */}
      <div className="absolute -left-16 top-40 hidden animate-fade-up rounded-2xl border border-border/60 bg-card p-3 shadow-pop lg:block" style={{ animationDelay: '.2s' }}>
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-500/15 text-emerald-600"><Bell className="h-4 w-4" /></span>
          <div>
            <p className="text-[11px] font-bold">Paiement reçu</p>
            <p className="text-[10px] text-muted-foreground">Wave · 25 000 FCFA</p>
          </div>
        </div>
      </div>
      <div className="absolute -right-14 bottom-40 hidden animate-fade-up rounded-2xl border border-border/60 bg-card p-3 shadow-pop lg:block" style={{ animationDelay: '.4s' }}>
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-orange-500/15 text-primary"><WifiOff className="h-4 w-4" /></span>
          <div>
            <p className="text-[11px] font-bold">Mode hors ligne</p>
            <p className="text-[10px] text-muted-foreground">Sync auto ✓</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================ Sections data ============================ */
function useLandingData() {
  const { t } = useI18n();
  return {
    features: [
      { icon: Users, title: t('f.personnel.t'), desc: t('f.personnel.d') },
      { icon: GraduationCap, title: t('f.schooling.t'), desc: t('f.schooling.d') },
      { icon: Wallet, title: t('f.finance.t'), desc: t('f.finance.d') },
      { icon: WifiOff, title: t('f.offline.t'), desc: t('f.offline.d') },
      { icon: Bell, title: t('f.push.t'), desc: t('f.push.d') },
      { icon: BarChart3, title: t('f.analytics.t'), desc: t('f.analytics.d') },
      { icon: ShieldCheck, title: t('f.security.t'), desc: t('f.security.d') },
      { icon: Languages, title: t('f.multi.t'), desc: t('f.multi.d') },
    ],
    modules: [
      { icon: School, name: t('m.primary.t'), desc: t('m.primary.d'), price: '25 000', tag: t('module.primary') },
      { icon: BookOpen, name: t('m.secondary.t'), desc: t('m.secondary.d'), price: '40 000', tag: t('module.secondary'), featured: true },
      { icon: Library, name: t('m.university.t'), desc: t('m.university.d'), price: '75 000', tag: t('module.university') },
    ],
    portals: [
      { name: t('portal.parent'), desc: t('portal.parent.d'), color: '#8b5cf6' },
      { name: t('portal.teacher'), desc: t('portal.teacher.d'), color: '#0ea5e9' },
      { name: t('portal.staffp'), desc: t('portal.staffp.d'), color: '#64748b' },
      { name: t('portal.discipline'), desc: t('portal.discipline.d'), color: '#e11d48' },
      { name: t('portal.secretariat'), desc: t('portal.secretariat.d'), color: '#d97706' },
      { name: t('portal.accounting'), desc: t('portal.accounting.d'), color: '#10b981' },
      { name: t('portal.censor'), desc: t('portal.censor.d'), color: '#6366f1' },
      { name: t('portal.admin'), desc: t('portal.admin.d'), color: '#f97316' },
    ],
    testimonials: [
      { name: 'Mme Awa Ndiaye', role: 'Directrice — Dakar, Sénégal', text: 'Nous gérons 1 240 élèves sans connexion stable. Tout tourne hors ligne, et les parents reçoivent les notifications dès le retour du réseau.', color: '#f97316' },
      { name: 'M. Yao Mensah', role: 'Économe — Lomé, Togo', text: 'Le recouvrement est passé de 62 % à 89 % en deux trimestres grâce aux relances Mobile Money et aux reçus numériques.', color: '#0ea5e9' },
      { name: 'M. Issouf Ouédraogo', role: 'Censeur — Ouagadougou, Burkina', text: 'Bulletins générés en un clic pour 38 classes. Le conseil de discipline suit chaque cas. Un outil pensé pour nos réalités.', color: '#8b5cf6' },
    ],
  };
}

/* ============================ Modules carousel ============================ */
const MODULE_SLIDES = [
  { img: './images/carousel-primary.jpg', tag: 'module.primary', title: 'm.primary.t', desc: 'm.primary.d', color: '#f97316' },
  { img: './images/carousel-secondary.jpg', tag: 'module.secondary', title: 'm.secondary.t', desc: 'm.secondary.d', color: '#0ea5e9' },
  { img: './images/carousel-university.jpg', tag: 'module.university', title: 'm.university.t', desc: 'm.university.d', color: '#8b5cf6' },
];

function ModuleCarousel() {
  const { t } = useI18n();
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % MODULE_SLIDES.length), 5500);
    return () => clearInterval(id);
  }, [paused]);

  const go = (d: number) => setIdx((i) => (i + d + MODULE_SLIDES.length) % MODULE_SLIDES.length);

  return (
    <div
      className="group relative overflow-hidden rounded-3xl border border-border/60 shadow-pop"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; setPaused(true); }}
      onTouchEnd={(e) => {
        if (touchX.current !== null) {
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        }
        touchX.current = null;
        setPaused(false);
      }}
      role="region"
      aria-roledescription="carrousel"
      aria-label={t('modules.title')}
    >
      {/* track */}
      <div className="flex transition-transform duration-700 ease-out" style={{ transform: `translateX(-${idx * 100}%)` }}>
        {MODULE_SLIDES.map((s, i) => (
          <div key={s.img} className="relative h-[280px] w-full shrink-0 sm:h-[380px] lg:h-[460px]" aria-hidden={i !== idx}>
            <img
              src={s.img}
              alt={t(s.title)}
              draggable={false}
              loading={i === 0 ? 'eager' : 'lazy'}
              className="h-full w-full select-none object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-8 lg:p-10">
              <span className="chip text-white shadow-sm" style={{ background: s.color }}>
                {t(s.tag)}
              </span>
              <h3 className="mt-2.5 text-2xl font-extrabold tracking-tight drop-shadow sm:text-3xl lg:text-4xl">
                {t(s.title)}
              </h3>
              <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-white/85 line-clamp-2 sm:text-[15px] sm:line-clamp-none">
                {t(s.desc)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* arrows (hidden on small screens — swipe works) */}
      <button
        onClick={() => go(-1)}
        aria-label="Précédent"
        className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/35 text-white opacity-100 backdrop-blur transition hover:bg-black/60 group-hover:opacity-100 sm:left-4 sm:grid sm:h-11 sm:w-11 lg:opacity-0"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={() => go(1)}
        aria-label="Suivant"
        className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/35 text-white opacity-100 backdrop-blur transition hover:bg-black/60 group-hover:opacity-100 sm:right-4 sm:grid sm:h-11 sm:w-11 lg:opacity-0"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* dots */}
      <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-black/35 px-2.5 py-1.5 backdrop-blur sm:right-6 sm:top-6">
        {MODULE_SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            aria-label={`Diapositive ${i + 1}`}
            aria-current={i === idx}
            className={`h-1.5 rounded-full transition-all duration-300 ${i === idx ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'}`}
          />
        ))}
      </div>
    </div>
  );
}

/* ============================ Landing ============================ */
export default function Landing() {
  const { t, lang, setLang } = useI18n();
  const theme = useTheme();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const d = useLandingData();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const go = (id: string) => {
    setMenu(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const navLinks: Array<[string, string]> = [
    [t('nav.features'), 'features'], [t('nav.modules'), 'modules'],
    [t('portals.kicker'), 'portals'], [t('nav.pricing'), 'pricing'], [t('nav.faq'), 'faq'],
  ];

  return (
    <div className="min-h-dvh bg-background">
      {/* ================= NAVBAR ================= */}
      <header className={`fixed inset-x-0 top-0 z-50 transition-all ${scrolled ? 'border-b border-border/60 bg-background/85 backdrop-blur-xl' : 'bg-transparent'}`}>
        <div className="container flex h-16 items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2">
            <span className={`grid h-9 w-9 place-items-center rounded-xl ${GRA} text-lg font-black text-white shadow-md`}>E</span>
            <span className={`text-lg font-extrabold tracking-tight ${scrolled ? '' : 'text-white'}`}>
              Ecole<span className="text-primary">CRM</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {navLinks.map(([label, id]) => (
              <button key={id} onClick={() => go(id)} className={`rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-muted hover:text-foreground ${scrolled ? 'text-muted-foreground' : 'text-zinc-300 hover:text-white'}`}>
                {label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
              className={`btn btn-ghost btn-sm gap-1.5 ${scrolled ? 'text-muted-foreground' : 'text-zinc-300'}`}
              title="FR / EN"
            >
              <Globe className="h-4 w-4" />
              <span className="text-[12px] font-bold uppercase">{lang}</span>
            </button>
            <button onClick={toggleTheme} className={`btn btn-ghost btn-sm px-2 ${scrolled ? '' : 'text-zinc-300'}`} aria-label="Theme">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link to="/login" className={`btn btn-ghost btn-sm hidden sm:inline-flex ${scrolled ? '' : 'text-zinc-300'}`}>{t('nav.login')}</Link>
            <Link to="/app/dashboard" className={`btn ${GRA} btn-md text-white shadow-md`}>
              {t('nav.app')} <ArrowRight className="h-4 w-4" />
            </Link>
            <button className="btn btn-ghost btn-sm px-2 lg:hidden" onClick={() => setMenu(!menu)} aria-label="Menu">
              {menu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {menu && (
          <div className="border-t border-border/60 bg-background/95 px-4 py-3 backdrop-blur-xl lg:hidden">
            {navLinks.map(([label, id]) => (
              <button key={id} onClick={() => go(id)} className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-muted-foreground hover:bg-muted">
                {label}
              </button>
            ))}
            <Link to="/login" className="block rounded-lg px-3 py-2.5 text-sm font-medium text-primary">{t('nav.login')}</Link>
          </div>
        )}
      </header>

      {/* ================= HERO (dark) ================= */}
      <section className="relative overflow-hidden bg-zinc-950 pb-24 pt-28 text-white dark:bg-[#0c0a09] sm:pb-32 sm:pt-36">
        {/* glows */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 left-1/2 h-[480px] w-[820px] -translate-x-1/2 rounded-full bg-primary/25 blur-[140px]" />
          <div className="absolute -right-40 top-40 h-72 w-72 rounded-full bg-orange-400/10 blur-[100px]" />
          <div className="absolute -left-40 bottom-0 h-72 w-72 rounded-full bg-amber-300/10 blur-[100px]" />
          <div
            className="absolute inset-0 opacity-[0.15]"
            style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,.35) 1px, transparent 0)', backgroundSize: '28px 28px' }}
          />
        </div>

        <div className="container relative grid items-center gap-12 lg:grid-cols-2">
          <div className="animate-fade-up text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[12px] font-semibold text-orange-200 backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              {t('hero.badge')}
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.4rem]">
              {t('hero.title1')}<br />
              <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent">{t('hero.title2')}</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-zinc-300/90 lg:mx-0">
              {t('hero.desc')}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <Link to="/login" className={`btn ${GRA} btn-lg px-7 text-white shadow-[0_10px_40px_-10px_rgba(249,115,22,0.7)]`}>
                {t('hero.cta1')} <ArrowRight className="h-4 w-4" />
              </Link>
              <button onClick={() => go('modules')} className="btn btn-lg border border-white/20 bg-white/5 px-7 text-white backdrop-blur hover:bg-white/10">
                {t('hero.cta2')}
              </button>
            </div>
            <div className="mt-8 flex items-center justify-center gap-2 lg:justify-start">
              <div className="flex -space-x-2">
                {['#f97316', '#0ea5e9', '#8b5cf6', '#10b981'].map((c, i) => (
                  <span key={i} className="grid h-8 w-8 place-items-center rounded-full border-2 border-zinc-950 text-[10px] font-bold text-white" style={{ background: c }}>
                    {['AD', 'YM', 'IO', 'RK'][i]}
                  </span>
                ))}
              </div>
              <p className="text-left text-[11px] leading-tight text-zinc-400">{t('hero.trust')}</p>
            </div>
          </div>

          <div className="animate-fade-up" style={{ animationDelay: '.15s' }}>
            <PhoneMock />
          </div>
        </div>

        {/* stats band */}
        <div className="container relative mt-16 sm:mt-20">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 backdrop-blur sm:grid-cols-4">
            {[
              ['120+', t('stats.schools')],
              [fmtNumber(65000), t('stats.students')],
              ['99,9%', t('stats.uptime')],
              ['4,8/5', t('stats.satisfaction')],
            ].map(([v, l], i) => (
              <div key={i} className="bg-zinc-950/80 px-6 py-6 text-center">
                <p className="text-2xl font-extrabold tracking-tight text-orange-400 sm:text-3xl">{v}</p>
                <p className="mt-1 text-[12px] font-medium text-zinc-400">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section id="features" className="py-20 sm:py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-primary">{t('features.kicker')}</span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{t('features.title')}</h2>
            <p className="mt-3 text-[15px] text-muted-foreground">{t('features.desc')}</p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {d.features.map((f, i) => (
              <div key={i} className="card group p-5 transition-all hover:-translate-y-1 hover:shadow-pop">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-[15px] font-bold">{f.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= MODULES / PRICING ================= */}
      <section id="modules" className="bg-muted/50 py-20 dark:bg-muted/20 sm:py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-primary">{t('modules.kicker')}</span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{t('modules.title')}</h2>
            <p className="mt-3 text-[15px] text-muted-foreground">{t('modules.desc')}</p>
          </div>

          {/* Carousel: primaire / secondaire / universitaire */}
          <div className="mt-10">
            <ModuleCarousel />
          </div>

          <div id="pricing" className="mt-12 grid gap-5 lg:grid-cols-3">
            {d.modules.map((m, i) => (
              <div key={i} className={`card relative flex flex-col p-6 ${m.featured ? 'ring-2 ring-primary shadow-pop lg:-my-3' : ''}`}>
                {m.featured && (
                  <span className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full ${GRA} px-3 py-1 text-[11px] font-bold text-white shadow`}>★ Populaire</span>
                )}
                <span className={`grid h-12 w-12 place-items-center rounded-xl ${m.featured ? GRA + ' text-white' : 'bg-primary/10 text-primary'}`}>
                  <m.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 text-lg font-extrabold">{m.name}</h3>
                <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-muted-foreground">{m.desc}</p>
                <div className="mt-5 border-t border-border/70 pt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t('m.primary.p')}</p>
                  <p className="mt-0.5">
                    <span className="text-3xl font-extrabold tracking-tight">{m.price}</span>
                    <span className="text-[13px] font-medium text-muted-foreground"> FCFA / mois</span>
                  </p>
                </div>
                <Link to="/login" className={`btn btn-md mt-4 w-full ${m.featured ? GRA + ' text-white' : 'btn-outline'}`}>
                  {t('hero.cta1')}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= PORTALS ================= */}
      <section id="portals" className="py-20 sm:py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-primary">{t('portals.kicker')}</span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{t('portals.title')}</h2>
            <p className="mt-3 text-[15px] text-muted-foreground">{t('portals.desc')}</p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {d.portals.map((p, i) => (
              <div key={i} className="card group relative overflow-hidden p-5">
                <div className="absolute inset-x-0 top-0 h-1 opacity-80" style={{ background: p.color }} />
                <span className="grid h-10 w-10 place-items-center rounded-full text-[13px] font-black text-white" style={{ background: p.color }}>
                  {p.name.split(' ')[1]?.[0] || p.name[0]}
                </span>
                <h3 className="mt-3.5 text-[14px] font-bold">{p.name}</h3>
                <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= OFFLINE (dark) ================= */}
      <section className="bg-zinc-950 py-20 text-white dark:bg-[#0c0a09] sm:py-24">
        <div className="container grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-orange-400">Offline-first · PWA</span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{t('offline.title')}</h2>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-zinc-300/90">{t('offline.desc')}</p>
            <ul className="mt-6 space-y-3">
              {[t('offline.f1'), t('offline.f2'), t('offline.f3')].map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-[14px] text-zinc-200">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-500/20 text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-2">
              {['Orange Money', 'Wave', 'MTN MoMo', 'Moov Money', 'FCFA (XOF)'].map((p) => (
                <span key={p} className="rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[12px] font-semibold text-zinc-200">
                  {p}
                </span>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Smartphone, big: '0 Go', small: 'requis pour démarrer' },
              { icon: WifiOff, big: '100%', small: 'des fonctions hors ligne' },
              { icon: Bell, big: '< 1s', small: 'délai de notification' },
              { icon: ShieldCheck, big: 'JWT', small: 'sessions sécurisées' },
            ].map((x, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                <x.icon className="h-5 w-5 text-orange-400" />
                <p className="mt-3 text-2xl font-extrabold tracking-tight">{x.big}</p>
                <p className="mt-0.5 text-[12px] text-zinc-400">{x.small}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= TESTIMONIALS ================= */}
      <section className="py-20 sm:py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-primary">{t('testimonials.kicker')}</span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{t('testimonials.title')}</h2>
          </div>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {d.testimonials.map((x, i) => (
              <figure key={i} className="card flex flex-col p-6">
                <Quote className="h-5 w-5 text-primary/50" />
                <blockquote className="mt-3 flex-1 text-[13.5px] leading-relaxed text-foreground/90">“{x.text}”</blockquote>
                <figcaption className="mt-5 flex items-center gap-3 border-t border-border/70 pt-4">
                  <span className="grid h-10 w-10 place-items-center rounded-full text-[12px] font-bold text-white" style={{ background: x.color }}>
                    {x.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                  </span>
                  <div>
                    <p className="text-[13px] font-bold">{x.name}</p>
                    <p className="text-[11.5px] text-muted-foreground">{x.role}</p>
                  </div>
                  <span className="ml-auto flex gap-0.5">
                    {[...Array(5)].map((_, s) => <Star key={s} className="h-3 w-3 fill-amber-400 text-amber-400" />)}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FAQ ================= */}
      <section id="faq" className="bg-muted/50 py-20 dark:bg-muted/20 sm:py-24">
        <div className="container max-w-3xl">
          <div className="text-center">
            <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-primary">{t('faq.kicker')}</span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{t('faq.title')}</h2>
            <p className="mt-3 text-[15px] text-muted-foreground">{t('faq.desc')}</p>
          </div>
          <div className="mt-10 space-y-3">
            {[1, 2, 3, 4, 5, 6].map((n) => {
              const open = openFaq === n;
              return (
                <div key={n} className="card overflow-hidden">
                  <button
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                    onClick={() => setOpenFaq(open ? null : n)}
                    aria-expanded={open}
                  >
                    <span className="text-[14.5px] font-semibold">{t(`faq.q${n}`)}</span>
                    <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
                  </button>
                  <div className={`grid transition-all duration-300 ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden">
                      <p className="px-5 pb-5 text-[13.5px] leading-relaxed text-muted-foreground">{t(`faq.a${n}`)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="py-20 sm:py-24">
        <div className="container">
          <div className="relative overflow-hidden rounded-3xl bg-zinc-950 px-6 py-14 text-center text-white sm:px-12">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -top-24 left-1/2 h-72 w-[560px] -translate-x-1/2 rounded-full bg-primary/30 blur-[120px]" />
            </div>
            <h2 className="relative mx-auto max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">{t('cta.title')}</h2>
            <p className="relative mx-auto mt-3 max-w-xl text-[14px] text-zinc-300">{t('cta.desc')}</p>
            <div className="relative mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link to="/login" className={`btn ${GRA} btn-lg px-8 text-white shadow-[0_10px_40px_-10px_rgba(249,115,22,0.7)]`}>
                {t('cta.btn')} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-border/60 py-12">
        <div className="container">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Link to="/" className="flex items-center gap-2">
                <span className={`grid h-9 w-9 place-items-center rounded-xl ${GRA} text-lg font-black text-white`}>E</span>
                <span className="text-lg font-extrabold tracking-tight">Ecole<span className="text-primary">CRM</span></span>
              </Link>
              <p className="mt-3 max-w-xs text-[12.5px] leading-relaxed text-muted-foreground">{t('hero.desc').slice(0, 120)}…</p>
              <p className="mt-3 flex items-center gap-1.5 text-[11.5px] font-medium text-muted-foreground">
                <Globe className="h-3.5 w-3.5" /> {t('footer.made')}
              </p>
            </div>
            {[
              [t('footer.product'), [t('nav.features'), t('nav.modules'), t('nav.pricing'), t('nav.faq')]],
              [t('footer.company'), [t('footer.about'), t('footer.contact')]],
              [t('footer.legal'), [t('footer.privacy'), t('footer.terms')]],
            ].map(([title, links], i) => (
              <div key={i}>
                <p className="text-[13px] font-bold">{title as string}</p>
                <ul className="mt-3 space-y-2">
                  {(links as string[]).map((l) => (
                    <li key={l}><button onClick={() => go('features')} className="text-[12.5px] text-muted-foreground hover:text-primary">{l}</button></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-6 text-[12px] text-muted-foreground">
            <p>© {new Date().getFullYear()} EcoleCRM — {t('footer.rights')}</p>
            <p className="flex items-center gap-1.5">
              <Smartphone className="h-3.5 w-3.5" /> PWA · Offline-first · FR/EN
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
