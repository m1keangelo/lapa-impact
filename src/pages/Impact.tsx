/**
 * My Impact — /impact (dashboard.md). The donor's personal ledger:
 * greeting + live badge, three counting StatCards (given / sent to field /
 * families reached), "what your giving funded" footprint strip, donation
 * history with live inserts, matched field photos with lightbox, and a
 * mission-wide context band. All live surfaces subscribe on mount and
 * unsubscribe on unmount; demo data drives everything when Firebase is
 * not configured. No session code → redirect to /login.
 */
import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { motion, useReducedMotion } from 'framer-motion';
import { AlertTriangle, HandCoins, RefreshCw } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import StatCard from '@/components/StatCard';
import LiveBadge from '@/components/LiveBadge';
import { useDonor, donorFirstName } from '@/hooks/useDonor';
import { useDonorDonations } from '@/hooks/useDonorDonations';
import { useDonorPhotos } from '@/hooks/useDonorPhotos';
import { useGlobalStats } from '@/hooks/useGlobalStats';
import { formatMoneyShort, toMillis } from '@/lib/format';
import { clearDonorCode, getDonorCode } from '@/lib/session';
import { cn } from '@/lib/utils';
import Footprint from './impact/Footprint';
import GiftHistory from './impact/GiftHistory';
import MatchedPhotos from './impact/MatchedPhotos';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

function StatSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-card border border-border bg-surface p-5 pt-[22px] md:p-6 md:pt-[26px]">
      <span className="absolute inset-x-0 top-0 h-[3px] bg-surface-2" aria-hidden />
      <div className="h-3 w-24 animate-pulse rounded bg-surface-2" />
      <div className="mt-4 h-7 w-32 animate-pulse rounded bg-surface-2" />
      <div className="mt-3 h-3 w-40 animate-pulse rounded bg-surface-2" />
    </div>
  );
}

