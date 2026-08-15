/**
 * Home / Landing (`/`) — public front door (home.md).
 * Lenis smooth scroll on this page only.
 * Composition (final master PART 2 story architecture):
 * Hero (recognize) → Memory (remember) → Intro (who we are) →
 * Generation (what brought us here / why we give back) → TrustStrip →
 * Bridge (community becomes action) → Path (how it works, 5 steps) →
 * FeedPreview (proof) → GalleryPreview → QuoteBand → Closing → FinalCta.
 * Footer from Layout.
 */
import { useEffect } from 'react';
import Lenis from 'lenis';
import Hero from './home/Hero';
import Memory from './home/Memory';
import Intro from './home/Intro';
import Generation from './home/Generation';
import MemoryNow from './home/MemoryNow';
import TrustStrip from './home/TrustStrip';
import Bridge from './home/Bridge';
import Path from './home/Path';
import WhyBuilt from './home/WhyBuilt';
import FeedPreview from './home/FeedPreview';
import GalleryPreview from './home/GalleryPreview';
import QuoteBand from './home/QuoteBand';
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
      <Memory />
      <Intro />
      <Generation />
      <MemoryNow />
      <TrustStrip />
      <Bridge />
      <Path />
      <WhyBuilt />
      <FeedPreview />
      <GalleryPreview />
      <QuoteBand />
      <Closing />
      <FinalCta />
    </>
  );
}
