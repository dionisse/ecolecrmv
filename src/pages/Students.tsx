import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Pencil, Trash2, Eye, Download, UserPlus, GraduationCap, Wallet, ShieldAlert, IdCard } from 'lucide-react';
import { db, type Student, type ModuleKind } from '@/db/database';
import { useI18n } from '@/i18n/I18nContext';
import { useAuth } from '@/state/auth';
import { useToast } from '@/state/toast';
import { fmtMoney, fmtDate, age, nowIso } from '@/utils/format';
import { exportExcel } from '@/utils/export';
import {
  PageHeader, Modal, Field, Select, Confirm, Chip, Avatar, SearchInput,
  Pagination, Empty, Tabs, StatCard, Progress,
} from '@/components/ui';
import * as Q from '@/db/queries';

const PER = 12;

const emptyStudent = (module: ModuleKind = 'secondary'): Student => ({
  matricule: '', firstName: '', lastName: '', gender: 'M',
  birthDate: '2012-01-01', birthPlace: '', classId: undefined, module,
  guardianName: '', guardianPhone: '', guardianEmail: '', address: '',
  enrolledAt: nowIso().slice(0, 10), status: 'active', photoColor: '#1ea75f',
});

export default function Students() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();
  const location = useLocation() as any;

  const students = useLiveQuery(() => db.students.toArray(), []) || [];
  const classes = useLiveQuery(() => db.classes.toArray(), []) || [];
  const grades = useLiveQuery(() => db.grades.toArray(), []) || [];
  const payments = useLiveQuery(() => db.payments.toArray(), []) || [];
  const incidents = useLiveQuery(() => db.incidents.toArray(), []) || [];

  const [q, setQ] = useState('');
  const [moduleF, setModuleF] = useState('');
  const [classF, setClassF] = useState('');
  const [statusF, setStatusF] = useState('');
  const [page, setPage] = useState(1);

  const [form, setForm] = useState<Student | null>(null);
  const [detail, setDetail] = useState<Student | null>(null);
  const [delTarget, setDelTarget] = useState<Student | null>(null);

  useEffect(() => { if (location?.state?.new) setForm(emptyStudent()); }, [location?.state]);

  const canEdit = ['admin', 'director', 'secretary', 'censor'].includes(user?.role || '');

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return students
      .filter((s) =>
        (!needle || `${s.firstName} ${s.lastName} ${s.matricule} ${s.guardianName}`.toLowerCase().includes(needle)) &&
        (!moduleF || s.module === moduleF) &&
        (!classF || String(s.classId) === classF) &&
        (!statusF || s.status === statusF)
      )
      .sort((a, b) => a.lastName.localeCompare(b.lastName));
  }, [students, q, moduleF, classF, statusF]);

  const pages = Math.ceil(filtered.length / PER);
  const rows = filtered.slice((page - 1) * PER, page * PER);

  const save = async () => {
    if (!form || !form.firstName || !form.lastName || !form.guardianName) {
      toast(t('common.required'), 'error');
      return;
    }
    if (form.id) {
      await db.students.put(form);
      toast(t('common.saved'));
    } else {
      const module = form.module;
      const seq = students.length + 1;
      const mat = `${module === 'primary' ? 'P' : module === 'secondary' ? 'S' : 'U'}${new Date().getFullYear()}-${String(seq).padStart(4, '0')}`;
      await db.students.add({ ...form, matricule: mat, photoColor: form.photoColor || ['#1ea75f', '#24446b', '#f2a90f', '#0d9488', '#e11d48'][seq % 5] });
      toast(t('students.enrolledOk'));
    }
    setForm(null);
  };

  const remove = async (s: Student) => {
    await db.students.delete(s.id!);
    toast(t('common.deleted'));
  };

  const exportX = () => {
    exportExcel(
      filtered.map((s) => ({
        Matricule: s.matricule, Nom: s.lastName, Prénom: s.firstName, Sexe: s.gender,
        Naissance: s.birthDate, Classe: classes.find((c) => c.id === s.classId)?.name || '',
        Module: t(`module.${s.module}`), Tuteur: s.guardianName, Téléphone: s.guardianPhone,
        Statut: s.status, Solde: Q.studentBalance(s, classes.find((c) => c.id === s.classId), payments),
      })),
      'apprenants_ecolecrm'
    );
    toast('Export XLSX ✓');
  };

  const classOptions = classes
    .filter((c) => !moduleF || c.module === moduleF)
    .map((c) => ({ value: String(c.id), label: `${c.name} (${c.module === 'primary' ? 'P' : c.module === 'secondary' ? 'S' : 'U'})` }));

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={t('students.title')}
        sub={`${filtered.length} ${t('common.of')} ${students.length} · ${t('students.sub')}`}
        actions={
          <>
            <button className="btn btn-outline btn-md" onClick={exportX}><Download className="h-4 w-4" /> Excel</button>
            {canEdit && (
              <button className="btn btn-primary btn-md" onClick={() => setForm(emptyStudent(moduleF as ModuleKind || 'secondary'))}>
                <UserPlus className="h-4 w-4" /> {t('students.enroll')}
              </button>
            )}
          </>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label={t('students.status.active')} value={String(students.filter((s) => s.status === 'active').length)} icon={<GraduationCap className="h-4 w-4" />} accent />
        <StatCard label={t('module.primary')} value={String(students.filter((s) => s.module === 'primary').length)} icon={<GraduationCap className="h-4 w-4" />} />
        <StatCard label={t('module.secondary')} value={String(students.filter((s) => s.module === 'secondary').length)} icon={<GraduationCap className="h-4 w-4" />} />
        <StatCard label={t('module.university')} value={String(students.filter((s) => s.module === 'university').length)} icon={<GraduationCap className="h-4 w-4" />} />
      </div>

      {/* filters */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="col-span-2"><SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder={`${t('common.search')} — ${t('students.matricule')}, ${t('common.name')}…`} /></div>
        <Select value={moduleF} onChange={(v) => { setModuleF(v); setClassF(''); setPage(1); }} placeholder={t('dash.byModule')} options={[
          { value: 'primary', label: t('module.primary') }, { value: 'secondary', label: t('module.secondary') }, { value: 'university', label: t('module.university') },
        ]} />
        <Select value={classF} onChange={(v) => { setClassF(v); setPage(1); }} placeholder={t('common.class')} options={classOptions} />
      </div>

      {/* table */}
      <div className="card mt-3 overflow-hidden">
        {rows.length === 0 ? (
          <Empty title={t('common.empty')} desc={t('common.emptyDesc')} icon={<IdCard className="h-6 w-6" />} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="th">{t('common.name')}</th>
                    <th className="th">{t('students.matricule')}</th>
                    <th className="th">{t('common.class')}</th>
                    <th className="th">{t('students.guardian')}</th>
                    <th className="th">{t('students.balance')}</th>
                    <th className="th">{t('common.status')}</th>
                    <th className="th text-right">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s) => {
                    const cls = classes.find((c) => c.id === s.classId);
                    const balance = Q.studentBalance(s, cls, payments);
                    return (
                      <tr key={s.id} className="tr cursor-pointer" onClick={() => setDetail(s)}>
                        <td className="td">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={`${s.firstName} ${s.lastName}`} color={s.photoColor} size={32} />
                            <div>
                              <p className="text-[13px] font-semibold">{s.lastName.toUpperCase()} {s.firstName}</p>
                              <p className="text-[11px] text-muted-foreground">{s.gender === 'M' ? t('students.male') : t('students.female')} · {age(s.birthDate)} {lang === 'fr' ? 'ans' : 'yrs'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="td font-mono text-[12px] text-muted-foreground">{s.matricule}</td>
                        <td className="td">
                          <span className="badge border-border/60 bg-muted/60">{cls?.name || '—'}</span>
                        </td>
                        <td className="td">
                          <p className="text-[12.5px]">{s.guardianName}</p>
                          <p className="text-[11px] text-muted-foreground">{s.guardianPhone}</p>
                        </td>
                        <td className="td">
                          {balance > 0 ? <span className="font-semibold text-danger">{fmtMoney(balance)}</span> : <span className="font-semibold text-success">0</span>}
                        </td>
                        <td className="td"><Chip value={s.status} label={t(`students.status.${s.status}`)} /></td>
                        <td className="td">
                          <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            <button className="btn btn-ghost btn-sm px-1.5" onClick={() => setDetail(s)} title={t('common.details')}><Eye className="h-3.5 w-3.5" /></button>
                            {canEdit && <button className="btn btn-ghost btn-sm px-1.5" onClick={() => setForm(s)} title={t('common.edit')}><Pencil className="h-3.5 w-3.5" /></button>}
                            {user?.role === 'admin' && <button className="btn btn-ghost btn-sm px-1.5 text-danger" onClick={() => setDelTarget(s)} title={t('common.delete')}><Trash2 className="h-3.5 w-3.5" /></button>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="border-t border-border/60">
              <Pagination page={page} pages={pages} onPage={setPage} total={filtered.length} perPage={PER} />
            </div>
          </>
        )}
      </div>

      <p className="mt-2 text-[11.5px] text-muted-foreground">{t('students.importHint')}</p>

      {/* form modal */}
      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        wide
        title={form?.id ? `${t('common.edit')} — ${form.firstName}` : t('students.enroll')}
        footer={
          <>
            <button className="btn btn-outline btn-md" onClick={() => setForm(null)}>{t('common.cancel')}</button>
            <button className="btn btn-primary btn-md" onClick={save}>{t('common.save')}</button>
          </>
        }
      >
        {form && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t('students.firstName')} required>
              <input className="input" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            </Field>
            <Field label={t('students.lastName')} required>
              <input className="input" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            </Field>
            <Field label={t('students.gender')}>
              <Select value={form.gender} onChange={(v) => setForm({ ...form, gender: v as 'M' | 'F' })} options={[
                { value: 'M', label: t('students.male') }, { value: 'F', label: t('students.female') },
              ]} />
            </Field>
            <Field label={t('students.birthDate')}>
              <input type="date" className="input" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} />
            </Field>
            <Field label={t('students.birthPlace')}>
              <input className="input" value={form.birthPlace || ''} onChange={(e) => setForm({ ...form, birthPlace: e.target.value })} />
            </Field>
            <Field label={t('common.module')}>
              <Select value={form.module} onChange={(v) => setForm({ ...form, module: v as ModuleKind, classId: undefined })} options={[
                { value: 'primary', label: t('module.primary') }, { value: 'secondary', label: t('module.secondary') }, { value: 'university', label: t('module.university') },
              ]} />
            </Field>
            <Field label={t('common.class')}>
              <Select value={String(form.classId || '')} onChange={(v) => setForm({ ...form, classId: Number(v) || undefined })} placeholder={t('common.class')} options={classes.filter((c) => c.module === form.module).map((c) => ({ value: String(c.id), label: c.name }))} />
            </Field>
            <Field label={t('students.enrolled')}>
              <input type="date" className="input" value={form.enrolledAt} onChange={(e) => setForm({ ...form, enrolledAt: e.target.value })} />
            </Field>
            <Field label={t('students.guardian')} required>
              <input className="input" value={form.guardianName} onChange={(e) => setForm({ ...form, guardianName: e.target.value })} />
            </Field>
            <Field label={t('students.guardianPhone')} hint="Orange Money / Wave / MTN / Moov">
              <input className="input" placeholder="+221 …" value={form.guardianPhone} onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })} />
            </Field>
            <Field label={t('common.email')}>
              <input type="email" className="input" value={form.guardianEmail || ''} onChange={(e) => setForm({ ...form, guardianEmail: e.target.value })} />
            </Field>
            <Field label={t('students.address')}>
              <input className="input" value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </Field>
            <Field label={t('common.status')}>
              <Select value={form.status} onChange={(v) => setForm({ ...form, status: v as Student['status'] })} options={[
                { value: 'active', label: t('students.status.active') }, { value: 'inactive', label: t('students.status.inactive') },
                { value: 'graduated', label: t('students.status.graduated') }, { value: 'left', label: t('students.status.left') },
              ]} />
            </Field>
          </div>
        )}
      </Modal>

      {/* detail modal */}
      <StudentDetail student={detail} onClose={() => setDetail(null)} grades={grades} payments={payments} incidents={incidents} classes={classes} students={students} />

      <Confirm
        open={!!delTarget}
        onClose={() => setDelTarget(null)}
        onConfirm={() => delTarget && remove(delTarget)}
        title={t('common.confirmDelete')}
        message={`${delTarget?.lastName} ${delTarget?.firstName} — ${t('common.confirmDelete')}`}
      />
    </div>
  );
}

