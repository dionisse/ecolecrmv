import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { UserPlus, Pencil, Trash2, Download, ShieldCheck, Star } from 'lucide-react';
import { db, type Staff, type Role } from '@/db/database';
import { useI18n } from '@/i18n/I18nContext';
import { useAuth } from '@/state/auth';
import { useToast } from '@/state/toast';
import { fmtMoney, fmtDate, nowIso } from '@/utils/format';
import { exportExcel } from '@/utils/export';
import { PageHeader, Modal, Field, Select, Confirm, Chip, Avatar, Tabs, StatCard, Progress, SearchInput, Pagination } from '@/components/ui';
import * as Q from '@/db/queries';

const PER = 10;

const MODULE_KEYS = ['users', 'students', 'academic', 'finance', 'staff', 'discipline', 'messages', 'reports', 'settings'];
const ROLE_MATRIX: Record<Role, string[]> = {
  admin: MODULE_KEYS,
  director: ['users', 'students', 'academic', 'finance', 'staff', 'discipline', 'messages', 'reports'],
  censor: ['students', 'academic', 'discipline', 'reports'],
  discipline: ['students', 'discipline'],
  accountant: ['finance', 'reports', 'messages'],
  secretary: ['students', 'academic', 'messages'],
  teacher: ['academic'],
  parent: [],
  staff: [],
};

const ROLE_COLORS: Record<string, string> = {
  admin: '#f97316', director: '#e11d48', teacher: '#0ea5e9', parent: '#8b5cf6',
  accountant: '#10b981', secretary: '#d97706', discipline: '#ef4444', censor: '#6366f1', staff: '#64748b',
};

const emptyStaff = (): Staff => ({
  name: '', role: 'teacher', module: 'secondary', email: '', phone: '', address: '',
  diploma: '', speciality: '', salary: 150000, hiredAt: nowIso().slice(0, 10), active: 1,
});

