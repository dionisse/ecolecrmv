import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { BookOpenCheck, CalendarCheck, ClipboardList, Users, ChevronRight } from 'lucide-react';
import { db } from '@/db/database';
import { useI18n } from '@/i18n/I18nContext';
import { useAuth } from '@/state/auth';
import { fmtDate, today } from '@/utils/format';
import { PageHeader, StatCard, Avatar, Progress, Chip, Empty } from '@/components/ui';
import * as Q from '@/db/queries';

/** Teacher portal: my classes, my subjects, grading shortcuts, today's sessions */
export default function Teaching() {
  const { t, lang } = useI18n();
  const { user } = useAuth();

  const staffMember = useLiveQuery(async () => {
    if (!user) return null;
    const all = await db.staff.toArray();
    if (user.staffId) {
      const found = all.find((s) => String(s.id) === user.staffId);
      if (found) return found;
    }
    // Fallback for accounts without a staff link: match by full name
    return all.find((s) => s.name === user.name && s.role === 'teacher') || null;
  }, [user?.email, user?.name]);

  const subjects = useLiveQuery(() => db.subjects.toArray(), []) || [];
  const classes = useLiveQuery(() => db.classes.toArray(), []) || [];
  const students = useLiveQuery(() => db.students.toArray(), []) || [];
  const grades = useLiveQuery(() => db.grades.toArray(), []) || [];
  const attendance = useLiveQuery(() => db.attendance.toArray(), []) || [];

  const mySubjects = useMemo(
    () => subjects.filter((s) => (staffMember ? s.teacherId === staffMember.id : true)),
    [subjects, staffMember]
  );
  const myClassIds = useMemo(() => new Set(mySubjects.map((s) => s.classIds || []).flat().concat(classes.filter((c) => c.mainTeacherId === staffMember?.id).map((c) => c.id!))), [mySubjects, classes, staffMember]);
  const myClasses = classes.filter((c) => myClassIds.has(c.id!) || c.module === mySubjects[0]?.module);

  const todayIso = today();
  const recentAbs = useMemo(
    () => attendance.filter((a) => a.date === todayIso && a.status !== 'present'),
    [attendance, todayIso]
  );

  // pseudo schedule derived deterministically from class ids
  const schedule = useMemo(() => {
    const days = lang === 'fr' ? ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const slots = ['08:00 – 10:00', '10:15 – 12:15', '13:00 – 15:00', '15:15 – 17:15'];
    const dayIdx = Math.min(4, (new Date().getDay() + 6) % 7);
    return {
      day: days[dayIdx],
      items: slots.map((time, i) => {
        const cls = myClasses[(i + dayIdx) % Math.max(1, myClasses.length)];
        const subj = mySubjects[i % Math.max(1, mySubjects.length)];
        return { time, cls, subj };
      }).filter((x) => x.cls && x.subj),
    };
  }, [myClasses, mySubjects, lang]);

  const toGrade = useMemo(() => mySubjects.length * 2, [mySubjects]);

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={t('portal.teacher')}
        sub={staffMember ? `${staffMember.name} · ${staffMember.speciality || staffMember.diploma || ''}` : user?.name || ''}
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label={t('nav.myClasses')} value={String(myClasses.length)} icon={<BookOpenCheck className="h-4 w-4" />} accent />
        <StatCard label={t('academic.subjects')} value={String(mySubjects.length)} icon={<ClipboardList className="h-4 w-4" />} />
        <StatCard label={t('dash.students')} value={String(new Set(myClasses.flatMap((c) => students.filter((s) => s.classId === c.id).map((s) => s.id!))).size)} icon={<Users className="h-4 w-4" />} />
        <StatCard label={t('dash.toGrade')} value={String(toGrade)} icon={<ClipboardList className="h-4 w-4" />} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        {/* today schedule */}
        <div className="card overflow-hidden xl:col-span-2">
          <div className="flex items-center justify-between px-4 py-3.5">
            <h3 className="text-[14px] font-bold">{t('dash.mySchedule')}</h3>
            <span className="badge border-primary/30 bg-primary/10 text-primary">{schedule.day}</span>
          </div>
          <div className="border-t border-border/60">
            {schedule.items.map((x, i) => {
              const roster = students.filter((s) => s.classId === x.cls.id);
              return (
                <div key={i} className="flex items-center gap-3 border-b border-border/50 px-4 py-3 last:border-0">
                  <span className="w-24 shrink-0 rounded-lg bg-muted/70 px-2 py-1.5 text-center text-[11px] font-bold">{x.time}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold">{x.subj.name}</p>
                    <p className="text-[11px] text-muted-foreground">{x.cls.name} · {x.cls.room} · {roster.length} {t('nav.students').toLowerCase()}</p>
                  </div>
                  <Link to="/app/academic" className="btn btn-outline btn-sm">
                    <CalendarCheck className="h-3.5 w-3.5" /> {t('academic.attendance')}
                  </Link>
                </div>
              );
            })}
            {!schedule.items.length && <Empty title={t('common.empty')} />}
          </div>
        </div>

        {/* absences today */}
        <div className="card overflow-hidden self-start">
          <div className="px-4 py-3.5">
            <h3 className="text-[14px] font-bold">{t('dash.absences')} — {t('dash.dueToday')}</h3>
          </div>
          <div className="max-h-72 overflow-y-auto border-t border-border/60">
            {recentAbs.map((a) => {
              const s = students.find((x) => x.id === a.studentId);
              return (
                <div key={a.id} className="flex items-center gap-3 border-b border-border/50 px-4 py-2.5 last:border-0">
                  <Avatar name={`${s?.firstName || ''} ${s?.lastName || ''}`} color={s?.photoColor} size={30} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-semibold">{Q.fullName(s)}</p>
                    <p className="text-[10.5px] text-muted-foreground">{classes.find((c) => c.id === a.classId)?.name}</p>
                  </div>
                  <Chip value={a.status} label={t(`academic.${a.status}`)} />
                </div>
              );
            })}
            {!recentAbs.length && <Empty title={lang === 'fr' ? 'Aucune absence aujourd’hui ✓' : 'No absences today ✓'} desc={t('common.empty')} />}
          </div>
        </div>
      </div>

      {/* my classes grid */}
      <h3 className="mb-3 mt-5 text-[13px] font-bold uppercase tracking-wide text-muted-foreground">{t('nav.myClasses')}</h3>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {myClasses.map((c) => {
          const roster = students.filter((s) => s.classId === c.id);
          const avg = Q.classAverage(students, grades, c.id!);
          const att = Q.attendanceRate(attendance, c.id!);
          return (
            <div key={c.id} className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[14.5px] font-bold">{c.name}</p>
                  <p className="text-[11px] text-muted-foreground">{c.room} · {t(`module.${c.module}`)}</p>
                </div>
                <span className={`text-[15px] font-extrabold ${avg >= 10 ? 'text-success' : 'text-danger'}`}>{avg.toFixed(1)}</span>
              </div>
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-[11px]">
                  <span className="text-muted-foreground">{roster.length} / {c.capacity}</span>
                  <span className="text-muted-foreground">{t('staff.attendanceRate')}: {att.rate}%</span>
                </div>
                <Progress value={(roster.length / Math.max(1, c.capacity)) * 100} barClass="bg-primary" />
              </div>
              <div className="mt-3 flex gap-2">
                <Link to="/app/academic" className="btn btn-outline btn-sm flex-1"><ClipboardList className="h-3.5 w-3.5" /> {t('academic.grades')}</Link>
                <Link to="/app/students" className="btn btn-outline btn-sm flex-1">{t('nav.students')} <ChevronRight className="h-3.5 w-3.5" /></Link>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-[11.5px] text-muted-foreground">
        {t('common.date')}: {fmtDate(todayIso, lang)}
      </p>
    </div>
  );
}
