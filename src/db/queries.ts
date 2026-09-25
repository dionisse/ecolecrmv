import type { Student, Grade, Payment, Expense, Incident, SchoolClass, Attendance, Staff } from './database';
import { lastNMonths, monthKey } from '@/utils/format';

export const fullName = (s?: Student) => (s ? `${s.lastName.toUpperCase()} ${s.firstName}` : '—');

export function studentAverage(grades: Grade[], studentId: number, term = 1): { avg: number; weighted: number; coefSum: number } | null {
  const g = grades.filter((x) => x.studentId === studentId && x.term === term);
  if (!g.length) return null;
  // group by subject: average scores first, then weight by coefficient
  const bySubject: Record<number, { sum: number; n: number; coef: number; max: number }> = {};
  for (const x of g) {
    const b = (bySubject[x.subjectId] ??= { sum: 0, n: 0, coef: x.coefficient, max: x.maxScore });
    b.sum += x.score; b.n++;
  }
  let wSum = 0, cSum = 0, maxSum = 0;
  for (const b of Object.values(bySubject)) {
    const on20 = (b.sum / b.n) * (20 / b.max);
    wSum += on20 * b.coef; cSum += b.coef; maxSum += 20 * b.coef;
  }
  return { avg: cSum ? wSum / cSum : 0, weighted: wSum, coefSum: cSum };
}

export function classRanking(students: Student[], grades: Grade[], classId: number, term = 1): Array<{ student: Student; avg: number; weighted: number; coefSum: number; rank: number }> {
  const inClass = students.filter((s) => s.classId === classId);
  const rows = inClass
    .map((s) => ({ student: s, ...studentAverage(grades, s.id!, term) }))
    .filter((r) => r.avg !== null) as Array<{ student: Student; avg: number; weighted: number; coefSum: number }>;
  rows.sort((a, b) => b.avg - a.avg);
  return rows.map((r, i) => ({ ...r, rank: i + 1 }));
}

export function classAverage(students: Student[], grades: Grade[], classId: number, term = 1): number {
  const rows = classRanking(students, grades, classId, term);
  if (!rows.length) return 0;
  return Math.round((rows.reduce((a, r) => a + r.avg, 0) / rows.length) * 100) / 100;
}

export function paymentsByMonth(payments: Payment[], n = 6): Array<{ month: string; total: number }> {
  const months = lastNMonths(n);
  return months.map((m) => ({
    month: m,
    total: payments.filter((p) => p.date.startsWith(m) && p.status !== 'failed').reduce((a, p) => a + p.amount, 0),
  }));
}

export function expensesByMonth(expenses: Expense[], n = 6): Array<{ month: string; total: number }> {
  const months = lastNMonths(n);
  return months.map((m) => ({
    month: m,
    total: expenses.filter((e) => e.date.startsWith(m)).reduce((a, e) => a + e.amount, 0),
  }));
}

export function sumInMonth(items: Array<{ date: string; amount: number }>): number {
  const mk = monthKey();
  return items.filter((x) => x.date.startsWith(mk)).reduce((a, x) => a + x.amount, 0);
}

export function studentBalance(student: Student, cls: SchoolClass | undefined, payments: Payment[]): number {
  if (!cls) return 0;
  const expected =
    (cls.fees.inscription || 0) +
    (cls.fees.scolarite || 0) * 9 + // 9 months
    (cls.fees.cantine || 0) * 9 +
    (cls.fees.transport || 0) * 9 +
    (cls.fees.examen || 0);
  const paid = payments.filter((p) => p.studentId === student.id && p.status !== 'failed').reduce((a, p) => a + p.amount, 0);
  return Math.max(0, expected - paid);
}

export function expectedThisMonth(classes: SchoolClass[], students: Student[]): number {
  const mk = monthKey();
  let total = 0;
  for (const s of students) {
    if (s.status !== 'active') continue;
    const cls = classes.find((c) => c.id === s.classId);
    if (!cls) continue;
    total += (cls.fees.scolarite || 0) + (cls.fees.cantine || 0) + (cls.fees.transport || 0);
    void mk;
  }
  return total;
}

export function attendanceRate(attendance: Attendance[], classId?: number, studentId?: number, n = 30): { present: number; absent: number; late: number; rate: number } {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - n);
  const rows = attendance.filter((a) =>
    new Date(a.date) >= cutoff &&
    (!classId || a.classId === classId) &&
    (!studentId || a.studentId === studentId)
  );
  const present = rows.filter((r) => r.status === 'present').length;
  const absent = rows.filter((r) => r.status === 'absent').length;
  const late = rows.filter((r) => r.status === 'late').length;
  const total = present + absent + late;
  return { present, absent, late, rate: total ? Math.round((present / total) * 1000) / 10 : 100 };
}

export function staffAttendanceRate(staff: Staff[], attendance: Attendance[]): number {
  // proxy: teachers' attendance mirrors global class attendance
  void staff;
  return attendanceRate(attendance).rate;
}

export function incidentsByType(incidents: Incident[]): Array<{ type: string; count: number }> {
  const map: Record<string, number> = {};
  for (const i of incidents) map[i.type] = (map[i.type] || 0) + 1;
  return Object.entries(map).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count);
}

export function methodSplit(payments: Payment[]): Array<{ name: string; value: number; color: string }> {
  const colors: Record<string, string> = {
    om: '#f97316', wave: '#0ea5e9', mtn: '#eab308', moov: '#8b5cf6',
    cash: '#64748b', transfer: '#10b981', check: '#e11d48', card: '#6366f1',
  };
  const map: Record<string, number> = {};
  for (const p of payments) if (p.status === 'paid' || p.status === 'partial') map[p.method] = (map[p.method] || 0) + p.amount;
  return Object.entries(map)
    .map(([name, value]) => ({ name, value, color: colors[name] || '#94a3b8' }))
    .sort((a, b) => b.value - a.value);
}

export const enrollmentByModule = (students: Student[]) => ({
  primary: students.filter((s) => s.module === 'primary').length,
  secondary: students.filter((s) => s.module === 'secondary').length,
  university: students.filter((s) => s.module === 'university').length,
});

export const passRate = (students: Student[], grades: Grade[], term = 1): number => {
  const withAvg = students.map((s) => studentAverage(grades, s.id!, term)).filter(Boolean) as Array<{ avg: number }>;
  if (!withAvg.length) return 0;
  return Math.round((withAvg.filter((a) => a.avg >= 10).length / withAvg.length) * 100);
};

export function gradeTrendByMonth(grades: Grade[], n = 6): Array<{ month: string; avg: number }> {
  const months = lastNMonths(n);
  return months.map((m) => {
    const g = grades.filter((x) => x.date.startsWith(m));
    const avg = g.length ? g.reduce((a, x) => a + (x.score / x.maxScore) * 20, 0) / g.length : 0;
    return { month: m, avg: Math.round(avg * 10) / 10 };
  });
}
