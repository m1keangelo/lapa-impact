/**
 * Workbench Tab A — Log a gift (donation).
 * Existing-donor flow: 12-char code with debounced live lookup.
 * Create-donor flow: generates a 12-char Base58 code, writes donors/{code}
 * with totalGiven=0 in the same batch as the donation, then shows the code
 * prominently for copying/sharing.
 * Writes: donations/{id} + donors/{code}.totalGiven += amount +
 * stats/global.totalIn += amount — one atomic batch (integer cents).
 */
import { useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { collection, doc, increment, writeBatch } from 'firebase/firestore';
import { Check, Copy, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '@/lib/firebase';
import { privacyName } from '@/lib/format';
import { cn } from '@/lib/utils';
import {
  AmountField,
  DonorCodeField,
  Field,
  SubmitButton,
} from './fields';
import {
  dollarsToCents,
  inputCls,
  textareaCls,
  useDonorLookup,
  type SaveState,
} from './formUtils';
import {
  generateDonorCode,
  nowLocalInputValue,
  resolveTimestamp,
  statsGlobalRef,
} from './writeUtils';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

export default function GiftForm({ onSaved }: { onSaved: () => void }) {
  const [code, setCode] = useState('');
  const lookup = useDonorLookup(code);
  const [createMode, setCreateMode] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newCode, setNewCode] = useState('');
  const [amount, setAmount] = useState('');
  const [when, setWhen] = useState(nowLocalInputValue);
  const [note, setNote] = useState('');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const cents = dollarsToCents(amount);
  const canSubmit =
    cents > 0 &&
    (createMode ? newName.trim().length > 0 : lookup.state === 'found');

  const enterCreateMode = () => {
    setNewCode(generateDonorCode());
    setCreateMode(true);
  };

  const copyCode = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Copy failed — select the code manually.');
    }
  };

  const resetForm = () => {
    setCode('');
    setCreateMode(false);
    setNewName('');
    setNewEmail('');
    setNewCode('');
    setAmount('');
    setWhen(nowLocalInputValue());
    setNote('');
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!db || !canSubmit || saveState !== 'idle') return;
    setSaveState('saving');
    try {
      const donorCode = createMode ? newCode : code.trim();
      const donorName = createMode
        ? privacyName(newName)
        : privacyName(lookup.donor?.name ?? '');

      const batch = writeBatch(db);
      if (createMode) {
        // New donor doc with totalGiven=0 — the increment below lands in the
        // same atomic batch, so the doc never exists without the gift counted.
        batch.set(doc(db, 'donors', donorCode), {
          code: donorCode,
          name: newName.trim(),
          ...(newEmail.trim() ? { email: newEmail.trim() } : {}),
          totalGiven: 0,
          createdAt: resolveTimestamp(when),
        });
      }
      batch.set(doc(collection(db, 'donations')), {
        donorCode,
        donorName,
        amount: cents,
        timestamp: resolveTimestamp(when),
        ...(note.trim() ? { note: note.trim() } : {}),
      });
      batch.update(doc(db, 'donors', donorCode), {
        totalGiven: increment(cents),
      });
      batch.set(
        statsGlobalRef(db),
        { totalIn: increment(cents), updatedAt: resolveTimestamp(when) },
        { merge: true },
      );
      await batch.commit();

      if (createMode) setCreatedCode(donorCode);
      toast.success('Gift recorded — live on the ledger now.');
      onSaved();
      setSaveState('saved');
      setTimeout(() => {
        setSaveState('idle');
        resetForm();
      }, 2000);
    } catch (err) {
      console.error('[GiftForm] write failed:', err);
      toast.error("Couldn't save — check connection, nothing was recorded.");
      setSaveState('idle');
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {/* Donor identity: existing code lookup OR create-new-donor */}
      {createMode ? (
        <div className="rounded-card border border-amber/40 bg-amber-glow/40 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-amber">
              New donor code
            </p>
            <button
              type="button"
              onClick={() => copyCode(newCode)}
              className="flex items-center gap-1.5 rounded-[8px] border border-border px-2.5 py-1 text-[12px] font-medium text-text-muted transition-colors hover:text-text"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-sage" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p
            className="mt-2 font-mono text-[20px] tracking-[0.12em] text-text"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {newCode}
          </p>
          <p className="mt-1 text-[12px] text-text-muted">
            Share this code with the donor — it opens their personal impact page.
          </p>
          <div className="mt-4 grid gap-4 min-[480px]:grid-cols-2">
            <Field label="Donor name">
              <input
                type="text"
                required
                placeholder="Maria García"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Email (optional)">
              <input
                type="email"
                placeholder="maria@example.org"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>
          <button
            type="button"
            onClick={() => setCreateMode(false)}
            className="mt-3 text-[12px] font-medium text-text-muted underline-offset-2 hover:text-text hover:underline"
          >
            ← Use an existing code instead
          </button>
        </div>
      ) : (
        <div>
          <DonorCodeField value={code} onChange={setCode} />
          <AnimatePresence>
            {lookup.state === 'notfound' && (
              <motion.button
                type="button"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: EASE }}
                onClick={enterCreateMode}
                className={cn(
                  'mt-2 flex items-center gap-2 overflow-hidden rounded-[10px] border border-dashed border-border-strong',
                  'px-3.5 py-2.5 text-[13px] font-medium text-text-muted transition-colors hover:border-amber hover:text-amber',
                )}
              >
                <UserPlus className="h-4 w-4" /> Create a new donor with a fresh code
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      )}

      <div className="grid gap-5 min-[480px]:grid-cols-2">
        <AmountField value={amount} onChange={setAmount} label="Amount (USD)" />
        <Field label="Date / time">
          <input
            type="datetime-local"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            className={cn(inputCls, 'font-mono text-[14px]')}
          />
        </Field>
      </div>

      <Field label="Note (optional)">
        <textarea
          rows={2}
          placeholder="For the river families…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className={textareaCls}
        />
      </Field>

      <SubmitButton
        state={saveState}
        label="Record gift"
        color="amber"
        disabled={!canSubmit}
      />

      {/* Post-create: show the generated code again, big, for sharing */}
      <AnimatePresence>
        {createdCode && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="rounded-card border border-sage/50 bg-sage/10 p-4"
          >
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-sage">
              Donor created — share this code
            </p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="font-mono text-[20px] tracking-[0.12em] text-text">{createdCode}</p>
              <button
                type="button"
                onClick={() => copyCode(createdCode)}
                className="flex items-center gap-1.5 rounded-[8px] border border-border px-2.5 py-1 text-[12px] font-medium text-text-muted transition-colors hover:text-text"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-sage" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <button
              type="button"
              onClick={() => setCreatedCode(null)}
              className="mt-2 text-[12px] font-medium text-text-muted hover:text-text"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}
