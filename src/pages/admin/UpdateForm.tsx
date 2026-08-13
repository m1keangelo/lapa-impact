/**
 * Workbench Tab C — Post a field update.
 * Dynamic metrics builder (key/value rows with suggested chips) + optional
 * photo attachments picked from the existing media library.
 * Writes: updates/{id} (+ stats/global.familiesHelped += n when the metrics
 * include a numeric `familiesHelped` key) — one batch.
 */
import { useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { collection, doc, increment, writeBatch } from 'firebase/firestore';
import { nanoid } from 'nanoid';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/i18n/LanguageContext';
import { db } from '@/lib/firebase';
import { useFeed } from '@/hooks/useFeed';
import { cloudinaryThumb } from '@/lib/cloudinary';
import { cn } from '@/lib/utils';
import type { MediaItem } from '@/lib/types';
import { Field, SubmitButton } from './fields';
import { inputCls, textareaCls, type SaveState } from './formUtils';
import { nowLocalInputValue, resolveTimestamp, statsGlobalRef } from './writeUtils';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const SUGGESTED_METRICS = ['familiesHelped', 'mealsServed', 'homesRepaired'];

interface MetricRow {
  id: string;
  key: string;
  value: string;
}

export default function UpdateForm({ onSaved }: { onSaved: () => void }) {
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [rows, setRows] = useState<MetricRow[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
  const [when, setWhen] = useState(nowLocalInputValue);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const media = useFeed<MediaItem>('media', { limit: 24 });

  const canSubmit = title.trim().length > 0 && body.trim().length > 0;

  const addRow = (key = '') =>
    setRows((r) => [...r, { id: nanoid(8), key, value: '' }]);
  const removeRow = (id: string) => setRows((r) => r.filter((x) => x.id !== id));
  const patchRow = (id: string, p: Partial<MetricRow>) =>
    setRows((r) => r.map((x) => (x.id === id ? { ...x, ...p } : x)));

  const toggleMedia = (id: string) =>
    setSelectedMedia((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
    );

  const buildMetrics = (): Record<string, string | number> => {
    const out: Record<string, string | number> = {};
    for (const row of rows) {
      const key = row.key.trim();
      if (!key) continue;
      const n = Number(row.value);
      out[key] = row.value.trim() !== '' && Number.isFinite(n) ? n : row.value.trim();
    }
    return out;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!db || !canSubmit || saveState !== 'idle') return;
    setSaveState('saving');
    try {
      const metrics = buildMetrics();
      const batch = writeBatch(db);
      batch.set(doc(collection(db, 'updates')), {
        title: title.trim(),
        body: body.trim(),
        metrics,
        timestamp: resolveTimestamp(when),
        ...(selectedMedia.length > 0 ? { mediaIds: selectedMedia } : {}),
      });
      const families = Number(metrics['familiesHelped']);
      if (Number.isFinite(families) && families > 0) {
        batch.set(
          statsGlobalRef(db),
          { familiesHelped: increment(Math.round(families)), updatedAt: resolveTimestamp(when) },
          { merge: true },
        );
      }
      await batch.commit();

      toast.success(t.admin.updateForm.saved);
      onSaved();
      setSaveState('saved');
      setTimeout(() => {
        setSaveState('idle');
        setTitle('');
        setBody('');
        setRows([]);
        setSelectedMedia([]);
        setWhen(nowLocalInputValue());
      }, 2000);
    } catch (err) {
      console.error('[UpdateForm] write failed:', err);
      toast.error(t.common.saveFailed);
      setSaveState('idle');
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="grid gap-5 min-[480px]:grid-cols-[1fr_auto]">
        <Field label={t.admin.updateForm.title}>
          <input
            type="text"
            required
            placeholder={t.admin.updateForm.titlePh}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label={t.admin.fields.dateTime} className="min-[480px]:w-[220px]">
          <input
            type="datetime-local"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            className={cn(inputCls, 'font-mono text-[14px]')}
          />
        </Field>
      </div>

      <Field
        label={t.admin.updateForm.body}
        hint={
          <span className="font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {t.admin.updateForm.chars(body.length)}
          </span>
        }
      >
        <textarea
          rows={5}
          required
          placeholder={t.admin.updateForm.bodyPh}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className={textareaCls}
        />
      </Field>

      {/* Metrics builder */}
      <div>
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-text-muted">
          {t.admin.updateForm.metrics}
        </p>
        <div className="mb-3 flex flex-wrap gap-2">
          {SUGGESTED_METRICS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => addRow(key)}
              className="rounded-full border border-border bg-surface-2 px-3 py-1.5 font-mono text-[12px] text-text-muted transition-colors hover:border-amber hover:text-amber"
            >
              + {key}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {rows.map((row) => (
              <motion.div
                key={row.id}
                layout="position"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: EASE }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={t.admin.updateForm.metricKeyPh}
                    value={row.key}
                    onChange={(e) => patchRow(row.id, { key: e.target.value })}
                    className={cn(inputCls, 'h-11 flex-1')}
                  />
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="12"
                    value={row.value}
                    onChange={(e) => patchRow(row.id, { value: e.target.value })}
                    className={cn(inputCls, 'h-11 w-28 font-mono')}
                  />
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    aria-label={t.admin.updateForm.removeMetric}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] text-text-faint transition-colors hover:bg-surface-2 hover:text-danger"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <button
          type="button"
          onClick={() => addRow()}
          className="mt-2 flex items-center gap-1.5 rounded-[10px] border border-dashed border-border-strong px-3.5 py-2 text-[13px] font-medium text-text-muted transition-colors hover:border-amber hover:text-amber"
        >
          <Plus className="h-4 w-4" /> {t.admin.updateForm.addMetric}
        </button>
      </div>

      {/* Attach photos from the media library */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-text-muted">
            {t.admin.updateForm.attachPhotos}
          </p>
          {selectedMedia.length > 0 && (
            <span className="rounded-full bg-sage/15 px-2.5 py-0.5 text-[12px] font-semibold text-sage">
              {t.admin.updateForm.selected(selectedMedia.length)}
            </span>
          )}
        </div>
        {media.items.length === 0 ? (
          <p className="rounded-[10px] border border-dashed border-border px-4 py-3 text-[13px] text-text-faint">
            {t.admin.updateForm.noPhotos}
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2 min-[480px]:grid-cols-4 md:grid-cols-6">
            {media.items.map((m) => {
              const selected = selectedMedia.includes(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleMedia(m.id)}
                  aria-pressed={selected}
                  aria-label={m.caption || t.admin.updateForm.mediaItem}
                  className={cn(
                    'relative aspect-square overflow-hidden rounded-[12px] border-2 transition-all duration-150 ease-calm',
                    selected
                      ? 'border-sage ring-2 ring-sage/50'
                      : 'border-transparent opacity-80 hover:opacity-100',
                  )}
                >
                  <img
                    src={cloudinaryThumb(m.thumbnailUrl || m.cloudinaryUrl, 200)}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>

      <SubmitButton
        state={saveState}
        label={t.admin.updateForm.postUpdate}
        color="sage"
        disabled={!canSubmit}
      />
    </form>
  );
}
