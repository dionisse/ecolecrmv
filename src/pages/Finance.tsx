import { useEffect, useMemo, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  Plus, Printer, Wallet, TrendingUp, TrendingDown, Receipt, Smartphone,
  ArrowUpRight, PieChart as PieIcon,
} from 'lucide-react';
import { db, type Payment, type Expense } from '@/db/database';
import { useI18n } from '@/i18n/I18nContext';
import { useAuth } from '@/state/auth';
import { useToast } from '@/state/toast';
import { useOnline, queueOperation } from '@/state/sync';
import { fmtMoney, fmtCompact, fmtDate, nowIso, receiptNo, uid, monthLabel, pct } from '@/utils/format';
import { exportExcel, printHtml, schoolHeaderHtml } from '@/utils/export';
import { PageHeader, Modal, Field, Select, Tabs, StatCard, Chip, Avatar, Empty, SearchInput, Pagination, Progress } from '@/components/ui';
import * as Q from '@/db/queries';
import { DEFAULT_SCHOOL } from '@/db/seed';
import { MomoChip } from '@/pages/Dashboard';

const PER = 10;
const METHODS: Payment['method'][] = ['om', 'wave', 'mtn', 'moov', 'cash', 'transfer', 'check', 'card'];
const CATEGORIES = ['inscription', 'scolarite', 'cantine', 'transport', 'uniforme', 'examen', 'reinscription'];
const EXPENSE_CATS = ['salary', 'utilities', 'rent', 'supplies', 'maintenance', 'other'];

const MOMO_COLORS: Record<string, string> = { om: '#f97316', wave: '#0ea5e9', mtn: '#eab308', moov: '#8b5cf6', cash: '#64748b', transfer: '#10b981', check: '#e11d48', card: '#6366f1' };

