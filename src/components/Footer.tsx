/**
 * Footer (design.md §7.2) — 3 columns on desktop, stacked on mobile.
 * Bottom row shows the live Firestore connection dot (sage when connected,
 * amber when reconnecting / demo mode).
 */
import { Link } from 'react-router';
import { firebaseReady } from '@/lib/firebase';
import { useGlobalStats } from '@/hooks/useGlobalStats';
import { cn } from '@/lib/utils';

export default function Footer() {
  const { status } = useGlobalStats();
  const connected = firebaseReady && status === 'live';

  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto w-full max-w-container px-5 pb-8 pt-12 md:px-8">
        <div className="grid gap-10 md:grid-cols-3">
          {/* 1 — Mission */}
          <div>
            <Link to="/" className="flex items-center gap-2.5">
              <img src="/logo.svg" alt="" className="h-6 w-6" />
              <span className="font-display text-[17px] font-medium text-text">
                LAPA Mission <span className="text-amber">Colombia</span>
              </span>
            </Link>
            <p className="mt-4 max-w-[34ch] text-[13px] font-medium leading-[1.5] tracking-[0.01em] text-text-muted">
              Earthquake relief in Colombia's mountain villages — tracked in
              public, in real time.
            </p>
            <p className="mt-2 text-[13px] font-medium tracking-[0.01em] text-text-muted">
              Every dollar is tracked publicly.
            </p>
          </div>

          {/* 2 — Quick links */}
          <div>
            <p className="eyebrow">Quick links</p>
            <ul className="mt-4 space-y-2.5">
              {[
                { to: '/feed', label: 'Live feed' },
                { to: '/gallery', label: 'Photo gallery' },
                { to: '/login', label: 'Enter your code' },
              ].map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="text-[13px] font-medium tracking-[0.01em] text-text-muted transition-colors hover:text-amber"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 3 — Field note + flag motif */}
          <div>
            <p className="eyebrow">Field note</p>
            <p className="mt-4 max-w-[36ch] text-[13px] font-medium leading-[1.5] tracking-[0.01em] text-text-muted">
              Operated by LAPA Mission Colombia · Relief work in the Andes
              foothills of Quindío.
            </p>
            {/* Colombian-flag-inspired motif (decorative, not the literal flag) */}
            <div className="mt-4 flex h-1.5 w-24 overflow-hidden rounded-full" aria-hidden>
              <span className="h-full w-1/2 bg-amber" />
              <span className="h-full w-1/4 bg-[#F3EAD9]" />
              <span className="h-full w-1/4 bg-terra" />
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
          <p className="text-[12px] font-medium tracking-[0.01em] text-text-muted">
            Built with transparency · Data updates live
          </p>
          <span className="inline-flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              {connected ? (
                <span className="absolute inline-flex h-full w-full animate-live-pulse rounded-full bg-sage" />
              ) : null}
              <span
                className={cn(
                  'relative inline-flex h-2 w-2 rounded-full',
                  connected ? 'bg-sage' : 'bg-amber',
                )}
              />
            </span>
            <span className="text-[12px] font-medium tracking-[0.01em] text-text-muted">
              {connected ? 'Connected to the live ledger' : 'Reconnecting…'}
            </span>
          </span>
        </div>
      </div>
    </footer>
  );
}
