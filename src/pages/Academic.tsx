import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Plus, Pencil, Trash2, FileText, ClipboardList, CalendarCheck, Users,
  ChevronDown, Printer, Layers,
} from 'lucide-react';
import { db, type SchoolClass, type Subject, type Grade, type ModuleKind, defaultFeesFor } from '@/db/database';
import { useI18n } from '@/i18n/I18nContext';
import { useAuth } from '@/state/auth';
import { useToast } from '@/state/toast';
import { fmtMoney, fmtDate, today } from '@/utils/format';
import { schoolHeaderHtml, printHtml } from '@/utils/export';
import { PageHeader, Modal, Field, Select, Confirm, Tabs, Empty, StatCard, Chip, Progress, SearchInput } from '@/components/ui';
import * as Q from '@/db/queries';
import { DEFAULT_SCHOOL } from '@/db/seed';

export default function Academic() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();
  const location = useLocation() as any;

  const classes = useLiveQuery(() => db.classes.toArray(), []) || [];
  const subjects = useLiveQuery(() => db.subjects.toArray(), []) || [];
  const students = useLiveQuery(() => db.students.toArray(), []) || [];
  const grades = useLiveQuery(() => db.grades.toArray(), []) || [];
  const staff = useLiveQuery(() => db.staff.toArray(), []) || [];
  const attendance = useLiveQuery(() => db.attendance.toArray(), []) || [];

  const [tab, setTab] = useState('classes');
  const [editClass, setEditClass] = useState<SchoolClass | null>(null);
  const [editSubject, setEditSubject] = useState<Subject | null>(null);
  const [delTarget, setDelTarget] = useState<{ kind: string; item: any } | null>(null);
  const [q, setQ] = useState('');

  useEffect(() => { if (location?.state?.new) setTab('classes'); }, [location?.state]);

  const canManage = ['admin', 'director'].includes(user?.role || '');
  const canGrade = canManage || user?.role === 'teacher' || user?.role === 'censor';

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={t('academic.title')}
        sub={`${classes.length} ${t('academic.classes').toLowerCase()} · ${subjects.length} ${t('academic.subjects').toLowerCase()} · ${students.length} ${t('nav.students').toLowerCase()}`}
        actions={
          tab === 'classes' && canManage ? (
            <button className="btn btn-primary btn-md" onClick={() => setEditClass({ name: '', level: '', module: 'primary', capacity: 30, fees: defaultFeesFor('primary') })}>
              <Plus className="h-4 w-4" /> {t('academic.newClass')}
            </button>
          ) : tab === 'subjects' && canManage ? (
            <button className="btn btn-primary btn-md" onClick={() => setEditSubject({ name: '', code: '', module: 'primary', coefficient: 1, maxScore: 10 })}>
              <Plus className="h-4 w-4" /> {t('academic.newSubject')}
            </button>
          ) : undefined
        }
      />

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'classes', label: t('academic.classes'), count: classes.length },
          { id: 'subjects', label: t('academic.subjects'), count: subjects.length },
          ...(canGrade ? [{ id: 'grades', label: t('academic.grades') }] : []),
          { id: 'bulletins', label: t('academic.bulletins') },
          { id: 'attendance', label: t('academic.attendance') },
        ]}
      />

      <div className="mt-4">
        {tab === 'classes' && (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {classes
              .filter((c) => !q || c.name.toLowerCase().includes(q.toLowerCase()))
              .map((c) => {
                const n = students.filter((s) => s.classId === c.id).length;
                const avg = Q.classAverage(students, grades, c.id!);
                const fill = (n / Math.max(1, c.capacity)) * 100;
                return (
                  <div key={c.id} className="card p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-[15px] font-bold">{c.name}</h3>
                          <span className="chip bg-primary/10 text-primary">{t(`module.${c.module}`)}</span>
                        </div>
                        <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                          {c.room} · {t('academic.mainTeacher')}: {staff.find((s) => s.id === c.mainTeacherId)?.name || '—'}
                        </p>
                      </div>
                      {canManage && (
                        <div className="flex gap-1">
                          <button className="btn btn-ghost btn-sm px-1.5" onClick={() => setEditClass(c)}><Pencil className="h-3.5 w-3.5" /></button>
                          {user?.role === 'admin' && <button className="btn btn-ghost btn-sm px-1.5 text-danger" onClick={() => setDelTarget({ kind: 'classes', item: c })}><Trash2 className="h-3.5 w-3.5" /></button>}
                        </div>
                      )}
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-lg bg-muted/60 px-2 py-1.5">
                        <p className="text-[10px] font-semibold uppercase text-muted-foreground">{t('dash.students')}</p>
                        <p className="text-[15px] font-extrabold">{n}<span className="text-[10px] font-normal text-muted-foreground">/{c.capacity}</span></p>
                      </div>
                      <div className="rounded-lg bg-muted/60 px-2 py-1.5">
                        <p className="text-[10px] font-semibold uppercase text-muted-foreground">{t('common.average')}</p>
                        <p className={`text-[15px] font-extrabold ${avg >= 10 ? 'text-success' : 'text-danger'}`}>{avg.toFixed(1)}</p>
                      </div>
                      <div className="rounded-lg bg-muted/60 px-2 py-1.5">
                        <p className="text-[10px] font-semibold uppercase text-muted-foreground">{t('finance.feeScolarite')}</p>
                        <p className="text-[13px] font-extrabold">{fmtMoney(c.fees.scolarite)}</p>
                      </div>
                    </div>
                    <Progress value={fill} className="mt-3 h-1.5" barClass={fill > 95 ? 'bg-danger' : fill > 80 ? 'bg-warn' : 'bg-success'} />
                  </div>
                );
              })}
            <div className="pt-1"><SearchInput value={q} onChange={setQ} placeholder={t('common.search')} /></div>
          </div>
        )}

        {tab === 'subjects' && (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="th">{t('academic.subject')}</th>
                    <th className="th">{t('common.module')}</th>
                    <th className="th">{t('academic.coefficient')}</th>
                    <th className="th">{t('academic.maxScore')}</th>
                    <th className="th">{t('nav.staff')}</th>
                    {canManage && <th className="th text-right">{t('common.actions')}</th>}
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((s) => (
                    <tr key={s.id} className="tr">
                      <td className="td">
                        <span className="font-semibold">{s.name}</span>
                        <span className="ml-2 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">{s.code}</span>
                      </td>
                      <td className="td"><Chip value={s.module} label={t(`module.${s.module}`)} /></td>
                      <td className="td font-bold">×{s.coefficient}</td>
                      <td className="td">/{s.maxScore}</td>
                      <td className="td text-muted-foreground">{staff.find((x) => x.id === s.teacherId)?.name || '—'}</td>
                      {canManage && (
                        <td className="td">
                          <div className="flex justify-end gap-1">
                            <button className="btn btn-ghost btn-sm px-1.5" onClick={() => setEditSubject(s)}><Pencil className="h-3.5 w-3.5" /></button>
                            {user?.role === 'admin' && <button className="btn btn-ghost btn-sm px-1.5 text-danger" onClick={() => setDelTarget({ kind: 'subjects', item: s })}><Trash2 className="h-3.5 w-3.5" /></button>}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'grades' && <GradeEntry classes={classes} subjects={subjects} students={students} grades={grades} user={user} />}

        {tab === 'bulletins' && <Bulletins classes={classes} students={students} grades={grades} subjects={subjects} />}

        {tab === 'attendance' && (
          <AttendancePanel classes={classes} students={students} attendance={attendance} />
        )}
      </div>

      {/* Class modal */}
      <Modal
        open={!!editClass}
        onClose={() => setEditClass(null)}
        title={editClass?.id ? `${t('common.edit')} — ${editClass.name}` : t('academic.newClass')}
        footer={
          <>
            <button className="btn btn-outline btn-md" onClick={() => setEditClass(null)}>{t('common.cancel')}</button>
            <button className="btn btn-primary btn-md" onClick={async () => {
              if (!editClass?.name) return toast(t('common.required'), 'error');
              if (editClass.id) { await db.classes.put(editClass); } else { await db.classes.add(editClass); }
              toast(t('common.saved')); setEditClass(null);
            }}>{t('common.save')}</button>
          </>
        }
      >
        {editClass && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t('common.name')} required>
              <input className="input" value={editClass.name} onChange={(e) => setEditClass({ ...editClass, name: e.target.value })} placeholder="6ème B" />
            </Field>
            <Field label={t('academic.level')}>
              <input className="input" value={editClass.level} onChange={(e) => setEditClass({ ...editClass, level: e.target.value })} placeholder="6ème" />
            </Field>
            <Field label={t('common.module')}>
              <Select value={editClass.module} onChange={(v) => setEditClass({ ...editClass, module: v as ModuleKind, fees: defaultFeesFor(v as ModuleKind) })} options={[
                { value: 'primary', label: t('module.primary') }, { value: 'secondary', label: t('module.secondary') }, { value: 'university', label: t('module.university') },
              ]} />
            </Field>
            <Field label={t('academic.capacity')}>
              <input type="number" className="input" value={editClass.capacity} onChange={(e) => setEditClass({ ...editClass, capacity: Number(e.target.value) })} />
            </Field>
            <Field label={`${t('finance.feeInscription')} (FCFA)`}>
              <input type="number" className="input" value={editClass.fees.inscription} onChange={(e) => setEditClass({ ...editClass, fees: { ...editClass.fees, inscription: Number(e.target.value) } })} />
            </Field>
            <Field label={`${t('finance.feeScolarite')} (FCFA)`}>
              <input type="number" className="input" value={editClass.fees.scolarite} onChange={(e) => setEditClass({ ...editClass, fees: { ...editClass.fees, scolarite: Number(e.target.value) } })} />
            </Field>
          </div>
        )}
      </Modal>

      {/* Subject modal */}
      <Modal
        open={!!editSubject}
        onClose={() => setEditSubject(null)}
        title={editSubject?.id ? `${t('common.edit')} — ${editSubject.name}` : t('academic.newSubject')}
        footer={
          <>
            <button className="btn btn-outline btn-md" onClick={() => setEditSubject(null)}>{t('common.cancel')}</button>
            <button className="btn btn-primary btn-md" onClick={async () => {
              if (!editSubject?.name) return toast(t('common.required'), 'error');
              if (editSubject.id) { await db.subjects.put(editSubject); } else { await db.subjects.add(editSubject); }
              toast(t('common.saved')); setEditSubject(null);
            }}>{t('common.save')}</button>
          </>
        }
      >
        {editSubject && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t('academic.subject')} required>
              <input className="input" value={editSubject.name} onChange={(e) => setEditSubject({ ...editSubject, name: e.target.value })} />
            </Field>
            <Field label="Code">
              <input className="input" value={editSubject.code} onChange={(e) => setEditSubject({ ...editSubject, code: e.target.value.toUpperCase() })} />
            </Field>
            <Field label={t('common.module')}>
              <Select value={editSubject.module} onChange={(v) => setEditSubject({ ...editSubject, module: v as ModuleKind, maxScore: v === 'primary' ? 10 : 20 })} options={[
                { value: 'primary', label: t('module.primary') }, { value: 'secondary', label: t('module.secondary') }, { value: 'university', label: t('module.university') },
              ]} />
            </Field>
            <Field label={t('academic.coefficient')}>
              <input type="number" min={1} max={6} className="input" value={editSubject.coefficient} onChange={(e) => setEditSubject({ ...editSubject, coefficient: Number(e.target.value) })} />
            </Field>
            <Field label={`${t('academic.maxScore')} (10 ou 20)`}>
              <Select value={String(editSubject.maxScore)} onChange={(v) => setEditSubject({ ...editSubject, maxScore: Number(v) })} options={[{ value: 10, label: '/10' }, { value: 20, label: '/20' }]} />
            </Field>
            <Field label={t('nav.staff')}>
              <Select value={String(editSubject.teacherId || '')} onChange={(v) => setEditSubject({ ...editSubject, teacherId: Number(v) || undefined })} placeholder="—" options={staff.filter((s) => s.role === 'teacher').map((s) => ({ value: String(s.id), label: s.name }))} />
            </Field>
          </div>
        )}
      </Modal>

      <Confirm
        open={!!delTarget}
        onClose={() => setDelTarget(null)}
        onConfirm={async () => {
          if (!delTarget) return;
          await (db as any)[delTarget.kind].delete(delTarget.item.id);
          toast(t('common.deleted'));
        }}
        title={t('common.confirmDelete')}
        message={String(delTarget?.item?.name || '')}
      />
    </div>
  );
}

