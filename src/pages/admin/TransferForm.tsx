/**
 * Workbench Tab B — Log a transfer (money out to the field).
 * Writes: transfers/{id} + stats/global.totalOut += amount — one batch.
 * Shows a non-blocking warning chip when the amount exceeds the recorded
 * balance (totalIn - totalOut). Optional single proof photo via the same
 * compress-then-unsigned-Cloudinary-upload pipeline as the Photos tab.
 */
import { useRef, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import imageCompression from 'browser-image-compression';
import { collection, doc, increment, writeBatch } from 'firebase/firestore';
import { ImagePlus, Loader2, TriangleAlert, X } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/i18n/LanguageContext';
import { cloudinaryReady, uploadToCloudinary } from '@/lib/cloudinary';
import { db } from '@/lib/firebase';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';
import { AmountField, Field, SubmitButton } from './fields';
import { dollarsToCents, inputCls, type SaveState } from './formUtils';
import { nowLocalInputValue, resolveTimestamp, statsGlobalRef } from './writeUtils';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

type ProofState =
  | { status: 'idle' }
  | { status: 'busy'; previewUrl: string }
  | { status: 'done'; url: string }
  | { status: 'error'; message: string };

export default function TransferForm({
  balanceCents,
  onSaved,
}: {
  balanceCents: number;
  onSaved: () => void;
}) {
  const { t } = useLanguage();
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [purpose, setPurpose] = useState('');
  const [when, setWhen] = useState(nowLocalInputValue);
  const [proof, setProof] = useState<ProofState>({ status: 'idle' });
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const fileInput = useRef<HTMLInputElement>(null);

  const cents = dollarsToCents(amount);
  const overdrawn = cents > 0 && cents > balanceCents;
  const canSubmit =
    cents > 0 &&
    recipient.trim().length > 0 &&
    purpose.trim().length > 0 &&
    proof.status !== 'busy';

  const onPickProof = async (file: File | undefined) => {
    if (!file) return;
    if (!cloudinaryReady) {
      setProof({
        status: 'error',
        message: t.admin.transferForm.cloudinaryMissing,
      });
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setProof({ status: 'busy', previewUrl });
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      });
      const result = await uploadToCloudinary(compressed, { folder: 'lapa-field/proofs' });
      URL.revokeObjectURL(previewUrl);
      setProof({ status: 'done', url: result.secureUrl });
    } catch (err) {
      URL.revokeObjectURL(previewUrl);
      setProof({
        status: 'error',
        message: err instanceof Error ? err.message : t.admin.transferForm.uploadFailed,
      });
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!db || !canSubmit || saveState !== 'idle') return;
    setSaveState('saving');
    try {
      const batch = writeBatch(db);
      batch.set(doc(collection(db, 'transfers')), {
        amount: cents,
        recipient: recipient.trim(),
        purpose: purpose.trim(),
        timestamp: resolveTimestamp(when),
        ...(proof.status === 'done' ? { proofUrl: proof.url } : {}),
        ...(overdrawn ? { overdrawnBy: cents - balanceCents } : {}),
      });
      batch.set(
        statsGlobalRef(db),
        { totalOut: increment(cents), updatedAt: resolveTimestamp(when) },
        { merge: true },
      );
      await batch.commit();

      toast.success(t.admin.transferForm.saved);
      onSaved();
      setSaveState('saved');
      setTimeout(() => {
        setSaveState('idle');
        setAmount('');
        setRecipient('');
        setPurpose('');
        setWhen(nowLocalInputValue());
        setProof({ status: 'idle' });
      }, 2000);
    } catch (err) {
      console.error('[TransferForm] write failed:', err);
      toast.error(t.common.saveFailed);
      setSaveState('idle');
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
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

      {/* Balance warning — non-blocking, reality is messy */}
      <AnimatePresence>
        {overdrawn && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="flex items-center gap-2 overflow-hidden rounded-[10px] border border-danger/60 px-3.5 py-2.5 text-[13px] font-medium text-danger"
          >
            <TriangleAlert className="h-4 w-4 shrink-0" />
            {t.admin.transferForm.overdrawn(formatMoney(cents - balanceCents))}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="grid gap-5 min-[480px]:grid-cols-2">
        <Field label={t.admin.transferForm.recipient}>
          <input
            type="text"
            required
            placeholder="Fundación Andes"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label={t.admin.transferForm.purpose}>
          <input
            type="text"
            required
            placeholder={t.admin.transferForm.purposePh}
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            className={inputCls}
          />
        </Field>
      </div>

      {/* Optional proof photo (single-file uploader) */}
      <Field label={t.admin.transferForm.proofLabel}>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            void onPickProof(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
        {proof.status === 'idle' && (
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-[10px] border border-dashed border-border-strong text-[13px] font-medium text-text-muted transition-colors hover:border-amber hover:text-amber"
          >
            <ImagePlus className="h-4 w-4" /> {t.admin.transferForm.attach}
          </button>
        )}
        {proof.status === 'busy' && (
          <div className="flex h-12 items-center gap-3 rounded-[10px] border border-border bg-surface-2 px-3.5">
            <img src={proof.previewUrl} alt="" className="h-9 w-9 rounded-[8px] object-cover" />
            <Loader2 className="h-4 w-4 animate-spin text-amber" />
            <span className="text-[13px] text-text-muted">{t.admin.transferForm.uploading}</span>
          </div>
        )}
        {proof.status === 'done' && (
          <div className="flex h-12 items-center gap-3 rounded-[10px] border border-sage/50 bg-surface-2 px-3.5">
            <img src={proof.url} alt="" className="h-9 w-9 rounded-[8px] object-cover" />
            <span className="text-[13px] font-medium text-sage">{t.admin.transferForm.proofAttached}</span>
            <button
              type="button"
              onClick={() => setProof({ status: 'idle' })}
              className="ml-auto rounded-[8px] p-1.5 text-text-muted transition-colors hover:text-text"
              aria-label={t.admin.transferForm.removeProof}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {proof.status === 'error' && (
          <div className="flex h-12 items-center gap-3 rounded-[10px] border border-danger/60 px-3.5">
            <TriangleAlert className="h-4 w-4 shrink-0 text-danger" />
            <span className="truncate text-[13px] text-danger">{proof.message}</span>
            <button
              type="button"
              onClick={() => setProof({ status: 'idle' })}
              className="ml-auto shrink-0 text-[13px] font-medium text-text-muted hover:text-text"
            >
              {t.common.dismiss}
            </button>
          </div>
        )}
      </Field>

      <SubmitButton
        state={saveState}
        label={t.admin.transferForm.recordTransfer}
        color="terra"
        disabled={!canSubmit}
      />
    </form>
  );
}
