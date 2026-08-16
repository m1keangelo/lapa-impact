/**
 * Team panel (spec §9) — admin manages staff/{uid} roles.
 *
 * Primary path: invite by name + email + role. The inviteStaffMember Cloud
 * Function creates the Auth account, binds the role and returns a one-time
 * temporary password to hand to the person — no Firebase console needed.
 *
 * Fallback path ("add by UID"): for accounts already created by hand in the
 * Firebase console, or while functions are not deployed yet (Blaze pending).
 *
 * Inactive members keep their record but the app treats them as signed-out
 * of the consoles.
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
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Copy, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/i18n/LanguageContext';
import { db } from '@/lib/firebase';
import type { StaffRole, StaffUser } from '@/lib/types';
import { cn } from '@/lib/utils';
import { logAudit } from './writeUtils';
import { Field, SubmitButton } from './fields';
import { inputCls, type SaveState } from './formUtils';

const ROLE_IDS: StaffRole[] = ['admin', 'finance', 'field'];

interface InviteResult {
  uid: string;
  email: string;
  role: string;
  created: boolean;
  tempPassword: string | null;
}

function RolePicker({
  role,
  onChange,
}: {
  role: StaffRole;
  onChange: (r: StaffRole) => void;
}) {
  const { t } = useLanguage();
  return (
    <div className="flex gap-2">
      {ROLE_IDS.map((r) => {
        const active = role === r;
        return (
          <button
            key={r}
            type="button"
            onClick={() => onChange(r)}
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
  );
}

export default function TeamPanel() {
  const { t } = useLanguage();
  const [members, setMembers] = useState<(StaffUser & { uid: string })[]>([]);
  const [mode, setMode] = useState<'invite' | 'manual'>('invite');

  // invite form
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<StaffRole>('field');
  const [inviting, setInviting] = useState(false);
  const [creds, setCreds] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // manual (UID) form
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

  const canInvite =
    inviteName.trim().length > 0 && inviteEmail.trim().includes('@');
  const canSubmit = uid.trim().length > 0 && name.trim().length > 0;

  const onInvite = async (e: FormEvent) => {
    e.preventDefault();
    if (!canInvite || inviting) return;
    setInviting(true);
    try {
      const fn = httpsCallable<
        { name: string; email: string; role: StaffRole },
        InviteResult
      >(getFunctions(), 'inviteStaffMember');
      const res = await fn({
        name: inviteName.trim(),
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      if (res.data.created && res.data.tempPassword) {
        setCreds({ email: res.data.email, password: res.data.tempPassword });
        toast.success(t.ops.team.invited);
      } else {
        toast.success(t.ops.team.adoptedTitle);
      }
      setInviteName('');
      setInviteEmail('');
      setInviteRole('field');
    } catch (err) {
      const code = (err as { code?: string })?.code ?? '';
      const message = (err as { message?: string })?.message ?? '';
      console.error('[TeamPanel] invite failed:', err);
      if (code.includes('unimplemented') || code.includes('unavailable') || code.includes('not-found')) {
        toast.error(t.ops.team.functionsMissing, { duration: 6000 });
      } else if (code.includes('already-exists') || code.includes('permission-denied') || code.includes('invalid-argument')) {
        toast.error(message || t.common.saveFailed, { duration: 6000 });
      } else {
        toast.error(t.common.saveFailed);
      }
    } finally {
      setInviting(false);
    }
  };

  const copyCreds = async () => {
    if (!creds) return;
    try {
      await navigator.clipboard.writeText(`${creds.email}\n${creds.password}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked — user can select manually */
    }
  };

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
      {creds ? (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-card border border-sage/40 bg-sage/10 p-5"
        >
          <h2 className="text-[14px] font-bold text-text">{t.ops.team.credsTitle}</h2>
          <div className="mt-3 flex flex-col gap-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                {t.ops.team.credsEmail}
              </p>
              <p className="font-mono text-[14px] font-semibold text-text">{creds.email}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                {t.ops.team.credsPassword}
              </p>
              <p className="font-mono text-[15px] font-bold text-text">{creds.password}</p>
            </div>
          </div>
          <p className="mt-3 text-[13px] leading-[1.5] text-text-muted">{t.ops.team.credsNote}</p>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => void copyCreds()}
              className="flex h-11 items-center gap-2 rounded-[10px] bg-amber px-4 text-[13px] font-bold text-white transition-opacity hover:opacity-90"
            >
              <Copy className="h-4 w-4" /> {copied ? t.ops.team.copied : t.ops.team.copy}
            </button>
            <button
              type="button"
              onClick={() => setCreds(null)}
              className="h-11 rounded-[10px] border border-border bg-surface px-4 text-[13px] font-semibold text-text-muted hover:text-text"
            >
              ✕
            </button>
          </div>
        </motion.section>
      ) : null}

      {mode === 'invite' ? (
        <form onSubmit={onInvite} className="flex flex-col gap-5">
          <div className="grid gap-5 min-[560px]:grid-cols-2">
            <Field label={t.ops.team.namePh.split('(')[0].trim()}>
              <input
                type="text"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder={t.ops.team.namePh}
                className={inputCls}
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder={t.ops.team.emailPh}
                className={inputCls}
              />
            </Field>
          </div>
          <Field label={t.ops.team.role}>
            <RolePicker role={inviteRole} onChange={setInviteRole} />
          </Field>
          <SubmitButton
            state={inviting ? 'saving' : 'idle'}
            label={inviting ? t.ops.team.inviting : t.ops.team.invite}
            disabled={!canInvite}
          />
          <button
            type="button"
            onClick={() => setMode('manual')}
            className="self-start text-[12px] font-semibold text-text-faint underline underline-offset-2 hover:text-text-muted"
          >
            {t.ops.team.manualToggle}
          </button>
        </form>
      ) : (
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
              <RolePicker role={role} onChange={setRole} />
            </Field>
          </div>
          <SubmitButton state={saveState} label={t.ops.team.add} disabled={!canSubmit} />
          <button
            type="button"
            onClick={() => setMode('invite')}
            className="self-start text-[12px] font-semibold text-text-faint underline underline-offset-2 hover:text-text-muted"
          >
            {t.ops.team.manualBack}
          </button>
        </form>
      )}

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
                  <p className="truncate font-mono text-[11px] text-text-faint">
                    {(m as { email?: string }).email ?? m.uid}
                  </p>
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
