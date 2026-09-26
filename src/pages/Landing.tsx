import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, GraduationCap, Wallet, WifiOff, Bell, BarChart3, ShieldCheck, Languages,
  School, BookOpen, Library, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Globe, Moon, Sun, Menu, X,
  Smartphone, ArrowRight, Star, Quote, Play, Sparkles, Shield,
} from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { useTheme, toggleTheme } from '@/utils/theme';
import { fmtNumber } from '@/utils/format';

const GRA = 'bg-gradient-to-br from-primary to-emerald-600';
const YELLOW = '#f2b90b';

/* ============================ Count-up (decorative) ============================ */
function CountUp({ to, decimals = 0, suffix = '' }: { to: number; decimals?: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const dur = 1500;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(to * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  const formatted = val.toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return <>{formatted}{suffix}</>;
}

/* ============================ Hero visual (photo encadrée) ============================ */
function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[620px]">
      {/* deco blob */}
      <span className="absolute -right-6 -top-6 -z-10 h-24 w-24 rounded-full bg-amber-300/50 blur-[2px]" aria-hidden />
      <div className="overflow-hidden rounded-[2.25rem] shadow-[0_35px_80px_-30px_rgba(13,60,35,0.45)] ring-1 ring-black/5">
        <img
          src="./images/hero-phone.jpg"
          alt="EcoleCRM sur smartphone : élèves, recouvrement et paiements Mobile Money"
          draggable={false}
          loading="eager"
          className="w-full select-none"
        />
      </div>

      {/* floating cards (style Hopewell) */}
      <div className="absolute -left-3 top-[16%] hidden animate-fade-up items-center gap-2.5 rounded-2xl border border-border/50 bg-card p-3 pr-5 shadow-pop sm:flex" style={{ animationDelay: '.25s' }}>
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><Bell className="h-5 w-5" /></span>
        <div>
          <p className="text-[15px] font-extrabold leading-none">25 000 FCFA</p>
          <p className="mt-1 text-[10.5px] font-medium text-muted-foreground">Paiement Wave reçu</p>
        </div>
      </div>
      <div className="absolute -left-3 bottom-[18%] hidden animate-fade-up items-center gap-2.5 rounded-2xl border border-border/50 bg-card p-3 pr-5 shadow-pop sm:flex" style={{ animationDelay: '.45s' }}>
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><WifiOff className="h-5 w-5" /></span>
        <div>
          <p className="text-[15px] font-extrabold leading-none">100% hors ligne</p>
          <p className="mt-1 text-[10.5px] font-medium text-muted-foreground">Sync automatique ✓</p>
        </div>
      </div>
      <div className="absolute -right-2 bottom-6 hidden animate-fade-up items-center gap-2.5 rounded-2xl border border-border/50 bg-card p-3 pr-5 shadow-pop md:flex" style={{ animationDelay: '.65s' }}>
        <span className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: `${YELLOW}22`, color: '#c78d06' }}><Shield className="h-5 w-5" /></span>
        <div>
          <p className="text-[15px] font-extrabold leading-none">100%</p>
          <p className="mt-1 text-[10.5px] font-medium text-muted-foreground">Données vérifiées & sûres</p>
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
      { name: t('portal.parent'), desc: t('portal.parent.d'), color: '#24446b' },
      { name: t('portal.teacher'), desc: t('portal.teacher.d'), color: '#1ea75f' },
      { name: t('portal.staffp'), desc: t('portal.staffp.d'), color: '#64748b' },
      { name: t('portal.discipline'), desc: t('portal.discipline.d'), color: '#ef4444' },
      { name: t('portal.secretariat'), desc: t('portal.secretariat.d'), color: '#f2a90f' },
      { name: t('portal.accounting'), desc: t('portal.accounting.d'), color: '#0d9488' },
      { name: t('portal.censor'), desc: t('portal.censor.d'), color: '#5b6cf5' },
      { name: t('portal.admin'), desc: t('portal.admin.d'), color: '#15803d' },
    ],
    testimonials: [
      { name: 'Mme Awa Ndiaye', role: 'Directrice — Dakar, Sénégal', text: 'Nous gérons 1 240 élèves sans connexion stable. Tout tourne hors ligne, et les parents reçoivent les notifications dès le retour du réseau.', color: '#1ea75f' },
      { name: 'M. Yao Mensah', role: 'Économe — Lomé, Togo', text: 'Le recouvrement est passé de 62 % à 89 % en deux trimestres grâce aux relances Mobile Money et aux reçus numériques.', color: '#24446b' },
      { name: 'M. Issouf Ouédraogo', role: 'Censeur — Ouagadougou, Burkina', text: 'Bulletins générés en un clic pour 38 classes. Le conseil de discipline suit chaque cas. Un outil pensé pour nos réalités.', color: '#0d9488' },
    ],
  };
}

