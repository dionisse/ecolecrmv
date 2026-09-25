import { db, type SchoolClass, type Subject, type Staff, type User, type Student, type Grade, type Payment, type Expense, type Incident, type Task, type Message, type Notification, type Attendance, defaultFeesFor } from './database';
import { uid, receiptNoSeq, monthKey } from '@/utils/format';

/* Singleton guard: prevents double-seeding under React StrictMode */
let seedPromise: Promise<void> | null = null;
export function ensureSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = seedIfEmpty().catch((err: any) => {
      seedPromise = null;
      console.error('Seed failed:', err?.name, err?.message, err?.inner?.message || '', err?.stack?.split('\n').slice(0, 4).join(' | '));
    });
  }
  return seedPromise;
}

/* Deterministic PRNG so the demo dataset is coherent */
function mulberry32(a: number) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20260925);
const pick = <T>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)];
const ri = (min: number, max: number) => Math.floor(rnd() * (max - min + 1)) + min;

const FIRST_M = ['Amadou', 'Moussa', 'Ibrahima', 'Abdoulaye', 'Cheikh', 'Ousmane', 'Mamadou', 'Ibrahim', 'Seydou', 'Boubacar', 'Adama', 'Souleymane', 'Kofi', 'Kwame', 'Yao', 'Alassane', 'Bakary', 'Dramane', 'Fodé', 'Ismaël', 'Lamine', 'Modibo', 'Saliou', 'Thierno', 'Yacouba'];
const FIRST_F = ['Aminata', 'Fatou', 'Aïcha', 'Mariama', 'Khadija', 'Awa', 'Adjaratou', 'Bintou', 'Ramatoulaye', 'Safiatou', 'Kadiatou', 'Aissatou', 'Coumba', 'Djénéba', 'Fanta', 'Hawa', 'Maimouna', 'Nafissatou', 'Rokia', 'Sokhna', 'Yasmine', 'Zeinab', 'Abibatou', 'Salimata', 'Oumou'];
const LAST = ['Diallo', 'Traoré', 'Koné', 'Sangaré', 'Coulibaly', 'Camara', 'Bah', 'Sow', 'Ba', 'Ndiaye', 'Fall', 'Sarr', 'Diop', 'Gueye', 'Kouyaté', 'Cissé', 'Keita', 'Touré', 'Ouattara', 'Fofana', 'Kanté', 'Doumbia', 'Sidibé', 'Yaméogo', 'Compaoré', 'Ouédraogo', 'Sawadogo', 'Kaboré', 'Zongo', 'Adjei', 'Mensah', 'Akpakpo', 'Dossou', 'Hounkpatin', 'Gnassingbé', 'Bamba', 'Watara', 'Sy', 'Ndiaye', 'Mbaye'];
const CITIES = ['Dakar', 'Abidjan', 'Cotonou', 'Lomé', 'Ouagadougou', 'Bamako', 'Niamey', 'Conakry'];
const QUARTIERS = ['Médina', 'Yoff', 'Plateau', 'Cocody', 'Yopougon', 'Marcory', 'Fidjrossè', 'Agoè', 'Bè', 'Gounghin', 'Dassasgho', 'Hamdallaye', 'Kalaban', 'Liberté VI', 'Nima', 'Adjamé'];

const now = new Date();
const Y = now.getFullYear();
const SCHOOL_YEAR = now.getMonth() >= 8 ? `${Y}-${Y + 1}` : `${Y - 1}-${Y}`;
const iso = (d: Date) => d.toISOString().slice(0, 10);
const daysAgo = (n: number) => { const d = new Date(now); d.setDate(d.getDate() - n); return d; };

export const DEFAULT_SCHOOL = {
  name: 'Groupe Scolaire Les Baobabs',
  motto: 'Savoir · Discipline · Excellence',
  phone: '+221 77 123 45 67',
  email: 'contact@lesbaobabs.edu',
  address: 'Bd du Centenaire, Dakar',
  year: SCHOOL_YEAR,
};

