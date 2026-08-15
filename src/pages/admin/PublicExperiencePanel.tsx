/**
 * PublicExperiencePanel — the admin's PREVIEW / LIVE / PAUSED switch
 * (final doc §7–12). One small panel above the workbench.
 *
 * - The flip is ALWAYS a deliberate human decision — never triggered by
 *   donation counts, amounts, or elapsed time.
 * - GO LIVE asks for confirmation (§8) and shows the §9 checklist as
 *   guidance, not an automated gate.
 * - PAUSE keeps existing records public and does NOT auto-return to
 *   preview; returning to preview is a separate deliberate action (§12).
 */
import { useState } from 'react';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Check, Loader2, Radio } from 'lucide-react';
import { toast } from 'sonner';
import Modal from '@/components/Modal';
import { db } from '@/lib/firebase';
import { usePublicMode, type PublicMode } from '@/hooks/usePublicMode';
import { useLanguage } from '@/i18n/LanguageContext';
import { logAudit } from './writeUtils';
import { cn } from '@/lib/utils';

type PendingAction = 'live' | 'paused' | 'preview' | null;

export default function PublicExperiencePanel({ email }: { email: string }) {
  const { t } = useLanguage();
  const { mode, ready } = usePublicMode();
  const [pending, setPending] = useState<PendingAction>(null);
  const [working, setWorking] = useState(false);

  const chip: Record<PublicMode, { label: string; cls: string; dot: string }> = {
    preview: {
      label: t.publicMode.statusPreview,
      cls: 'border-amber/50 bg-amber-glow text-amber',
      dot: 'bg-amber',
    },
    live: {
      label: t.publicMode.statusLive,
      cls: 'border-sage/50 bg-sage/10 text-sage',
      dot: 'bg-sage animate-pulse',
    },
    paused: {
      label: t.publicMode.statusPaused,
      cls: 'border-border bg-surface-2 text-text-muted',
      dot: 'bg-text-muted',
    },
  };

  const desc: Record<PublicMode, string> = {
    preview: t.publicMode.descPreview,
    live: t.publicMode.descLive,
    paused: t.publicMode.descPaused,
  };

  const confirmCopy: Record<
    Exclude<PendingAction, null>,
    { title: string; body: string; cta: string; toast: string }
  > = {
    live: {
      title: t.publicMode.confirmGoLiveTitle,
      body: t.publicMode.confirmGoLiveBody,
      cta: t.publicMode.goLive,
      toast: t.publicMode.toastGoLive,
    },
    paused: {
      title: t.publicMode.confirmPauseTitle,
      body: t.publicMode.confirmPauseBody,
      cta: t.publicMode.pause,
      toast: t.publicMode.toastPaused,
    },
    preview: {
      title: t.publicMode.confirmBackTitle,
      body: t.publicMode.confirmBackBody,
      cta: t.publicMode.backToPreview,
      toast: t.publicMode.toastPreview,
    },
  };

  const apply = async (next: Exclude<PendingAction, null>) => {
    if (!db || working) return;
    setWorking(true);
    try {
      await setDoc(
        doc(db, 'settings', 'public'),
        { mode: next, updatedAt: serverTimestamp(), updatedBy: email },
        { merge: true },
      );
      void logAudit(db, 'settings.mode', { mode: next });
      toast.success(confirmCopy[next].toast);
      setPending(null);
    } catch (err) {
      console.error('[PublicExperiencePanel] mode write failed:', err);
      toast.error(t.common.saveFailed);
    } finally {
      setWorking(false);
    }
  };

  const active = chip[mode];

  return (
    <section
      aria-label={t.publicMode.panelTitle}
      className="mt-6 rounded-card border border-border bg-surface p-5 md:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Radio className="h-4 w-4 text-text-muted" strokeWidth={1.75} />
          <h2 className="text-[12px] font-semibold tracking-[0.14em] text-text-muted">
            {t.publicMode.panelTitle}
          </h2>
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-[0.08em]',
              active.cls,
            )}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full', active.dot)} />
            {active.label}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {mode !== 'live' && (
            <button
              type="button"
              disabled={!ready}
              onClick={() => setPending('live')}
              className="rounded-full bg-amber px-5 py-2.5 text-[13px] font-semibold tracking-[0.02em] text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {t.publicMode.goLive}
            </button>
          )}
          {mode === 'live' && (
            <button
              type="button"
              disabled={!ready}
              onClick={() => setPending('paused')}
              className="rounded-full border border-border px-5 py-2.5 text-[13px] font-semibold tracking-[0.02em] text-text transition-colors hover:border-text-muted disabled:opacity-50"
            >
              {t.publicMode.pause}
            </button>
          )}
          {mode === 'paused' && (
            <button
              type="button"
              disabled={!ready}
              onClick={() => setPending('preview')}
              className="text-[13px] font-medium text-text-muted underline decoration-dotted underline-offset-4 transition-colors hover:text-text disabled:opacity-50"
            >
              {t.publicMode.backToPreview}
            </button>
          )}
        </div>
      </div>

      <p className="mt-3 text-[13px] leading-[1.6] text-text-muted">{desc[mode]}</p>

      {/* Confirmation — GO LIVE gets the §9 checklist as guidance. */}
      <Modal
        open={pending !== null}
        onClose={() => !working && setPending(null)}
        title={pending ? confirmCopy[pending].title : ''}
      >
        {pending && (
          <div>
            <p className="whitespace-pre-line text-[14px] leading-[1.7] text-text">
              {confirmCopy[pending].body}
            </p>

            {pending === 'live' && (
              <div className="mt-5 rounded-lg border border-border bg-surface-2 p-4">
                <p className="text-[11px] font-semibold tracking-[0.12em] text-text-muted">
                  {t.publicMode.checklistTitle.toUpperCase()}
                </p>
                <ul className="mt-2.5 space-y-2">
                  {t.publicMode.checklist.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-[13px] leading-[1.5] text-text"
                    >
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0 text-sage"
                        strokeWidth={2}
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={working}
                onClick={() => setPending(null)}
                className="rounded-full border border-border px-5 py-3 text-[14px] font-medium text-text transition-colors hover:border-text-muted disabled:opacity-50"
              >
                {t.publicMode.cancel}
              </button>
              <button
                type="button"
                disabled={working}
                onClick={() => void apply(pending)}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-full px-6 py-3 text-[14px] font-semibold transition-opacity hover:opacity-90 disabled:opacity-60',
                  pending === 'live'
                    ? 'bg-amber text-white'
                    : 'bg-text text-bg',
                )}
              >
                {working && <Loader2 className="h-4 w-4 animate-spin" />}
                {working ? t.publicMode.working : confirmCopy[pending].cta}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}
