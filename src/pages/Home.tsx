/**
 * Home / Landing (`/`) — public front door.
 * Lenis smooth scroll on this page only.
 * Composition (FIN spec §7):
 * Hero → Quiénes Somos (one powerful pause) → Event Spotlight →
 * Path (how it works) → WhyBuilt → FeedPreview (proof) →
 * Closing → FinalCta. Footer from Layout.
 */
import { useEffect } from 'react';
import Lenis from 'lenis';
import Hero from './home/Hero';
import WhoWeAre from './home/WhoWeAre';
import EventSpotlight from './home/EventSpotlight';
import Path from './home/Path';
import WhyBuilt from './home/WhyBuilt';
import FeedPreview from './home/FeedPreview';
import Closing from './home/Closing';
import FinalCta from './home/FinalCta';

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
      <WhoWeAre />
      <EventSpotlight />
      <Path />
      <WhyBuilt />
      <FeedPreview />
      <Closing />
      <FinalCta />
    </>
  );
}
