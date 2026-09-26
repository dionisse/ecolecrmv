import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  Users, UserCog, Wallet, TrendingUp, TrendingDown, Plus, Receipt, ShieldAlert,
  Bell, CalendarClock, BookOpenCheck, GraduationCap, School, Library, PiggyBank,
} from 'lucide-react';
import { db } from '@/db/database';
import { useI18n } from '@/i18n/I18nContext';
import { useAuth } from '@/state/auth';
import { fmtMoney, fmtCompact, pct, monthLabel, fmtNumber } from '@/utils/format';
import { StatCard, Avatar, Chip, Progress, PageHeader } from '@/components/ui';
import * as Q from '@/db/queries';

const GRA = 'bg-gradient-to-br from-primary to-emerald-600';
const MODULE_COLORS = { primary: '#1ea75f', secondary: '#24446b', university: '#f2a90f' };

export default function Dashboard() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const nav = useNavigate();

  const students = useLiveQuery(() => db.students.toArray(), []) || [];
  const classes = useLiveQuery(() => db.classes.toArray(), []) || [];
  const staff = useLiveQuery(() => db.staff.toArray(), []) || [];
  const payments = useLiveQuery(() => db.payments.toArray(), []) || [];
  const expenses = useLiveQuery(() => db.expenses.toArray(), []) || [];
  const incidents = useLiveQuery(() => db.incidents.toArray(), []) || [];
  const grades = useLiveQuery(() => db.grades.toArray(), []) || [];
  const attendance = useLiveQuery(() => db.attendance.toArray(), []) || [];
  const history = useLiveQuery(async () => (await db.meta.get('history'))?.value as Array<[string, number, number, number]> || [], []) || [];

  const stats = useMemo(() => {
    const collectedMonth = Q.sumInMonth(payments);
    const spentMonth = Q.sumInMonth(expenses);
    const active = students.filter((s) => s.status === 'active').length;
    const teachers = staff.filter((s) => s.role === 'teacher').length;
    const att = Q.attendanceRate(attendance);
    const pass = Q.passRate(students, grades);
    return { collectedMonth, spentMonth, active, teachers, att, pass };
  }, [students, staff, payments, expenses, attendance, grades]);

  const flow = useMemo(() => {
    const inc = Q.paymentsByMonth(payments, 6);
    const exp = Q.expensesByMonth(expenses, 6);
    return inc.map((x, i) => ({
      month: monthLabel(x.month, lang),
      recettes: x.total,
      dépenses: exp[i].total,
    }));
  }, [payments, expenses, lang]);

  const enrollment = useMemo(() => {
    void students;
    return history.map(([y, p, s, u]) => ({ year: y.slice(0, 4), [t('module.primary')]: p, [t('module.secondary')]: s, [t('module.university')]: u }));
  }, [history, t, students]);

  const incidentsPie = useMemo(() => {
    const colors = ['#1ea75f', '#24446b', '#f2a90f', '#0d9488', '#ef4444', '#eab308', '#64748b'];
    return Q.incidentsByType(incidents).slice(0, 7).map((x, i) => ({ name: t(`disc.type.${x.type}`), value: x.count, color: colors[i] }));
  }, [incidents, t]);

  const latestPayments = useMemo(
    () => [...payments].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6),
    [payments]
  );

  const moduleSplit = Q.enrollmentByModule(students);
  const recovery = pct(stats.collectedMonth, Math.max(1, stats.collectedMonth + 800000));

  const openNew = (page: string) => nav(page, { state: { new: 1 } });

  /* ---------- role-gated sections ---------- */
  const isFinance = user?.role === 'admin' || user?.role === 'director' || user?.role === 'accountant';
  const isAcademic = user?.role === 'admin' || user?.role === 'director' || user?.role === 'censor' || user?.role === 'secretary';
  const isDiscipline = user?.role === 'admin' || user?.role === 'director' || user?.role === 'censor' || user?.role === 'discipline';

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={`${t('dash.welcome')}, ${user?.name.split(' ').slice(-1)[0]} 👋`}
        sub={`${user ? t(ROLE_KEY[user.role] || 'portal.admin') : ''} · ${new Date().toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`}
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {(isAcademic || user?.role === 'admin') && (
          <StatCard label={t('dash.students')} value={fmtNumber(stats.active)} delta="+8,2%" deltaUp icon={<Users className="h-4 w-4" />} hint={`${classes.length} ${t('dash.classes').toLowerCase()}`} accent />
        )}
        {(user?.role === 'admin' || user?.role === 'director') && (
          <StatCard label={t('dash.staff')} value={String(staff.length)} delta="+2" deltaUp icon={<UserCog className="h-4 w-4" />} hint={`${stats.teachers} ${t('dash.teachers').toLowerCase()}`} />
        )}
        {isFinance && (
          <StatCard label={t('dash.collected')} value={fmtCompact(stats.collectedMonth) + ' F'} delta="+12,4%" deltaUp icon={<Wallet className="h-4 w-4" />} hint={fmtMoney(stats.collectedMonth)} accent />
        )}
        {isFinance && (
          <StatCard label={t('finance.spent')} value={fmtCompact(stats.spentMonth) + ' F'} delta="-3,1%" deltaUp={false} icon={<TrendingDown className="h-4 w-4" />} hint={fmtMoney(stats.spentMonth)} />
        )}
        {isAcademic && (
          <StatCard label={t('rep.passRate')} value={stats.pass + '%'} delta="+4 pts" deltaUp icon={<GraduationCap className="h-4 w-4" />} hint={t('academic.term1')} />
        )}
        {isDiscipline && (
          <StatCard label={t('dash.absRate')} value={(100 - stats.att.rate).toFixed(1) + '%'} delta="-0,8 pt" deltaUp icon={<CalendarClock className="h-4 w-4" />} hint={`${stats.att.absent + stats.att.late} ${t('common.status').toLowerCase()}`} />
        )}
        {isFinance && (
          <StatCard label={t('dash.recovery')} value={recovery + '%'} delta="+2,3%" deltaUp icon={<PiggyBank className="h-4 w-4" />} />
        )}
      </div>

      {/* charts row */}
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        {isFinance && (
          <div className="card p-4 sm:p-5 xl:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-[14px] font-bold">{t('dash.revenue')}</h3>
                <p className="text-[11.5px] text-muted-foreground">FCFA · 6 {lang === 'fr' ? 'mois' : 'months'}</p>
              </div>
              <span className="badge border-success/30 bg-success/10 text-success">+{t('common.thisMonth')}: {fmtMoney(stats.collectedMonth - stats.spentMonth)}</span>
            </div>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={flow} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.08} vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="currentColor" opacity={0.5} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} stroke="currentColor" opacity={0.5} tickLine={false} axisLine={false} tickFormatter={(v) => fmtCompact(v)} width={42} />
                  <Tooltip
                    cursor={{ fill: 'currentColor', opacity: 0.05 }}
                    contentStyle={{ borderRadius: 12, border: '1px solid rgba(128,128,128,.25)', background: 'var(--card)', fontSize: 12 }}
                    formatter={(v: any) => fmtMoney(Number(v))}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="recettes" name={t('finance.collected')} fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={26} />
                  <Bar dataKey="dépenses" name={t('finance.spent')} fill="#f2a90f" radius={[6, 6, 0, 0]} maxBarSize={26} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {isAcademic && (
          <div className="card p-4 sm:p-5">
            <h3 className="text-[14px] font-bold">{t('dash.byModule')}</h3>
            <p className="text-[11.5px] text-muted-foreground">{t('dash.enrollment')}</p>
            <div className="mt-3 space-y-3">
              {(['primary', 'secondary', 'university'] as const).map((m) => {
                const total = Math.max(1, stats.active);
                const v = (moduleSplit as any)[m];
                const Icon = m === 'primary' ? School : m === 'secondary' ? BookOpenCheck : Library;
                return (
                  <div key={m}>
                    <div className="mb-1 flex items-center justify-between text-[12.5px]">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Icon className="h-3.5 w-3.5" style={{ color: MODULE_COLORS[m] }} />
                        {t(`module.${m}`)}
                      </span>
                      <span className="font-bold">{v} <span className="font-normal text-muted-foreground">({Math.round((v / total) * 100)}%)</span></span>
                    </div>
                    <Progress value={(v / total) * 100} barClass="" className="[&>div]:bg-none" />
                  </div>
                );
              })}
            </div>
            <div className="mt-4 h-36">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={enrollment}>
                  <defs>
                    <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1ea75f" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#1ea75f" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="year" tick={{ fontSize: 10 }} stroke="currentColor" opacity={0.5} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid rgba(128,128,128,.25)', background: 'var(--card)', fontSize: 12 }} />
                  <Area type="monotone" dataKey={t('module.secondary')} stroke="#24446b" fill="#24446b" fillOpacity={0.12} strokeWidth={2} />
                  <Area type="monotone" dataKey={t('module.primary')} stroke="#1ea75f" fill="url(#gP)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {isDiscipline && (
          <div className="card p-4 sm:p-5">
            <h3 className="text-[14px] font-bold">{t('dash.discipline')}</h3>
            <p className="text-[11.5px] text-muted-foreground">{t('rep.period')}: 60 {lang === 'fr' ? 'jours' : 'days'}</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={incidentsPie} dataKey="value" nameKey="name" innerRadius={52} outerRadius={82} paddingAngle={3} strokeWidth={0}>
                    {incidentsPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid rgba(128,128,128,.25)', background: 'var(--card)', fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 10.5 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* quick actions */}
      {(user?.role === 'admin' || user?.role === 'director' || user?.role === 'accountant' || user?.role === 'secretary' || user?.role === 'discipline') && (
        <div className="mt-4">
          <h3 className="mb-2.5 text-[13px] font-bold uppercase tracking-wide text-muted-foreground">{t('dash.quickActions')}</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {[
              { label: t('dash.newStudent'), icon: Users, to: '/app/students', color: '#1ea75f' },
              { label: t('dash.newPayment'), icon: Receipt, to: '/app/finance', color: '#10b981' },
              { label: t('dash.newIncident'), icon: ShieldAlert, to: '/app/discipline', color: '#e11d48' },
              { label: t('dash.sendNotif'), icon: Bell, to: '/app/messages', color: '#f2a90f' },
              { label: t('rep.title'), icon: TrendingUp, to: '/app/reports', color: '#24446b' },
            ].map((a) => (
              <Link key={a.label} to={a.to} state={{ new: 1 }} className="card group flex flex-col items-center gap-2.5 p-4 transition-all hover:-translate-y-0.5 hover:shadow-pop">
                <span className="grid h-10 w-10 place-items-center rounded-xl text-white transition group-hover:scale-105" style={{ background: a.color }}>
                  <a.icon className="h-4.5 w-4.5" />
                </span>
                <span className="text-center text-[12px] font-semibold leading-tight">{a.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* latest payments + classes overview */}
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        {(isFinance || user?.role === 'secretary') && (
          <div className="card overflow-hidden xl:col-span-2">
            <div className="flex items-center justify-between px-4 py-3.5 sm:px-5">
              <h3 className="text-[14px] font-bold">{t('dash.latestPayments')}</h3>
              <Link to="/app/finance" className="text-[12px] font-semibold text-primary hover:underline">{t('common.viewAll')}</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px]">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="th">{t('finance.student')}</th>
                    <th className="th">{t('finance.method')}</th>
                    <th className="th">{t('common.amount')}</th>
                    <th className="th">{t('common.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {latestPayments.map((p) => {
                    const st = students.find((s) => s.id === p.studentId);
                    return (
                      <tr key={p.id} className="tr">
                        <td className="td">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={`${st?.lastName || ''} ${st?.firstName || ''}`} color={st?.photoColor} size={30} />
                            <div className="min-w-0">
                              <p className="truncate text-[13px] font-semibold">{Q.fullName(st)}</p>
                              <p className="text-[11px] text-muted-foreground">{p.receiptNo} · {p.date}</p>
                            </div>
                          </div>
                        </td>
                        <td className="td"><MomoChip method={p.method} /></td>
                        <td className="td font-bold">{fmtMoney(p.amount)}</td>
                        <td className="td"><Chip value={p.status} label={t(`finance.status.${p.status}`)} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {isAcademic && (
          <div className="card p-4 sm:p-5">
            <h3 className="mb-3 text-[14px] font-bold">{t('dash.collectionByClass')}</h3>
            <div className="space-y-3">
              {classes.slice(0, 7).map((c) => {
                const clsStudents = students.filter((s) => s.classId === c.id);
                const paid = payments.filter((p) => clsStudents.some((s) => s.id === p.studentId) && p.status !== 'failed').reduce((a, p) => a + p.amount, 0);
                const expected = Math.max(1, clsStudents.length * (c.fees.inscription + c.fees.scolarite * 3));
                return (
                  <div key={c.id}>
                    <div className="mb-1 flex items-center justify-between text-[12px]">
                      <span className="font-medium">{c.name}</span>
                      <span className="text-muted-foreground">{Math.round((paid / expected) * 100)}%</span>
                    </div>
                    <Progress value={(paid / expected) * 100} barClass={paid / expected > 0.7 ? 'bg-success' : paid / expected > 0.4 ? 'bg-warn' : 'bg-danger'} />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export const ROLE_KEY: Record<string, string> = {
  admin: 'portal.admin', director: 'portal.admin', teacher: 'portal.teacher', parent: 'portal.parent',
  accountant: 'portal.accounting', secretary: 'portal.secretariat', discipline: 'portal.discipline',
  censor: 'portal.censor', staff: 'portal.staffp',
};

export function MomoChip({ method }: { method: string }) {
  const styles: Record<string, [string, string]> = {
    om: ['#f97316', 'OM'], wave: ['#1dc8f2', 'W'], mtn: ['#ffcc00', 'MTN'],
    moov: ['#1e40af', 'M'], cash: ['#64748b', '€'], transfer: ['#10b981', '⇄'], check: ['#e11d48', 'Ch'], card: ['#6366f1', '▚'],
  };
  const [color, label] = styles[method] || ['#94a3b8', '?'];
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="grid h-5 w-5 place-items-center rounded text-[7px] font-black text-white" style={{ background: color }}>{label}</span>
    </span>
  );
}
