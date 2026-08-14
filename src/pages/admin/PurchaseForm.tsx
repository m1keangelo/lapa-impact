/**
 * Finance console — MONEY OUT (spec §10–11).
 *
 * The finance user (e.g. Mayra) records what was bought: amount, vendor,
 * category, location, description, receipt photo. The write extends the
 * existing transfers/{id} ledger entry (vendor/category/location/
 * receiptUrl/missionDay) so the public feed shows the purchase with its
 * "View receipt" proof, and stats/global.totalOut increments atomically.
 */
import { useRef, useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import imageCompression from 'browser-image-compression';
import { collection, doc, increment, writeBatch } from 'firebase/firestore';
import { ImagePlus, Loader2, TriangleAlert, X } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/i18n/LanguageContext';
import { cloudinaryReady, uploadToCloudinary } from '@/lib/cloudinary';
import { CAMPAIGN } from '@/lib/campaign';
import { db } from '@/lib/firebase';
import { formatMoney } from '@/lib/format';
import { missionDay } from '@/lib/mission';
import { cn } from '@/lib/utils';
import { AmountField, Field, SubmitButton } from './fields';
import { dollarsToCents, inputCls, type SaveState } from './formUtils';
import { nowLocalInputValue, resolveTimestamp, statsGlobalRef } from './writeUtils';

type ReceiptState =
  | { status: 'idle' }
  | { status: 'busy'; previewUrl: string }
  | { status: 'done'; url: string }
  | { status: 'error'; message: string };

const CATEGORY_IDS = [
  'food',
  'water',
  'hygiene',
  'shelter',
  'transport',
  'medical',
  'supplies',
  'other',
] as const;

export default function PurchaseForm({
  balanceCents,
  onSaved,
}: {
  balanceCents: number;
  onSaved: () => void;
}) {
  const { t, lang } = useLanguage();
  const [amount, setAmount] = useState('');
  const [vendor, setVendor] = useState('');
  const [category, setCategory] = useState<string>('food');
  const [locationId, setLocationId] = useState(CAMPAIGN.locations[0]?.id ?? '');
  const [description, setDescription] = useState('');
  const [when, setWhen] = useState(nowLocalInputValue);
  const [receipt, setReceipt] = useState<ReceiptState>({ status: 'idle' });
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const fileInput = useRef<HTMLInputElement>(null);

  const cents = dollarsToCents(amount);
  const overdrawn = cents > 0 && cents > balanceCents;
  const canSubmit =
    cents > 0 &&
    vendor.trim().length > 0 &&
    description.trim().length > 0 &&
    receipt.status !== 'busy';

  const categoryLabel = (id: string) =>
    t.ops.finance.categories[id as keyof typeof t.ops.finance.categories] ?? id;

  const onPickReceipt = async (file: File | undefined) => {
    if (!file) return;
    if (!cloudinaryReady) {
      setReceipt({ status: 'error', message: t.admin.transferForm.cloudinaryMissing });
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setReceipt({ status: 'busy', previewUrl });
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      });
      const result = await uploadToCloudinary(compressed, { folder: 'lapa-field/receipts' });
      URL.revokeObjectURL(previewUrl);
      setReceipt({ status: 'done', url: result.secureUrl });
    } catch (err) {
      URL.revokeObjectURL(previewUrl);
      setReceipt({
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
      const ts = resolveTimestamp(when);
      const tsMs =
        typeof ts === 'object' && 'toMillis' in ts && typeof ts.toMillis === 'function'
          ? ts.toMillis()
          : Date.now();
      const batch = writeBatch(db);
      batch.set(doc(collection(db, 'transfers')), {
        amount: cents,
        recipient: vendor.trim(), // ledger line reads from recipient
        purpose: description.trim(),
        timestamp: ts,
        vendor: vendor.trim(),
        category,
        location: locationId,
        missionDay: missionDay(tsMs),
        ...(receipt.status === 'done' ? { receiptUrl: receipt.url } : {}),
        ...(overdrawn ? { overdrawnBy: cents - balanceCents } : {}),
      });
      batch.set(statsGlobalRef(db), { totalOut: increment(cents), updatedAt: ts }, { merge: true });
      await batch.commit();

      toast.success(t.ops.finance.saved);
      onSaved();
      setSaveState('saved');
      setTimeout(() => {
        setSaveState('idle');
        setAmount('');
        setVendor('');
        setDescription('');
        setWhen(nowLocalInputValue());
        setReceipt({ status: 'idle' });
      }, 2000);
    } catch (err) {
      console.error('[PurchaseForm] write failed:', err);
      toast.error(t.common.saveFailed);
      setSaveState('idle');
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="grid gap-5 min-[560px]:grid-cols-2">
        <AmountField value={amount} onChange={setAmount} />
        <Field label={t.admin.fields.dateTime}>
          <input
            type="datetime-local"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            className={inputCls}
          />
        </Field>
      </div>

      <div className="grid gap-5 min-[560px]:grid-cols-2">
        <Field label={t.ops.finance.vendor}>
          <input
            type="text"
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
            placeholder={t.ops.finance.vendorPh}
            className={inputCls}
          />
        </Field>
        <Field label={t.ops.finance.category}>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={cn(inputCls, 'appearance-none')}
          >
            {CATEGORY_IDS.map((id) => (
              <option key={id} value={id}>
                {categoryLabel(id)}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label={t.ops.finance.location}>
        <div className="flex flex-wrap gap-2">
          {CAMPAIGN.locations.map((loc) => {
            const active = locationId === loc.id;
            return (
              <button
                key={loc.id}
                type="button"
                onClick={() => setLocationId(loc.id)}
                className={cn(
                  'h-9 rounded-full border px-3.5 text-[13px] font-medium transition-colors duration-150',
                  active
                    ? 'border-amber bg-amber text-white'
                    : 'border-border bg-surface text-text-muted hover:text-text',
                )}
              >
                {lang === 'es' ? loc.es : loc.en}
              </button>
            );
          })}
        </div>
      </Field>

      <Field label={t.ops.finance.description}>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t.ops.finance.descriptionPh}
          className={inputCls}
        />
      </Field>

      {/* Receipt — the public proof */}
      <Field label={t.ops.finance.receipt} hint={t.ops.finance.receiptHint}>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            void onPickReceipt(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
        {receipt.status === 'idle' && (
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-[10px] border border-dashed border-border-strong bg-surface-2 text-[14px] font-medium text-text-muted transition-colors hover:border-amber hover:text-amber"
          >
            <ImagePlus className="h-4 w-4" /> {t.ops.finance.attach}
          </button>
        )}
        {receipt.status === 'busy' && (
          <div className="flex h-12 items-center gap-3 rounded-[10px] border border-border bg-surface-2 px-4">
            <Loader2 className="h-4 w-4 animate-spin text-amber" />
            <span className="text-[13px] font-medium text-text-muted">{t.ops.finance.uploading}</span>
          </div>
        )}
        {receipt.status === 'done' && (
          <div className="flex items-center gap-3 rounded-[10px] border border-sage/40 bg-sage/10 px-4 py-3">
            <img src={receipt.url} alt="" className="h-12 w-12 rounded-[8px] object-cover" />
            <span className="flex-1 text-[13px] font-medium text-text">
              {t.ops.finance.receiptAttached}
            </span>
            <button
              type="button"
              onClick={() => setReceipt({ status: 'idle' })}
              className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted hover:text-danger"
              aria-label={t.ops.finance.removeReceipt}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {receipt.status === 'error' && (
          <p className="text-[13px] font-medium text-danger">{receipt.message}</p>
        )}
      </Field>

      {overdrawn && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-[10px] border border-amber/40 bg-amber-glow px-4 py-2.5 text-[13px] font-medium text-amber"
        >
          <TriangleAlert className="h-4 w-4 shrink-0" />
          {t.admin.transferForm.overdrawn(formatMoney(cents - balanceCents))}
        </motion.p>
      )}

      <SubmitButton state={saveState} label={t.ops.finance.record} disabled={!canSubmit} />
    </form>
  );
}
