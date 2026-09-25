import Dexie, { type Table } from 'dexie';
import { uid, receiptNo } from '@/utils/format';

/* =========================== Types =========================== */

export type ModuleKind = 'primary' | 'secondary' | 'university';

export type Role =
  | 'admin' | 'director' | 'teacher' | 'parent' | 'accountant'
  | 'secretary' | 'discipline' | 'censor' | 'staff';

export interface User {
  id?: number;
  name: string;
  email: string;
  password: string; // demo-only (real backend hashes + salts)
  role: Role;
  phone?: string;
  avatarColor?: string;
  staffId?: string;   // link to staff member
  childIds?: string[]; // link to students (parents)
  lang?: 'fr' | 'en';
  active: 1 | 0;
}

export interface Staff {
  id?: number;
  name: string;
  role: Role;
  module: ModuleKind | 'all';
  email?: string;
  phone?: string;
  address?: string;
  diploma?: string;
  speciality?: string;
  salary: number;
  hiredAt: string;
  subjects?: string[]; // subject ids
  classIds?: string[]; // classes taught / led
  active: 1 | 0;
}

export interface SchoolClass {
  id?: number;
  name: string;              // e.g. "CM2 A", "3ème B", "L1 Gestion"
  level: string;             // e.g. "CM2", "3ème", "L1"
  module: ModuleKind;
  capacity: number;
  mainTeacherId?: number;    // staff id
  room?: string;
  fees: { inscription: number; scolarite: number; cantine?: number; transport?: number; examen?: number };
}

export interface Subject {
  id?: number;
  name: string;
  code: string;
  module: ModuleKind;
  coefficient: number;
  maxScore: number;          // 10 (primary), 20 (secondary/univ)
  classIds?: number[];
  teacherId?: number;
}

export interface Student {
  id?: number;
  matricule: string;
  firstName: string;
  lastName: string;
  gender: 'M' | 'F';
  birthDate: string;
  birthPlace?: string;
  classId?: number;
  module: ModuleKind;
  guardianName: string;
  guardianPhone: string;
  guardianEmail?: string;
  address?: string;
  enrolledAt: string;
  status: 'active' | 'inactive' | 'graduated' | 'left';
  photoColor?: string;
}

export interface Grade {
  id?: number;
  studentId: number;
  subjectId: number;
  classId: number;
  term: 1 | 2 | 3;
  evaluation: string;        // "Devoir 1", "Composition", "Examen"…
  score: number;
  maxScore: number;
  coefficient: number;
  date: string;
  teacherId?: number;
}

export interface Attendance {
  id?: number;
  studentId: number;
  classId: number;
  date: string;
  status: 'present' | 'absent' | 'late';
  justified?: boolean;
  note?: string;
}

export interface Payment {
  id?: number;
  receiptNo: string;
  studentId: number;
  classId?: number;
  category: string;   // inscription | scolarite | cantine | transport | uniforme | examen | reinSCRIPTION…
  amount: number;
  method: 'om' | 'wave' | 'mtn' | 'moov' | 'cash' | 'transfer' | 'check' | 'card';
  phone?: string;     // momo number
  reference?: string;
  date: string;
  term?: 1 | 2 | 3;
  status: 'paid' | 'pending' | 'partial' | 'failed';
  cashierId?: number;
  note?: string;
}

export interface Expense {
  id?: number;
  label: string;
  category: string; // salary | utilities | rent | supplies | maintenance | other
  amount: number;
  date: string;
  supplier?: string;
  proof?: string;
  note?: string;
}

export interface Incident {
  id?: number;
  studentId: number;
  classId?: number;
  date: string;
  type: string;
  severity: 'low' | 'moderate' | 'serious';
  description: string;
  sanction: string;   // none | warning | detention | exclusion | council
  status: 'open' | 'resolved';
  reportedById?: number;
}

export interface Message {
  id?: number;
  title: string;
  body: string;
  audience: 'parents' | 'teachers' | 'students' | 'all' | 'staff';
  studentId?: number;   // targeted parent message
  date: string;
  sentById?: number;
  channel: 'push' | 'sms' | 'portal';
}

export interface Task {
  id?: number;
  title: string;
  assigneeId?: number;   // user id
  role?: Role;
  due: string;
  priority: 'low' | 'normal' | 'high';
  done: 1 | 0;
  module?: ModuleKind | 'all';
}

export interface Notification {
  id?: number;
  title: string;
  body: string;
  date: string;
  forRole?: Role | 'all';
  read: 1 | 0;
}

/* =========================== DB =========================== */

class EcoleDB extends Dexie {
  users!: Table<User, number>;
  staff!: Table<Staff, number>;
  classes!: Table<SchoolClass, number>;
  subjects!: Table<Subject, number>;
  students!: Table<Student, number>;
  grades!: Table<Grade, number>;
  attendance!: Table<Attendance, number>;
  payments!: Table<Payment, number>;
  expenses!: Table<Expense, number>;
  incidents!: Table<Incident, number>;
  messages!: Table<Message, number>;
  tasks!: Table<Task, number>;
  notifications!: Table<Notification, number>;
  meta!: Table<{ key: string; value: unknown }, string>;

  constructor() {
    super('ecolecrm');
    this.version(1).stores({
      users: '++id, &email, role, staffId',
      staff: '++id, name, role, module',
      classes: '++id, name, module, mainTeacherId',
      subjects: '++id, name, module, code',
      students: '++id, &matricule, lastName, firstName, classId, module, status',
      grades: '++id, studentId, subjectId, classId, term, date',
      attendance: '++id, studentId, classId, date, status',
      payments: '++id, &receiptNo, studentId, date, status, method',
      expenses: '++id, date, category',
      incidents: '++id, studentId, date, severity, status',
      messages: '++id, date, audience',
      tasks: '++id, assigneeId, due, done',
      notifications: '++id, date, read',
      meta: '&key',
    });
  }
}

export const db = new EcoleDB();

export const TABLES = [
  'users', 'staff', 'classes', 'subjects', 'students', 'grades', 'attendance',
  'payments', 'expenses', 'incidents', 'messages', 'tasks', 'notifications',
] as const;

export async function backupAll(): Promise<Record<string, unknown[]>> {
  const out: Record<string, unknown[]> = {};
  for (const t of TABLES) out[t] = await (db as any)[t].toArray();
  out['meta'] = await db.meta.toArray();
  return out;
}

export async function restoreAll(data: Record<string, unknown[]>) {
  await db.transaction('rw', db.tables, async () => {
    for (const t of TABLES) {
      if (Array.isArray(data[t])) {
        await (db as any)[t].clear();
        await (db as any)[t].bulkAdd(data[t]);
      }
    }
    if (Array.isArray(data['meta'])) {
      await db.meta.clear();
      await db.meta.bulkAdd(data['meta'] as any);
    }
  });
}

export async function wipeAll() {
  await db.transaction('rw', db.tables, async () => {
    for (const t of db.tables) await t.clear();
  });
}

/* Fees helpers */
export const FEE_KEYS = ['inscription', 'scolarite', 'cantine', 'transport', 'examen'] as const;
export type FeeKey = (typeof FEE_KEYS)[number];

export const defaultFeesFor = (module: ModuleKind) => ({
  inscription: module === 'primary' ? 15000 : module === 'secondary' ? 25000 : 50000,
  scolarite: module === 'primary' ? 8000 : module === 'secondary' ? 15000 : 35000,
  cantine: module === 'primary' ? 6000 : undefined,
  transport: module === 'secondary' ? 7000 : undefined,
  examen: module === 'university' ? 15000 : 5000,
});

export { receiptNo };
