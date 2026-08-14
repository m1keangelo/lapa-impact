/**
 * StickyGiveBar (one-pass master §21) — compact mobile-only bottom CTA
 * that slides in once the visitor has scrolled past the first screen.
 * A visitor can be ready to give at any moment; don't make them scroll
 * back up. Slim, paper-backed, safe-area aware. Desktop never sees it,
 * and it stays off the donate flow itself.
 */
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { HandCoins } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { CHECKOUT_AVAILABLE } from '@/lib/donate';

export default function StickyGiveBar() {
  const { t } = useLanguage();
  const { pathname } = useLocation();
  const reduceMotion = useReducedMotion();
  const [past, setPast] = useState(false);

  useEffect(() => {
    const onScroll = () => setPast(window.scrollY > window.innerHeight * 0.85);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (
    !CHECKOUT_AVAILABLE ||
    pathname.startsWith('/donate') ||
    pathname.startsWith('/admin')
  ) {
    return null;
  }

  return (
    <AnimatePresence>
      {past ? (
        <motion.div
          initial={{ y: reduceMotion ? 0 : 72, opacity: reduceMotion ? 1 : 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: reduceMotion ? 0 : 72, opacity: reduceMotion ? 1 : 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/95 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 backdrop-blur-md md:hidden"
        >
          <Link
            to="/donate"
            aria-label={t.donate.giveAria}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-amber text-[15px] font-semibold text-white transition-all duration-150 ease-calm active:scale-[0.98]"
          >
            <HandCoins className="h-4 w-4" />
            {t.donate.giveNow}
          </Link>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