export default function Finance() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();
  const online = useOnline();
  const location = useLocation() as any;

  const payments = useLiveQuery(() => db.payments.toArray(), []) || [];
  const expenses = useLiveQuery(() => db.expenses.toArray(), []) || [];
  const students = useLiveQuery(() => db.students.toArray(), []) || [];
  const classes = useLiveQuery(() => db.classes.toArray(), []) || [];

  const [tab, setTab] = useState('payments');
  const [payForm, setPayForm] = useState<Payment | null>(null);
  const [expForm, setExpForm] = useState<Expense | null>(null);
  const [q, setQ] = useState('');
  const [statusF, setStatusF] = useState('');
  const [page, setPage] = useState(1);
  const [lastReceipt, setLastReceipt] = useState<Payment | null>(null);
  const [step, setStep] = useState<'form' | 'momo'>('form');

  useEffect(() => { if (location?.state?.new && (user?.role === 'admin' || user?.role === 'accountant' || user?.role === 'director')) openPay(); }, [location?.state]);

  const isParent = user?.role === 'parent';
  const canPay = ['admin', 'director', 'accountant', 'secretary'].includes(user?.role || '');

  const myChildrenLive = useLiveQuery(async () => {
    if (!user || user.role !== 'parent') return [] as any[];
    const u = await db.users.where('email').equals(user.email).first();
    const ids = (u?.childIds || []).map(Number);
    return db.students.filter((s) => ids.includes(s.id!)).toArray();
  }, [user?.email]) || [];
  const myStudents = isParent ? myChildrenLive : students;

  const visiblePayments = useMemo(() => {
    let rows = payments;
    if (isParent) rows = rows.filter((p) => myStudents.some((s) => s.id === p.studentId));
    const needle = q.trim().toLowerCase();
    return rows
      .filter((p) => (!needle || `${p.receiptNo} ${Q.fullName(students.find((s) => s.id === p.studentId))}`.toLowerCase().includes(needle)) && (!statusF || p.status === statusF))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [payments, students, q, statusF, isParent, myStudents]);

  const openPay = () => {
    setStep('form');
    setPayForm({
      receiptNo: receiptNo(), studentId: 0, category: 'scolarite', amount: 0,
      method: 'om', date: nowIso().slice(0, 10), term: 1, status: 'paid',
      cashierId: undefined, phone: '',
    });
  };

  const openExp = () => setExpForm({ label: '', category: 'supplies', amount: 0, date: nowIso().slice(0, 10), supplier: '', proof: `PIECE-${Math.floor(1000 + Math.random() * 9000)}` });

  /* ---- save payment (+ simulated momo) ---- */
  const savePayment = async (momoSend = false) => {
    if (!payForm || !payForm.studentId || !payForm.amount) return toast(t('common.required'), 'error');
    const method = payForm.method;
    const isMomo = ['om', 'wave', 'mtn', 'moov'].includes(method);
    const status: Payment['status'] = momoSend && isMomo ? 'pending' : payForm.status;
    const rec: Payment = { ...payForm, status, reference: isMomo && momoSend ? `MM-${uid('').toUpperCase().slice(0, 8)}` : payForm.reference };
    await db.payments.add(rec);
    if (!online) queueOperation();
    if (momoSend && isMomo) {
      toast(`${t('finance.momoSent')} — ${t(`finance.method.${method}`)} (${rec.phone || '…'})`);
      await db.notifications.add({ title: t('msg.tpl.payment'), body: `${fmtMoney(rec.amount)} — ${t(`finance.method.${method}`)} · ${rec.receiptNo}`, date: nowIso(), forRole: 'parent', read: 0 });
    } else {
      toast(`${fmtMoney(rec.amount)} ✓`);
    }
    setLastReceipt(rec);
    setPayForm(null);
    printReceipt(rec);
  };

  const saveExpense = async () => {
    if (!expForm || !expForm.label || !expForm.amount) return toast(t('common.required'), 'error');
    await db.expenses.add(expForm);
    if (!online) queueOperation();
    toast(`${t('finance.newExpense')} ✓`);
    setExpForm(null);
  };

  const printReceipt = (p: Payment) => {
    const s = students.find((x) => x.id === p.studentId);
    const cls = classes.find((c) => c.id === s?.classId);
    const cashier = user?.name || '—';
    printHtml(t('finance.receipt'), `
      ${schoolHeaderHtml(DEFAULT_SCHOOL, `<div style="text-align:right"><b>${t('finance.receiptNo')} : ${p.receiptNo}</b><br><span class="muted">${fmtDate(p.date, lang)}</span></div>`)}
      <h2>${t('finance.receipt')} — ${t('finance.receivedFrom')}</h2>
      <div class="grid2">
        <p><b>${t('finance.student')} :</b> ${s ? `${s.lastName.toUpperCase()} ${s.firstName}` : '—'}</p>
        <p><b>${t('students.matricule')} :</b> ${s?.matricule || '—'}</p>
        <p><b>${t('common.class')} :</b> ${cls?.name || '—'}</p>
        <p><b>${t('students.guardian')} :</b> ${s?.guardianName || '—'}</p>
      </div>
      <table>
        <thead><tr><th>${t('finance.for')}</th><th class="right">${t('common.amount')}</th></tr></thead>
        <tbody>
          <tr><td>${feeLabel(p.category, t)}${p.term ? ` — ${t('academic.term')} ${p.term}` : ''}</td><td class="right"><b>${fmtMoney(p.amount)}</b></td></tr>
        </tbody>
      </table>
      <div class="grid2">
        <p><b>${t('finance.method')} :</b> ${t(`finance.method.${p.method}`)}${p.reference ? ` (${p.reference})` : ''}</p>
        <p><b>${t('finance.cashier')} :</b> ${cashier}</p>
      </div>
      <div class="total-box">${fmtMoney(p.amount)}</div>
      <div class="stamp">
        <div class="sign">${t('finance.cashier')}</div>
        <div class="sign">Cachet de l’école</div>
      </div>
      <div class="footer"><span>EcoleCRM · ${DEFAULT_SCHOOL.name}</span><span>Reçu généré hors ligne · FCFA (XOF)</span></div>
    `);
  };

  /* ---- stats ---- */
  const paid = payments.filter((p) => p.status !== 'failed');
  const totalIn = paid.reduce((a, p) => a + p.amount, 0);
  const totalOut = expenses.reduce((a, e) => a + e.amount, 0);
  const inMonth = Q.sumInMonth(paid);
  const outMonth = Q.sumInMonth(expenses);
  const methodPie = Q.methodSplit(payments);
  const flow = useMemo(() => {
    const inc = Q.paymentsByMonth(payments, 6);
    const exp = Q.expensesByMonth(expenses, 6);
    return inc.map((x, i) => ({ month: monthLabel(x.month, lang), recettes: x.total, dépenses: exp[i].total }));
  }, [payments, expenses, lang]);

  const pages = Math.ceil(visiblePayments.length / PER);
  const rows = visiblePayments.slice((page - 1) * PER, page * PER);

  /* parent: balances of children */
  const childrenBalances = isParent ? myStudents.map((s) => {
    const cls = classes.find((c) => c.id === s.classId);
    return { s, cls, balance: Q.studentBalance(s, cls, payments) };
  }) : [];

  const exportP = () => {
    exportExcel(visiblePayments.map((p) => {
      const s = students.find((x) => x.id === p.studentId);
      return {
        Reçu: p.receiptNo, Date: p.date, Élève: s ? `${s.lastName} ${s.firstName}` : '',
        Classe: classes.find((c) => c.id === s?.classId)?.name || '', Catégorie: p.category,
        Montant: p.amount, Moyen: t(`finance.method.${p.method}`), Statut: p.status,
      };
    }), 'paiements_ecolecrm');
    toast('Export XLSX ✓');
  };

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={isParent ? t('nav.payments') : t('finance.title')}
        sub={isParent ? t('portal.parent.d') : t('finance.payments') + ' · ' + t('finance.expenses') + ' · ' + t('finance.reports')}
        actions={
          canPay && (
            <>
              <button className="btn btn-outline btn-md" onClick={exportP}><ArrowUpRight className="h-4 w-4" /> Excel</button>
              <button className="btn btn-outline btn-md" onClick={openExp}><TrendingDown className="h-4 w-4" /> {t('finance.newExpense')}</button>
              <button className="btn btn-primary btn-md" onClick={openPay}><Plus className="h-4 w-4" /> {t('finance.newPayment')}</button>
            </>
          )
        }
      />

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'payments', label: t('finance.payments'), count: visiblePayments.length },
          ...(canPay ? [{ id: 'expenses', label: t('finance.expenses'), count: expenses.length }] : []),
          ...(canPay ? [{ id: 'reports', label: t('finance.reports') }] : []),
          ...(canPay ? [{ id: 'fees', label: t('finance.fees') }] : []),
        ]}
      />

      {tab === 'payments' && (
        <>
          {/* parent children balances */}
          {isParent && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {childrenBalances.map(({ s, cls, balance }) => (
                <div key={s.id} className="card flex items-center gap-3 p-4">
                  <Avatar name={`${s.firstName} ${s.lastName}`} color={s.photoColor} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-bold">{s.lastName.toUpperCase()} {s.firstName}</p>
                    <p className="text-[11.5px] text-muted-foreground">{cls?.name} · {s.matricule}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10.5px] font-semibold uppercase text-muted-foreground">{t('students.balance')}</p>
                    <p className={`text-[15px] font-extrabold ${balance > 0 ? 'text-danger' : 'text-success'}`}>{balance > 0 ? fmtMoney(balance) : '✓ ' + t('finance.status.paid')}</p>
                  </div>
                </div>
              ))}
              <div className="card flex items-center gap-3 border-dashed p-4 sm:col-span-2">
                <Smartphone className="h-5 w-5 text-primary" />
                <p className="flex-1 text-[12px] text-muted-foreground">{t('finance.momoHint')}</p>
                <Link to="/app/messages" className="btn btn-outline btn-sm">{lang === 'fr' ? 'Contacter l’école' : 'Contact school'}</Link>
              </div>
            </div>
          )}

          {/* KPIs (staff) */}
          {canPay && (
            <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
              <StatCard label={t('finance.collected')} value={fmtCompact(inMonth) + ' F'} icon={<TrendingUp className="h-4 w-4" />} hint={t('common.thisMonth')} accent />
              <StatCard label={t('finance.spent')} value={fmtCompact(outMonth) + ' F'} icon={<TrendingDown className="h-4 w-4" />} hint={t('common.thisMonth')} />
              <StatCard label={t('finance.balance')} value={fmtCompact(totalIn - totalOut) + ' F'} icon={<Wallet className="h-4 w-4" />} hint={`${t('common.total')}: ${fmtMoney(totalIn - totalOut)}`} />
              <StatCard label={t('finance.status.pending')} value={String(payments.filter((p) => p.status === 'pending').length)} icon={<Receipt className="h-4 w-4" />} />
            </div>
          )}

          {/* filters + table */}
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <div className="col-span-2 sm:col-span-2"><SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder={`${t('common.search')} ${t('finance.receiptNo').toLowerCase()}…`} /></div>
            <Select value={statusF} onChange={(v) => { setStatusF(v); setPage(1); }} placeholder={t('common.status')} options={[
              { value: 'paid', label: t('finance.status.paid') }, { value: 'pending', label: t('finance.status.pending') },
              { value: 'partial', label: t('finance.status.partial') }, { value: 'failed', label: t('finance.status.failed') },
            ]} />
          </div>
          <div className="card mt-3 overflow-hidden">
            {rows.length === 0 ? <Empty title={t('common.empty')} icon={<Receipt className="h-6 w-6" />} /> : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px]">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="th">{t('finance.receiptNo')}</th>
                        <th className="th">{t('finance.student')}</th>
                        <th className="th">{t('finance.for')}</th>
                        <th className="th">{t('common.amount')}</th>
                        <th className="th">{t('finance.method')}</th>
                        <th className="th">{t('common.status')}</th>
                        <th className="th text-right">{t('finance.receipt')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((p) => {
                        const s = students.find((x) => x.id === p.studentId);
                        return (
                          <tr key={p.id} className="tr">
                            <td className="td">
                              <p className="font-mono text-[11.5px] font-semibold">{p.receiptNo}</p>
                              <p className="text-[10.5px] text-muted-foreground">{fmtDate(p.date, lang)}</p>
                            </td>
                            <td className="td">
                              <div className="flex items-center gap-2">
                                <Avatar name={`${s?.lastName || ''} ${s?.firstName || ''}`} color={s?.photoColor} size={28} />
                                <div>
                                  <p className="text-[12.5px] font-semibold">{s ? `${s.lastName.toUpperCase()} ${s.firstName}` : '—'}</p>
                                  <p className="text-[10.5px] text-muted-foreground">{classes.find((c) => c.id === s?.classId)?.name}</p>
                                </div>
                              </div>
                            </td>
                            <td className="td text-muted-foreground">{feeLabel(p.category, t)}</td>
                            <td className="td font-bold">{fmtMoney(p.amount)}</td>
                            <td className="td"><MomoChip method={p.method} /> <span className="text-[11.5px] text-muted-foreground">{t(`finance.method.${p.method}`)}</span></td>
                            <td className="td"><Chip value={p.status} label={t(`finance.status.${p.status}`)} /></td>
                            <td className="td text-right">
                              <button className="btn btn-ghost btn-sm px-1.5" onClick={() => printReceipt(p)}><Printer className="h-3.5 w-3.5" /></button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="border-t border-border/60"><Pagination page={page} pages={pages} onPage={setPage} total={visiblePayments.length} perPage={PER} /></div>
              </>
            )}
          </div>
        </>
      )}

      {tab === 'expenses' && canPay && (
        <div className="card mt-4 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px]">
              <thead>
                <tr className="bg-muted/50">
                  <th className="th">{t('common.date')}</th>
                  <th className="th">{t('finance.category')}</th>
                  <th className="th">{t('common.name')}</th>
                  <th className="th">{t('finance.supplier')}</th>
                  <th className="th">{t('common.amount')}</th>
                  <th className="th">{t('finance.proof')}</th>
                </tr>
              </thead>
              <tbody>
                {[...expenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 40).map((e) => (
                  <tr key={e.id} className="tr">
                    <td className="td text-muted-foreground">{fmtDate(e.date, lang)}</td>
                    <td className="td"><span className="badge border-border/60 bg-muted/60">{t(`finance.cat${e.category.charAt(0).toUpperCase()}${e.category.slice(1)}`)}</span></td>
                    <td className="td font-medium">{e.label}</td>
                    <td className="td text-muted-foreground">{e.supplier}</td>
                    <td className="td font-bold text-danger">-{fmtMoney(e.amount)}</td>
                    <td className="td font-mono text-[11px] text-muted-foreground">{e.proof}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'reports' && canPay && (
        <div className="mt-4 grid gap-4 xl:grid-cols-3">
          <div className="card p-4 sm:p-5 xl:col-span-2">
            <h3 className="mb-4 text-[14px] font-bold">{t('finance.flow')}</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={flow}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.08} vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="currentColor" opacity={0.5} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} stroke="currentColor" opacity={0.5} tickLine={false} axisLine={false} tickFormatter={(v) => fmtCompact(v)} width={44} />
                  <Tooltip cursor={{ fill: 'currentColor', opacity: 0.05 }} contentStyle={{ borderRadius: 12, border: '1px solid rgba(128,128,128,.25)', background: 'var(--card)', fontSize: 12 }} formatter={(v: any) => fmtMoney(Number(v))} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="recettes" name={t('finance.collected')} fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={26} />
                  <Bar dataKey="dépenses" name={t('finance.spent')} fill="#f97316" radius={[6, 6, 0, 0]} maxBarSize={26} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card p-4 sm:p-5">
            <h3 className="mb-4 flex items-center gap-2 text-[14px] font-bold"><PieIcon className="h-4 w-4" /> {t('finance.payers')}</h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={methodPie} dataKey="value" nameKey="name" innerRadius={45} outerRadius={72} paddingAngle={3} strokeWidth={0}>
                    {methodPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid rgba(128,128,128,.25)', background: 'var(--card)', fontSize: 12 }} formatter={(v: any) => fmtMoney(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 space-y-1.5">
              {methodPie.map((m) => (
                <div key={m.name} className="flex items-center justify-between text-[12px]">
                  <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: m.color }} />{t(`finance.method.${m.name}`)}</span>
                  <span className="font-bold">{Math.round((m.value / Math.max(1, methodPie.reduce((a, x) => a + x.value, 0))) * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'fees' && canPay && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {classes.map((c) => {
            const clsStudents = students.filter((s) => s.classId === c.id);
            const paidCls = payments.filter((p) => clsStudents.some((s) => s.id === p.studentId) && p.status !== 'failed').reduce((a, p) => a + p.amount, 0);
            const expected = Math.max(1, clsStudents.length * (c.fees.inscription + c.fees.scolarite * 3 + (c.fees.cantine || 0) * 3));
            return (
              <div key={c.id} className="card p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[14px] font-bold">{c.name}</h3>
                  <span className="chip bg-primary/10 text-primary">{t(`module.${c.module}`)}</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[12px]">
                  {(['inscription', 'scolarite', 'cantine', 'transport', 'examen'] as const).filter((k) => (c.fees as any)[k]).map((k) => (
                    <div key={k} className="flex justify-between gap-2">
                      <span className="text-muted-foreground">{feeLabel(k, t)}</span>
                      <span className="font-semibold">{fmtMoney((c.fees as any)[k])}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-[11.5px]">
                    <span className="text-muted-foreground">{t('finance.coverage')}</span>
                    <span className="font-bold">{pct(paidCls, expected)}%</span>
                  </div>
                  <Progress value={pct(paidCls, expected)} barClass={paidCls / expected > 0.7 ? 'bg-success' : paidCls / expected > 0.4 ? 'bg-warn' : 'bg-danger'} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Payment modal (with momo steps) */}
      <Modal
        open={!!payForm}
        onClose={() => setPayForm(null)}
        wide
        title={<span className="flex items-center gap-2"><Receipt className="h-4 w-4 text-primary" /> {t('finance.newPayment')} — {payForm?.receiptNo}</span>}
        footer={
          step === 'form' ? (
            <>
              <button className="btn btn-outline btn-md" onClick={() => setPayForm(null)}>{t('common.cancel')}</button>
              <button
                className="btn btn-primary btn-md"
                onClick={() => {
                  if (!payForm?.studentId || !payForm.amount) return toast(t('common.required'), 'error');
                  if (['om', 'wave', 'mtn', 'moov'].includes(payForm.method)) { setStep('momo'); return; }
                  savePayment(false);
                }}
              >
                {['om', 'wave', 'mtn', 'moov'].includes(payForm?.method || '') ? t('finance.pushMomo') : t('common.save')}
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-outline btn-md" onClick={() => setStep('form')}>← {t('nav.back')}</button>
              <button className="btn btn-success btn-md" onClick={() => savePayment(true)}><Smartphone className="h-4 w-4" /> {t('finance.pushMomo')}</button>
            </>
          )
        }
      >
        {payForm && step === 'form' && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t('finance.student')} required className="sm:col-span-2">
              <Select
                value={String(payForm.studentId || '')}
                onChange={(v) => {
                  const s = students.find((x) => x.id === Number(v));
                  const cls = classes.find((c) => c.id === s?.classId);
                  const amount = payForm.category === 'inscription' ? (cls?.fees.inscription || 0) : (cls?.fees.scolarite || 0);
                  setPayForm({ ...payForm, studentId: Number(v), classId: cls?.id, amount, phone: s?.guardianPhone || '' });
                }}
                placeholder="—"
                options={(isParent ? myStudents : students).map((s) => ({ value: String(s.id), label: `${s.lastName.toUpperCase()} ${s.firstName} — ${s.matricule}` }))}
              />
            </Field>
            <Field label={t('finance.category')}>
              <Select
                value={payForm.category}
                onChange={(v) => {
                  const cls = classes.find((c) => c.id === payForm.classId);
                  const amount = (cls?.fees as any)[v] || 0;
                  setPayForm({ ...payForm, category: v, amount });
                }}
                options={CATEGORIES.map((c) => ({ value: c, label: feeLabel(c, t) }))}
              />
            </Field>
            <Field label={`${t('common.amount')} (FCFA)`} required>
              <input type="number" className="input" value={payForm.amount || ''} onChange={(e) => setPayForm({ ...payForm, amount: Number(e.target.value) })} />
            </Field>
            <Field label={t('finance.method')}>
              <Select value={payForm.method} onChange={(v) => setPayForm({ ...payForm, method: v as Payment['method'] })} options={METHODS.map((m) => ({ value: m, label: t(`finance.method.${m}`) }))} />
            </Field>
            <Field label={t('finance.momoSim')} hint={t('finance.momoHint')}>
              <input className="input" placeholder="+221 77 …" value={payForm.phone || ''} onChange={(e) => setPayForm({ ...payForm, phone: e.target.value })} />
            </Field>
            <Field label={t('common.date')}>
              <input type="date" className="input" value={payForm.date} onChange={(e) => setPayForm({ ...payForm, date: e.target.value })} />
            </Field>
            <Field label={t('common.status')}>
              <Select value={payForm.status} onChange={(v) => setPayForm({ ...payForm, status: v as Payment['status'] })} options={[
                { value: 'paid', label: t('finance.status.paid') }, { value: 'pending', label: t('finance.status.pending') }, { value: 'partial', label: t('finance.status.partial') },
              ]} />
            </Field>
          </div>
        )}

        {payForm && step === 'momo' && (
          <div className="py-2">
            <div className="mx-auto max-w-sm rounded-2xl border border-border/70 p-5 text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl text-white" style={{ background: MOMO_COLORS[payForm.method] }}>
                <Smartphone className="h-7 w-7" />
              </span>
              <h3 className="mt-3 text-[15px] font-bold">{t(`finance.method.${payForm.method}`)}</h3>
              <p className="mt-1 text-[12.5px] text-muted-foreground">{t('finance.momoHint')}</p>
              <div className="mt-4 rounded-xl bg-muted/60 p-4 text-left">
                <div className="flex justify-between text-[12.5px]"><span className="text-muted-foreground">{t('finance.momoSim')}</span><span className="font-semibold">{payForm.phone || '—'}</span></div>
                <div className="mt-1.5 flex justify-between text-[12.5px]"><span className="text-muted-foreground">{t('common.amount')}</span><span className="font-extrabold">{fmtMoney(payForm.amount)}</span></div>
                <div className="mt-1.5 flex justify-between text-[12.5px]"><span className="text-muted-foreground">Réf.</span><span className="font-mono text-[11px]">MM-{uid('').toUpperCase().slice(0, 8)}</span></div>
              </div>
              <p className="mt-4 text-[11px] text-muted-foreground">SMS/USSD simulé — démo hors ligne. {t('finance.confirmMomo')}.</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Expense modal */}
      <Modal
        open={!!expForm}
        onClose={() => setExpForm(null)}
        title={<span className="flex items-center gap-2"><TrendingDown className="h-4 w-4 text-danger" /> {t('finance.newExpense')}</span>}
        footer={
          <>
            <button className="btn btn-outline btn-md" onClick={() => setExpForm(null)}>{t('common.cancel')}</button>
            <button className="btn btn-primary btn-md" onClick={saveExpense}>{t('common.save')}</button>
          </>
        }
      >
        {expForm && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t('common.name')} required className="sm:col-span-2">
              <input className="input" value={expForm.label} onChange={(e) => setExpForm({ ...expForm, label: e.target.value })} />
            </Field>
            <Field label={t('finance.category')}>
              <Select value={expForm.category} onChange={(v) => setExpForm({ ...expForm, category: v })} options={EXPENSE_CATS.map((c) => ({ value: c, label: t(`finance.cat${c.charAt(0).toUpperCase()}${c.slice(1)}`) }))} />
            </Field>
            <Field label={`${t('common.amount')} (FCFA)`} required>
              <input type="number" className="input" value={expForm.amount || ''} onChange={(e) => setExpForm({ ...expForm, amount: Number(e.target.value) })} />
            </Field>
            <Field label={t('finance.supplier')}>
              <input className="input" value={expForm.supplier || ''} onChange={(e) => setExpForm({ ...expForm, supplier: e.target.value })} />
            </Field>
            <Field label={t('common.date')}>
              <input type="date" className="input" value={expForm.date} onChange={(e) => setExpForm({ ...expForm, date: e.target.value })} />
            </Field>
          </div>
        )}
      </Modal>
    </div>
  );
}

export function feeLabel(cat: string, t: (k: string) => string): string {
  const key = `finance.fee${cat.charAt(0).toUpperCase()}${cat.slice(1)}`;
  const val = t(key);
  return val.startsWith('finance.') ? cat : val;
}
