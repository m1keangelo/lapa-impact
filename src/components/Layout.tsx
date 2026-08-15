/**
 * Layout — shared shell: sticky Navbar + content slot + Footer.
 *
 * Routing contract (react-dev.md): this Layout renders <Outlet/>, so
 * App.tsx MUST nest page routes inside `<Route element={<Layout/>}>`.
 * Navbar is sticky (normal flow) — no nav-height offset is applied here
 * and pages must not add their own.
 */
import { useEffect } from 'react';
import { Outlet, useLocation, useNavigationType } from 'react-router';
import Navbar from './Navbar';
import Footer from './Footer';
import StickyGiveBar from './StickyGiveBar';

/** §26/§75 — scroll positions by history key so BACK returns you exactly
    where you were (critical on mobile when opening proof/details). */
const scrollCache = new Map<string, number>();

export default function Layout() {
  const { key, pathname } = useLocation();
  const navType = useNavigationType();

  // Continuously remember where this history entry was scrolled to.
  useEffect(() => {
    const save = () => scrollCache.set(key, window.scrollY);
    window.addEventListener('scroll', save, { passive: true });
    return () => {
      window.removeEventListener('scroll', save);
      save();
    };
  }, [key]);

  useEffect(() => {
    if (navType === 'POP') {
      const y = scrollCache.get(key);
      if (y != null) {
        // Wait a frame so the page has rendered tall enough to scroll.
        requestAnimationFrame(() => window.scrollTo(0, y));
        return;
      }
    }
    // New navigation starts at the top (Lenis on Home wraps window scroll).
    window.scrollTo(0, 0);
  }, [key, navType, pathname]);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-bg text-text">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <StickyGiveBar />
    </div>
  );
}
