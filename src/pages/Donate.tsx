/**
 * Donate page (mobile-first — 90% of visitors are on phones).
 *
 * Two ways in, one shared pot:
 *   1. The $25 solidarity ticket (fixed price, server-side).
 *   2. The donation ladder: $10–$1000 presets or a custom amount ($1 min).
 *
 * Tapping any option asks the createCheckoutSession function for a Stripe
 * Checkout URL and redirects. Until the functions are deployed, everything
 * falls back to the fixed Stripe Payment Link.
 */
import { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { HeartHandshake, Ticket } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
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
  const { t } = useLanguage();
  const [selected, setSelected] = useState<number | null>(2_500);
  const [custom, setCustom] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const customCents = useMemo(() => {
    const n = Math.round(Number(custom.replace(/[^0-9.]/g, '')) * 100);
    return Number.isFinite(n) ? n : 0;
  }, [custom]);

  const customValid = custom.trim() !== '' && customCents >= MIN_CUSTOM_CENTS;
  const chosenCents = customValid ? customCents : selected;

  const go = async (type: 'donation' | 'ticket', amountCents?: number) => {
    if (busy) return;
    setBusy(true);
    setError(false);
    try {
      await startCheckout(type, amountCents);
      // Browser is navigating away — keep the busy state.
    } catch {
      setBusy(false);
      setError(true);
    }
  };

  const presetBtn = (active: boolean) =>
    cn(
      'flex h-14 items-center justify-center rounded-[12px] border font-mono text-[16px] font-medium transition-all duration-150 ease-calm active:scale-[0.97]',
      active
        ? 'border-amber bg-amber/15 text-amber'
        : 'border-border bg-surface-2 text-text hover:border-border-strong',
    );

  return (
    <main className="mx-auto w-full max-w-xl px-5 pb-24 pt-10 md:pt-16">
      {/* Header */}
      <motion.header
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="text-center"
      >
        <h1 className="font-display text-[32px] font-medium leading-[1.1] tracking-[-0.01em] text-text md:text-[44px]">
          {t.donate.page.title}
        </h1>
        <p className="mx-auto mt-3 max-w-[40ch] text-[15px] leading-[1.6] text-text-muted">
          {t.donate.page.subtitle}
        </p>
      </motion.header>

      {/* $25 ticket */}
      <motion.section
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE, delay: reduceMotion ? 0 : 0.08 }}
        className="mt-8 rounded-card border border-amber/40 bg-surface p-5"
        aria-label={t.donate.page.ticketTitle}
      >
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber/15">
            <Ticket className="h-5 w-5 text-amber" strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-display text-[19px] font-medium text-text">
                {t.donate.page.ticketTitle}
              </h2>
              <span
                className="font-mono text-[19px] font-medium text-amber"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {formatMoney(TICKET_CENTS)}
              </span>
            </div>
            <p className="mt-1.5 text-[14px] leading-[1.55] text-text-muted">
              {t.donate.page.ticketBody}
            </p>
          </div>
        </div>
        <button
          type="button"
          disabled={!CHECKOUT_AVAILABLE || busy}
          onClick={() => void go('ticket')}
          className="mt-4 flex h-[52px] w-full items-center justify-center rounded-[12px] bg-amber font-semibold text-[#201409] transition-all duration-150 ease-calm hover:brightness-105 active:scale-[0.98] disabled:opacity-50"
        >
          {busy ? t.donate.page.opening : t.donate.page.ticketCta}
        </button>
      </motion.section>

      {/* Divider */}
      <div className="mt-8 flex items-center gap-4" aria-hidden>
        <span className="h-px flex-1 bg-border" />
        <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-text-faint">
          {t.donate.page.orDivider}
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      {/* Donation ladder */}
      <motion.section
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE, delay: reduceMotion ? 0 : 0.16 }}
        className="mt-8"
        aria-label={t.donate.page.chooseAmount}
      >
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sage/15">
            <HeartHandshake className="h-5 w-5 text-sage" strokeWidth={1.75} />
          </span>
          <h2 className="pt-2.5 font-display text-[19px] font-medium text-text">
            {t.donate.page.chooseAmount}
          </h2>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5 min-[420px]:grid-cols-3">
          {PRESETS.map((cents) => (
            <button
              key={cents}
              type="button"
              onClick={() => {
                setSelected(cents);
                setCustom('');
              }}
              aria-pressed={!customValid && selected === cents}
              className={presetBtn(!customValid && selected === cents)}
            >
              {formatMoney(cents)}
            </button>
          ))}
          {/* Custom amount fills the last grid cell */}
          <div
            className={cn(
              'flex h-14 items-center rounded-[12px] border bg-surface-2 px-3 transition-colors duration-150',
              customValid ? 'border-amber' : 'border-border focus-within:border-border-strong',
            )}
          >
            <span className="font-mono text-[16px] text-text-muted">$</span>
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              inputMode="decimal"
              placeholder={t.donate.page.customPh}
              aria-label={t.donate.page.customAria}
              className="h-full w-full bg-transparent pl-1 font-mono text-[16px] text-text placeholder:text-text-faint focus:outline-none"
              style={{ fontSize: 16 }} /* ≥16px prevents iOS focus zoom */
            />
          </div>
        </div>

        {custom.trim() !== '' && !customValid ? (
          <p className="mt-2 text-[13px] font-medium text-danger" role="alert">
            {t.donate.page.customMin}
          </p>
        ) : null}

        <button
          type="button"
          disabled={!CHECKOUT_AVAILABLE || busy || chosenCents == null || chosenCents < MIN_CUSTOM_CENTS}
          onClick={() => void go('donation', chosenCents ?? undefined)}
          className="mt-4 flex h-[52px] w-full items-center justify-center rounded-[12px] bg-sage font-semibold text-[#122112] transition-all duration-150 ease-calm hover:brightness-105 active:scale-[0.98] disabled:opacity-50"
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

        <p className="mt-5 text-center text-[13px] leading-[1.55] text-text-muted">
          {t.donate.potNote}
        </p>
        <p className="mt-2 text-center text-[12px] font-medium tracking-[0.01em] text-text-faint">
          {t.donate.page.secureNote}
        </p>
      </motion.section>
    </main>
  );
}
