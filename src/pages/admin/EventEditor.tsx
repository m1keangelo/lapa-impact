/**
 * EventEditor — Admin → Events tab (FINAL(2) PART 69/71/109).
 *
 * One collapsible editor for the public /event page, pre-filled with the
 * confirmed facts (SEED_EVENT) or the live Firestore doc. Nothing goes
 * public until Publish is pressed. Only the PRIMARY admin can edit or
 * publish; every other role sees the same fields read-only. If no primary
 * organizer exists yet, an admin can claim the role once, right here.
 */
import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Lock, Plus, Trash2 } from 'lucide-react';
import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { toast } from 'sonner';
import { useLanguage } from '@/i18n/LanguageContext';
import { db } from '@/lib/firebase';
import { SEED_EVENT, type EventDoc } from '@/lib/eventData';
import { useEvent } from '@/hooks/useEvent';
import type { StaffUser } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Field } from './fields';
import { dollarsToCents, inputCls } from './formUtils';

type SectionId =
  | 'basics'
  | 'datePlace'
  | 'ticket'
  | 'performers'
  | 'features'
  | 'businesses'
  | 'media'
  | 'publishing';

function Section({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-card border border-border bg-surface">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex min-h-[52px] w-full items-center justify-between gap-3 px-5 py-3 text-left"
      >
        <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-text-muted">
          {title}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-text-faint transition-transform duration-200',
            open && 'rotate-180',
          )}
          aria-hidden
        />
      </button>
      {open ? (
        <div className="space-y-4 border-t border-border px-5 py-5">{children}</div>
      ) : null}
    </section>
  );
}

