/**
 * Home / Landing (`/`) — public front door (home.md).
 * Lenis smooth scroll + GSAP ScrollTrigger live on this page only.
 * Composition: Hero → TrustStrip → Journey (pinned) → FeedPreview →
 * GalleryPreview → QuoteBand → FinalCta. Footer comes from Layout.
 */
import { useEffect } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Hero from './home/Hero';
import TrustStrip from './home/TrustStrip';
import Journey from './home/Journey';
import FeedPreview from './home/FeedPreview';
import GalleryPreview from './home/GalleryPreview';
import QuoteBand from './home/QuoteBand';
import FinalCta from './home/FinalCta';

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  // Lenis smooth scroll, synced to ScrollTrigger — this page only.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const lenis = new Lenis({ anchors: true, lerp: 0.11 });
    lenis.on('scroll', ScrollTrigger.update);
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // Recalculate pin distances once images/fonts settle.
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener('load', refresh);

    return () => {
      window.removeEventListener('load', refresh);
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, []);

  return (
    <>
      <Hero />
      <TrustStrip />
      <Journey />
      <FeedPreview />
      <GalleryPreview />
      <QuoteBand />
      <FinalCta />
    </>
  );
}
