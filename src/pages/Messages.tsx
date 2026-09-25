import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Bell, Send, Megaphone, MessageSquareText } from 'lucide-react';
import { db, type Message } from '@/db/database';
import { useI18n } from '@/i18n/I18nContext';
import { useAuth } from '@/state/auth';
import { useToast } from '@/state/toast';
import { useOnline, queueOperation } from '@/state/sync';
import { fmtDateTime, nowIso } from '@/utils/format';
import { PageHeader, Modal, Field, Select, Tabs, Empty } from '@/components/ui';

const TEMPLATES = [
  { id: 'tpl.absence', title: 'Absence signalée', body: 'Bonjour, votre enfant a été signalé absent aujourd’hui. Merci de contacter le secrétariat.' },
  { id: 'tpl.payment', title: 'Rappel de paiement', body: 'Bonjour, merci de régulariser les frais de scolarité. Orange Money, Wave, MTN et Moov acceptés.' },
  { id: 'tpl.meeting', title: 'Convocation réunion', body: 'Vous êtes convié(e) à la réunion de l’école. Merci de votre présence.' },
  { id: 'tpl.grades', title: 'Publication des notes', body: 'Les notes du devoir viennent d’être publiées sur le portail.' },
];

export default function Messages() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();
  const online = useOnline();

  const messages = useLiveQuery(() => db.messages.orderBy('date').reverse().toArray(), []) || [];
  const [tab, setTab] = useState('history');
  const [form, setForm] = useState<Message | null>(null);

  const canSend = user?.role !== 'parent' && user?.role !== 'staff';

  const send = async () => {
    if (!form || !form.title || !form.body) return toast(t('common.required'), 'error');
    const m: Message = { ...form, date: nowIso(), sentById: user?.id };
    await db.messages.add(m);
    await db.notifications.add({ title: m.title, body: m.body.slice(0, 90), date: nowIso(), forRole: 'all', read: 0 });
    // browser push simulation
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`EcoleCRM — ${m.title}`, { body: m.body, icon: './icons/icon-192.png' });
      }
    } catch {}
    if (!online) queueOperation();
    toast(t('msg.sentOk'));
    setForm(null);
  };

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={t('msg.title')}
        sub={t('msg.sub')}
        actions={canSend && (
          <button className="btn btn-primary btn-md" onClick={() => setForm({ title: '', body: '', audience: 'parents', date: '', channel: 'push' })}>
            <Megaphone className="h-4 w-4" /> {t('msg.newMessage')}
          </button>
        )}
      />

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'history', label: t('msg.history'), count: messages.length },
          { id: 'templates', label: t('msg.templates'), count: TEMPLATES.length },
        ]}
      />

      {tab === 'history' && (
        <div className="mt-4 space-y-3">
          {messages.map((m) => (
            <div key={m.id} className="card p-4">
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Bell className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[13.5px] font-bold">{m.title}</p>
                    <span className="badge border-border/60 bg-muted/60">{t(`msg.audience.${m.audience === 'staff' ? 'teachers' : m.audience}`)}</span>
                    <span className="chip bg-primary/10 text-primary">{m.channel}</span>
                  </div>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{m.body}</p>
                  <p className="mt-1.5 text-[10.5px] text-muted-foreground/70">{fmtDateTime(m.date, lang)}</p>
                </div>
              </div>
            </div>
          ))}
          {!messages.length && <div className="card"><Empty title={t('common.empty')} icon={<MessageSquareText className="h-6 w-6" />} /></div>}
        </div>
      )}

      {tab === 'templates' && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {TEMPLATES.map((tpl) => (
            <div key={tpl.id} className="card p-4">
              <p className="text-[13.5px] font-bold">{t(`msg.${tpl.id}`)}</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{tpl.body}</p>
              {canSend && (
                <button className="btn btn-outline btn-sm mt-3" onClick={() => { setForm({ title: t(`msg.${tpl.id}`), body: tpl.body, audience: tpl.id === 'tpl.payment' || tpl.id === 'tpl.absence' ? 'parents' : 'all', date: '', channel: 'push' }); }}>
                  <Send className="h-3.5 w-3.5" /> {t('common.use') !== 'common.use' ? t('common.use') : 'Utiliser'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title={<span className="flex items-center gap-2"><Megaphone className="h-4 w-4 text-primary" /> {t('msg.newMessage')}</span>}
        footer={
          <>
            <button className="btn btn-outline btn-md" onClick={() => setForm(null)}>{t('common.cancel')}</button>
            <button className="btn btn-primary btn-md" onClick={send}><Send className="h-4 w-4" /> {t('msg.push')}</button>
          </>
        }
      >
        {form && (
          <div className="grid gap-3">
            <Field label={t('msg.audience')}>
              <div className="grid grid-cols-4 gap-2">
                {(['parents', 'teachers', 'students', 'all'] as const).map((a) => (
                  <button
                    key={a}
                    onClick={() => setForm({ ...form, audience: a })}
                    className={`rounded-xl border px-3 py-2.5 text-[12px] font-semibold transition ${
                      form.audience === a ? 'border-primary bg-primary/10 text-primary' : 'border-border/70 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {t(`msg.audience.${a}`)}
                  </button>
                ))}
              </div>
            </Field>
            <Field label={t('common.name')} required>
              <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </Field>
            <Field label="Message" required>
              <textarea className="input min-h-24" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
            </Field>
            <p className="text-[11.5px] text-muted-foreground">
              {online ? 'Notification push immédiate (navigateur + portail).' : t('common.offlineQueued')}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
