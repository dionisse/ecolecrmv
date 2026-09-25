import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { translate, type Lang } from './index';

export const LANG_KEY = 'ecolecrm.lang';

interface I18nCtx { lang: Lang; setLang: (l: Lang) => void; t: (key: string, vars?: Record<string, string | number>) => string; }

const Ctx = createContext<I18nCtx>({ lang: 'fr', setLang: () => {}, t: (k) => k });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try { return (localStorage.getItem(LANG_KEY) as Lang) || 'fr'; } catch { return 'fr'; }
  });

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = lang === 'fr'
      ? 'EcoleCRM — Gestion scolaire intelligente | Primaire · Secondaire · Universitaire'
      : 'EcoleCRM — Smart school management | Primary · Secondary · University';
  }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem(LANG_KEY, l); } catch {}
  };

  const t = (key: string, vars?: Record<string, string | number>) => translate(lang, key, vars);
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);
