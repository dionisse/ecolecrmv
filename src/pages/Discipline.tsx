import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, CheckCheck, ShieldAlert, Gavel, Search } from 'lucide-react';
import { db, type Incident } from '@/db/database';
import { useI18n } from '@/i18n/I18nContext';
import { useAuth } from '@/state/auth';
import { useToast } from '@/state/toast';
import { useOnline, queueOperation } from '@/state/sync';
import { fmtDate, nowIso } from '@/utils/format';
import { PageHeader, Modal, Field, Select, Tabs, Chip, Avatar, Empty, SearchInput, StatCard } from '@/components/ui';
import * as Q from '@/db/queries';

const TYPES = ['lateness', 'absence', 'fight', 'cheating', 'insubordination', 'vandalism', 'other'];
const SEVERITIES = ['low', 'moderate', 'serious'];
const SANCTIONS = ['none', 'warning', 'detention', 'exclusion', 'council'];

export default function Discipline() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();
  const online = useOnline();
  const location = useLocation() as any;

  const incidents = useLiveQuery(() => db.incidents.toArray(), []) || [];
  const students = useLiveQuery(() => db.students.toArray(), []) || [];
  const classes = useLiveQuery(() => db.classes.toArray(), []) || [];

  const [tab, setTab] = useState('open');
  const [form, setForm] = useState<Incident | null>(null);
  const [q, setQ] = useState('');
  const [sevF, setSevF] = useState('');

  useEffect(() => { if (location?.state?.new) openNew(); }, [location?.state]);

  const canManage = ['admin', 'director', 'discipline', 'censor', 'teacher'].includes(user?.role || '');

  const openNew = () => setForm({
    studentId: 0, classId: undefined, date: nowIso().slice(0, 10),
    type: 'lateness', severity: 'low', description: '', sanction: 'none', status: 'open',
    reportedById: undefined,
  });

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return incidents
      .filter((i) =>
        (tab === 'open' ? i.status === 'open' : tab === 'resolved' ? i.status === 'resolved' : true) &&
        (!sevF || i.severity === sevF) &&
        (!needle || Q.fullName(students.find((s) => s.id === i.studentId)).toLowerCase().includes(needle))
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [incidents, students, tab, sevF, q]);

  const openCount = incidents.filter((i) => i.status === 'open').length;
  const seriousCount = incidents.filter((i) => i.severity === 'serious').length;
  const resolvedCount = incidents.filter((i) => i.status === 'resolved').length;

  const save = async () => {
    if (!form || !form.studentId) return toast(t('common.required'), 'error');
    await db.incidents.add({ ...form, classId: students.find((s) => s.id === form.studentId)?.classId });
    if (!online) queueOperation();
    // auto-notify guardian (push simulation)
    const s = students.find((x) => x.id === form.studentId);
    await db.notifications.add({
      title: `${t('msg.tpl.absence')} — ${s?.lastName || ''}`,
      body: `${t(`disc.type.${form.type}`)} · ${t(`disc.severity.${form.severity}`)} · ${t(`disc.${form.sanction}`)}`,
      date: nowIso(), forRole: 'parent', read: 0,
    });
    toast(t('common.saved'));
    setForm(null);
  };

  const resolve = async (i: Incident) => {
    await db.incidents.update(i.id!, { status: 'resolved' });
    toast(t('disc.resolved') + ' ✓');
  };

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={t('disc.title')}
        sub={t('disc.sub')}
        actions={canManage && (
          <button className="btn btn-primary btn-md" onClick={openNew}><Plus className="h-4 w-4" /> {t('disc.newIncident')}</button>
        )}
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label={t('disc.open')} value={String(openCount)} icon={<ShieldAlert className="h-4 w-4" />} accent />
        <StatCard label={t('disc.severity.serious')} value={String(seriousCount)} icon={<Gavel className="h-4 w-4" />} />
        <StatCard label={t('disc.resolved')} value={String(resolvedCount)} icon={<CheckCheck className="h-4 w-4" />} />
        <StatCard label={t('common.total')} value={String(incidents.length)} />
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <Tabs
          active={tab}
          onChange={setTab}
          className="flex-1"
          tabs={[
            { id: 'open', label: t('disc.open'), count: openCount },
            { id: 'resolved', label: t('disc.resolved'), count: resolvedCount },
            { id: 'all', label: t('common.all'), count: incidents.length },
          ]}
        />
        <div className="flex gap-2">
          <div className="w-40"><SearchInput value={q} onChange={setQ} placeholder={t('common.search')} /></div>
          <div className="w-36"><Select value={sevF} onChange={setSevF} placeholder={t('disc.severity.moderate')} options={SEVERITIES.map((s) => ({ value: s, label: t(`disc.severity.${s}`) }))} /></div>
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.slice(0, 60).map((i) => {
          const s = students.find((x) => x.id === i.studentId);
          const cls = classes.find((c) => c.id === i.classId);
          return (
            <div key={i.id} className="card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <Avatar name={`${s?.firstName || ''} ${s?.lastName || ''}`} color={s?.photoColor} size={36} />
                  <div>
                    <p className="text-[13px] font-bold leading-tight">{Q.fullName(s)}</p>
                    <p className="text-[11px] text-muted-foreground">{cls?.name} · {fmtDate(i.date, lang)}</p>
                  </div>
                </div>
                <Chip value={i.severity} label={t(`disc.severity.${i.severity}`)} />
              </div>
              <p className="mt-2.5 text-[13px] font-semibold">{t(`disc.type.${i.type}`)}</p>
              <p className="mt-0.5 line-clamp-2 text-[12px] text-muted-foreground">{i.description}</p>
              <div className="mt-3 flex items-center justify-between gap-2">
                <div className="flex gap-1.5">
                  <span className="badge border-border/60 bg-muted/60">{t(`disc.${i.sanction}`)}</span>
                  <Chip value={i.status} label={t(`disc.${i.status}`)} />
                </div>
                {i.status === 'open' && canManage && (
                  <button className="btn btn-success btn-sm" onClick={() => resolve(i)}><CheckCheck className="h-3.5 w-3.5" /> {t('disc.resolved')}</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {!filtered.length && <div className="card mt-3"><Empty title={t('common.empty')} desc={t('common.emptyDesc')} icon={<ShieldAlert className="h-6 w-6" />} /></div>}

      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title={t('disc.newIncident')}
        footer={
          <>
            <button className="btn btn-outline btn-md" onClick={() => setForm(null)}>{t('common.cancel')}</button>
            <button className="btn btn-primary btn-md" onClick={save}>{t('common.save')}</button>
          </>
        }
      >
        {form && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t('finance.student')} required className="sm:col-span-2">
              <Select
                value={String(form.studentId || '')}
                onChange={(v) => setForm({ ...form, studentId: Number(v) })}
                placeholder="—"
                options={[...students].sort((a, b) => a.lastName.localeCompare(b.lastName)).map((s) => ({ value: String(s.id), label: `${s.lastName.toUpperCase()} ${s.firstName} — ${s.matricule}` }))}
              />
            </Field>
            <Field label={t('disc.type')}>
              <Select value={form.type} onChange={(v) => setForm({ ...form, type: v })} options={TYPES.map((x) => ({ value: x, label: t(`disc.type.${x}`) }))} />
            </Field>
            <Field label={t('disc.severity.moderate')}>
              <Select value={form.severity} onChange={(v) => setForm({ ...form, severity: v as Incident['severity'] })} options={SEVERITIES.map((x) => ({ value: x, label: t(`disc.severity.${x}`) }))} />
            </Field>
            <Field label={t('disc.sanction')}>
              <Select value={form.sanction} onChange={(v) => setForm({ ...form, sanction: v })} options={SANCTIONS.map((x) => ({ value: x, label: t(`disc.${x}`) }))} />
            </Field>
            <Field label={t('common.date')}>
              <input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </Field>
            <Field label={t('disc.description')} required className="sm:col-span-2">
              <textarea className="input min-h-20" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
            <p className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-[11.5px] text-muted-foreground sm:col-span-2">
              <Search className="h-3.5 w-3.5 shrink-0" /> Une notification push sera envoyée au parent {students.find((s) => s.id === form.studentId)?.guardianPhone}.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
