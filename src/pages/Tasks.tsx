import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { CheckSquare, Square, ListTodo, CalendarClock, AlertOctagon, Plus } from 'lucide-react';
import { db } from '@/db/database';
import { useI18n } from '@/i18n/I18nContext';
import { useAuth } from '@/state/auth';
import { useToast } from '@/state/toast';
import { fmtDate, nowIso, today } from '@/utils/format';
import { PageHeader, StatCard, Modal, Field, Select, Chip, Empty, Tabs } from '@/components/ui';
import type { Task } from '@/db/database';

/** Staff portal: administrative tasks */
export default function Tasks() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();

  const tasks = useLiveQuery(() => db.tasks.toArray(), []) || [];
  const users = useLiveQuery(() => db.users.toArray(), []) || [];
  const [tab, setTab] = useState('open');
  const [form, setForm] = useState<Task | null>(null);

  const mine = useMemo(() => tasks.filter((x) => !user || !x.assigneeId || x.assigneeId === user.id), [tasks, user]);
  const open = mine.filter((x) => !x.done);
  const done = mine.filter((x) => x.done);
  const overdue = open.filter((x) => x.due < today());

  const canManage = ['admin', 'director', 'secretary'].includes(user?.role || '');

  const toggle = async (task: Task) => {
    await db.tasks.update(task.id!, { done: task.done ? 0 : 1 });
  };

  const save = async () => {
    if (!form || !form.title) return toast(t('common.required'), 'error');
    await db.tasks.add({ ...form, assigneeId: form.assigneeId || user?.id });
    toast(t('common.saved'));
    setForm(null);
  };

  const rows = tab === 'open' ? open : tab === 'done' ? done : mine;

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={t('portal.staffp')}
        sub={t('portal.staffp.d')}
        actions={canManage && (
          <button className="btn btn-primary btn-md" onClick={() => setForm({ title: '', due: today(), priority: 'normal', done: 0 })}>
            <Plus className="h-4 w-4" /> {t('common.add')}
          </button>
        )}
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label={t('dash.tasks')} value={String(open.length)} icon={<ListTodo className="h-4 w-4" />} accent />
        <StatCard label={t('dash.overdue')} value={String(overdue.length)} icon={<AlertOctagon className="h-4 w-4" />} />
        <StatCard label="✓" value={String(done.length)} icon={<CheckSquare className="h-4 w-4" />} />
        <StatCard label={t('common.total')} value={String(mine.length)} icon={<CalendarClock className="h-4 w-4" />} />
      </div>

      <Tabs
        className="mt-4"
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'open', label: t('disc.open'), count: open.length },
          { id: 'done', label: '✓', count: done.length },
          { id: 'all', label: t('common.all'), count: mine.length },
        ]}
      />

      <div className="card mt-3 overflow-hidden">
        {rows.length === 0 ? <Empty title={t('common.empty')} desc={t('common.emptyDesc')} icon={<ListTodo className="h-6 w-6" />} /> : (
          <div className="divide-y divide-border/50">
            {rows.sort((a, b) => a.due.localeCompare(b.due)).map((task) => (
              <div key={task.id} className="flex items-center gap-3 px-4 py-3">
                <button onClick={() => toggle(task)} className="shrink-0" aria-label="toggle">
                  {task.done ? <CheckSquare className="h-5 w-5 text-success" /> : <Square className="h-5 w-5 text-muted-foreground" />}
                </button>
                <div className="min-w-0 flex-1">
                  <p className={`text-[13.5px] font-semibold ${task.done ? 'text-muted-foreground line-through' : ''}`}>{task.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {t('common.date')}: {fmtDate(task.due, lang)} · {users.find((u) => u.id === task.assigneeId)?.name || '—'}
                  </p>
                </div>
                <Chip
                  value={task.due < today() && !task.done ? 'failed' : task.priority === 'high' ? 'pending' : 'none'}
                  label={task.due < today() && !task.done ? t('dash.overdue') : task.priority === 'high' ? '!' : task.done ? '✓' : t('dash.dueToday')}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title={t('nav.myTasks')}
        footer={
          <>
            <button className="btn btn-outline btn-md" onClick={() => setForm(null)}>{t('common.cancel')}</button>
            <button className="btn btn-primary btn-md" onClick={save}>{t('common.save')}</button>
          </>
        }
      >
        {form && (
          <div className="grid gap-3">
            <Field label={t('common.name')} required>
              <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('common.date')}>
                <input type="date" className="input" value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} />
              </Field>
              <Field label="Priorité">
                <Select value={form.priority} onChange={(v) => setForm({ ...form, priority: v as Task['priority'] })} options={[
                  { value: 'low', label: t('disc.severity.low') }, { value: 'normal', label: '—' }, { value: 'high', label: t('disc.severity.serious') },
                ]} />
              </Field>
            </div>
            <Field label={t('common.role')}>
              <Select value={String(form.assigneeId || '')} onChange={(v) => setForm({ ...form, assigneeId: Number(v) || undefined })} placeholder="Moi" options={users.map((u) => ({ value: String(u.id), label: u.name }))} />
            </Field>
          </div>
        )}
      </Modal>
    </div>
  );
}
