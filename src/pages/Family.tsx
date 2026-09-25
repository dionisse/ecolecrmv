import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { GraduationCap, Wallet, CalendarClock, BellRing, FileText } from 'lucide-react';
import { db } from '@/db/database';
import { useI18n } from '@/i18n/I18nContext';
import { useAuth } from '@/state/auth';
import { fmtDate, fmtMoney } from '@/utils/format';
import { PageHeader, StatCard, Avatar, Chip, Progress, Empty } from '@/components/ui';
import * as Q from '@/db/queries';

/** Parent portal: children overview — grades, balance, absences, messages */
export default function Family() {
  const { t, lang } = useI18n();
  const { user } = useAuth();

  const children = useLiveQuery(async () => {
    if (!user) return [];
    const u = await db.users.where('email').equals(user.email).first();
    const ids = (u?.childIds || []).map(Number);
    return db.students.filter((s) => ids.includes(s.id!)).toArray();
  }, [user?.email]) || [];

  const classes = useLiveQuery(() => db.classes.toArray(), []) || [];
  const students = useLiveQuery(() => db.students.toArray(), []) || [];
  const grades = useLiveQuery(() => db.grades.toArray(), []) || [];
  const payments = useLiveQuery(() => db.payments.toArray(), []) || [];
  const incidents = useLiveQuery(() => db.incidents.toArray(), []) || [];
  const attendance = useLiveQuery(() => db.attendance.toArray(), []) || [];
  const messages = useLiveQuery(() => db.messages.orderBy('date').reverse().limit(5).toArray(), []) || [];

  const totalBalance = useMemo(
    () => children.reduce((a, s) => a + Q.studentBalance(s, classes.find((c) => c.id === s.classId), payments), 0),
    [children, classes, payments]
  );

  if (!children.length) {
    return (
      <div className="animate-fade-up">
        <PageHeader title={t('portal.parent')} sub={t('portal.parent.d')} />
        <div className="card"><Empty title={t('common.empty')} desc={t('portal.parent.d')} /></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={t('portal.parent')}
        sub={`${children.length} ${t('dash.children').toLowerCase()} · ${t('portal.parent.d')}`}
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label={t('dash.children')} value={String(children.length)} icon={<GraduationCap className="h-4 w-4" />} accent />
        <StatCard label={t('dash.balanceDue')} value={totalBalance > 0 ? fmtMoney(totalBalance) : '✓'} icon={<Wallet className="h-4 w-4" />} />
        <StatCard
          label={t('dash.absences')}
          value={String(children.reduce((a, s) => a + attendance.filter((x) => x.studentId === s.id && x.status === 'absent').length, 0))}
          icon={<CalendarClock className="h-4 w-4" />}
        />
        <StatCard label="Messages" value={String(messages.length)} icon={<BellRing className="h-4 w-4" />} />
      </div>

      {/* child cards */}
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        {children.map((s) => {
          const cls = classes.find((c) => c.id === s.classId);
          const avg = Q.studentAverage(grades, s.id!);
          const ranking = cls ? Q.classRanking(students, grades, cls.id!) : [];
          const rank = ranking.findIndex((r) => r.student.id === s.id) + 1;
          const balance = Q.studentBalance(s, cls, payments);
          const myAbs = attendance.filter((a) => a.studentId === s.id && a.status !== 'present').length;
          const myGrades = grades.filter((g) => g.studentId === s.id).slice(-5).reverse();
          const myIncidents = incidents.filter((i) => i.studentId === s.id);
          return (
            <div key={s.id} className="card overflow-hidden">
              <div className="flex items-center gap-3 border-b border-border/60 bg-muted/40 px-5 py-4">
                <Avatar name={`${s.firstName} ${s.lastName}`} color={s.photoColor} size={46} />
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-bold">{s.lastName.toUpperCase()} {s.firstName}</p>
                  <p className="text-[11.5px] text-muted-foreground">{cls?.name} · {s.matricule}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase text-muted-foreground">{t('common.average')}</p>
                  <p className={`text-lg font-extrabold ${(avg?.avg || 0) >= 10 ? 'text-success' : 'text-danger'}`}>{avg ? avg.avg.toFixed(2) : '—'}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 p-4">
                <div className="rounded-xl bg-muted/50 p-3 text-center">
                  <p className="text-[10px] font-semibold uppercase text-muted-foreground">{t('common.rank')}</p>
                  <p className="mt-0.5 text-[15px] font-extrabold">{rank || '—'}<span className="text-[10px] font-normal text-muted-foreground">/{ranking.length}</span></p>
                </div>
                <div className="rounded-xl bg-muted/50 p-3 text-center">
                  <p className="text-[10px] font-semibold uppercase text-muted-foreground">{t('students.balance')}</p>
                  <p className={`mt-0.5 text-[13px] font-extrabold ${balance > 0 ? 'text-danger' : 'text-success'}`}>{balance > 0 ? fmtMoney(balance) : '✓'}</p>
                </div>
                <div className="rounded-xl bg-muted/50 p-3 text-center">
                  <p className="text-[10px] font-semibold uppercase text-muted-foreground">{t('dash.absences')}</p>
                  <p className="mt-0.5 text-[15px] font-extrabold">{myAbs}</p>
                </div>
              </div>
              {/* latest grades */}
              <div className="px-4 pb-2">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{t('dash.lastGrades')}</p>
                <div className="space-y-1.5">
                  {myGrades.map((g) => (
                    <div key={g.id} className="flex items-center justify-between text-[12.5px]">
                      <span className="text-muted-foreground">{g.evaluation}</span>
                      <span className="flex items-center gap-2">
                        <span className="font-bold">{g.score}<span className="font-normal text-muted-foreground">/{g.maxScore}</span></span>
                        <Chip value={g.score / g.maxScore >= 0.5 ? 'paid' : 'failed'} label={g.score / g.maxScore >= 0.5 ? '✓' : '✗'} />
                      </span>
                    </div>
                  ))}
                  {!myGrades.length && <p className="text-[12px] text-muted-foreground">{t('academic.noGradesYet')}</p>}
                </div>
              </div>
              {myIncidents.length > 0 && (
                <div className="mx-4 mb-3 rounded-xl bg-danger/5 px-3.5 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-danger">{t('disc.followUp')}</p>
                  {myIncidents.slice(0, 2).map((i) => (
                    <p key={i.id} className="mt-1 text-[12px] text-muted-foreground">
                      {fmtDate(i.date, lang)} — {t(`disc.type.${i.type}`)} · <b>{t(`disc.${i.sanction}`)}</b>
                    </p>
                  ))}
                </div>
              )}
              <div className="flex gap-2 border-t border-border/60 px-4 py-3">
                <Link to="/app/finance" className="btn btn-primary btn-sm flex-1"><Wallet className="h-3.5 w-3.5" /> {t('nav.payments')}</Link>
                <Link to="/app/messages" className="btn btn-outline btn-sm flex-1"><BellRing className="h-3.5 w-3.5" /> {t('nav.messages')}</Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* school messages */}
      <h3 className="mb-3 mt-5 text-[13px] font-bold uppercase tracking-wide text-muted-foreground">{t('msg.history')}</h3>
      <div className="space-y-2.5">
        {messages.map((m) => (
          <div key={m.id} className="card flex items-start gap-3 p-4">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><FileText className="h-4 w-4" /></span>
            <div>
              <p className="text-[13px] font-bold">{m.title}</p>
              <p className="mt-0.5 text-[12px] text-muted-foreground">{m.body}</p>
              <p className="mt-1 text-[10.5px] text-muted-foreground/70">{fmtDate(m.date, lang)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
