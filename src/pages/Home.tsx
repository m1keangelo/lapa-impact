/**
 * Home / Landing (`/`) — public front door (home.md).
 * Lenis smooth scroll on this page only.
 * Composition: Hero → Memory → Intro → TrustStrip → Path (journey line) →
 * FeedPreview → GalleryPreview → QuoteBand → Closing → FinalCta. Footer from Layout.
 */
import { useEffect } from 'react';
import Lenis from 'lenis';
import Hero from './home/Hero';
import Memory from './home/Memory';
import Intro from './home/Intro';
import TrustStrip from './home/TrustStrip';
import Path from './home/Path';
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
      <TrustStrip />
      <Path />
      <FeedPreview />
      <GalleryPreview />
      <QuoteBand />
      <Closing />
      <FinalCta />
    </>
  );
}
