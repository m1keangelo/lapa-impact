/**
 * ContextualHelp — ONE reusable help sheet for the whole admin (final doc
 * §53–68). Each panel gets ONE subtle ⓘ button with a 44×44px touch
 * target. Opens the shared Modal (centered on desktop, bottom sheet on
 * mobile) with plain-language sections: what it does / what to enter /
 * what happens next / what donors see / example. Never navigates, never
 * reloads, never loses unsaved form data.
 */
import { useState } from 'react';
import { CircleHelp } from 'lucide-react';
import Modal from '@/components/Modal';
import { useLanguage } from '@/i18n/LanguageContext';
import { cn } from '@/lib/utils';

export type HelpArea = 'gift' | 'transfer' | 'update' | 'photos' | 'queue' | 'team' | 'events' | 'hero';

function HelpBody({ area }: { area: HelpArea | 'global' }) {
  const { t } = useLanguage();
  const c = t.help.areas[area];
  if (!c) return null;

  return (
    <div className="mt-4 space-y-5 text-[14px] leading-[1.65]">
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-faint">
          {t.help.whatItDoes}
        </h3>
        <p className="mt-1.5 text-text">{c.does}</p>
      </section>

      {c.enter.length > 0 && (
        <section>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-faint">
            {t.help.whatToEnter}
          </h3>
          <ul className="mt-1.5 list-disc space-y-1 pl-5 text-text">
            {c.enter.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-faint">
          {t.help.whatHappens}
        </h3>
        <p className="mt-1.5 text-text">{c.next}</p>
        <p className="mt-2 rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-[13px] font-medium text-text-muted">
          {t.help.flow}
        </p>
      </section>

      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-faint">
          {t.help.whatDonorsSee}
        </h3>
        <p className="mt-1.5 text-text">{c.donorsSee}</p>
      </section>

      {c.example ? (
        <section>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-faint">
            {t.help.exampleLabel}
          </h3>
          <p className="mt-1.5 rounded-lg border border-amber/40 bg-amber-glow px-3.5 py-2.5 text-[13px] font-medium text-text">
            {c.example}
          </p>
        </section>
      ) : null}
    </div>
  );
}

/** The per-panel ⓘ button + sheet. */
export default function ContextualHelp({
  area,
  areaLabel,
  className,
}: {
  area: HelpArea;
  /** Human panel name for the aria label — "Help for Gift", not "Info" */
  areaLabel: string;
  className?: string;
}) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const content = t.help.areas[area];

  return (
    <>
      <button
        type="button"
        aria-label={t.help.buttonAria(areaLabel)}
        onClick={() => setOpen(true)}
        className={cn(
          'flex h-11 w-11 items-center justify-center rounded-full text-text-faint transition-colors hover:bg-surface-2 hover:text-text',
          className,
        )}
      >
        <CircleHelp className="h-[18px] w-[18px]" strokeWidth={1.5} />
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={content?.title ?? areaLabel}
        wide
      >
        <HelpBody area={area} />
      </Modal>
    </>
  );
}

/** The global "HOW THIS WORKS ⓘ" link near the top of admin (§66). */
export function GlobalHelp() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label={t.help.globalAria}
        onClick={() => setOpen(true)}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-border bg-surface px-4 text-[12px] font-semibold tracking-[0.1em] text-text-muted transition-colors hover:border-border-strong hover:text-text"
      >
        {t.help.globalCta}
        <CircleHelp className="h-4 w-4 text-amber" strokeWidth={1.75} />
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={t.help.areas.global.title} wide>
        <HelpBody area="global" />
      </Modal>
    </>
  );
}
