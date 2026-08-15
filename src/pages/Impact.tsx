/**
 * My Impact — /impact (master §37). The donor's window into the mission:
 * a warm greeting, "Your $X joined the Colombia response fund.", their
 * giving list, and a preview of what the shared fund is doing right now —
 * with paths into the story and the proof. Never a "dashboard", never a
 * claim that a specific gift bought a specific item.
 *
 * Auth-gated by Firebase Auth (email + password). On mount we silently ask
 * the backend to link any gifts made with this account's email
 * (linkMyDonations) — safe before the functions deploy, instant after.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router';
import { motion, useReducedMotion } from 'framer-motion';
import {
  AlertTriangle,
  Camera,
  HandCoins,
  Loader2,
  Package,
  RefreshCw,
  ScrollText,
} from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { firebaseReady } from '@/lib/firebase';
import {
  linkMyDonations,
  signOutDonor,
  useAccountName,
  useAuthUser,
} from '@/lib/auth';
import { useMyDonations } from '@/hooks/useMyDonations';
import { usePublicFeed } from '@/hooks/usePublicFeed';
import PreviewChip from '@/components/PreviewChip';
import { formatMoneyShort, toMillis } from '@/lib/format';
import type { FeedEntry } from '@/lib/types';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

function dateLabel(ts: number, lang: 'en' | 'es'): string {
  return new Date(ts).toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export default function Impact() {
  const reduceMotion = useReducedMotion();
  const { t, lang } = useLanguage();
  const { user, loading: authLoading } = useAuthUser();
  const accountName = useAccountName(user);
  const [retryKey, setRetryKey] = useState(0);
  const {
    donations,
    status: donationsStatus,
  } = useMyDonations(user?.uid ?? null, 25, retryKey);
  const feed = usePublicFeed();

  // Link gifts made with this email to the account — once per sign-in.
  useEffect(() => {
    if (user) void linkMyDonations();
  }, [user]);

  const totalGiven = useMemo(
    () => donations.reduce((s, d) => s + d.amount, 0),
    [donations],
  );

  const missionPreview = useMemo(() => feed.entries.slice(0, 3), [feed.entries]);

  // Guards come after every hook (rules of hooks).
  if (authLoading) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center" role="status">
        <Loader2 className="h-8 w-8 animate-spin text-amber" strokeWidth={1.5} />
      </div>
    );
  }
  if (!firebaseReady || !user) {
    return <Navigate to="/login" state={{ from: 'impact' }} replace />;
  }

  const name = accountName ?? t.myImpact.fallbackName;
  const rise = (delay: number) => ({
    initial: { opacity: 0, y: reduceMotion ? 0 : 24 },
    animate: { opacity: 1, y: 0 },
    transition: {
      delay: reduceMotion ? 0 : delay,
      duration: reduceMotion ? 0 : 0.5,
      ease: EASE,
    },
  });

  const missionLine = (entry: FeedEntry): { icon: typeof HandCoins; text: string } => {
    switch (entry.kind) {
      case 'donation':
        return {
          icon: HandCoins,
          text: t.home.feedPreview.donationTitle(
            entry.donation.donorName ?? t.common.aDonor,
          ),
        };
      case 'transfer':
        return {
          icon: Package,
          text: t.home.feedPreview.transferTitle(
            lang === 'es'
              ? entry.transfer.recipientEs ?? entry.transfer.recipient
              : entry.transfer.recipient,
          ),
        };
      case 'update':
        return {
          icon: ScrollText,
          text:
            lang === 'es'
              ? entry.update.titleEs ?? entry.update.title
              : entry.update.title,
        };
      case 'photo':
        return {
          icon: Camera,
          text:
            lang === 'es'
              ? entry.media.captionEs ?? entry.media.caption
              : entry.media.caption,
        };
    }
  };

  return (
    <div className="relative">
      <div className="mx-auto w-full max-w-container px-5 pb-20 pt-10 md:px-8">
        {/* ── Header ─────────────────────────────────────────────── */}
        <header>
          <motion.p
            {...rise(0)}
            className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber"
          >
            {t.myImpact.eyebrow}
          </motion.p>
          <motion.h1
            {...rise(0.08)}
            className="mt-4 font-display text-[32px] font-medium leading-[1.1] tracking-[-0.015em] text-text md:text-5xl"
          >
            {t.myImpact.greeting(name)}
          </motion.h1>
          <motion.p
            {...rise(0.12)}
            className="mt-2 text-[14px] font-medium tracking-[0.01em] text-text-muted"
          >
            {t.myImpact.sub}
          </motion.p>
          {totalGiven > 0 ? (
            <motion.div {...rise(0.16)} className="mt-5 max-w-[56ch]">
              <p className="font-display text-xl font-medium leading-[1.35] text-amber md:text-2xl">
                {t.myImpact.showedUp}
              </p>
              <p className="mt-2 font-display text-xl font-medium leading-[1.35] text-text md:text-2xl">
                {t.myImpact.joined(formatMoneyShort(totalGiven))}
              </p>
              <p className="mt-2 text-[15px] leading-[1.55] text-text-muted">
                {t.myImpact.whatNext}
              </p>
            </motion.div>
          ) : null}
        </header>

        {/* ── My giving ──────────────────────────────────────────── */}
        <motion.section {...rise(0.24)} className="mt-12" aria-label={t.myImpact.myGiving}>
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
              {t.myImpact.myGiving}
            </h2>
            {donations.length > 0 ? (
              <p className="text-[12px] font-medium tracking-[0.01em] text-text-faint">
                {t.myImpact.giftsCount(String(donations.length))}
              </p>
            ) : null}
          </div>

          {donationsStatus === 'loading' ? (
            <div className="mt-4 flex justify-center rounded-card border border-border bg-surface px-6 py-12">
              <Loader2 className="h-6 w-6 animate-spin text-amber" strokeWidth={1.5} />
            </div>
          ) : donationsStatus === 'error' ? (
            <div className="mt-4 flex flex-col items-center gap-4 rounded-card border border-border bg-surface px-6 py-12 text-center">
              <AlertTriangle className="h-8 w-8 text-danger" strokeWidth={1.5} />
              <button
                type="button"
                onClick={() => setRetryKey((k) => k + 1)}
                className="inline-flex items-center gap-2 rounded-[10px] bg-amber px-4 py-2 text-sm font-semibold text-white transition-all duration-150 ease-calm hover:bg-amber-soft active:scale-[0.98]"
              >
                <RefreshCw className="h-4 w-4" />
                {t.common.retry}
              </button>
            </div>
          ) : donations.length === 0 ? (
            <div className="mt-4 flex flex-col items-center gap-3 rounded-card border border-dashed border-border-strong bg-surface px-6 py-14 text-center">
              <p className="font-display text-xl font-medium text-text">
                {t.myImpact.emptyTitle}
              </p>
              <p className="max-w-[46ch] text-[13px] font-medium leading-[1.5] tracking-[0.01em] text-text-muted">
                {t.myImpact.emptyBody}
              </p>
              <p className="max-w-[46ch] text-[12px] font-medium leading-[1.5] tracking-[0.01em] text-text-faint">
                {t.myImpact.linkingNote}
              </p>
              <Link
                to="/donate"
                className="mt-3 inline-flex items-center gap-2 rounded-[10px] bg-amber px-6 py-3 text-[15px] font-semibold text-white transition-all duration-150 ease-calm hover:bg-amber-soft active:scale-[0.98]"
              >
                <HandCoins className="h-4 w-4" />
                {t.myImpact.giveCta}
              </Link>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-border rounded-card border border-border bg-surface">
              {donations.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber/10" aria-hidden>
                      <HandCoins className="h-4 w-4 text-amber" />
                    </span>
                    <div>
                      <p
                        className="font-mono text-[15px] font-medium text-text"
                        style={{ fontVariantNumeric: 'tabular-nums' }}
                      >
                        {formatMoneyShort(d.amount)}
                      </p>
                      <p className="text-[12px] font-medium tracking-[0.01em] text-text-faint">
                        {dateLabel(toMillis(d.timestamp), lang)}
                      </p>
                    </div>
                  </div>
                  {d.source === 'ticket' ? (
                    <span className="rounded-full border border-border bg-surface-2 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-text-muted">
                      {t.event.ticketChip}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </motion.section>

        {/* ── From the mission ───────────────────────────────────── */}
        <motion.section {...rise(0.32)} className="mt-12" aria-label={t.myImpact.updatesTitle}>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
            {t.myImpact.updatesTitle}
          </h2>
          {/* Preview mode: the mission preview below is demo content —
              label it clearly (final doc §6). */}
          {feed.isDemo ? (
            <div className="mt-3">
              <PreviewChip />
            </div>
          ) : null}
          {missionPreview.length === 0 ? (
            <div className="mt-4 rounded-card border border-dashed border-border-strong bg-surface px-6 py-10 text-center">
              <p className="font-display text-lg font-medium text-text">
                {t.feed.missionEmptyTitle}
              </p>
              <p className="mt-2 text-[13px] font-medium leading-[1.5] tracking-[0.01em] text-text-muted">
                {t.feed.missionEmptyBody}
              </p>
            </div>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {missionPreview.map((entry) => {
                const line = missionLine(entry);
                const Icon = line.icon;
                return (
                  <li
                    key={`${entry.kind}-${entry.id}`}
                    className="flex items-center gap-3 rounded-card border border-border bg-surface px-5 py-3.5"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-amber" aria-hidden />
                    <p className="min-w-0 flex-1 truncate text-[14px] font-medium tracking-[0.01em] text-text">
                      {line.text}
                    </p>
                    <p className="shrink-0 text-[12px] font-medium tracking-[0.01em] text-text-faint">
                      {dateLabel(entry.ts, lang)}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link
              to="/feed"
              className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-amber transition-colors hover:text-amber-soft"
            >
              {t.myImpact.storyCta}
            </Link>
            <Link
              to="/gallery"
              className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-amber transition-colors hover:text-amber-soft"
            >
              {t.myImpact.proofCta}
            </Link>
          </div>
        </motion.section>

        {/* ── Sign-out note ──────────────────────────────────────── */}
        <footer className="mt-16 text-center">
          <p className="text-[12px] font-medium tracking-[0.01em] text-text-faint">
            {t.myImpact.notYou}{' '}
            <button
              type="button"
              onClick={() => void signOutDonor()}
              className="font-semibold text-text-muted underline decoration-dotted underline-offset-4 transition-colors hover:text-danger"
            >
              {t.myImpact.signOut}
            </button>
          </p>
        </footer>
      </div>
    </div>
  );
}