export default function EventEditor({
  staff,
  uid,
  email,
}: {
  staff: StaffUser;
  uid: string;
  email: string;
}) {
  const { t } = useLanguage();
  const { event, loading } = useEvent();
  const [draft, setDraft] = useState<EventDoc | null>(null);
  const [openSections, setOpenSections] = useState<SectionId[]>(['basics']);
  const [busy, setBusy] = useState(false);
  const [claimBusy, setClaimBusy] = useState(false);
  const [hasPrimary, setHasPrimary] = useState<boolean | null>(null);

  const isPrimary = staff.role === 'admin' && staff.primary === true;
  const canEdit = isPrimary;

  // Pre-fill from the live doc once it loads; seed stands in before the
  // first publish (confirmed facts only).
  useEffect(() => {
    if (!loading && draft === null) {
      setDraft(JSON.parse(JSON.stringify(event)) as EventDoc);
    }
  }, [loading, event, draft]);

  // Does any staff member already carry the primary flag? (admin can list)
  useEffect(() => {
    if (!db || staff.role !== 'admin') return;
    getDocs(collection(db, 'staff'))
      .then((snap) => setHasPrimary(snap.docs.some((d) => d.data().primary === true)))
      .catch(() => setHasPrimary(null));
  }, [staff.role]);

  const priceStr = useMemo(
    () => (draft ? (draft.ticketPriceCents / 100).toString() : '25'),
    [draft],
  );

  const toggle = (id: SectionId) =>
    setOpenSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );

  const patch = (fn: (d: EventDoc) => EventDoc) =>
    setDraft((prev) => (prev ? fn(JSON.parse(JSON.stringify(prev)) as EventDoc) : prev));

  const claimPrimary = async () => {
    if (!db || claimBusy) return;
    setClaimBusy(true);
    try {
      await setDoc(doc(db, 'staff', uid), { primary: true }, { merge: true });
      setHasPrimary(true);
    } catch (err) {
      console.warn('[EventEditor] claim failed:', err);
    } finally {
      setClaimBusy(false);
    }
  };

  const publish = async () => {
    if (!db || !draft || !canEdit || busy) return;
    setBusy(true);
    try {
      await setDoc(doc(db, 'events', 'current'), {
        ...draft,
        status: 'published',
        updatedAt: serverTimestamp(),
        updatedBy: email,
      });
      toast.success(t.admin.ev.published);
    } catch (err) {
      console.warn('[EventEditor] publish failed:', err);
    } finally {
      setBusy(false);
    }
  };

  if (loading || !draft) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-border-strong border-t-amber" />
      </div>
    );
  }

  const disabled = !canEdit;
  const ev = t.admin.ev;

  return (
    <div className="space-y-4">
      {/* ── Permission banner ────────────────────────────────────── */}
      {!canEdit ? (
        <div className="rounded-card border border-border bg-surface-2/60 p-5">
          <div className="flex items-start gap-3">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-text-faint" aria-hidden />
            <div>
              <p className="text-[14px] font-semibold text-text">{ev.readOnlyTitle}</p>
              <p className="mt-1 text-[13px] leading-[1.55] text-text-muted">
                {ev.readOnlyNote}
              </p>
              {staff.role === 'admin' && hasPrimary === false ? (
                <>
                  <p className="mt-3 text-[13px] leading-[1.55] text-text-muted">
                    {ev.claimNote}
                  </p>
                  <button
                    type="button"
                    disabled={claimBusy}
                    onClick={() => void claimPrimary()}
                    className="mt-3 inline-flex min-h-[44px] items-center rounded-[10px] bg-amber px-5 text-[14px] font-semibold text-white transition-colors hover:bg-amber-soft disabled:opacity-60"
                  >
                    {claimBusy ? ev.claiming : ev.claimCta}
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {/* ── BASICS ───────────────────────────────────────────────── */}
      <Section title={ev.sections.basics} open={openSections.includes('basics')} onToggle={() => toggle('basics')}>
        <Field label={ev.titleEn}>
          <input disabled={disabled} value={draft.title.en} onChange={(e) => patch((d) => ((d.title.en = e.target.value), d))} className={cn(inputCls, 'disabled:opacity-60')} />
        </Field>
        <Field label={ev.titleEs}>
          <input disabled={disabled} value={draft.title.es} onChange={(e) => patch((d) => ((d.title.es = e.target.value), d))} className={cn(inputCls, 'disabled:opacity-60')} />
        </Field>
      </Section>

      {/* ── DATE & PLACE ─────────────────────────────────────────── */}
      <Section title={ev.sections.datePlace} open={openSections.includes('datePlace')} onToggle={() => toggle('datePlace')}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={ev.dateEn}>
            <input disabled={disabled} value={draft.dateLabel.en} onChange={(e) => patch((d) => ((d.dateLabel.en = e.target.value), d))} className={cn(inputCls, 'disabled:opacity-60')} />
          </Field>
          <Field label={ev.dateEs}>
            <input disabled={disabled} value={draft.dateLabel.es} onChange={(e) => patch((d) => ((d.dateLabel.es = e.target.value), d))} className={cn(inputCls, 'disabled:opacity-60')} />
          </Field>
          <Field label={ev.timeEn}>
            <input disabled={disabled} value={draft.timeLabel.en} onChange={(e) => patch((d) => ((d.timeLabel.en = e.target.value), d))} className={cn(inputCls, 'disabled:opacity-60')} />
          </Field>
          <Field label={ev.timeEs}>
            <input disabled={disabled} value={draft.timeLabel.es} onChange={(e) => patch((d) => ((d.timeLabel.es = e.target.value), d))} className={cn(inputCls, 'disabled:opacity-60')} />
          </Field>
        </div>
        <Field label={ev.venue}>
          <input disabled={disabled} value={draft.venueName} onChange={(e) => patch((d) => ((d.venueName = e.target.value), d))} className={cn(inputCls, 'disabled:opacity-60')} />
        </Field>
        <Field label={ev.address}>
          <input disabled={disabled} value={draft.address} onChange={(e) => patch((d) => ((d.address = e.target.value), d))} className={cn(inputCls, 'disabled:opacity-60')} />
        </Field>
      </Section>

      {/* ── TICKET & DONATION ────────────────────────────────────── */}
      <Section title={ev.sections.ticket} open={openSections.includes('ticket')} onToggle={() => toggle('ticket')}>
        <Field label={ev.price}>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-mono text-[15px] text-text-muted">$</span>
            <input
              disabled={disabled}
              type="text"
              inputMode="decimal"
              value={priceStr}
              onChange={(e) => patch((d) => ((d.ticketPriceCents = dollarsToCents(e.target.value)), d))}
              className={cn(inputCls, 'pl-8 font-mono disabled:opacity-60')}
            />
          </div>
        </Field>
        <Field label={ev.ticketUrl}>
          <input
            disabled={disabled}
            value={draft.ticketUrl ?? ''}
            onChange={(e) => patch((d) => ((d.ticketUrl = e.target.value.trim() || null), d))}
            className={cn(inputCls, 'font-mono text-[13px] disabled:opacity-60')}
          />
        </Field>
      </Section>

      {/* ── PERFORMERS & HOSTS ───────────────────────────────────── */}
      <Section title={ev.sections.performers} open={openSections.includes('performers')} onToggle={() => toggle('performers')}>
        {draft.performers.map((p, i) => (
          <div key={i} className="rounded-[10px] border border-border p-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label={ev.name}>
                <input disabled={disabled} value={p.name} onChange={(e) => patch((d) => ((d.performers[i].name = e.target.value), d))} className={cn(inputCls, 'disabled:opacity-60')} />
              </Field>
              <Field label={ev.roleEn}>
                <input disabled={disabled} value={p.role.en} onChange={(e) => patch((d) => ((d.performers[i].role.en = e.target.value), d))} className={cn(inputCls, 'disabled:opacity-60')} />
              </Field>
              <Field label={ev.roleEs}>
                <input disabled={disabled} value={p.role.es} onChange={(e) => patch((d) => ((d.performers[i].role.es = e.target.value), d))} className={cn(inputCls, 'disabled:opacity-60')} />
              </Field>
            </div>
            {!disabled ? (
              <button type="button" onClick={() => patch((d) => (d.performers.splice(i, 1), d))} className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-danger">
                <Trash2 className="h-3.5 w-3.5" aria-hidden /> {ev.remove}
              </button>
            ) : null}
          </div>
        ))}
        {!disabled ? (
          <button
            type="button"
            onClick={() => patch((d) => (d.performers.push({ name: '', role: { en: '', es: '' } }), d))}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-[10px] border border-border-strong px-4 text-[13px] font-semibold text-text"
          >
            <Plus className="h-4 w-4" aria-hidden /> {ev.add}
          </button>
        ) : null}
      </Section>

      {/* ── FEATURES ─────────────────────────────────────────────── */}
      <Section title={ev.sections.features} open={openSections.includes('features')} onToggle={() => toggle('features')}>
        {draft.features.map((f, i) => (
          <div key={i} className="flex items-end gap-3">
            <Field label={ev.featureEn} className="flex-1">
              <input disabled={disabled} value={f.en} onChange={(e) => patch((d) => ((d.features[i].en = e.target.value), d))} className={cn(inputCls, 'disabled:opacity-60')} />
            </Field>
            <Field label={ev.featureEs} className="flex-1">
              <input disabled={disabled} value={f.es} onChange={(e) => patch((d) => ((d.features[i].es = e.target.value), d))} className={cn(inputCls, 'disabled:opacity-60')} />
            </Field>
            {!disabled ? (
              <button type="button" aria-label={ev.remove} onClick={() => patch((d) => (d.features.splice(i, 1), d))} className="flex h-12 w-10 shrink-0 items-center justify-center text-danger">
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            ) : null}
          </div>
        ))}
        {!disabled ? (
          <button
            type="button"
            onClick={() => patch((d) => (d.features.push({ en: '', es: '' }), d))}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-[10px] border border-border-strong px-4 text-[13px] font-semibold text-text"
          >
            <Plus className="h-4 w-4" aria-hidden /> {ev.add}
          </button>
        ) : null}
      </Section>

      {/* ── BUSINESSES & SPONSORS ────────────────────────────────── */}
      <Section title={ev.sections.businesses} open={openSections.includes('businesses')} onToggle={() => toggle('businesses')}>
        {draft.businesses.map((b, i) => (
          <div key={i} className="rounded-[10px] border border-border p-4">
            <Field label={ev.name}>
              <input disabled={disabled} value={b.name} onChange={(e) => patch((d) => ((d.businesses[i].name = e.target.value), d))} className={cn(inputCls, 'disabled:opacity-60')} />
            </Field>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label={ev.givesEn}>
                <input disabled={disabled} value={b.gives.en} onChange={(e) => patch((d) => ((d.businesses[i].gives.en = e.target.value), d))} className={cn(inputCls, 'disabled:opacity-60')} />
              </Field>
              <Field label={ev.givesEs}>
                <input disabled={disabled} value={b.gives.es} onChange={(e) => patch((d) => ((d.businesses[i].gives.es = e.target.value), d))} className={cn(inputCls, 'disabled:opacity-60')} />
              </Field>
              <Field label={ev.kindEn}>
                <input disabled={disabled} value={b.kind.en} onChange={(e) => patch((d) => ((d.businesses[i].kind.en = e.target.value), d))} className={cn(inputCls, 'disabled:opacity-60')} />
              </Field>
              <Field label={ev.kindEs}>
                <input disabled={disabled} value={b.kind.es} onChange={(e) => patch((d) => ((d.businesses[i].kind.es = e.target.value), d))} className={cn(inputCls, 'disabled:opacity-60')} />
              </Field>
            </div>
            {!disabled ? (
              <button type="button" onClick={() => patch((d) => (d.businesses.splice(i, 1), d))} className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-danger">
                <Trash2 className="h-3.5 w-3.5" aria-hidden /> {ev.remove}
              </button>
            ) : null}
          </div>
        ))}
        {!disabled ? (
          <button
            type="button"
            onClick={() => patch((d) => (d.businesses.push({ name: '', gives: { en: '', es: '' }, kind: { en: '', es: '' } }), d))}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-[10px] border border-border-strong px-4 text-[13px] font-semibold text-text"
          >
            <Plus className="h-4 w-4" aria-hidden /> {ev.add}
          </button>
        ) : null}
      </Section>

      {/* ── MEDIA ────────────────────────────────────────────────── */}
      <Section title={ev.sections.media} open={openSections.includes('media')} onToggle={() => toggle('media')}>
        <Field label={ev.image} hint={ev.imageHint}>
          <input
            disabled={disabled}
            value={draft.image ?? ''}
            onChange={(e) => patch((d) => ((d.image = e.target.value.trim() || null), d))}
            className={cn(inputCls, 'font-mono text-[13px] disabled:opacity-60')}
          />
        </Field>
        {draft.image ? (
          <img src={draft.image} alt="" className="mt-2 max-h-48 rounded-[10px] border border-border object-cover" />
        ) : null}
      </Section>

      {/* ── PUBLISHING ───────────────────────────────────────────── */}
      <Section title={ev.sections.publishing} open={openSections.includes('publishing')} onToggle={() => toggle('publishing')}>
        <p className="text-[13px] leading-[1.55] text-text-muted">{ev.publishNote}</p>
        {canEdit ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void publish()}
            className="flex h-12 w-full items-center justify-center rounded-[10px] bg-amber text-[15px] font-semibold text-white transition-colors hover:bg-amber-soft disabled:opacity-60"
          >
            {busy ? ev.publishing : ev.publish}
          </button>
        ) : null}
      </Section>
    </div>
  );
}

/** Re-export so Admin.tsx never imports eventData directly. */
export { SEED_EVENT };