export async function seedIfEmpty() {
  const count = await db.students.count();
  const seeded = await db.meta.get('seeded');
  if (count > 0 && seeded) return;

  await db.transaction('rw', db.tables, async () => {
    for (const t of db.tables) await t.clear();

    /* ---------- Classes ---------- */
    const classDefs: Array<[string, string, SchoolClass['module'], number]> = [
      ['CP1', 'CI', 'primary', 30], ['CP2', 'CE', 'primary', 28], ['CE1', 'CE1', 'primary', 30],
      ['CE2', 'CE2', 'primary', 28], ['CM1', 'CM1', 'primary', 26], ['CM2', 'CM2', 'primary', 26],
      ['6ème A', '6ème', 'secondary', 40], ['5ème A', '5ème', 'secondary', 40], ['4ème A', '4ème', 'secondary', 38],
      ['3ème A', '3ème', 'secondary', 38], ['2nde S', '2nde', 'secondary', 35], ['Tle S', 'Terminale', 'secondary', 32],
      ['L1 Gestion', 'Licence 1', 'university', 60], ['L2 Gestion', 'Licence 2', 'university', 55],
      ['L3 Éco', 'Licence 3', 'university', 45], ['M2 Management', 'Master 2', 'university', 30],
    ];
    const classIds: number[] = [];
    for (const [name, level, module, capacity] of classDefs) {
      const id = await db.classes.add({
        name, level, module, capacity,
        room: module === 'university' ? `Amphi ${ri(1, 4)}` : `Salle ${ri(1, 20)}`,
        fees: defaultFeesFor(module),
      } as SchoolClass);
      classIds.push(id);
    }
    const pIds = classIds.slice(0, 6), sIds = classIds.slice(6, 12), uIds = classIds.slice(12);

    /* ---------- Staff ---------- */
    const staffDefs: Array<[string, Staff['role'], string, string, number]> = [
      ['Dr Awa Ndiaye', 'director', 'all', 'Doctorat Sciences de l’Éducation', 650000],
      ['M. Issouf Ouédraogo', 'censor', 'secondary', 'Master Éducation', 320000],
      ['Mme Rokia Kanté', 'discipline', 'secondary', 'Licence Droit', 280000],
      ['Mme Salimata Fall', 'accountant', 'all', 'Master Finance (UCAD)', 350000],
      ['M. Karim Sow', 'secretary', 'all', 'BTS Secretariat', 180000],
      ['M. Yao Mensah', 'teacher', 'primary', 'CAPE', 160000],
      ['Mme Aminata Diallo', 'teacher', 'primary', 'CAPE', 155000],
      ['M. Moussa Traoré', 'teacher', 'secondary', 'Master Maths', 240000],
      ['Mme Fatou Camara', 'teacher', 'secondary', 'Master Lettres', 230000],
      ['M. Kofi Adjei', 'teacher', 'secondary', 'Master Physique', 240000],
      ['Mme Aïcha Koné', 'teacher', 'secondary', 'Master Anglais', 220000],
      ['M. Ibrahima Sarr', 'teacher', 'university', 'Doctorat Économie', 480000],
      ['Mme Mariama Bâ', 'teacher', 'university', 'Doctorat Gestion', 470000],
      ['M. Seydou Bamba', 'staff', 'all', 'Baccalauréat', 120000],
      ['Mme Hawa Coulibaly', 'staff', 'all', 'Baccalauréat', 110000],
    ];
    const staffIds: number[] = [];
    for (const [name, role, module, diploma, salary] of staffDefs) {
      const id = await db.staff.add({
        name, role, module: module as Staff['module'], diploma, salary,
        hiredAt: iso(new Date(Y - ri(1, 12), ri(0, 10), ri(1, 27))),
        email: name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z ]/g, '').split(' ').filter(Boolean).slice(-1)[0] + '.' + name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z ]/g, '').split(' ').filter(Boolean)[0] + '@lesbaobabs.edu',
        phone: `+221 7${ri(0, 8)} ${ri(100, 999)} ${ri(10, 99)} ${ri(10, 99)}`,
        address: `Quartier ${pick(QUARTIERS)}, ${pick(CITIES)}`,
        speciality: role === 'teacher' ? diploma.replace('Master ', '').replace('Doctorat ', '') : undefined,
        active: 1,
      } as Staff);
      staffIds.push(id);
    }
    const [directorId, censorId, discId, accountId, secrId, ...teacherIds] = staffIds;

    // assign main teachers
    for (let i = 0; i < classIds.length; i++) {
      const cls = await db.classes.get(classIds[i]);
      const module = cls!.module;
      const pool = (await db.staff.where('role').equals('teacher').toArray()).filter((s) => s.module === module);
      await db.classes.update(classIds[i], { mainTeacherId: pool[i % Math.max(pool.length, 1)]?.id });
    }

    /* ---------- Users ---------- */
    const mkColor = () => pick(['#f97316', '#0ea5e9', '#8b5cf6', '#10b981', '#e11d48', '#d97706']);
    const users: User[] = [
      { name: 'Dr Awa Ndiaye', email: 'admin@ecole.cm', password: 'admin123', role: 'admin', phone: '+221 77 100 00 01', avatarColor: '#f97316', active: 1 },
      { name: 'Moussa Traoré', email: 'prof@ecole.cm', password: 'prof123', role: 'teacher', staffId: String(teacherIds[0]), avatarColor: '#0ea5e9', active: 1 },
      { name: 'Cheikh Fall', email: 'parent@ecole.cm', password: 'parent123', role: 'parent', phone: '+221 76 555 12 34', childIds: [], avatarColor: '#8b5cf6', active: 1 },
      { name: 'Salimata Fall', email: 'compta@ecole.cm', password: 'compta123', role: 'accountant', staffId: String(accountId), avatarColor: '#10b981', active: 1 },
      { name: 'Karim Sow', email: 'secretariat@ecole.cm', password: 'secretaire123', role: 'secretary', staffId: String(secrId), avatarColor: '#d97706', active: 1 },
      { name: 'Rokia Kanté', email: 'discipline@ecole.cm', password: 'discipline123', role: 'discipline', staffId: String(discId), avatarColor: '#e11d48', active: 1 },
      { name: 'Issouf Ouédraogo', email: 'censeur@ecole.cm', password: 'censeur123', role: 'censor', staffId: String(censorId), avatarColor: '#6366f1', active: 1 },
    ];
    const userIds: number[] = [];
    for (const u of users) userIds.push(await db.users.add(u));

    /* ---------- Subjects ---------- */
    const subjectDefs: Array<[string, string, Subject['module'], number, number]> = [
      ['Mathématiques', 'MATH', 'primary', 2, 10], ['Français', 'FR', 'primary', 2, 10],
      ['Éveil au milieu', 'EM', 'primary', 1, 10], ['Éducation physique', 'EPS', 'primary', 1, 10],
      ['Anglais', 'ANG', 'primary', 1, 10],
      ['Mathématiques', 'MATH', 'secondary', 4, 20], ['Français', 'FR', 'secondary', 4, 20],
      ['Anglais', 'ANG', 'secondary', 2, 20], ['Physique-Chimie', 'PC', 'secondary', 3, 20],
      ['Sciences de la Vie et de la Terre', 'SVT', 'secondary', 3, 20],
      ['Histoire-Géographie', 'HG', 'secondary', 2, 20], ['Philosophie', 'PHILO', 'secondary', 2, 20],
      ['Éducation physique', 'EPS', 'secondary', 1, 20], ['Informatique', 'INFO', 'secondary', 1, 20],
      ['Analyse Mathématique', 'ANA', 'university', 3, 20], ['Comptabilité Générale', 'CG', 'university', 3, 20],
      ['Microéconomie', 'MICRO', 'university', 2, 20], ['Macroéconomie', 'MACRO', 'university', 2, 20],
      ['Droit des affaires UEMOA', 'DROIT', 'university', 2, 20], ['Statistiques', 'STAT', 'university', 2, 20],
      ['Anglais technique', 'ANGT', 'university', 1, 20],
    ];
    const subjectIds: number[] = [];
    for (const [name, code, module, coefficient, maxScore] of subjectDefs) {
      const pool = module === 'primary' ? [teacherIds[0], teacherIds[1]] : module === 'secondary' ? [teacherIds[0], teacherIds[1], teacherIds[2], teacherIds[3], teacherIds[4]] : [teacherIds[5], teacherIds[6]];
      subjectIds.push(await db.subjects.add({ name, code, module, coefficient, maxScore, teacherId: pool[ri(0, pool.length - 1)] } as Subject));
    }
    const primSubj = subjectIds.slice(0, 5), secSubj = subjectIds.slice(5, 14), uniSubj = subjectIds.slice(14);

    /* ---------- Students ---------- */
    const students: Student[] = [];
    let seq = 1;
    for (const cid of classIds) {
      const cls = await db.classes.get(cid);
      const n = Math.round(cls!.capacity * (0.7 + rnd() * 0.25));
      for (let i = 0; i < n; i++) {
        const gender: 'M' | 'F' = rnd() < 0.51 ? 'M' : 'F';
        const firstName = gender === 'M' ? pick(FIRST_M) : pick(FIRST_F);
        const lastName = pick(LAST);
        const module = cls!.module;
        const ageBase = module === 'primary' ? 8 : module === 'secondary' ? 15 : 21;
        const birth = new Date(Y - ageBase - ri(0, 2), ri(0, 11), ri(1, 28));
        students.push({
          matricule: '', // set after we know index
          firstName, lastName, gender,
          birthDate: iso(birth),
          birthPlace: pick(CITIES),
          classId: cid,
          module,
          guardianName: `${pick(FIRST_M)} ${lastName}`,
          guardianPhone: `+221 7${ri(0, 8)} ${ri(100, 999)} ${ri(10, 99)} ${ri(10, 99)}`,
          guardianEmail: `parent${seq}@mail.com`,
          address: `${pick(QUARTIERS)}, ${pick(CITIES)}`,
          enrolledAt: iso(new Date(now.getMonth() >= 8 ? Y : Y - 1, 8, ri(1, 30))),
          status: 'active',
          photoColor: mkColor(),
        });
        seq++;
      }
    }
    const studentIds: number[] = [];
    for (let i = 0; i < students.length; i++) {
      students[i].matricule = `${students[i].module === 'primary' ? 'P' : students[i].module === 'secondary' ? 'S' : 'U'}${SCHOOL_YEAR.slice(0, 4)}-${String(i + 1).padStart(4, '0')}`;
      studentIds.push(await db.students.add(students[i]));
    }

    // link the demo parent to 2 students from Tle S & CM2
    const tle = students.findIndex((s) => s.classId === classIds[11]);
    const cm2 = students.findIndex((s) => s.classId === classIds[5]);
    const childIds = [studentIds[tle < 0 ? 0 : tle], studentIds[cm2 < 0 ? 1 : cm2]];
    await db.users.update(userIds[2], { childIds: childIds.map(String) });

    /* ---------- Grades (term 1, all students × subjects of their module, 2 evals) ---------- */
    const evals = ['Devoir 1', 'Devoir 2', 'Composition'];
    const grades: Grade[] = [];
    const allSubjects = await db.subjects.toArray();
    const subjMap = new Map(allSubjects.map((x) => [x.id, x]));
    for (let si = 0; si < students.length; si++) {
      const s = students[si];
      const cls = s.classId!;
      const subj = s.module === 'primary' ? primSubj : s.module === 'secondary' ? secSubj : uniSubj;
      // per-student ability to make realistic averages
      const ability = 0.45 + rnd() * 0.5;
      for (const sid of subj) {
        const subject = subjMap.get(sid)!;
        for (let e = 0; e < 3; e++) {
          const score = Math.min(subject!.maxScore, Math.max(0, Math.round((subject!.maxScore * (ability + (rnd() - 0.5) * 0.24)) * 2) / 2));
          grades.push({
            studentId: studentIds[students.indexOf(s)],
            subjectId: sid, classId: cls, term: 1,
            evaluation: evals[e], score, maxScore: subject!.maxScore,
            coefficient: subject!.coefficient,
            date: iso(daysAgo(ri(15, 90))), teacherId: subject!.teacherId,
          });
        }
      }
    }
    // bulk in chunks
    for (let i = 0; i < grades.length; i += 2000) await db.grades.bulkAdd(grades.slice(i, i + 2000));

    /* ---------- Attendance (last 18 school days, sample classes) ---------- */
    const att: Attendance[] = [];
    const sampleClasses = [classIds[5], classIds[11], classIds[9]];
    for (let d = 1; d <= 24; d++) {
      const date = daysAgo(d);
      if (date.getDay() === 0) continue;
      for (const cid of sampleClasses) {
        const clsStudents = students.map((s, i) => ({ s, i })).filter((x) => x.s.classId === cid);
        for (const { s, i } of clsStudents) {
          const r = rnd();
          const status: Attendance['status'] = r < 0.9 ? 'present' : r < 0.96 ? 'absent' : 'late';
          att.push({ studentId: studentIds[i], classId: cid, date: iso(date), status, justified: status === 'absent' ? rnd() < 0.4 : undefined });
        }
      }
    }
    for (let i = 0; i < att.length; i += 2000) await db.attendance.bulkAdd(att.slice(i, i + 2000));

    /* ---------- Payments ---------- */
    const methods: Payment['method'][] = ['om', 'wave', 'mtn', 'moov', 'cash', 'transfer'];
    const payments: Payment[] = [];
    let paySeq = 1;
    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      const cls = await db.classes.get(s.classId!);
      const nb = ri(1, 4);
      for (let k = 0; k < nb; k++) {
        const cat = k === 0 ? 'inscription' : 'scolarite';
        const base = cat === 'inscription' ? cls!.fees.inscription : cls!.fees.scolarite;
        const full = rnd() < 0.72;
        const amount = full ? base : Math.round(base * (0.3 + rnd() * 0.5) / 500) * 500;
        payments.push({
          receiptNo: receiptNoSeq(paySeq++),
          studentId: studentIds[i],
          classId: s.classId,
          category: cat,
          amount,
          method: pick(methods),
          phone: s.guardianPhone,
          date: iso(daysAgo(ri(0, 150))),
          term: cat === 'scolarite' ? (ri(1, 2) as 1 | 2) : undefined,
          status: full ? 'paid' : 'partial',
          cashierId: userIds[3],
          reference: cat === 'inscription' ? undefined : `MO-${uid('').toUpperCase().slice(0, 8)}`,
        });
      }
    }
    payments.sort((a, b) => b.date.localeCompare(a.date));
    for (let i = 0; i < payments.length; i += 2000) await db.payments.bulkAdd(payments.slice(i, i + 2000));

    /* ---------- Expenses ---------- */
    const expenseDefs: Array<[string, Expense['category'], number]> = [
      ['Salaires enseignants', 'salary', 1850000], ['Salaires administration', 'salary', 800000],
      ['Facture SENELEC', 'utilities', 210000], ['Facture SONEB / eau', 'utilities', 85000],
      ['Internet & fibre', 'utilities', 75000], ['Loyer annexe', 'rent', 250000],
      ['Fournitures papier', 'supplies', 120000], ['Manuels scolaires', 'supplies', 420000],
      ['Produits d’entretien', 'supplies', 45000], ['Réparation climatiseurs', 'maintenance', 95000],
      ['Carburant bus scolaire', 'maintenance', 150000], ['Panneaux signalétique', 'other', 65000],
    ];
    for (let m = 0; m < 5; m++) {
      for (const [label, category, base] of expenseDefs) {
        if (m === 0 && rnd() < 0.35) continue;
        await db.expenses.add({
          label, category,
          amount: Math.round(base * (0.85 + rnd() * 0.3) / 500) * 500,
          date: iso(new Date(now.getFullYear(), now.getMonth() - m, ri(1, 27))),
          supplier: category === 'salary' ? 'Masse salariale' : pick(['SENELEC', 'Sonatel', 'Librairie Notre Dame', 'GAINE 2 SARL', 'Quincaillerie Teranga', 'Total Energies']),
          proof: `PIECE-${ri(1000, 9999)}`,
        } as Expense);
      }
    }

    /* ---------- Incidents ---------- */
    const types = ['lateness', 'absence', 'fight', 'cheating', 'insubordination', 'vandalism', 'other'];
    const sanctions = ['none', 'warning', 'detention', 'exclusion', 'council'];
    for (let i = 0; i < 22; i++) {
      const idx = ri(0, students.length - 1);
      const s = students[idx];
      const type = pick(types);
      const severity: Incident['severity'] = type === 'fight' || type === 'vandalism' ? pick(['moderate', 'serious'] as const) : pick(['low', 'moderate'] as const);
      await db.incidents.add({
        studentId: studentIds[idx], classId: s.classId,
        date: iso(daysAgo(ri(0, 60))),
        type, severity,
        description: type === 'lateness' ? 'Arrivé(e) en retard au portail' : type === 'fight' ? 'Bagarre à la récréation' : type === 'cheating' ? 'Fraude constatée pendant la composition' : 'Fait signalé par un enseignant',
        sanction: severity === 'serious' ? pick(['exclusion', 'council'] as const) : severity === 'moderate' ? pick(['warning', 'detention'] as const) : pick(['none', 'warning'] as const),
        status: rnd() < 0.7 ? 'resolved' : 'open',
        reportedById: userIds[5],
      } as Incident);
    }

    /* ---------- Tasks ---------- */
    const tasks: Task[] = [
      { title: 'Préparer le conseil de classe du CM2', assigneeId: userIds[0], due: iso(daysAgo(-3)), priority: 'high', done: 0, module: 'primary' },
      { title: 'Relancer les paiements de scolarité en retard (6ème A)', assigneeId: userIds[3], due: iso(daysAgo(-2)), priority: 'high', done: 0, module: 'secondary' },
      { title: 'Imprimer les bulletins du 1er semestre', assigneeId: userIds[4], due: iso(daysAgo(-6)), priority: 'normal', done: 0, module: 'all' },
      { title: 'Convocation des parents — incidents ouverts', assigneeId: userIds[5], due: iso(daysAgo(-1)), priority: 'high', done: 0, module: 'secondary' },
      { title: 'Mettre à jour la liste des matières du L2', assigneeId: userIds[6], due: iso(daysAgo(-8)), priority: 'low', done: 0, module: 'university' },
      { title: 'Saisir les notes du Devoir 2 (4ème A)', assigneeId: userIds[1], due: iso(daysAgo(-4)), priority: 'normal', done: 0, module: 'secondary' },
      { title: 'Inventaire des fournitures du stock', assigneeId: userIds[4], due: iso(daysAgo(2)), priority: 'low', done: 1, module: 'all' },
      { title: 'Versement des salaires du mois', assigneeId: userIds[3], due: iso(daysAgo(1)), priority: 'high', done: 1, module: 'all' },
    ];
    for (const t of tasks) await db.tasks.add(t);

    /* ---------- Messages & notifications ---------- */
    const messages: Message[] = [
      { title: 'Réunion de parents d’élèves — CM2', body: 'Chers parents, la réunion trimestrielle se tiendra samedi à 9h dans la cour centrale. Présence fortement recommandée.', audience: 'parents', date: iso(daysAgo(2)), channel: 'push', sentById: userIds[0] },
      { title: 'Publication des notes du Devoir 2', body: 'Les notes du deuxième devoir sont désormais disponibles sur les portails.', audience: 'students', date: iso(daysAgo(4)), channel: 'portal', sentById: userIds[1] },
      { title: 'Rappel : paiement de la scolarité de février', body: 'Merci de régulariser les paiements avant le 10 du mois. Mobile Money accepté : Orange Money, Wave, MTN MoMo, Moov.', audience: 'parents', date: iso(daysAgo(6)), channel: 'push', sentById: userIds[3] },
      { title: 'Réunion pédagogique des enseignants', body: 'Réunion vendredi à 16h en salle des professeurs.', audience: 'teachers', date: iso(daysAgo(8)), channel: 'portal', sentById: userIds[0] },
    ];
    for (const m of messages) await db.messages.add(m);

    const notifs: Notification[] = [
      { title: 'Nouveau paiement reçu', body: 'Wave — 150 000 FCFA encaissés (frais de scolarité).', date: iso(daysAgo(0)), forRole: 'admin', read: 0 },
      { title: '3 incidents ouverts', body: 'Des incidents attendent une décision du conseil de discipline.', date: iso(daysAgo(1)), forRole: 'discipline', read: 0 },
      { title: 'Bulletin disponible', body: 'Le bulletin du 1er semestre est prêt à être consulté.', date: iso(daysAgo(2)), forRole: 'parent', read: 0 },
      { title: 'Sauvegarde locale effectuée', body: 'Les données ont été sauvegardées automatiquement sur cet appareil.', date: iso(daysAgo(3)), forRole: 'all', read: 1 },
    ];
    for (const n of notifs) await db.notifications.add(n);

    /* ---------- Stats meta ---------- */
    // fake historical enrollment for the chart (per year)
    const years: Array<[string, number, number, number]> = [
      [`${Y - 5}-${Y - 4}`, 410, 380, 120], [`${Y - 4}-${Y - 3}`, 445, 402, 140],
      [`${Y - 3}-${Y - 2}`, 470, 431, 180], [`${Y - 2}-${Y - 1}`, 521, 466, 205],
      [`${Y - 1}-${Y}`, 560, 497, 240],
    ];
    await db.meta.bulkPut([
      { key: 'seeded', value: true },
      { key: 'school', value: DEFAULT_SCHOOL },
      { key: 'history', value: years },
      { key: 'syncQueue', value: 0 },
      { key: 'lastSync', value: new Date().toISOString() },
      { key: 'monthKey', value: monthKey() },
    ]);
  });
}