/* ============================ Modules carousel ============================ */
const MODULE_SLIDES = [
  { img: './images/carousel-primary.jpg', tag: 'module.primary', title: 'm.primary.t', desc: 'm.primary.d', color: '#1ea75f' },
  { img: './images/carousel-secondary.jpg', tag: 'module.secondary', title: 'm.secondary.t', desc: 'm.secondary.d', color: '#f2a90f' },
  { img: './images/carousel-university.jpg', tag: 'module.university', title: 'm.university.t', desc: 'm.university.d', color: '#24446b' },
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
      className="group relative overflow-hidden rounded-[2rem] shadow-[0_30px_60px_-25px_rgba(13,60,35,0.35)] ring-1 ring-black/5"
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
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-8 lg:p-10">
              <span className="chip rounded-full text-white shadow-sm" style={{ background: s.color }}>
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
        className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-foreground opacity-100 shadow-md backdrop-blur transition hover:bg-white group-hover:opacity-100 sm:left-4 sm:grid sm:h-11 sm:w-11 lg:opacity-0"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={() => go(1)}
        aria-label="Suivant"
        className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-foreground opacity-100 shadow-md backdrop-blur transition hover:bg-white group-hover:opacity-100 sm:right-4 sm:grid sm:h-11 sm:w-11 lg:opacity-0"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* dots */}
      <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-black/30 px-2.5 py-1.5 backdrop-blur sm:right-6 sm:top-6">
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
      <header className={`fixed inset-x-0 top-0 z-50 transition-all ${scrolled ? 'bg-card/90 shadow-[0_4px_20px_-8px_rgba(13,60,35,0.18)] backdrop-blur-xl' : 'bg-transparent'}`}>
        <div className="container flex h-16 items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2">
            <span className={`grid h-9 w-9 place-items-center rounded-xl ${GRA} text-lg font-black text-white shadow-md`}>E</span>
            <span className="text-lg font-extrabold tracking-tight">
              Ecole<span className="text-primary">CRM</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {navLinks.map(([label, id]) => (
              <button key={id} onClick={() => go(id)} className="rounded-full px-3.5 py-2 text-sm font-semibold text-foreground/75 transition hover:bg-primary/10 hover:text-primary">
                {label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
              className="btn btn-ghost btn-sm gap-1.5 text-foreground/70 hover:text-foreground"
              title="FR / EN"
            >
              <Globe className="h-4 w-4" />
              <span className="text-[12px] font-bold uppercase">{lang}</span>
            </button>
            <button onClick={toggleTheme} className="btn btn-ghost btn-sm px-2 text-foreground/70 hover:text-foreground" aria-label="Theme">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link to="/login" className="btn btn-ghost btn-sm hidden text-foreground/70 hover:text-foreground sm:inline-flex">{t('nav.login')}</Link>
            <Link to="/app/dashboard" className={`btn ${GRA} btn-md hidden rounded-full px-5 text-white shadow-[0_10px_25px_-8px_rgba(30,167,95,0.55)] sm:inline-flex`}>
              {t('nav.app')} <ArrowRight className="h-4 w-4" />
            </Link>
            <button className="btn btn-ghost btn-sm px-2 lg:hidden" onClick={() => setMenu(!menu)} aria-label="Menu">
              {menu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {menu && (
          <div className="border-t border-border/50 bg-card/95 px-4 py-3 backdrop-blur-xl lg:hidden">
            {navLinks.map(([label, id]) => (
              <button key={id} onClick={() => go(id)} className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-foreground/75 hover:bg-primary/10 hover:text-primary">
                {label}
              </button>
            ))}
            <Link to="/login" className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-primary">{t('nav.login')}</Link>
            <Link to="/app/dashboard" className={`btn ${GRA} btn-md mt-2 w-full rounded-full text-white`}>
              {t('nav.app')} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </header>

      {/* ================= HERO (light mint, style Hopewell) ================= */}
      <section className="relative overflow-hidden pb-20 pt-28 sm:pb-24 sm:pt-32">
        {/* decorative blobs */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <span className="absolute left-[4%] top-24 h-16 w-16 rounded-full bg-amber-300/50" />
          <span className="absolute right-[8%] top-16 h-24 w-24 rounded-full bg-primary/10 blur-md" />
          <span className="absolute -left-24 bottom-10 h-72 w-72 rounded-full bg-primary/10 blur-[90px]" />
          <span className="absolute -right-24 top-40 h-80 w-80 rounded-full bg-amber-200/30 blur-[100px]" />
        </div>

        <div className="container relative grid items-center gap-14 lg:grid-cols-2">
          <div className="animate-fade-up text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-[11.5px] font-bold uppercase tracking-wide text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              {t('hero.badge')}
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.12] tracking-tight text-foreground sm:text-5xl lg:text-[3.3rem]">
              {t('hero.title1')}<br />
              <span className="relative inline-block text-primary">
                {t('hero.title2')}
                <span className="absolute inset-x-0 -bottom-1.5 h-[6px] rounded-full" style={{ background: YELLOW }} aria-hidden />
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-[15px] leading-relaxed text-muted-foreground lg:mx-0">
              {t('hero.desc')}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <Link to="/login" className={`btn ${GRA} btn-lg rounded-full px-7 text-white shadow-[0_14px_30px_-10px_rgba(30,167,95,0.6)]`}>
                {t('hero.cta1')} <ArrowRight className="h-4 w-4" />
              </Link>
              <button onClick={() => go('modules')} className="btn btn-lg rounded-full border border-border/70 bg-card px-6 text-foreground shadow-sm hover:bg-muted">
                <span className={`grid h-6 w-6 place-items-center rounded-full ${GRA} text-white`}>
                  <Play className="h-3 w-3 fill-white" />
                </span>
                {t('hero.cta2')}
              </button>
            </div>
            <div className="mt-8 flex items-center justify-center gap-3 lg:justify-start">
              <div className="flex -space-x-2.5">
                {['#1ea75f', '#24446b', '#f2a90f', '#0d9488'].map((c, i) => (
                  <span key={i} className="grid h-9 w-9 place-items-center rounded-full border-[3px] border-background text-[10px] font-bold text-white" style={{ background: c }}>
                    {['AD', 'YM', 'IO', 'RK'][i]}
                  </span>
                ))}
              </div>
              <p className="text-left text-[12px] leading-tight text-muted-foreground">
                <b className="text-foreground">12 600+ utilisateurs</b><br />
                {t('hero.trust')}
              </p>
            </div>
          </div>

          <div className="animate-fade-up" style={{ animationDelay: '.15s' }}>
            <HeroVisual />
          </div>
        </div>

        {/* stats cards (counters) */}
        <div className="container relative mt-16 sm:mt-20">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { el: <CountUp to={120} suffix="+" />, label: t('stats.schools') },
              { el: <CountUp to={65000} />, label: t('stats.students') },
              { el: <CountUp to={99.9} decimals={1} suffix="%" />, label: t('stats.uptime') },
              { el: <CountUp to={4.8} decimals={1} suffix="/5" />, label: t('stats.satisfaction') },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl border border-border/50 bg-card p-6 text-center shadow-card">
                <p className="text-3xl font-extrabold tracking-tight text-foreground">{s.el}</p>
                <p className="mt-1.5 text-[12px] font-semibold text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-[12px] font-semibold text-muted-foreground">
            {fmtNumber(65000)}+ apprenants · 2013 · UEMOA
          </p>
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
              <div key={i} className="card group p-5 transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-pop">
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
      <section id="modules" className="bg-card py-20 dark:bg-white/[0.02] sm:py-24">
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
              <div key={i} className={`card relative flex flex-col rounded-2xl p-6 ${m.featured ? 'border-primary/50 ring-2 ring-primary shadow-pop lg:-my-3' : ''}`}>
                {m.featured && (
                  <span className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full ${GRA} px-3.5 py-1 text-[11px] font-bold text-white shadow`}>★ Populaire</span>
                )}
                <span className={`grid h-12 w-12 place-items-center rounded-xl ${m.featured ? GRA + ' text-white' : 'bg-primary/10 text-primary'}`}>
                  <m.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 text-lg font-extrabold">{m.name}</h3>
                <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-muted-foreground">{m.desc}</p>
                <div className="mt-5 border-t border-border/60 pt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t('m.primary.p')}</p>
                  <p className="mt-0.5">
                    <span className="text-3xl font-extrabold tracking-tight">{m.price}</span>
                    <span className="text-[13px] font-medium text-muted-foreground"> FCFA / mois</span>
                  </p>
                </div>
                <Link to="/login" className={`btn btn-md mt-4 w-full rounded-full ${m.featured ? GRA + ' text-white' : 'btn-outline text-foreground'}`}>
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
              <div key={i} className="card group relative overflow-hidden p-5 transition-all hover:-translate-y-1 hover:shadow-pop">
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

      {/* ================= OFFLINE (deep green) ================= */}
      <section className="bg-[#0d2a1d] py-20 text-emerald-50 sm:py-24">
        <div className="container grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-amber-300">Offline-first · PWA</span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{t('offline.title')}</h2>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-emerald-100/80">{t('offline.desc')}</p>
            <ul className="mt-6 space-y-3">
              {[t('offline.f1'), t('offline.f2'), t('offline.f3')].map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-[14px] text-emerald-50/90">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-400/20 text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-2">
              {['Orange Money', 'Wave', 'MTN MoMo', 'Moov Money', 'FCFA (XOF)'].map((p) => (
                <span key={p} className="rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-[12px] font-semibold text-emerald-50">
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
              <div key={i} className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                <x.icon className="h-5 w-5 text-amber-300" />
                <p className="mt-3 text-2xl font-extrabold tracking-tight">{x.big}</p>
                <p className="mt-0.5 text-[12px] text-emerald-100/70">{x.small}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= TESTIMONIALS ================= */}
      <section className="bg-card py-20 dark:bg-white/[0.02] sm:py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-primary">{t('testimonials.kicker')}</span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{t('testimonials.title')}</h2>
          </div>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {d.testimonials.map((x, i) => (
              <figure key={i} className="flex flex-col rounded-2xl border border-border/50 bg-background p-6 shadow-card">
                <Quote className="h-5 w-5 text-primary/50" />
                <blockquote className="mt-3 flex-1 text-[13.5px] leading-relaxed text-foreground/90">“{x.text}”</blockquote>
                <figcaption className="mt-5 flex items-center gap-3 border-t border-border/60 pt-4">
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
      <section id="faq" className="py-20 sm:py-24">
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
                <div key={n} className="card overflow-hidden rounded-2xl">
                  <button
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                    onClick={() => setOpenFaq(open ? null : n)}
                    aria-expanded={open}
                  >
                    <span className="text-[14.5px] font-semibold">{t(`faq.q${n}`)}</span>
                    <ChevronDown className={`h-4 w-4 shrink-0 text-primary transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
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

      {/* ================= CTA (green) ================= */}
      <section className="pb-20 sm:pb-24">
        <div className="container">
          <div className={`relative overflow-hidden rounded-[2rem] ${GRA} px-6 py-16 text-center text-white sm:px-12`}>
            <div className="pointer-events-none absolute inset-0" aria-hidden>
              <span className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
              <span className="absolute -bottom-14 right-10 h-48 w-48 rounded-full bg-white/10" />
              <span className="absolute right-1/4 top-6 h-6 w-6 rounded-full bg-amber-300/70" />
            </div>
            <h2 className="relative mx-auto max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">{t('cta.title')}</h2>
            <p className="relative mx-auto mt-3 max-w-xl text-[14px] text-white/85">{t('cta.desc')}</p>
            <div className="relative mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link to="/login" className="btn btn-lg rounded-full bg-white px-8 text-primary shadow-[0_14px_30px_-12px_rgba(0,0,0,0.4)] hover:bg-emerald-50">
                {t('cta.btn')} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FOOTER (deep green) ================= */}
      <footer className="bg-[#0d241a] py-12 text-emerald-100/70">
        <div className="container">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Link to="/" className="flex items-center gap-2">
                <span className={`grid h-9 w-9 place-items-center rounded-xl ${GRA} text-lg font-black text-white`}>E</span>
                <span className="text-lg font-extrabold tracking-tight text-white">Ecole<span className="text-emerald-400">CRM</span></span>
              </Link>
              <p className="mt-3 max-w-xs text-[12.5px] leading-relaxed">{t('hero.desc').slice(0, 120)}…</p>
              <p className="mt-3 flex items-center gap-1.5 text-[11.5px] font-medium">
                <Globe className="h-3.5 w-3.5" /> {t('footer.made')}
              </p>
            </div>
            {[
              [t('footer.product'), [t('nav.features'), t('nav.modules'), t('nav.pricing'), t('nav.faq')]],
              [t('footer.company'), [t('footer.about'), t('footer.contact')]],
              [t('footer.legal'), [t('footer.privacy'), t('footer.terms')]],
            ].map(([title, links], i) => (
              <div key={i}>
                <p className="text-[13px] font-bold text-white">{title as string}</p>
                <ul className="mt-3 space-y-2">
                  {(links as string[]).map((l) => (
                    <li key={l}><button onClick={() => go('features')} className="text-[12.5px] hover:text-emerald-400">{l}</button></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6 text-[12px]">
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
