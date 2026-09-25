import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Building2, Globe, Moon, Sun, BellRing, DatabaseBackup, RotateCcw, Download,
  RefreshCw, Trash2, Smartphone, Palette,
} from 'lucide-react';
import { db, backupAll, restoreAll, wipeAll } from '@/db/database';
import { seedIfEmpty, DEFAULT_SCHOOL } from '@/db/seed';
import { useI18n } from '@/i18n/I18nContext';
import { useAuth } from '@/state/auth';
import { useToast } from '@/state/toast';
import { useOnline, useSync, flushQueue, enablePush } from '@/state/sync';
import { setTheme, useTheme } from '@/utils/theme';
import { fmtDateTime, nowIso } from '@/utils/format';
import { PageHeader, Field, Select, Confirm } from '@/components/ui';

export default function SettingsPage() {
  const { t, lang, setLang } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();
  const theme = useTheme();
  const online = useOnline();
  const { queue, lastSync } = useSync();
  const fileRef = useRef<HTMLInputElement>(null);

  const schoolCfg = useLiveQuery(async () => (await db.meta.get('school'))?.value as typeof DEFAULT_SCHOOL, []) || DEFAULT_SCHOOL;
  const [school, setSchool] = useState(schoolCfg);
  const [confirmReset, setConfirmReset] = useState(false);
  const [pushState, setPushState] = useState<'default' | 'granted' | 'denied' | 'unsupported'>(
    typeof Notification !== 'undefined' ? Notification.permission as any : 'unsupported'
  );

  useEffect(() => { setSchool(schoolCfg); }, [schoolCfg]);

  const canConfig = user?.role === 'admin';

  const saveSchool = async () => {
    if (!canConfig) return;
    await db.meta.put({ key: 'school', value: school });
    toast(t('common.saved'));
  };

  const doBackup = async () => {
    const data = await backupAll();
    const blob = new Blob([JSON.stringify({ app: 'ecolecrm', version: 1, exportedAt: nowIso(), data }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ecolecrm-sauvegarde-${nowIso().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast(t('set.backup') + ' ✓');
  };

  const doRestore = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed?.data) throw new Error('bad');
      await restoreAll(parsed.data);
      toast(t('set.restore') + ' ✓');
      setTimeout(() => window.location.reload(), 800);
    } catch {
      toast('JSON invalide', 'error');
    }
  };

  const doReset = async () => {
    await wipeAll();
    await seedIfEmpty();
    toast('Démo réinitialisée ✓');
    setTimeout(() => window.location.reload(), 700);
  };

  const askPush = async () => {
    const res = await enablePush();
    setPushState(res);
    toast(res === 'granted' ? t('set.pushEnabled') : t('set.pushBlocked'), res === 'granted' ? 'success' : 'error');
  };

  return (
    <div className="animate-fade-up max-w-4xl">
      <PageHeader title={t('set.title')} sub={t('portal.admin.d')} />

      {/* School identity */}
      <section className="card p-5">
        <h3 className="flex items-center gap-2 text-[14px] font-bold"><Building2 className="h-4 w-4 text-primary" /> {t('set.school')}</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label={t('set.schoolName')}>
            <input className="input" disabled={!canConfig} value={school?.name || ''} onChange={(e) => setSchool({ ...school, name: e.target.value })} />
          </Field>
          <Field label={t('set.schoolMotto')}>
            <input className="input" disabled={!canConfig} value={school?.motto || ''} onChange={(e) => setSchool({ ...school, motto: e.target.value })} />
          </Field>
          <Field label={t('set.academicYear')}>
            <input className="input" disabled value={school?.year || ''} />
          </Field>
          <Field label={t('set.currency')}>
            <input className="input" disabled value="FCFA (XOF) — UEMOA" />
          </Field>
        </div>
        {canConfig && (
          <button className="btn btn-primary btn-md mt-4" onClick={saveSchool}>{t('common.save')}</button>
        )}
      </section>

      {/* Appearance & language */}
      <section className="card mt-4 p-5">
        <h3 className="flex items-center gap-2 text-[14px] font-bold"><Palette className="h-4 w-4 text-primary" /> {t('set.appearance')} · {t('set.language')}</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label={t('set.language')}>
            <div className="grid grid-cols-2 gap-2">
              {(['fr', 'en'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-[13px] font-semibold transition ${
                    lang === l ? 'border-primary bg-primary/10 text-primary' : 'border-border/70 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <Globe className="h-4 w-4" /> {l === 'fr' ? 'Français' : 'English'}
                </button>
              ))}
            </div>
          </Field>
          <Field label={t('set.appearance')}>
            <div className="grid grid-cols-2 gap-2">
              {(['light', 'dark'] as const).map((th) => (
                <button
                  key={th}
                  onClick={() => setTheme(th)}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-[13px] font-semibold transition ${
                    theme === th ? 'border-primary bg-primary/10 text-primary' : 'border-border/70 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {th === 'light' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />} {th === 'light' ? 'Clair' : 'Sombre'}
                </button>
              ))}
            </div>
          </Field>
        </div>
      </section>

      {/* Notifications */}
      <section className="card mt-4 p-5">
        <h3 className="flex items-center gap-2 text-[14px] font-bold"><BellRing className="h-4 w-4 text-primary" /> {t('set.notif')}</h3>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/50 px-4 py-3">
          <div>
            <p className="text-[13px] font-semibold">{t('set.enablePush')}</p>
            <p className="text-[11.5px] text-muted-foreground">
              {pushState === 'granted' ? `✓ ${t('set.pushEnabled')}` : pushState === 'denied' ? t('set.pushBlocked') : 'Parents, élèves, enseignants'}
            </p>
          </div>
          <button className="btn btn-outline btn-md" onClick={askPush}>
            <BellRing className="h-4 w-4" /> {pushState === 'granted' ? '✓' : 'Activer'}
          </button>
        </div>
      </section>

      {/* Sync & data */}
      <section className="card mt-4 p-5">
        <h3 className="flex items-center gap-2 text-[14px] font-bold"><DatabaseBackup className="h-4 w-4 text-primary" /> {t('set.data')}</h3>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/50 px-4 py-3">
          <div>
            <p className="flex items-center gap-2 text-[13px] font-semibold"><RefreshCw className="h-3.5 w-3.5" /> {t('set.syncQueue')}: {queue}</p>
            <p className="text-[11.5px] text-muted-foreground">
              {online ? `${t('nav.online')} · ${lastSync ? `${t('nav.sync')}: ${fmtDateTime(lastSync, lang)}` : '—'}` : t('nav.offline')}
            </p>
          </div>
          <button className="btn btn-outline btn-md" onClick={async () => { await flushQueue(); toast(t('nav.sync') + ' ✓'); }}>
            <RefreshCw className="h-4 w-4" /> {t('nav.syncNow')}
          </button>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <button className="btn btn-outline btn-md" onClick={doBackup}><Download className="h-4 w-4" /> {t('set.backup')}</button>
          <button className="btn btn-outline btn-md" onClick={() => fileRef.current?.click()}><RotateCcw className="h-4 w-4" /> {t('set.restore')}</button>
          {canConfig && (
            <button className="btn btn-md border border-danger/30 text-danger hover:bg-danger/10" onClick={() => setConfirmReset(true)}>
              <Trash2 className="h-4 w-4" /> {t('set.resetDemo')}
            </button>
          )}
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && doRestore(e.target.files[0])} />
        </div>
        <p className="mt-3 text-[11.5px] text-muted-foreground">{t('set.offlineInfo')}</p>
      </section>

      {/* PWA */}
      <section className="card mt-4 p-5">
        <h3 className="flex items-center gap-2 text-[14px] font-bold"><Smartphone className="h-4 w-4 text-primary" /> PWA</h3>
        <p className="mt-2 text-[12.5px] text-muted-foreground">
          {t('pwa.installDesc')} — Chrome/Edge : menu → « Installer l’application » · iOS Safari : Partager → « Sur l’écran d’accueil ».
        </p>
      </section>

      <p className="mt-6 text-center text-[11px] text-muted-foreground">
        EcoleCRM v1.0 — {t('appName')} · {t('footer.made')}
      </p>

      <Confirm
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={doReset}
        title={t('set.resetDemo')}
        message="Toutes les données locales seront remplacées par le jeu de démonstration."
      />
    </div>
  );
}
