/**
 * Admin Tab — Needs (mini-campaigns). Create a named need with a goal
 * and a photo; it appears on the homepage with a live progress bar.
 * Below: the active list — update "raised so far" as the single fund is
 * allocated, or mark a need as funded. All money integer cents; writes
 * validated by the campaigns Firestore rule (money-desk roles only).
 */
import { useEffect, useState, type FormEvent } from 'react';
import { collection, doc, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { useLanguage } from '@/i18n/LanguageContext';
import { db } from '@/lib/firebase';
import type { Campaign } from '@/lib/types';
import { Field, SubmitButton } from './fields';
import { dollarsToCents, inputCls, textareaCls, type SaveState } from './formUtils';
import { logAudit } from './writeUtils';

export default function CampaignForm() {
  const { t } = useLanguage();
  const cf = t.admin.campaignForm;

  // ── create form state ──
  const [titleEn, setTitleEn] = useState('');
  const [titleEs, setTitleEs] = useState('');
  const [storyEn, setStoryEn] = useState('');
  const [storyEs, setStoryEs] = useState('');
  const [goal, setGoal] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [saveState, setSaveState] = useState<SaveState>('idle');

  // ── live list ──
  const [items, setItems] = useState<Campaign[]>([]);
  useEffect(() => {
    if (!db) return;
    return onSnapshot(collection(db, 'campaigns'), (snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Campaign);
      all.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
      setItems(all);
    });
  }, []);

  const goalCents = dollarsToCents(goal);
  const canSubmit =
    titleEn.trim().length > 0 && titleEs.trim().length > 0 &&
    storyEn.trim().length > 0 && storyEs.trim().length > 0 && goalCents > 0;

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!db || !canSubmit || saveState !== 'idle') return;
    setSaveState('saving');
    try {
      const ref = doc(collection(db, 'campaigns'));
      await setDoc(ref, {
        title: titleEn.trim(),
        titleEs: titleEs.trim(),
        story: storyEn.trim(),
        storyEs: storyEs.trim(),
        goalCents,
        raisedCents: 0,
        ...(imageUrl.trim() ? { imageUrl: imageUrl.trim() } : {}),
        status: 'active',
        order: items.length + 1,
        createdAt: serverTimestamp(),
      });
      await logAudit(db, 'campaign.create', { id: ref.id });
      setSaveState('saved');
      toast.success(cf.saved);
      setTitleEn(''); setTitleEs(''); setStoryEn(''); setStoryEs('');
      setGoal(''); setImageUrl('');
      window.setTimeout(() => setSaveState('idle'), 1500);
    } catch {
      setSaveState('idle');
      toast.error('Error');
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h2 className="font-display text-[22px] font-semibold text-text">{cf.title}</h2>
        <p className="mt-1 max-w-[60ch] text-[13px] leading-[1.55] text-text-muted">{cf.sub}</p>
      </header>

      {/* ── create ── */}
      <form onSubmit={(e) => void onCreate(e)} className="space-y-4 rounded-card border border-border bg-surface p-5">
        <h3 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-text-muted">
          {cf.newTitle}
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={cf.titleEn}>
            <input value={titleEn} onChange={(e) => setTitleEn(e.target.value)} maxLength={120} className={inputCls} />
          </Field>
          <Field label={cf.titleEs}>
            <input value={titleEs} onChange={(e) => setTitleEs(e.target.value)} maxLength={120} className={inputCls} />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={cf.storyEn}>
            <textarea value={storyEn} onChange={(e) => setStoryEn(e.target.value)} maxLength={600} rows={3} className={textareaCls} />
          </Field>
          <Field label={cf.storyEs}>
            <textarea value={storyEs} onChange={(e) => setStoryEs(e.target.value)} maxLength={600} rows={3} className={textareaCls} />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={cf.goal}>
            <input value={goal} onChange={(e) => setGoal(e.target.value)} inputMode="decimal" placeholder="400" className={inputCls} />
          </Field>
          <Field label={cf.imageUrl} hint={cf.imageHint}>
            <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://… o /quake-2.jpg" className={inputCls} />
          </Field>
        </div>
        <SubmitButton state={saveState} disabled={!canSubmit} label={cf.createCta} />
      </form>

      {/* ── live list ── */}
      <section>
        <h3 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-text-muted">
          {cf.listTitle}
        </h3>
        {items.length === 0 ? (
          <p className="mt-3 text-[13px] text-text-muted">{cf.empty}</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {items.map((c) => (
              <CampaignRow key={c.id} campaign={c} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function CampaignRow({ campaign: c }: { campaign: Campaign }) {
  const { t } = useLanguage();
  const cf = t.admin.campaignForm;
  const [raised, setRaised] = useState(String(c.raisedCents / 100));
  const [busy, setBusy] = useState(false);
  const done = c.status === 'completed';

  const saveRaised = async () => {
    if (!db || busy) return;
    const cents = dollarsToCents(raised);
    if (cents < 0) return;
    setBusy(true);
    try {
      await updateDoc(doc(db, 'campaigns', c.id), { raisedCents: cents });
      await logAudit(db, 'campaign.updateRaised', { id: c.id });
      toast.success(cf.saved);
    } catch {
      toast.error('Error');
    } finally {
      setBusy(false);
    }
  };

  const markDone = async () => {
    if (!db || busy) return;
    setBusy(true);
    try {
      await updateDoc(doc(db, 'campaigns', c.id), {
        status: 'completed',
        raisedCents: c.goalCents,
      });
      await logAudit(db, 'campaign.complete', { id: c.id });
      toast.success(cf.saved);
    } catch {
      toast.error('Error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <p className="truncate text-[15px] font-semibold text-text">
          {c.titleEs} {done ? '✓' : ''}
        </p>
        <p className="text-[12px] text-text-muted">
          ${(c.raisedCents / 100).toFixed(0)} / ${(c.goalCents / 100).toFixed(0)}
        </p>
      </div>
      {!done ? (
        <div className="flex flex-wrap items-end gap-2">
          <Field label={cf.raisedNow} className="w-36">
            <input
              value={raised}
              onChange={(e) => setRaised(e.target.value)}
              inputMode="decimal"
              className={inputCls}
            />
          </Field>
          <button
            type="button"
            onClick={() => void saveRaised()}
            disabled={busy}
            className="h-11 rounded-[10px] bg-amber px-4 text-[13px] font-semibold text-white transition-all hover:bg-amber-soft active:scale-[0.98] disabled:opacity-50"
          >
            {cf.updateCta}
          </button>
          <button
            type="button"
            onClick={() => void markDone()}
            disabled={busy}
            className="h-11 rounded-[10px] border border-border px-4 text-[13px] font-semibold text-text-muted transition-colors hover:text-text active:scale-[0.98] disabled:opacity-50"
          >
            {cf.markDone}
          </button>
        </div>
      ) : null}
    </li>
  );
}
