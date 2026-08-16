/**
 * StickyGiveBar (one-pass master §21) — compact mobile-only bottom CTA
 * that appears once the visitor has scrolled past the first screen.
 * A visitor can be ready to give at any moment; don't make them scroll
 * back up. Slim, paper-backed, safe-area aware. Desktop never sees it,
 * and it stays off the donate flow itself. Renders statically — buttons
 * never animate (TYPOGRAPHIC MOTION ONLY).
 */
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import { HandCoins } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { CHECKOUT_AVAILABLE } from '@/lib/donate';

export default function StickyGiveBar() {
  const { t } = useLanguage();
  const { pathname } = useLocation();
  const [past, setPast] = useState(false);
  const [ladderVisible, setLadderVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setPast(window.scrollY > window.innerHeight * 0.85);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* One-pager: the bar's job is to bring you TO the ladder — once the
     #donar section is on screen it steps aside so it never covers the
     Give button. */
  useEffect(() => {
    const el = document.getElementById('donar');
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setLadderVisible(entry.isIntersecting),
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [pathname]);

  if (
    !CHECKOUT_AVAILABLE ||
    pathname.startsWith('/donate') ||
    pathname.startsWith('/admin') ||
    !past ||
    ladderVisible
  ) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 md:hidden">
      {/* One-pager: the ladder lives on the homepage at #donar. */}
      <a
        href="/#donar"
        aria-label={t.donate.giveAria}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-amber text-[15px] font-semibold text-white transition-all duration-150 ease-calm active:scale-[0.98]"
      >
        <HandCoins className="h-4 w-4" />
        {t.donate.giveNow}
      </a>
    </div>
  );
}