/* ================= Grade entry ================= */
function GradeEntry({ classes, subjects, students, grades, user }: {
  classes: SchoolClass[]; subjects: Subject[]; students: any[]; grades: Grade[]; user: any;
}) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [term, setTerm] = useState('1');
  const [evaluation, setEvaluation] = useState('Devoir 1');
  const [scores, setScores] = useState<Record<number, string>>({});

  const teacherSubjects = user?.role === 'teacher' ? subjects : subjects;
  const clsSubjects = subjects.filter((s) => (classes.find((c) => c.id === Number(classId))?.module === s.module));
  const roster = students.filter((s) => s.classId === Number(classId)).sort((a, b) => a.lastName.localeCompare(b.lastName));
  const maxScore = subjects.find((s) => s.id === Number(subjectId))?.maxScore || 20;

  const saveAll = async () => {
    const cid = Number(classId), sid = Number(subjectId);
    const subject = subjects.find((s) => s.id === sid);
    if (!cid || !sid || !subject) return toast(t('common.required'), 'error');
    const entries = Object.entries(scores).filter(([, v]) => v !== '');
    if (!entries.length) return toast(t('common.required'), 'error');
    await db.grades.bulkAdd(entries.map(([studentId, v]) => ({
      studentId: Number(studentId), subjectId: sid, classId: cid, term: Number(term) as 1 | 2 | 3,
      evaluation, score: Math.min(maxScore, Number(v)), maxScore: subject.maxScore,
      coefficient: subject.coefficient, date: today(), teacherId: subject.teacherId,
    })));
    setScores({});
    toast(`${entries.length} ${t('academic.grades').toLowerCase()} ✓`);
  };

  const existing = useMemo(() => {
    const cid = Number(classId), sid = Number(subjectId);
    if (!cid || !sid) return {};
    const map: Record<number, number> = {};
    grades.filter((g) => g.classId === cid && g.subjectId === sid && g.term === Number(term) && g.evaluation === evaluation)
      .forEach((g) => { map[g.studentId] = g.score; });
    return map;
  }, [classId, subjectId, term, evaluation, grades]);

  return (
    <div>
      <div className="card grid gap-2 p-4 sm:grid-cols-5">
        <Field label={t('common.class')}>
          <Select value={classId} onChange={setClassId} placeholder="—" options={classes.map((c) => ({ value: String(c.id), label: c.name }))} />
        </Field>
        <Field label={t('academic.subject')}>
          <Select value={subjectId} onChange={setSubjectId} placeholder="—" options={clsSubjects.map((s) => ({ value: String(s.id), label: s.name }))} />
        </Field>
        <Field label={t('academic.term')}>
          <Select value={term} onChange={setTerm} options={[{ value: '1', label: t('academic.term1') }, { value: '2', label: t('academic.term2') }, { value: '3', label: t('academic.term3') }]} />
        </Field>
        <Field label={t('academic.evaluation')}>
          <Select value={evaluation} onChange={setEvaluation} options={['Devoir 1', 'Devoir 2', 'Composition', 'Examen', 'TP'].map((x) => ({ value: x, label: x }))} />
        </Field>
        <div className="flex items-end">
          <button className="btn btn-primary btn-md w-full" onClick={saveAll} disabled={!classId || !subjectId}>
            <ClipboardList className="h-4 w-4" /> {t('common.save')}
          </button>
        </div>
      </div>

      {!classId || !subjectId ? (
        <div className="card mt-3"><Empty title={t('academic.enterGrades')} desc={`${t('common.class')} + ${t('academic.subject')}`} icon={<Layers className="h-6 w-6" />} /></div>
      ) : (
        <div className="card mt-3 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="bg-muted/50">
                  <th className="th">#</th>
                  <th className="th">{t('students.name')}</th>
                  <th className="th">{t('academic.evaluation')} <span className="normal-case text-[10px]">(/ {maxScore})</span></th>
                  <th className="th">{t('common.average')}</th>
                </tr>
              </thead>
              <tbody>
                {roster.map((s, i) => {
                  const avg = Q.studentAverage(grades, s.id);
                  return (
                    <tr key={s.id} className="tr">
                      <td className="td text-muted-foreground">{i + 1}</td>
                      <td className="td font-medium">{s.lastName.toUpperCase()} {s.firstName}</td>
                      <td className="td w-32">
                        <input
                          type="number" min={0} max={maxScore} step={0.25}
                          className="input h-8 w-24"
                          placeholder={String(existing[s.id] ?? '')}
                          value={scores[s.id] ?? ''}
                          onChange={(e) => setScores({ ...scores, [s.id]: e.target.value })}
                        />
                      </td>
                      <td className="td">
                        {avg ? <span className={`font-bold ${avg.avg >= 10 ? 'text-success' : 'text-danger'}`}>{avg.avg.toFixed(2)}</span> : <span className="text-muted-foreground">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="border-t border-border/60 px-4 py-2 text-[11px] text-muted-foreground">
            {teacherSubjects.length} {t('academic.subjects').toLowerCase()} · {roster.length} {t('nav.students').toLowerCase()}
          </p>
        </div>
      )}
    </div>
  );
}

/* ================= Bulletins ================= */
function Bulletins({ classes, students, grades, subjects }: {
  classes: SchoolClass[]; students: any[]; grades: Grade[]; subjects: Subject[];
}) {
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const [classId, setClassId] = useState('');
  const [term, setTerm] = useState('1');

  const ranking = classId ? Q.classRanking(students, grades, Number(classId), Number(term)) : [];

  const printBulletin = (row: any) => {
    const s = row.student;
    const cls = classes.find((c) => c.id === s.classId);
    const bySubject: Record<number, { scores: number[]; max: number; coef: number }> = {};
    grades.filter((g) => g.studentId === s.id && g.term === Number(term)).forEach((g) => {
      const b = (bySubject[g.subjectId] ??= { scores: [], max: g.maxScore, coef: g.coefficient });
      b.scores.push(g.score);
    });
    const rowsHtml = Object.entries(bySubject).map(([sid, b]) => {
      const subj = subjects.find((x) => x.id === Number(sid));
      const avg = b.scores.reduce((a, x) => a + x, 0) / b.scores.length;
      const on20 = avg * (20 / b.max);
      return `<tr>
        <td>${subj?.name || sid}</td>
        <td class="right">${b.coef}</td>
        <td class="right">${b.scores.map((x) => x.toFixed(0)).join(' · ')}</td>
        <td class="right"><b>${(avg * (20 / b.max)).toFixed(2)}</b> / 20</td>
        <td class="right">${on20 * b.coef > 14 ? 'Très bien' : on20 * b.coef > 12 ? 'Bien' : on20 * b.coef >= 10 ? 'Passable' : 'Insuffisant'}</td>
      </tr>`;
    }).join('');
    const decision = row.avg >= 10 ? t('academic.passed') : row.avg >= 8.5 ? t('academic.warning') : t('academic.repeat');
    const appr = row.avg >= 16 ? t('academic.exc') : row.avg >= 14 ? t('academic.vgood') : row.avg >= 12 ? t('academic.good') : row.avg >= 10 ? t('academic.avg') : t('academic.insuf');

    printHtml(t('academic.bulletinFor'), `
      ${schoolHeaderHtml(DEFAULT_SCHOOL, `<div style="text-align:right"><span class="badge">${t('academic.term')} ${term}</span><br><span class="muted">${fmtDate(new Date().toISOString(), lang)}</span></div>`)}
      <h2>${t('academic.bulletinFor')} : ${s.lastName.toUpperCase()} ${s.firstName}</h2>
      <div class="grid2">
        <p><b>${t('students.matricule')} :</b> ${s.matricule}</p>
        <p><b>${t('common.class')} :</b> ${cls?.name || ''}</p>
        <p><b>${t('common.module')} :</b> ${t(`module.${s.module}`)}</p>
        <p><b>${t('academic.avgClass')} :</b> ${Q.classAverage(students, grades, s.classId, Number(term)).toFixed(2)} / 20</p>
      </div>
      <table>
        <thead><tr><th>${t('academic.subject')}</th><th class="right">${t('academic.coefficient')}</th><th class="right">${t('academic.grades')}</th><th class="right">Moy. /20</th><th class="right">${t('academic.appreciation')}</th></tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
      <div class="total-box">${t('common.average')} : ${row.avg.toFixed(2)} / 20 — ${t('common.rank')} ${row.rank}/${ranking.length}</div>
      <p style="margin-top:14px"><span class="badge">${t('academic.decision')} : <b>${decision}</b></span> <span class="badge">${t('academic.appreciation')} : <b>${appr}</b></span></p>
      <div class="stamp">
        <div class="sign">${t('academic.mainTeacher')}</div>
        <div class="sign">${t('role.director')}</div>
      </div>
      <div class="footer"><span>EcoleCRM · ${DEFAULT_SCHOOL.name}</span><span>FCFA (XOF) · UEMOA</span></div>
    `);
    toast('PDF ✓');
  };

  const printAll = () => {
    toast(`${ranking.length} bulletins — ${t('common.print')}…`);
    ranking.slice(0, 1).forEach((row, i) => setTimeout(() => printBulletin(row), i * 350));
  };

  return (
    <div>
      <div className="card grid gap-2 p-4 sm:grid-cols-3">
        <Field label={t('common.class')}>
          <Select value={classId} onChange={setClassId} placeholder="—" options={classes.map((c) => ({ value: String(c.id), label: c.name }))} />
        </Field>
        <Field label={t('academic.term')}>
          <Select value={term} onChange={setTerm} options={[{ value: '1', label: t('academic.term1') }, { value: '2', label: t('academic.term2') }, { value: '3', label: t('academic.term3') }]} />
        </Field>
        <div className="flex items-end">
          <button className="btn btn-primary btn-md w-full" onClick={printAll} disabled={!classId || !ranking.length}>
            <Printer className="h-4 w-4" /> {t('academic.generateBulletin')} ({ranking.length})
          </button>
        </div>
      </div>

      {!classId ? (
        <div className="card mt-3"><Empty title={t('academic.bulletins')} desc={t('common.class')} icon={<FileText className="h-6 w-6" />} /></div>
      ) : (
        <div className="card mt-3 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px]">
              <thead>
                <tr className="bg-muted/50">
                  <th className="th">{t('common.rank')}</th>
                  <th className="th">{t('students.name')}</th>
                  <th className="th">{t('common.average')}</th>
                  <th className="th">{t('academic.appreciation')}</th>
                  <th className="th">{t('academic.decision')}</th>
                  <th className="th text-right">{t('common.print')}</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((row) => (
                  <tr key={row.student.id} className="tr">
                    <td className="td font-bold">{row.rank}</td>
                    <td className="td font-medium">{row.student.lastName.toUpperCase()} {row.student.firstName}</td>
                    <td className="td">
                      <span className={`font-extrabold ${row.avg >= 10 ? 'text-success' : row.avg >= 8.5 ? 'text-warn' : 'text-danger'}`}>{row.avg.toFixed(2)}</span>
                      <span className="text-muted-foreground">/20</span>
                    </td>
                    <td className="td text-muted-foreground">
                      {row.avg >= 16 ? t('academic.exc') : row.avg >= 14 ? t('academic.vgood') : row.avg >= 12 ? t('academic.good') : row.avg >= 10 ? t('academic.avg') : t('academic.insuf')}
                    </td>
                    <td className="td">
                      <Chip value={row.avg >= 10 ? 'paid' : row.avg >= 8.5 ? 'pending' : 'failed'} label={row.avg >= 10 ? t('academic.passed') : row.avg >= 8.5 ? t('academic.warning') : t('academic.repeat')} />
                    </td>
                    <td className="td text-right">
                      <button className="btn btn-outline btn-sm" onClick={() => printBulletin(row)}><Printer className="h-3.5 w-3.5" /> PDF</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= Attendance ================= */
function AttendancePanel({ classes, students, attendance }: {
  classes: SchoolClass[]; students: any[]; attendance: any[];
}) {
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const [classId, setClassId] = useState('');
  const [date, setDate] = useState(today());
  const [marks, setMarks] = useState<Record<number, 'present' | 'absent' | 'late'>>({});

  const roster = students.filter((s) => s.classId === Number(classId)).sort((a, b) => a.lastName.localeCompare(b.lastName));

  const existingToday = useMemo(() => {
    const map: Record<number, string> = {};
    attendance.filter((a) => a.classId === Number(classId) && a.date === date).forEach((a) => { map[a.studentId] = a.status; });
    return map;
  }, [attendance, classId, date]);

  const save = async () => {
    const cid = Number(classId);
    if (!cid) return;
    const entries = Object.entries(marks);
    if (!entries.length) return toast(t('common.required'), 'error');
    await db.attendance.bulkAdd(entries.map(([sid, status]) => ({ studentId: Number(sid), classId: cid, date, status })));
    setMarks({});
    toast(`${entries.length} ✓`);
  };

  const recent = useMemo(
    () => [...attendance].filter((a) => a.status !== 'present').sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30),
    [attendance]
  );

  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
      <div>
        <div className="card grid gap-2 p-4 sm:grid-cols-2">
          <Field label={t('common.class')}>
            <Select value={classId} onChange={setClassId} placeholder="—" options={classes.map((c) => ({ value: String(c.id), label: c.name }))} />
          </Field>
          <Field label={t('common.date')}>
            <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>
        {!classId ? (
          <div className="card mt-3"><Empty title={t('academic.markAttendance')} icon={<CalendarCheck className="h-6 w-6" />} /></div>
        ) : (
          <div className="card mt-3 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3">
              <p className="text-[13px] font-bold">{roster.length} {t('nav.students').toLowerCase()}</p>
              <button className="btn btn-primary btn-sm" onClick={save}><CalendarCheck className="h-3.5 w-3.5" /> {t('common.save')}</button>
            </div>
            <div className="max-h-[430px] overflow-y-auto border-t border-border/60">
              {roster.map((s) => {
                const cur = marks[s.id] ?? (existingToday[s.id] as any) ?? 'present';
                const set = (v: 'present' | 'absent' | 'late') => setMarks({ ...marks, [s.id]: v });
                return (
                  <div key={s.id} className="flex items-center justify-between gap-2 border-b border-border/50 px-4 py-2 last:border-0">
                    <p className="text-[13px] font-medium">{s.lastName.toUpperCase()} {s.firstName}</p>
                    <div className="flex gap-1">
                      {(['present', 'late', 'absent'] as const).map((v) => (
                        <button
                          key={v}
                          onClick={() => set(v)}
                          className={`rounded-full px-2.5 py-1 text-[10.5px] font-bold transition ${
                            cur === v
                              ? v === 'present' ? 'bg-success text-white' : v === 'late' ? 'bg-warn text-black' : 'bg-danger text-white'
                              : 'bg-muted text-muted-foreground hover:bg-muted/70'
                          }`}
                        >
                          {t(`academic.${v}`)}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="card overflow-hidden self-start">
        <div className="px-4 py-3.5">
          <h3 className="text-[14px] font-bold">{t('dash.absences')} — {t('common.recent')}</h3>
        </div>
        <div className="max-h-[520px] overflow-y-auto border-t border-border/60">
          {recent.map((a) => {
            const s = students.find((x) => x.id === a.studentId);
            const c = classes.find((x) => x.id === a.classId);
            return (
              <div key={a.id} className="flex items-center gap-3 border-b border-border/50 px-4 py-2.5 last:border-0">
                <span className={`h-2 w-2 shrink-0 rounded-full ${a.status === 'absent' ? 'bg-danger' : 'bg-warn'}`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-semibold">{s ? `${s.lastName.toUpperCase()} ${s.firstName}` : '—'}</p>
                  <p className="text-[10.5px] text-muted-foreground">{c?.name} · {fmtDate(a.date, lang)}</p>
                </div>
                <Chip value={a.status} label={t(`academic.${a.status}`)} />
              </div>
            );
          })}
          {!recent.length && <Empty title={t('common.empty')} />}
        </div>
      </div>
    </div>
  );
}
