import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { FileDown, FileSpreadsheet, GraduationCap, Wallet, ShieldAlert, Users } from 'lucide-react';
import { db } from '@/db/database';
import { useI18n } from '@/i18n/I18nContext';
import { useToast } from '@/state/toast';
import { fmtCompact, fmtMoney, monthLabel } from '@/utils/format';
import { exportExcel, printHtml, schoolHeaderHtml } from '@/utils/export';
import { PageHeader, StatCard, Progress } from '@/components/ui';
import * as Q from '@/db/queries';
import { DEFAULT_SCHOOL } from '@/db/seed';

const MODULE_COLORS = { primary: '#1ea75f', secondary: '#24446b', university: '#f2a90f' };

export default function Reports() {
  const { t, lang } = useI18n();
  const { toast } = useToast();

  const students = useLiveQuery(() => db.students.toArray(), []) || [];
  const classes = useLiveQuery(() => db.classes.toArray(), []) || [];
  const grades = useLiveQuery(() => db.grades.toArray(), []) || [];
  const payments = useLiveQuery(() => db.payments.toArray(), []) || [];
  const expenses = useLiveQuery(() => db.expenses.toArray(), []) || [];
  const incidents = useLiveQuery(() => db.incidents.toArray(), []) || [];
  const attendance = useLiveQuery(() => db.attendance.toArray(), []) || [];

  const classPerf = useMemo(
    () => classes.map((c) => ({
      name: c.name,
      moyenne: Q.classAverage(students, grades, c.id!),
      students: students.filter((s) => s.classId === c.id).length,
      module: c.module,
    })),
    [classes, students, grades]
  );

  const trend = useMemo(() => Q.gradeTrendByMonth(grades, 6).map((x) => ({
    month: monthLabel(x.month, lang),
    moyenne: x.avg,
  })), [grades, lang]);

  const genderSplit = useMemo(() => {
    const m = students.filter((s) => s.gender === 'M');
    const f = students.filter((s) => s.gender === 'F');
    const avg = (arr: typeof students) => {
      const avgs = arr.map((s) => Q.studentAverage(grades, s.id!)).filter(Boolean) as any[];
      return avgs.length ? Math.round((avgs.reduce((a, x) => a + x.avg, 0) / avgs.length) * 100) / 100 : 0;
    };
    return [
      { name: t('students.male'), moyenne: avg(m), n: m.length },
      { name: t('students.female'), moyenne: avg(f), n: f.length },
    ];
  }, [students, grades, t]);

  const flow = useMemo(() => {
    const inc = Q.paymentsByMonth(payments, 6);
    const exp = Q.expensesByMonth(expenses, 6);
    return inc.map((x, i) => ({ month: monthLabel(x.month, lang), recettes: x.total, dépenses: exp[i].total }));
  }, [payments, expenses, lang]);

  const incidentsByType = useMemo(() => {
    const colors = ['#1ea75f', '#24446b', '#f2a90f', '#0d9488', '#ef4444', '#eab308', '#64748b'];
    return Q.incidentsByType(incidents).map((x, i) => ({ name: t(`disc.type.${x.type}`), value: x.count, color: colors[i % colors.length] }));
  }, [incidents, t]);

  const totalIn = payments.filter((p) => p.status !== 'failed').reduce((a, p) => a + p.amount, 0);
  const totalOut = expenses.reduce((a, e) => a + e.amount, 0);
  const att = Q.attendanceRate(attendance);
  const pass = Q.passRate(students, grades);

  const exportR = () => {
    exportExcel(classPerf.map((c) => ({
      Classe: c.name, Module: t(`module.${c.module}`), Effectif: c.students,
      Moyenne: c.moyenne, 'Taux réussite %': Math.round((c.moyenne / 20) * 100),
    })), 'rapport_performance');
    toast('Export XLSX ✓');
  };

  const printR = () => {
    const rows = classPerf.map((c) => `<tr><td>${c.name}</td><td class="right">${c.students}</td><td class="right"><b>${c.moyenne.toFixed(2)}</b> / 20</td><td class="right">${Math.round((c.moyenne / 20) * 100)}%</td></tr>`).join('');
    printHtml(t('rep.title'), `
      ${schoolHeaderHtml(DEFAULT_SCHOOL, `<div style="text-align:right"><span class="badge">${t('rep.title')}</span><br><span class="muted">${new Date().toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US')}</span></div>`)}
      <div class="grid2" style="margin:10px 0">
        <p><b>${t('dash.students')} :</b> ${students.length}</p>
        <p><b>${t('rep.passRate')} :</b> ${pass}%</p>
        <p><b>${t('finance.balance')} :</b> ${fmtMoney(totalIn - totalOut)}</p>
        <p><b>${t('staff.attendanceRate')} :</b> ${att.rate}%</p>
      </div>
      <h2>${t('rep.bestClasses')}</h2>
      <table><thead><tr><th>${t('common.class')}</th><th class="right">${t('dash.students')}</th><th class="right">${t('common.average')}</th><th class="right">${t('rep.passRate')}</th></tr></thead><tbody>${rows}</tbody></table>
      <h2>${t('rep.financeSummary')}</h2>
      <table><thead><tr><th>${t('rep.period')}</th><th class="right">${t('finance.collected')}</th><th class="right">${t('finance.spent')}</th><th class="right">${t('finance.balance')}</th></tr></thead>
      <tbody>${flow.map((f) => `<tr><td>${f.month}</td><td class="right">${fmtMoney(f.recettes)}</td><td class="right">${fmtMoney(f.dépenses)}</td><td class="right"><b>${fmtMoney(f.recettes - f.dépenses)}</b></td></tr>`).join('')}</tbody></table>
      <div class="footer"><span>EcoleCRM · ${DEFAULT_SCHOOL.name}</span><span>FCFA (XOF) · UEMOA</span></div>
    `);
    toast('PDF ✓');
  };

  const top = [...classPerf].sort((a, b) => b.moyenne - a.moyenne).slice(0, 5);

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={t('rep.title')}
        sub={t('rep.sub')}
        actions={
          <>
            <button className="btn btn-outline btn-md" onClick={printR}><FileDown className="h-4 w-4" /> {t('rep.exportPdf')}</button>
            <button className="btn btn-outline btn-md" onClick={exportR}><FileSpreadsheet className="h-4 w-4" /> {t('rep.exportExcel')}</button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label={t('rep.passRate')} value={pass + '%'} icon={<GraduationCap className="h-4 w-4" />} accent />
        <StatCard label={t('common.average')} value={`${(classPerf.reduce((a, c) => a + c.moyenne, 0) / Math.max(1, classPerf.length)).toFixed(2)}/20`} icon={<Users className="h-4 w-4" />} />
        <StatCard label={t('finance.balance')} value={fmtCompact(totalIn - totalOut) + ' F'} icon={<Wallet className="h-4 w-4" />} hint={fmtMoney(totalIn - totalOut)} />
        <StatCard label={t('staff.attendanceRate')} value={att.rate + '%'} icon={<ShieldAlert className="h-4 w-4" />} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        {/* class performance */}
        <div className="card p-4 sm:p-5">
          <h3 className="text-[14px] font-bold">{t('rep.bestClasses')}</h3>
          <p className="text-[11.5px] text-muted-foreground">{t('common.average')} / 20</p>
          <div className="mt-3 space-y-3">
            {top.map((c) => (
              <div key={c.name}>
                <div className="mb-1 flex items-center justify-between text-[12.5px]">
                  <span className="flex items-center gap-2 font-medium">
                    {c.name}
                    <span className="chip" style={{ background: `${MODULE_COLORS[c.module]}1a`, color: MODULE_COLORS[c.module] }}>{t(`module.${c.module}`)}</span>
                  </span>
                  <span className={`font-extrabold ${c.moyenne >= 10 ? 'text-success' : 'text-danger'}`}>{c.moyenne.toFixed(2)}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(c.moyenne / 20) * 100}%`, background: c.moyenne >= 10 ? '#10b981' : '#ef4444' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* grade trend */}
        <div className="card p-4 sm:p-5">
          <h3 className="text-[14px] font-bold">{t('rep.academicPerf')}</h3>
          <p className="text-[11.5px] text-muted-foreground">6 {lang === 'fr' ? 'mois' : 'months'}</p>
          <div className="mt-3 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.08} vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="currentColor" opacity={0.5} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 20]} tick={{ fontSize: 11 }} stroke="currentColor" opacity={0.5} tickLine={false} axisLine={false} width={28} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid rgba(128,128,128,.25)', background: 'var(--card)', fontSize: 12 }} />
                <Line type="monotone" dataKey="moyenne" stroke="#1ea75f" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* finance summary */}
        <div className="card p-4 sm:p-5">
          <h3 className="text-[14px] font-bold">{t('rep.financeSummary')}</h3>
          <div className="mt-3 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={flow}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.08} vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="currentColor" opacity={0.5} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} stroke="currentColor" opacity={0.5} tickLine={false} axisLine={false} tickFormatter={(v) => fmtCompact(v)} width={40} />
                <Tooltip cursor={{ fill: 'currentColor', opacity: 0.05 }} contentStyle={{ borderRadius: 12, border: '1px solid rgba(128,128,128,.25)', background: 'var(--card)', fontSize: 12 }} formatter={(v: any) => fmtMoney(Number(v))} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="recettes" name={t('finance.collected')} fill="#10b981" radius={[5, 5, 0, 0]} maxBarSize={22} />
                <Bar dataKey="dépenses" name={t('finance.spent')} fill="#f2a90f" radius={[5, 5, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* incidents + gender */}
        <div className="grid gap-4">
          <div className="card p-4 sm:p-5">
            <h3 className="text-[14px] font-bold">{t('dash.discipline')}</h3>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={incidentsByType} dataKey="value" nameKey="name" innerRadius={40} outerRadius={65} paddingAngle={3} strokeWidth={0}>
                    {incidentsByType.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid rgba(128,128,128,.25)', background: 'var(--card)', fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card p-4 sm:p-5">
            <h3 className="text-[14px] font-bold">{t('rep.genderAvg')}</h3>
            <div className="mt-3 space-y-3">
              {genderSplit.map((g) => (
                <div key={g.name}>
                  <div className="mb-1 flex justify-between text-[12.5px]">
                    <span className="font-medium">{g.name} <span className="text-muted-foreground">({g.n})</span></span>
                    <span className="font-extrabold">{g.moyenne.toFixed(2)}/20</span>
                  </div>
                  <Progress value={(g.moyenne / 20) * 100} barClass={g.moyenne >= 10 ? 'bg-success' : 'bg-danger'} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