/* ---------------- Student detail ---------------- */
function StudentDetail({ student, onClose, grades, payments, incidents, classes, students }: {
  student: Student | null; onClose: () => void;
  grades: any[]; payments: any[]; incidents: any[]; classes: any[]; students: Student[];
}) {
  const { t, lang } = useI18n();
  const [tab, setTab] = useState('grades');
  const subjects = useLiveQuery(() => db.subjects.toArray(), []) || [];
  if (!student) return null;
  const subjName = (id: number) => subjects.find((s) => s.id === id)?.name || `#${id}`;
  const cls = classes.find((c) => c.id === student.classId);
  const myGrades = grades.filter((g) => g.studentId === student.id);
  const myPayments = payments.filter((p) => p.studentId === student.id).sort((a, b) => b.date.localeCompare(a.date));
  const myIncidents = incidents.filter((i) => i.studentId === student.id);
  const avg = Q.studentAverage(grades, student.id!);
  const ranking = cls ? Q.classRanking(students, grades, cls.id!) : [];
  const rank = ranking.findIndex((r) => r.student.id === student.id) + 1;
  const balance = Q.studentBalance(student, cls, payments);

  return (
    <Modal open={!!student} onClose={onClose} wide title={
      <span className="flex items-center gap-3">
        <Avatar name={`${student.firstName} ${student.lastName}`} color={student.photoColor} size={34} />
        <span>
          {student.lastName.toUpperCase()} {student.firstName}
          <span className="ml-2 font-mono text-[11px] font-normal text-muted-foreground">{student.matricule}</span>
        </span>
      </span>
    }>
      {/* info grid */}
      <div className="grid gap-3 text-[13px] sm:grid-cols-3">
        {[
          [t('common.class'), cls?.name || '—'],
          [t('common.module'), t(`module.${student.module}`)],
          [t('students.birthDate'), `${fmtDate(student.birthDate, lang)} (${age(student.birthDate)} ${lang === 'fr' ? 'ans' : 'yrs'})`],
          [t('students.birthPlace'), student.birthPlace || '—'],
          [t('students.guardian'), student.guardianName],
          [t('students.guardianPhone'), student.guardianPhone],
        ].map(([k, v], i) => (
          <div key={i} className="rounded-lg bg-muted/50 px-3 py-2">
            <p className="text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">{k}</p>
            <p className="mt-0.5 font-medium">{v}</p>
          </div>
        ))}
      </div>

      {/* key figures */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="card p-3 text-center">
          <p className="text-[10.5px] font-semibold uppercase text-muted-foreground">{t('common.average')}</p>
          <p className={`mt-1 text-xl font-extrabold ${(avg?.avg || 0) >= 10 ? 'text-success' : 'text-danger'}`}>{avg ? avg.avg.toFixed(2) : '—'}<span className="text-[11px] font-normal text-muted-foreground">/20</span></p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-[10.5px] font-semibold uppercase text-muted-foreground">{t('common.rank')}</p>
          <p className="mt-1 text-xl font-extrabold">{rank || '—'}<span className="text-[11px] font-normal text-muted-foreground">/{ranking.length}</span></p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-[10.5px] font-semibold uppercase text-muted-foreground">{t('students.balance')}</p>
          <p className={`mt-1 text-xl font-extrabold ${balance > 0 ? 'text-danger' : 'text-success'}`}>{balance > 0 ? `${fmtMoney(balance)}` : '✓'}</p>
        </div>
      </div>

      <Tabs
        className="mt-4"
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'grades', label: t('students.gradesTab'), count: myGrades.length },
          { id: 'payments', label: t('students.paymentsTab'), count: myPayments.length },
          { id: 'discipline', label: t('students.disciplineTab'), count: myIncidents.length },
        ]}
      />

      <div className="mt-3 max-h-72 overflow-y-auto rounded-lg border border-border/60">
        {tab === 'grades' && (myGrades.length ? (
          <table className="w-full">
            <thead><tr className="bg-muted/50"><th className="th">{t('academic.subject')}</th><th className="th">{t('academic.evaluation')}</th><th className="th">{t('common.amount')}</th></tr></thead>
            <tbody>
              {myGrades.slice(-20).reverse().map((g) => (
                <tr key={g.id} className="tr">
                  <td className="td">{subjName(g.subjectId)}</td>
                  <td className="td text-muted-foreground">{g.evaluation}</td>
                  <td className="td font-bold">{g.score}<span className="text-muted-foreground">/{g.maxScore}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <Empty title={t('academic.noGradesYet')} />)}

        {tab === 'payments' && (myPayments.length ? (
          <table className="w-full">
            <thead><tr className="bg-muted/50"><th className="th">{t('common.date')}</th><th className="th">{t('finance.category')}</th><th className="th">{t('common.amount')}</th><th className="th">{t('common.status')}</th></tr></thead>
            <tbody>
              {myPayments.map((p) => (
                <tr key={p.id} className="tr">
                  <td className="td">{fmtDate(p.date, lang)}</td>
                  <td className="td">{t(`finance.fee${p.category.charAt(0).toUpperCase()}${p.category.slice(1)}`).startsWith('finance.') ? p.category : t(`finance.fee${p.category.charAt(0).toUpperCase()}${p.category.slice(1)}`)}</td>
                  <td className="td font-bold">{fmtMoney(p.amount)}</td>
                  <td className="td"><Chip value={p.status} label={t(`finance.status.${p.status}`)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <Empty title={t('common.empty')} />)}

        {tab === 'discipline' && (myIncidents.length ? (
          <table className="w-full">
            <thead><tr className="bg-muted/50"><th className="th">{t('common.date')}</th><th className="th">{t('disc.incident')}</th><th className="th">{t('disc.sanction')}</th><th className="th">{t('common.status')}</th></tr></thead>
            <tbody>
              {myIncidents.map((i) => (
                <tr key={i.id} className="tr">
                  <td className="td">{fmtDate(i.date, lang)}</td>
                  <td className="td">
                    {t(`disc.type.${i.type}`)}
                    <Chip value={i.severity} label={t(`disc.severity.${i.severity}`)} />
                  </td>
                  <td className="td">{t(`disc.${i.sanction}`)}</td>
                  <td className="td"><Chip value={i.status} label={t(`disc.${i.status}`)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <Empty title={t('common.empty')} />)}
      </div>
    </Modal>
  );
}
