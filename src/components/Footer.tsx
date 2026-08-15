/**
 * Footer — the page's closing beat. Deliberately ink-dark (one-pass
 * master §26 rhythm: …photo story → transparency → CTA → dark close).
 * 3 columns on desktop, stacked on mobile. Bottom row shows the live
 * Firestore connection dot (sage when connected, blue otherwise).
 */
import { Link } from 'react-router';
import { firebaseReady } from '@/lib/firebase';
import { useGlobalStats } from '@/hooks/useGlobalStats';
import { useLanguage } from '@/i18n/LanguageContext';
import { CAMPAIGN } from '@/lib/campaign';
import { cn } from '@/lib/utils';

export default function Footer() {
  const { status, isDemo } = useGlobalStats();
  const { t } = useLanguage();
  const connected = firebaseReady && !isDemo && status === 'live';

  return (
    <footer className="bg-[#111111]">
      <div className="mx-auto w-full max-w-container px-5 pb-24 pt-14 md:px-8 md:pb-8">
        <div className="grid gap-10 md:grid-cols-3">
          {/* 1 — Mission */}
          <div>
            <Link to="/" className="flex items-center gap-2.5">
              <img src="/logo-mark.png" alt="" className="h-7 w-7 rounded-full" />
              <span className="font-display text-[17px] font-medium text-[#F7F5F0]">
                LAPA.Help
              </span>
              <span className="text-[13px] leading-none" aria-hidden>
                {CAMPAIGN.flag}
              </span>
            </Link>
            <p className="mt-4 max-w-[34ch] font-display text-[19px] leading-[1.45] text-[#F7F5F0]">
              {t.footer.tagline}
            </p>
            <p className="mt-3 text-[13px] font-medium tracking-[0.01em] text-[#A39E93]">
              {t.footer.everyDollar}
            </p>
          </div>

          {/* 2 — Quick links */}
          <div>
            <p className="eyebrow !text-[#A39E93]">{t.footer.quickLinks}</p>
            <ul className="mt-4 space-y-2.5">
              {[
                { to: '/feed', label: t.footer.liveFeed },
                { to: '/event', label: t.nav.event },
                { to: '/gallery', label: t.footer.photoGallery },
                { to: '/impact', label: t.nav.myImpact },
              ].map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="text-[13px] font-medium tracking-[0.01em] text-[#A39E93] transition-colors hover:text-[#F7F5F0]"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 3 — Field note + campaign motif */}
          <div>
            <p className="eyebrow !text-[#A39E93]">{t.footer.fieldNote}</p>
            <p className="mt-4 max-w-[36ch] text-[13px] font-medium leading-[1.5] tracking-[0.01em] text-[#A39E93]">
              {t.footer.fieldNoteBody}
            </p>
            {/* Campaign motif: platform blue / paper / warm clay */}
            <div className="mt-4 flex h-1.5 w-24 overflow-hidden rounded-full" aria-hidden>
              <span className="h-full w-1/2 bg-amber" />
              <span className="h-full w-1/4 bg-[#F7F5F0]" />
              <span className="h-full w-1/4 bg-terra" />
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6">
          <p className="text-[12px] font-medium tracking-[0.01em] text-[#A39E93]">
            {t.footer.bottomNote}
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
            <span className="text-[12px] font-medium tracking-[0.01em] text-[#A39E93]">
              {isDemo
                ? t.publicMode.statusPreview
                : connected
                  ? t.footer.connected
                  : t.footer.reconnecting}
            </span>
          </span>
        </div>
      </div>
    </footer>
  );
}
