/**
 * Team panel (spec §9) — admin manages staff/{uid} roles.
 *
 * Accounts themselves are created in the Firebase console (email/password);
 * this panel binds each account's uid to a role: admin, finance (Mayra),
 * or field volunteer. Inactive members keep their record but the app
 * treats them as signed-out of the consoles.
 */
import { useEffect, useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { Users } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/i18n/LanguageContext';
import { db } from '@/lib/firebase';
import type { StaffRole, StaffUser } from '@/lib/types';
import { cn } from '@/lib/utils';
import { logAudit } from './writeUtils';
import { Field, SubmitButton } from './fields';
import { inputCls, type SaveState } from './formUtils';

const ROLE_IDS: StaffRole[] = ['admin', 'finance', 'field'];

export default function TeamPanel() {
  const { t } = useLanguage();
  const [members, setMembers] = useState<(StaffUser & { uid: string })[]>([]);
  const [uid, setUid] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<StaffRole>('field');
  const [saveState, setSaveState] = useState<SaveState>('idle');

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(
      collection(db, 'staff'),
      (snap) =>
        setMembers(snap.docs.map((d) => ({ uid: d.id, ...(d.data() as StaffUser) }))),
      (err) => console.warn('[TeamPanel] listener failed:', err),
    );
    return unsub;
  }, []);

  const canSubmit = uid.trim().length > 0 && name.trim().length > 0;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!db || !canSubmit || saveState !== 'idle') return;
    setSaveState('saving');
    try {
      await setDoc(
        doc(db, 'staff', uid.trim()),
        {
          name: name.trim(),
          role,
          active: true,
          createdAt: serverTimestamp(),
        },
        { merge: true },
      );
      void logAudit(db, 'staff.upsert', { targetUid: uid.trim(), role });
      toast.success(t.ops.team.saved);
      setSaveState('saved');
      setTimeout(() => {
        setSaveState('idle');
        setUid('');
        setName('');
        setRole('field');
      }, 1600);
    } catch (err) {
      console.error('[TeamPanel] save failed:', err);
      toast.error(t.common.saveFailed);
      setSaveState('idle');
    }
  };

  const toggleActive = async (member: StaffUser & { uid: string }) => {
    if (!db) return;
    try {
      await setDoc(
        doc(db, 'staff', member.uid),
        { active: !member.active },
        { merge: true },
      );
      void logAudit(db, 'staff.toggle', { targetUid: member.uid, active: !member.active });
    } catch (err) {
      console.error('[TeamPanel] toggle failed:', err);
      toast.error(t.common.saveFailed);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <Field label="UID" hint={t.ops.team.uidHint}>
          <input
            type="text"
            value={uid}
            onChange={(e) => setUid(e.target.value)}
            placeholder={t.ops.team.uidPh}
            className={cn(inputCls, 'font-mono text-[13px]')}
          />
        </Field>
        <div className="grid gap-5 min-[560px]:grid-cols-2">
          <Field label={t.ops.team.namePh.split('(')[0].trim()}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.ops.team.namePh}
              className={inputCls}
            />
          </Field>
          <Field label={t.ops.team.role}>
            <div className="flex gap-2">
              {ROLE_IDS.map((r) => {
                const active = role === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={cn(
                      'h-12 flex-1 rounded-[10px] border px-2 text-[12px] font-semibold transition-colors duration-150',
                      active
                        ? 'border-amber bg-amber text-white'
                        : 'border-border bg-surface text-text-muted hover:text-text',
                    )}
                  >
                    {t.ops.roles[r]}
                  </button>
                );
              })}
            </div>
          </Field>
        </div>
        <SubmitButton state={saveState} label={t.ops.team.add} disabled={!canSubmit} />
      </form>

      <section>
        <h2 className="flex items-center gap-2 font-display text-[19px] font-medium text-text">
          <Users className="h-4 w-4 text-text-muted" /> {t.ops.team.title}
        </h2>
        <div className="mt-4 flex flex-col gap-2">
          {members.length === 0 ? (
            <p className="text-[13px] font-medium text-text-faint">{t.ops.team.empty}</p>
          ) : (
            members.map((m) => (
              <motion.div
                key={m.uid}
                layout
                className="flex items-center gap-3 rounded-card border border-border bg-surface px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold text-text">{m.name}</p>
                  <p className="truncate font-mono text-[11px] text-text-faint">{m.uid}</p>
                </div>
                <span className="rounded-full border border-border bg-surface-2 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                  {t.ops.roles[m.role] ?? m.role}
                </span>
                <button
                  type="button"
                  onClick={() => void toggleActive(m)}
                  className={cn(
                    'rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors',
                    m.active
                      ? 'border-sage/40 bg-sage/10 text-sage'
                      : 'border-danger/40 bg-danger/10 text-danger',
                  )}
                >
                  {m.active ? t.ops.team.active : t.ops.team.inactive}
                </button>
              </motion.div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
