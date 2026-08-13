/**
 * Navbar (design.md §7.1) — sticky top, translucent bg + backdrop-blur,
 * 1px bottom border, 60px tall. Routes: / (logo), /feed, /gallery, /login,
 * and /impact ("My Impact") when a donor code is in sessionStorage.
 * The admin route is intentionally NOT linked here.
 *
 * Positioning contract: sticky in normal flow — Layout and pages add no
 * nav-height offset (see react-dev.md).
 */
import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import { useGlobalStats } from '@/hooks/useGlobalStats';
import { formatMoneyShort } from '@/lib/format';
import { getDonorCode } from '@/lib/session';
import { cn } from '@/lib/utils';
import ThemeToggle from './ThemeToggle';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

const NAV_LINKS = [
  { to: '/feed', label: 'Feed' },
  { to: '/gallery', label: 'Gallery' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(() => window.scrollY > 24);
  const [sheetOpen, setSheetOpen] = useState(false);
  const { stats, status } = useGlobalStats();

  // Re-check the donor session on every navigation.
  const donorCode = getDonorCode();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const closeSheet = () => setSheetOpen(false);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'rounded-[10px] px-3 py-2 text-sm font-medium transition-colors duration-200 ease-calm',
      isActive ? 'text-amber' : 'text-text-muted hover:text-text',
    );

  return (
    <header
      className={cn(
        'sticky top-0 z-50 h-[60px] border-b backdrop-blur-md transition-all duration-200 ease-calm',
        scrolled
          ? 'border-border bg-bg/95'
          : 'border-transparent bg-bg/85',
      )}
    >
      <div className="mx-auto flex h-full w-full max-w-container items-center justify-between px-5 md:px-8">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5" aria-label="LAPA Mission Colombia — home">
          <img src="/logo.svg" alt="" className="h-6 w-6" />
          <span className="font-display text-[17px] font-medium tracking-[-0.01em] text-text">
            LAPA Mission <span className="text-amber">Colombia</span>
          </span>
        </Link>

        {/* Desktop right cluster */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {/* Compact live stat chip */}
          <span className="mr-2 hidden items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 lg:inline-flex">
            <span className="relative flex h-1.5 w-1.5">
              {status === 'live' ? (
                <span className="absolute inline-flex h-full w-full animate-live-pulse rounded-full bg-amber" />
              ) : null}
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber" />
            </span>
            <span
              className="font-mono text-xs font-medium text-text"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {formatMoneyShort(stats.totalIn)}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted">
              raised
            </span>
          </span>

          {NAV_LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className={linkClass}>
              {l.label}
            </NavLink>
          ))}
          {donorCode ? (
            <NavLink to="/impact" className={linkClass}>
              My Impact
            </NavLink>
          ) : null}

          <ThemeToggle className="ml-1" />

          {donorCode ? (
            <Link
              to="/impact"
              className="ml-2 rounded-[10px] bg-amber px-4 py-2 text-sm font-semibold text-[#1A130B] transition-all duration-150 ease-calm hover:bg-amber-soft active:scale-[0.98]"
            >
              My Impact
            </Link>
          ) : (
            <Link
              to="/login"
              className="ml-2 rounded-[10px] bg-amber px-4 py-2 text-sm font-semibold text-[#1A130B] transition-all duration-150 ease-calm hover:bg-amber-soft active:scale-[0.98]"
            >
              Enter code
            </Link>
          )}
        </nav>

        {/* Mobile: theme toggle + hamburger sheet */}
        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Open menu"
                className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-full border-border bg-bg p-0 sm:max-w-full [&>button]:right-6 [&>button]:top-5 [&>button]:text-text-muted"
            >
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <div className="flex h-full flex-col px-6 pb-10 pt-20">
                <AnimatePresence>
                  {sheetOpen && (
                    <nav className="flex flex-col gap-2" aria-label="Mobile">
                      {[
                        { to: '/', label: 'Home' },
                        ...NAV_LINKS,
                        ...(donorCode ? [{ to: '/impact', label: 'My Impact' }] : []),
                      ].map((l, i) => (
                        <motion.div
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
                            className={({ isActive }) =>
                              cn(
                                'block rounded-card px-4 py-4 font-display text-2xl font-medium transition-colors',
                                isActive ? 'text-amber' : 'text-text hover:bg-surface-2',
                              )
                            }
                          >
                            {l.label}
                          </NavLink>
                        </motion.div>
                      ))}
                      <motion.div
                        initial={{ opacity: 0, x: 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          delay: 0.06 * (donorCode ? 4 : 3),
                          duration: 0.35,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className="mt-6"
                      >
                        <Link
                          to={donorCode ? '/impact' : '/login'}
                          onClick={closeSheet}
                          className="block rounded-[10px] bg-amber px-4 py-3.5 text-center text-base font-semibold text-[#1A130B] transition-all active:scale-[0.98]"
                        >
                          {donorCode ? 'Open My Impact' : 'Enter your donor code'}
                        </Link>
                      </motion.div>
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
