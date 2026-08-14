/**
 * Layout — shared shell: sticky Navbar + content slot + Footer.
 *
 * Routing contract (react-dev.md): this Layout renders <Outlet/>, so
 * App.tsx MUST nest page routes inside `<Route element={<Layout/>}>`.
 * Navbar is sticky (normal flow) — no nav-height offset is applied here
 * and pages must not add their own.
 */
import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import Navbar from './Navbar';
import Footer from './Footer';
import StickyGiveBar from './StickyGiveBar';

export default function Layout() {
  const { pathname } = useLocation();

  // Start each page at the top (Lenis on Home wraps window scroll).
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

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
