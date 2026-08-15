/**
 * Workbench Tab A — Record a donation (final doc §58).
 *
 * The old six-digit donor-code system is GONE. The form is plain and
 * human: name, optional email, amount, date/time, note.
 *
 * Writes (one atomic batch, integer cents):
 *   donations/{id}        { donorName (privacy-trimmed), amount, ts, note }
 *   giftEmails/{id}       { email } — ONLY when the donor gave an email;
 *                         a rules-closed sidecar doc (PII stays out of the
 *                         public-read donation). linkMyDonations reads it
 *                         server-side to connect the gift to the donor's
 *                         My Impact account.
 *   stats/global          totalIn += amount
 */
import { useState, type FormEvent } from 'react';
import { collection, doc, increment, writeBatch } from 'firebase/firestore';
import { toast } from 'sonner';
import { useLanguage } from '@/i18n/LanguageContext';
import { db } from '@/lib/firebase';
import { privacyName } from '@/lib/format';
import { cn } from '@/lib/utils';
import { AmountField, Field, SubmitButton } from './fields';
import { dollarsToCents, inputCls, textareaCls, type SaveState } from './formUtils';
import { nowLocalInputValue, resolveTimestamp, statsGlobalRef } from './writeUtils';

export default function GiftForm({ onSaved }: { onSaved: () => void }) {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [when, setWhen] = useState(nowLocalInputValue);
  const [note, setNote] = useState('');
  const [saveState, setSaveState] = useState<SaveState>('idle');

  const cents = dollarsToCents(amount);
  const canSubmit = cents > 0 && name.trim().length > 0;

  const resetForm = () => {
    setName('');
    setEmail('');
    setAmount('');
    setWhen(nowLocalInputValue());
    setNote('');
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!db || !canSubmit || saveState !== 'idle') return;
    setSaveState('saving');
    try {
      const donationRef = doc(collection(db, 'donations'));
      const batch = writeBatch(db);
      batch.set(donationRef, {
        donorName: privacyName(name),
        amount: cents,
        timestamp: resolveTimestamp(when),
        ...(note.trim() ? { note: note.trim() } : {}),
      });
      // PII sidecar: the email NEVER goes on the public donation doc.
      if (email.trim()) {
        batch.set(doc(db, 'giftEmails', donationRef.id), {
          email: email.trim().toLowerCase(),
        });
      }
      batch.set(
        statsGlobalRef(db),
        { totalIn: increment(cents), updatedAt: resolveTimestamp(when) },
        { merge: true },
      );
      await batch.commit();

      toast.success(t.admin.giftForm.saved);
      onSaved();
      setSaveState('saved');
      setTimeout(() => {
        setSaveState('idle');
        resetForm();
      }, 2000);
    } catch (err) {
      console.error('[GiftForm] write failed:', err);
      toast.error(t.common.saveFailed);
      setSaveState('idle');
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="grid gap-5 min-[480px]:grid-cols-2">
        <Field label={t.admin.giftForm.donorName}>
          <input
            type="text"
            required
            autoComplete="off"
            placeholder="Maria García"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label={t.admin.giftForm.emailOptional} hint={t.admin.giftForm.emailHint}>
          <input
            type="email"
            autoComplete="off"
            placeholder="maria@example.org"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
          />
        </Field>
      </div>

      <div className="grid gap-5 min-[480px]:grid-cols-2">
        <AmountField value={amount} onChange={setAmount} label={t.admin.fields.amountUsd} />
        <Field label={t.admin.fields.dateTime}>
          <input
            type="datetime-local"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            className={cn(inputCls, 'font-mono text-[14px]')}
          />
        </Field>
      </div>

      <Field label={t.admin.giftForm.noteOptional}>
        <textarea
          rows={2}
          placeholder={t.admin.giftForm.notePh}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className={textareaCls}
        />
      </Field>

      <SubmitButton
        state={saveState}
        label={t.admin.giftForm.recordGift}
        color="amber"
        disabled={!canSubmit}
      />
    </form>
  );
}
