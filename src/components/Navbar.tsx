/**
 * Navbar — ONE-PAGER mode. The public site is a single page now, so the
 * bar carries exactly three things: the brand (home), the language
 * toggle (ES/EN), and one Donar button that scrolls to the on-page
 * donation ladder (#donar). No menu, no page links — nothing pulls the
 * visitor away from the ask.
 *
 * The hidden pages (/feed, /event, /impact, /gallery, /admin, /login)
 * still exist at their URLs — they are simply not linked here.
 *
 * Positioning contract: sticky in normal flow — Layout and pages add no
 * nav-height offset (see react-dev.md).
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { HandCoins } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { CAMPAIGN } from '@/lib/campaign';
import { CHECKOUT_AVAILABLE } from '@/lib/donate';
import { cn } from '@/lib/utils';
import LanguageToggle from './LanguageToggle';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(() => window.scrollY > 24);
  const { t } = useLanguage();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const amberBtn =
    'rounded-[10px] bg-amber px-4 py-2 text-sm font-semibold text-white transition-all duration-150 ease-calm hover:bg-amber-soft active:scale-[0.98]';

  return (
    <header
      className={cn(
        // Solid paper background — no glassmorphism: nav text must read
        // over any photograph (TEXT OVER PHOTOGRAPHY rule).
        'sticky top-0 z-50 h-[60px] border-b bg-bg transition-colors duration-200 ease-calm',
        scrolled ? 'border-border' : 'border-transparent',
      )}
    >
      <div className="mx-auto flex h-full w-full max-w-container items-center justify-between px-5 md:px-8">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5" aria-label={t.nav.brandHome}>
          <img src="/logo-mark.png" alt="" className="h-7 w-7 rounded-full" />
          <span className="font-display text-[17px] font-medium tracking-[-0.01em] text-text">
            LAPA.Help
          </span>
          <span
            className="rounded-full border border-border bg-surface px-2 py-0.5 text-[12px] leading-none"
            title={CAMPAIGN.campaignName}
          >
            {CAMPAIGN.flag}
          </span>
        </Link>

        {/* Right cluster: language + the one decision */}
        <div className="flex items-center gap-2 md:gap-3">
          <LanguageToggle />
          {CHECKOUT_AVAILABLE ? (
            <a
              href="/#donar"
              aria-label={t.donate.giveAria}
              className={cn(amberBtn, 'inline-flex items-center gap-1.5')}
            >
              <HandCoins className="h-4 w-4" />
              {t.nav.give}
            </a>
          ) : null}
        </div>
      </div>
    </header>
  );
}