export default function Impact() {
  const reduceMotion = useReducedMotion();
  const navigate = useNavigate();
  const code = getDonorCode();
  const [retryKey, setRetryKey] = useState(0);
  const [online, setOnline] = useState(() => navigator.onLine);

  const { donor, status: donorStatus, isDemo } = useDonor(code, retryKey);
  const {
    donations,
    status: donationsStatus,
    revision,
  } = useDonorDonations(code, 25, retryKey);
  const donationIds = useMemo(() => donations.map((d) => d.id), [donations]);
  const { photos, status: photosStatus } = useDonorPhotos(donationIds, 8, retryKey);
  const { stats: global, status: globalStatus } = useGlobalStats();

  // Connection honesty: amber "reconnecting" treatment while offline.
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  // Live-insert toast: a genuinely new gift arrived in this donor's ledger.
  useEffect(() => {
    if (revision > 0) {
      toast('Your gift was recorded — thank you.', {
        icon: <HandCoins className="h-4 w-4 text-amber" />,
      });
    }
  }, [revision]);

  const loading =
    donorStatus === 'loading' || donationsStatus === 'loading' || globalStatus === 'loading';
  const hasError =
    donorStatus === 'error' || donationsStatus === 'error' || photosStatus === 'error';

  const firstName = donorFirstName(donor);
  const totalGiven = donor?.totalGiven ?? donations.reduce((s, d) => s + d.amount, 0);

  // Pro-rata share of mission transfers ("sent to the field") and families.
  const ratio = global.totalIn > 0 ? Math.min(1, global.totalOut / global.totalIn) : 0;
  const sentToField = Math.min(totalGiven, Math.round(totalGiven * ratio));
  const familiesExact = global.totalIn > 0 ? (global.familiesHelped * totalGiven) / global.totalIn : 0;
  const families = totalGiven > 0 ? Math.max(1, Math.round(familiesExact)) : 0;

  const giftCount = donations.length;
  const firstGift = useMemo(() => {
    if (giftCount === 0) return '';
    const first = Math.min(...donations.map((d) => toMillis(d.timestamp)));
    return new Date(first).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }, [donations, giftCount]);

  // Cumulative giving sparkline (oldest → newest, ≤8 samples).
  const sparkline = useMemo(() => {
    const ordered = [...donations].sort((a, b) => toMillis(a.timestamp) - toMillis(b.timestamp));
    let acc = 0;
    return ordered.map((d) => (acc += d.amount)).slice(-8);
  }, [donations]);

  // Guard comes after every hook (rules of hooks).
  if (!code) {
    return <Navigate to="/login" state={{ from: 'impact' }} replace />;
  }

  const live =
    !loading && !hasError && (donorStatus === 'live' || donationsStatus === 'live');

  // Session code no longer matches any donor ledger (deleted / typo'd code).
  const notFound = !loading && !hasError && donorStatus === 'empty';

  const rise = (delay: number) => ({
    initial: { opacity: 0, y: reduceMotion ? 0 : 24 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: reduceMotion ? 0 : delay, duration: reduceMotion ? 0 : 0.5, ease: EASE },
  });

  return (
    <div className="relative">
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
          },
        }}
      />

      {/* Reconnecting banner — slides down while offline */}
      <div
        className={cn(
          'overflow-hidden bg-surface-2 transition-all duration-300 ease-calm',
          online ? 'max-h-0' : 'max-h-10 border-b border-border',
        )}
        role="status"
      >
        <p className="flex h-10 items-center justify-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-amber">
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          Reconnecting to the field…
        </p>
      </div>

      <div className="mx-auto w-full max-w-container px-5 pb-20 pt-8 md:px-8">
        {/* ── Section 1 · Personal header ─────────────────────────── */}
        <header>
          <div className="flex items-center justify-between gap-3">
            {live && online ? (
              <LiveBadge />
            ) : !online ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1">
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber">
                  Reconnecting
                </span>
              </span>
            ) : isDemo ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1">
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber">
                  Demo data
                </span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1">
                <span className="relative inline-flex h-2 w-2 animate-pulse rounded-full bg-text-faint" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-faint">
                  Connecting
                </span>
              </span>
            )}
            <p
              className="font-mono text-[12px] tracking-[0.01em] text-text-faint"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              Signed in as code •••• {code.slice(-4)}
            </p>
          </div>

          <motion.h1
            {...rise(0.05)}
            className="mt-6 font-display text-[32px] font-medium leading-[1.1] tracking-[-0.015em] text-text md:text-5xl"
          >
            Hola, <span className="italic text-amber">{firstName}</span>.
          </motion.h1>
          <motion.p
            {...rise(0.25)}
            className="mt-3 max-w-[52ch] text-[15px] leading-[1.55] text-text-muted"
          >
            Here's everything your generosity has done — updated live from the field.
          </motion.p>
        </header>

        {notFound ? (
          <div className="mt-10 flex flex-col items-center gap-4 rounded-card border border-border bg-surface px-6 py-14 text-center">
            <AlertTriangle className="h-10 w-10 text-danger" strokeWidth={1.5} />
            <p className="font-display text-xl font-medium text-text">
              We can't find a ledger for this code.
            </p>
            <p className="max-w-[44ch] text-[13px] font-medium leading-[1.4] tracking-[0.01em] text-text-muted">
              It may have been typed with a typo, or the mission may have
              retired it. Sign out and try entering it again.
            </p>
            <button
              type="button"
              onClick={() => {
                clearDonorCode();
                navigate('/login');
              }}
              className="rounded-[10px] bg-amber px-4 py-2 text-sm font-semibold text-[#1A130B] transition-all duration-150 ease-calm hover:bg-amber-soft active:scale-[0.98]"
            >
              Re-enter my code
            </button>
          </div>
        ) : (
          <>
        {/* ── Section 2 · Personal stat trio ──────────────────────── */}
        <section aria-label="Your giving totals" className="mt-10">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-3">
              <StatSkeleton />
              <StatSkeleton />
              <StatSkeleton />
            </div>
          ) : hasError ? (
            <div className="flex flex-col items-center gap-4 rounded-card border border-border bg-surface px-6 py-12 text-center">
              <AlertTriangle className="h-10 w-10 text-danger" strokeWidth={1.5} />
              <p className="font-display text-xl font-medium text-text">
                We lost the thread to the field.
              </p>
              <p className="max-w-[44ch] text-[13px] font-medium leading-[1.4] tracking-[0.01em] text-text-muted">
                Your ledger couldn't be loaded. Check your connection and try again.
              </p>
              <button
                type="button"
                onClick={() => setRetryKey((k) => k + 1)}
                className="inline-flex items-center gap-2 rounded-[10px] bg-amber px-4 py-2 text-sm font-semibold text-[#1A130B] transition-all duration-150 ease-calm hover:bg-amber-soft active:scale-[0.98]"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 32 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: reduceMotion ? 0 : 0.1 + i * 0.1,
                    duration: reduceMotion ? 0 : 0.5,
                    ease: EASE,
                  }}
                >
                  {i === 0 ? (
                    <StatCard
                      label="You've given"
                      value={totalGiven}
                      variant="in"
                      delta={
                        giftCount > 0
                          ? `${giftCount} ${giftCount === 1 ? 'gift' : 'gifts'} · first gift ${firstGift}`
                          : 'no gifts recorded yet'
                      }
                      sparkline={sparkline.length > 1 ? sparkline : undefined}
                    />
                  ) : i === 1 ? (
                    <StatCard
                      label="Sent to the field"
                      value={sentToField}
                      variant="out"
                      delta={`your share of the ${formatMoneyShort(global.totalOut)} transferred`}
                    />
                  ) : (
                    <StatCard
                      label="Families reached"
                      value={families}
                      variant="impact"
                      format="count"
                      delta="through the work your gifts funded"
                    />
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* ── Section 3 · What your giving funded ─────────────────── */}
        <Footprint reducedMotion={Boolean(reduceMotion)} />

        {/* ── Section 4 · Gifts + matched photos ──────────────────── */}
        <div className="mt-12 grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <GiftHistory
              donations={donations}
              status={donationsStatus}
              reducedMotion={Boolean(reduceMotion)}
            />
          </div>
          <div className="lg:col-span-5">
            <MatchedPhotos
              photos={photos}
              status={photosStatus}
              donationIds={donationIds}
              reducedMotion={Boolean(reduceMotion)}
            />
          </div>
        </div>

        {/* ── Section 5 · Mission-wide context band ───────────────── */}
        <motion.section
          initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ amount: 0.8, once: true }}
          transition={{ duration: reduceMotion ? 0 : 0.3, ease: EASE }}
          aria-label="Mission-wide totals"
          className="mt-12 rounded-card border border-border bg-surface px-6 py-6"
        >
          <p className="text-center font-display text-lg font-medium text-text">
            You're part of something bigger.
          </p>
          <div className="mt-4 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-10">
            {[
              { color: 'var(--amber)', value: formatMoneyShort(global.totalIn), label: 'in from all donors' },
              { color: 'var(--terra)', value: formatMoneyShort(global.totalOut), label: 'out to the field' },
              { color: 'var(--sage)', value: String(global.familiesHelped), label: 'families helped' },
            ].map((s) => (
              <p key={s.label} className="flex items-center gap-2 text-[13px] font-medium tracking-[0.01em] text-text-muted">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} aria-hidden />
                <span
                  className="font-mono text-[15px] font-medium text-text"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {s.value}
                </span>
                {s.label}
              </p>
            ))}
          </div>
        </motion.section>
          </>
        )}

        {/* ── Section 6 · Sign-out note ────────────────────────────── */}
        <footer className="mt-14 text-center">
          <p className="text-[12px] font-medium tracking-[0.01em] text-text-faint">
            Your code is your key — bookmark it. We never ask for a password.
          </p>
          <button
            type="button"
            onClick={() => {
              clearDonorCode();
              navigate('/');
            }}
            className="mt-2 text-[13px] font-semibold text-text-muted transition-colors hover:text-danger"
          >
            Sign out
          </button>
        </footer>
      </div>
    </div>
  );
}