export default function StaffPage() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();
  const location = useLocation() as any;

  const staff = useLiveQuery(() => db.staff.toArray(), []) || [];
  const users = useLiveQuery(() => db.users.toArray(), []) || [];
  const attendance = useLiveQuery(() => db.attendance.toArray(), []) || [];
  const grades = useLiveQuery(() => db.grades.toArray(), []) || [];
  const subjects = useLiveQuery(() => db.subjects.toArray(), []) || [];

  const [tab, setTab] = useState('list');
  const [form, setForm] = useState<Staff | null>(null);
  const [delTarget, setDelTarget] = useState<Staff | null>(null);
  const [q, setQ] = useState('');
  const [roleF, setRoleF] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => { if (location?.state?.new) setForm(emptyStaff()); }, [location?.state]);

  const canManage = user?.role === 'admin' || user?.role === 'director';

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return staff
      .filter((s) => (!needle || `${s.name} ${s.email}`.toLowerCase().includes(needle)) && (!roleF || s.role === roleF))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [staff, q, roleF]);

  const pages = Math.ceil(filtered.length / PER);
  const rows = filtered.slice((page - 1) * PER, page * PER);

  const save = async () => {
    if (!form || !form.name) return toast(t('common.required'), 'error');
    if (form.id) await db.staff.put(form);
    else await db.staff.add(form);
    toast(t('common.saved'));
    setForm(null);
  };

  const attRate = Q.attendanceRate(attendance);
  const perfFor = (s: Staff) => {
    const taught = subjects.filter((x) => x.teacherId === s.id);
    if (!taught.length) return null;
    const g = grades.filter((x) => taught.some((sub) => sub.id === x.subjectId));
    if (!g.length) return null;
    return Math.round((g.reduce((a, x) => a + (x.score / x.maxScore) * 20, 0) / g.length) * 10) / 10;
  };

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={t('staff.title')}
        sub={`${staff.length} — ${t('staff.sub')}`}
        actions={
          <>
            <button
              className="btn btn-outline btn-md"
              onClick={() => {
                exportExcel(filtered.map((s) => ({ Nom: s.name, Rôle: t(`role.${s.role}`), Module: t(`module.${s.module}`), Diplôme: s.diploma, Téléphone: s.phone, Salaire: s.salary, Embauché: s.hiredAt })), 'personnel_ecolecrm');
                toast('Export XLSX ✓');
              }}
            >
              <Download className="h-4 w-4" /> Excel
            </button>
            {canManage && (
              <button className="btn btn-primary btn-md" onClick={() => setForm(emptyStaff())}><UserPlus className="h-4 w-4" /> {t('staff.newStaff')}</button>
            )}
          </>
        }
      />

      <Tabs active={tab} onChange={setTab} tabs={[
        { id: 'list', label: t('nav.staff'), count: staff.length },
        { id: 'perf', label: t('staff.performance') },
        ...(user?.role === 'admin' ? [{ id: 'roles', label: t('staff.roles') }] : []),
      ]} />

      {tab === 'list' && (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
            <StatCard label={t('common.total')} value={String(staff.length)} accent />
            <StatCard label={t('role.teacher')} value={String(staff.filter((s) => s.role === 'teacher').length)} />
            <StatCard label={t('staff.attendanceRate')} value={attRate.rate + '%'} />
            <StatCard label="Masse salariale" value={fmtMoney(staff.reduce((a, s) => a + s.salary, 0))} />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <div className="col-span-2"><SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder={`${t('common.search')} ${t('nav.staff').toLowerCase()}…`} /></div>
            <Select value={roleF} onChange={(v) => { setRoleF(v); setPage(1); }} placeholder={t('common.role')} options={(Object.keys(ROLE_COLORS) as Role[]).map((r) => ({ value: r, label: t(`role.${r}`) }))} />
          </div>

          <div className="card mt-3 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="th">{t('common.name')}</th>
                    <th className="th">{t('common.role')}</th>
                    <th className="th">{t('common.module')}</th>
                    <th className="th">{t('staff.diploma')}</th>
                    <th className="th">{t('staff.salary')}</th>
                    <th className="th">{t('staff.hiredAt')}</th>
                    <th className="th text-right">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s) => (
                    <tr key={s.id} className="tr">
                      <td className="td">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={s.name} color={ROLE_COLORS[s.role]} size={32} />
                          <div>
                            <p className="text-[13px] font-semibold">{s.name}</p>
                            <p className="text-[11px] text-muted-foreground">{s.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="td">
                        <span className="chip text-white" style={{ background: ROLE_COLORS[s.role] }}>{t(`role.${s.role}`)}</span>
                      </td>
                      <td className="td text-muted-foreground">{s.module === 'all' ? t('common.all') : t(`module.${s.module}`)}</td>
                      <td className="td text-[12px]">{s.diploma || '—'}</td>
                      <td className="td font-semibold">{fmtMoney(s.salary)}</td>
                      <td className="td text-muted-foreground">{fmtDate(s.hiredAt, lang)}</td>
                      <td className="td">
                        {canManage && (
                          <div className="flex justify-end gap-1">
                            <button className="btn btn-ghost btn-sm px-1.5" onClick={() => setForm(s)}><Pencil className="h-3.5 w-3.5" /></button>
                            {user?.role === 'admin' && <button className="btn btn-ghost btn-sm px-1.5 text-danger" onClick={() => setDelTarget(s)}><Trash2 className="h-3.5 w-3.5" /></button>}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-border/60"><Pagination page={page} pages={pages} onPage={setPage} total={filtered.length} perPage={PER} /></div>
          </div>
        </>
      )}

      {tab === 'perf' && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {staff.filter((s) => s.role === 'teacher').map((s) => {
            const perf = perfFor(s);
            const load = subjects.filter((x) => x.teacherId === s.id).length;
            return (
              <div key={s.id} className="card p-4">
                <div className="flex items-center gap-3">
                  <Avatar name={s.name} color={ROLE_COLORS[s.role]} size={42} />
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-bold">{s.name}</p>
                    <p className="text-[11.5px] text-muted-foreground">{s.speciality || s.diploma}</p>
                  </div>
                  <span className="ml-auto flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-1 text-[11px] font-bold text-amber-600">
                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> {perf ? perf.toFixed(1) : '—'}/20
                  </span>
                </div>
                <div className="mt-3 space-y-2">
                  <div>
                    <div className="mb-1 flex justify-between text-[11px]"><span className="text-muted-foreground">{t('staff.attendanceRate')}</span><span className="font-bold">{attRate.rate}%</span></div>
                    <Progress value={attRate.rate} barClass="bg-success" />
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between text-[11px]"><span className="text-muted-foreground">{t('staff.punctuality')}</span><span className="font-bold">{Math.min(98, attRate.rate + 3)}%</span></div>
                    <Progress value={Math.min(98, attRate.rate + 3)} barClass="bg-primary" />
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between text-[11px]"><span className="text-muted-foreground">{t('staff.subjects')}</span><span className="font-bold">{load}</span></div>
                    <Progress value={Math.min(100, load * 20)} barClass="bg-primary/70" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'roles' && user?.role === 'admin' && (
        <div className="card mt-4 overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <h3 className="text-[14px] font-bold">{t('staff.permissions')}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="bg-muted/50">
                  <th className="th">{t('common.role')}</th>
                  {MODULE_KEYS.map((m) => <th key={m} className="th text-center">{t(`nav.${m}`)}</th>)}
                </tr>
              </thead>
              <tbody>
                {(Object.keys(ROLE_MATRIX) as Role[]).map((r) => (
                  <tr key={r} className="tr">
                    <td className="td">
                      <span className="chip text-white" style={{ background: ROLE_COLORS[r] }}>{t(`role.${r}`)}</span>
                    </td>
                    {MODULE_KEYS.map((m) => (
                      <td key={m} className="td text-center">
                        {ROLE_MATRIX[r].includes(m)
                          ? <span className="inline-grid h-5 w-5 place-items-center rounded-full bg-success/15 text-[10px] font-bold text-success">✓</span>
                          : <span className="inline-grid h-5 w-5 place-items-center rounded-full bg-muted text-[10px] text-muted-foreground">·</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="border-t border-border/60 px-4 py-2.5 text-[11.5px] text-muted-foreground">
            {t('portals.desc')}
          </p>
        </div>
      )}

      {/* Staff form modal */}
      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        wide
        title={form?.id ? `${t('common.edit')} — ${form.name}` : t('staff.newStaff')}
        footer={
          <>
            <button className="btn btn-outline btn-md" onClick={() => setForm(null)}>{t('common.cancel')}</button>
            <button className="btn btn-primary btn-md" onClick={save}>{t('common.save')}</button>
          </>
        }
      >
        {form && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t('common.name')} required>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label={t('common.role')}>
              <Select value={form.role} onChange={(v) => setForm({ ...form, role: v as Role })} options={(Object.keys(ROLE_COLORS) as Role[]).map((r) => ({ value: r, label: t(`role.${r}`) }))} />
            </Field>
            <Field label={t('common.module')}>
              <Select value={form.module} onChange={(v) => setForm({ ...form, module: v as any })} options={[
                { value: 'all', label: t('common.all') }, { value: 'primary', label: t('module.primary') },
                { value: 'secondary', label: t('module.secondary') }, { value: 'university', label: t('module.university') },
              ]} />
            </Field>
            <Field label={t('staff.diploma')}>
              <input className="input" value={form.diploma || ''} onChange={(e) => setForm({ ...form, diploma: e.target.value })} />
            </Field>
            <Field label={t('common.email')}>
              <input type="email" className="input" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label={t('common.phone')}>
              <input className="input" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field label={`${t('staff.salary')} (FCFA)`}>
              <input type="number" className="input" value={form.salary} onChange={(e) => setForm({ ...form, salary: Number(e.target.value) })} />
            </Field>
            <Field label={t('staff.hiredAt')}>
              <input type="date" className="input" value={form.hiredAt} onChange={(e) => setForm({ ...form, hiredAt: e.target.value })} />
            </Field>
            <Field label={t('students.address')} className="sm:col-span-2">
              <input className="input" value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </Field>
          </div>
        )}
      </Modal>

      <Confirm
        open={!!delTarget}
        onClose={() => setDelTarget(null)}
        onConfirm={async () => { if (delTarget) { await db.staff.delete(delTarget.id!); toast(t('common.deleted')); } }}
        title={t('common.confirmDelete')}
        message={String(delTarget?.name || '')}
      />
    </div>
  );
}
