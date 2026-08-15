/**
 * Donate page (mobile-first — 90% of visitors are on phones).
 *
 * One module, one decision (one-pass master §17–18): a strong human
 * photograph, "Our people need us.", the amount ladder with the $25
 * solidarity ticket visually prominent, custom amount, Give Now.
 *
 * Tapping Give asks the createCheckoutSession function for a Stripe
 * Checkout URL and redirects. Choosing the $25 preset checks out as the
 * solidarity ticket (fixed server-side price, tagged 'ticket'). Until
 * the functions are deployed, everything falls back to the fixed
 * Stripe Payment Link.
 */
import { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useLanguage } from '@/i18n/LanguageContext';
import { CAMPAIGN, campaignEyebrow } from '@/lib/campaign';
import { CHECKOUT_AVAILABLE, startCheckout } from '@/lib/donate';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

/** Preset donation amounts, integer cents. */
const PRESETS = [1_000, 2_500, 5_000, 10_000, 25_000, 50_000, 100_000];
const TICKET_CENTS = 2_500;
const MIN_CUSTOM_CENTS = 100;

export default function Donate() {
  const reduceMotion = useReducedMotion();
  const { t, lang } = useLanguage();
  const [selected, setSelected] = useState<number | null>(TICKET_CENTS);
  const [custom, setCustom] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const customCents = useMemo(() => {
    const n = Math.round(Number(custom.replace(/[^0-9.]/g, '')) * 100);
    return Number.isFinite(n) ? n : 0;
  }, [custom]);

  const customValid = custom.trim() !== '' && customCents >= MIN_CUSTOM_CENTS;
  const chosenCents = customValid ? customCents : selected;

  // One warm line under the ladder: what this amount can do. Custom
  // amounts and non-preset values get the generic line.
  const ladderLine = (() => {
    if (chosenCents == null) return null;
    const L = t.donate.page.ladder as Record<string, string>;
    if (customValid) return L.custom;
    return L[String(chosenCents)] ?? L.custom;
  })();

  const go = async () => {
    if (busy || chosenCents == null) return;
    setBusy(true);
    setError(false);
    // The $25 preset IS the solidarity ticket — tagged server-side.
    const type =
      !customValid && selected === TICKET_CENTS ? 'ticket' : 'donation';
    try {
      await startCheckout(type, chosenCents);
      // Browser is navigating away — keep the busy state.
    } catch {
      setBusy(false);
      setError(true);
    }
  };

  const presetBtn = (active: boolean) =>
    cn(
      'relative flex h-14 items-center justify-center rounded-[12px] border text-[16px] font-semibold transition-all duration-150 ease-calm active:scale-[0.97]',
      active
        ? 'border-amber bg-amber text-white'
        : 'border-border bg-surface text-text hover:border-border-strong',
    );

  return (
    <main className="mx-auto w-full max-w-xl px-5 pb-24 pt-8 md:pt-14">
      {/* Campaign eyebrow */}
      <motion.p
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted"
      >
        LAPA.Help · {campaignEyebrow(lang)}
      </motion.p>

      {/* One strong human photograph */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE, delay: reduceMotion ? 0 : 0.06 }}
        className="mt-4 overflow-hidden rounded-card"
      >
        <img
          src={CAMPAIGN.donateImage}
          alt={lang === 'es' ? CAMPAIGN.locationEs : CAMPAIGN.location}
          className="aspect-[16/10] w-full object-cover"
          loading="eager"
        />
      </motion.div>

      {/* Headline + the single decision */}
      <motion.section
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE, delay: reduceMotion ? 0 : 0.12 }}
        className="mt-7"
        aria-label={t.donate.page.chooseAmount}
      >
        <h1 className="text-center font-display text-[32px] font-medium leading-[1.1] tracking-[-0.01em] text-text md:text-[40px]">
          {t.donate.page.title}
        </h1>
        <p className="mt-2 text-center text-[15px] font-medium text-text-muted">
          {t.donate.page.chooseAmount}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2.5 min-[420px]:grid-cols-3">
          {PRESETS.map((cents) => {
            const active = !customValid && selected === cents;
            return (
              <button
                key={cents}
                type="button"
                onClick={() => {
                  setSelected(cents);
                  setCustom('');
                }}
                aria-pressed={active}
                className={presetBtn(active)}
              >
                {cents === TICKET_CENTS ? (
                  <span
                    className={cn(
                      'absolute -top-2 right-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]',
                      active ? 'bg-white text-amber' : 'bg-terra text-white',
                    )}
                  >
                    {t.donate.page.ticketTag}
                  </span>
                ) : null}
                {formatMoney(cents)}
              </button>
            );
          })}
          {/* Custom amount fills the last grid cell */}
          <div
            className={cn(
              'flex h-14 items-center rounded-[12px] border bg-surface px-3 transition-colors duration-150',
              customValid ? 'border-amber' : 'border-border focus-within:border-border-strong',
            )}
          >
            <span className="text-[16px] text-text-muted">$</span>
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              inputMode="decimal"
              placeholder={t.donate.page.customPh}
              aria-label={t.donate.page.customAria}
              className="h-full w-full bg-transparent pl-1 text-[16px] font-semibold text-text placeholder:font-normal placeholder:text-text-faint focus:outline-none"
              style={{ fontSize: 16 }} /* ≥16px prevents iOS focus zoom */
            />
          </div>
        </div>

        {ladderLine ? (
          <motion.p
            key={ladderLine}
            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="mt-3 text-center text-[14px] leading-[1.5] text-text-muted"
          >
            {ladderLine}
          </motion.p>
        ) : null}

        {custom.trim() !== '' && !customValid ? (
          <p className="mt-2 text-center text-[13px] font-medium text-danger" role="alert">
            {t.donate.page.customMin}
          </p>
        ) : null}

        <button
          type="button"
          disabled={!CHECKOUT_AVAILABLE || busy || chosenCents == null || chosenCents < MIN_CUSTOM_CENTS}
          onClick={() => void go()}
          className="mt-4 flex h-[52px] w-full items-center justify-center rounded-[12px] bg-amber text-[16px] font-semibold text-white transition-all duration-150 ease-calm hover:bg-amber-soft active:scale-[0.98] disabled:opacity-50"
        >
          {busy
            ? t.donate.page.opening
            : chosenCents
              ? t.donate.page.giveCta(formatMoney(chosenCents))
              : t.donate.page.chooseAmount}
        </button>

        {error ? (
          <p className="mt-3 text-center text-[13px] font-medium text-danger" role="alert">
            {t.donate.page.checkoutError}
          </p>
        ) : null}

        <p className="mt-5 text-center text-[14px] font-medium leading-[1.55] text-text">
          {t.donate.page.supportLine}
        </p>
        <p className="mt-4 text-center font-display text-[15px] italic leading-[1.5] text-text-muted">
          {t.donate.page.grow}
        </p>
        <p className="mt-3 text-center text-[12px] font-medium tracking-[0.01em] text-text-faint">
          {t.donate.page.secureNote}
        </p>
      </motion.section>
    </main>
  );
}
