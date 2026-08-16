/**
 * Navbar (master §39) — sticky top, solid paper bg, 60px.
 * Desktop links: Mission / Give / Live / Event / My Impact. Mobile chrome is
 * only Logo + Give + Menu; everything else lives in the sheet. The gallery
 * moves to the menu + footer; the admin route is never linked here.
 * LAPA↗ stays hidden until the real LAPA site URL exists (§39).
 *
 * Positioning contract: sticky in normal flow — Layout and pages add no
 * nav-height offset (see react-dev.md).
 */
import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router';
import { AnimatePresence, m } from 'framer-motion';
import { Menu, HandCoins } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { CAMPAIGN } from '@/lib/campaign';
import { CHECKOUT_AVAILABLE } from '@/lib/donate';
import { cn } from '@/lib/utils';
import LanguageToggle from './LanguageToggle';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(() => window.scrollY > 24);
  const [sheetOpen, setSheetOpen] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const closeSheet = () => setSheetOpen(false);

  const amberBtn =
    'rounded-[10px] bg-amber px-4 py-2 text-sm font-semibold text-white transition-all duration-150 ease-calm hover:bg-amber-soft active:scale-[0.98]';

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'rounded-[10px] px-3 py-2 text-sm font-medium transition-colors duration-200 ease-calm',
      isActive ? 'text-amber' : 'text-text-muted hover:text-text',
    );

  // §39 — the whole public site in five words.
  const desktopLinks = [
    { to: '/', label: t.nav.mission, end: true },
    { to: '/feed', label: t.nav.live, end: false },
    { to: '/event', label: t.nav.event, end: false },
    { to: '/impact', label: t.nav.myImpact, end: false },
  ];

  const sheetLinks = [
    { to: '/', label: t.nav.mission },
    { to: '/feed', label: t.nav.live },
    { to: '/event', label: t.nav.event },
    { to: '/impact', label: t.nav.myImpact },
    { to: '/gallery', label: t.nav.gallery },
  ];

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

        {/* Desktop right cluster */}
        <nav className="hidden items-center gap-1 md:flex" aria-label={t.nav.primaryAria}>
          {desktopLinks.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
              {l.label}
            </NavLink>
          ))}

          <LanguageToggle className="ml-1" />

          {CHECKOUT_AVAILABLE ? (
            <Link
              to="/donate"
              aria-label={t.donate.giveAria}
              className={cn(amberBtn, 'ml-2 inline-flex items-center gap-1.5')}
            >
              <HandCoins className="h-4 w-4" />
              {t.nav.give}
            </Link>
          ) : null}
        </nav>

        {/* Mobile: Give + hamburger only (§39) */}
        <div className="flex items-center gap-2 md:hidden">
          {CHECKOUT_AVAILABLE ? (
            <Link
              to="/donate"
              aria-label={t.donate.giveAria}
              className={cn(amberBtn, 'inline-flex items-center gap-1.5 px-3.5')}
            >
              <HandCoins className="h-4 w-4" />
              {t.nav.give}
            </Link>
          ) : null}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label={t.nav.openMenu}
                className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-full border-border bg-bg p-0 sm:max-w-full [&>button]:right-6 [&>button]:top-5 [&>button]:text-text-muted"
            >
              <SheetTitle className="sr-only">{t.nav.menu}</SheetTitle>
              <div className="flex h-full flex-col px-6 pb-10 pt-20">
                <AnimatePresence>
                  {sheetOpen && (
                    <nav className="flex flex-col gap-2" aria-label={t.nav.mobileAria}>
                      {sheetLinks.map((l, i) => (
                        <m.div
                          key={l.to}
                          initial={{ opacity: 0, x: 24 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            delay: 0.06 * i,
                            duration: 0.35,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                        >
                          <NavLink
                            to={l.to}
                            onClick={closeSheet}
                            className={({ isActive }) =>
                              cn(
                                'block rounded-card px-4 py-4 font-display text-2xl font-medium transition-colors',
                                isActive ? 'text-amber' : 'text-text hover:bg-surface-2',
                              )
                            }
                          >
                            {l.label}
                          </NavLink>
                        </m.div>
                      ))}
                      {CHECKOUT_AVAILABLE ? (
                        <m.div
                          initial={{ opacity: 0, x: 24 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            delay: 0.06 * sheetLinks.length,
                            duration: 0.35,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          className="mt-6"
                        >
                          <Link
                            to="/donate"
                            onClick={closeSheet}
                            aria-label={t.donate.giveAria}
                            className="flex items-center justify-center gap-2 rounded-[10px] bg-amber px-4 py-3.5 text-center text-base font-semibold text-white transition-all active:scale-[0.98]"
                          >
                            <HandCoins className="h-5 w-5" />
                            {t.nav.give}
                          </Link>
                        </m.div>
                      ) : null}
                      <m.div
                        initial={{ opacity: 0, x: 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          delay:
                            0.06 *
                            (sheetLinks.length + (CHECKOUT_AVAILABLE ? 1 : 0)),
                          duration: 0.35,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className="mt-8 flex items-center justify-between border-t border-border pt-6"
                      >
                        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
                          {t.nav.langLabel}
                        </span>
                        <LanguageToggle className="border-border bg-surface" />
                      </m.div>
                    </nav>
                  )}
                </AnimatePresence>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
