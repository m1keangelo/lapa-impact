/**
 * Home / Landing (`/`) — ONE PAGE, one decision: get help moving.
 * Lenis smooth scroll on this page only.
 *
 * Composition (one-pager directive):
 * Hero (identity) → OneNeed (what happened) → OneFunds (where the money
 * goes) → Path (how it works, #como-funciona) → PhotoStrip (reality,
 * second banner) → CampaignsSection (needs, dark) → GiveSection (the
 * ask, #donar) → Closing. Footer from Layout.
 *
 * The removed sections (WhoWeAre, EventSpotlight, FeedPreview,
 * WhyBuilt, FinalCta) stay in the codebase — hidden, not deleted.
 */
import { useEffect } from 'react';
import Lenis from 'lenis';
import Hero from './home/Hero';
import OneNeed from './home/OneNeed';
import OneFunds from './home/OneFunds';
import Path from './home/Path';
import PhotoStrip from './home/PhotoStrip';
import CampaignsSection from './home/CampaignsSection';
import GiveSection from './home/GiveSection';
import Closing from './home/Closing';

export default function Home() {
  // Lenis smooth scroll — this page only.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const lenis = new Lenis({ anchors: true, lerp: 0.11 });
    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return (
    <>
      <Hero />
      <OneNeed />
      <OneFunds />
      <Path />
      <PhotoStrip />
      <CampaignsSection />
      <GiveSection />
      <Closing />
    </>
  );
}
