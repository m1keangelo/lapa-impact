/**
 * Home — MEMORY → NOW transition (final master PART 20/103). The one
 * required visual moment: a quiet nostalgic image (what our parents
 * carried) crossfades into a real Colombia field image (what we do now)
 * as you scroll, then lands on two words: "WE SHOW UP." No paragraph —
 * the imagery tells it. Reduced motion: static diptych, no pin.
 */
import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useLanguage } from '@/i18n/LanguageContext';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

export default function MemoryNow() {
  const reduceMotion = useReducedMotion();
  const { t } = useLanguage();
  const m = t.home.memoryNow;

  const wrapRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: wrapRef,
    offset: ['start start', 'end end'],
  });
  // Memory holds, then NOW fades in across the middle of the pin.
  const nowOpacity = useTransform(scrollYProgress, [0.3, 0.7], [0, 1]);
  const memoryLabelOpacity = useTransform(scrollYProgress, [0.3, 0.55], [1, 0]);
  const nowLabelOpacity = useTransform(scrollYProgress, [0.45, 0.7], [0, 1]);

  /* ── Reduced motion: quiet static diptych, nothing pinned ── */
  if (reduceMotion) {
    return (
      <section aria-label={`${m.memoryLabel} → ${m.nowLabel}`} className="py-16 md:py-24">
        <div className="mx-auto grid w-full max-w-container grid-cols-2 gap-3 px-5 md:gap-4 md:px-8">
          <figure className="overflow-hidden rounded-card border border-border">
            <img
              src="/memory-table.jpg"
              alt={m.memoryAlt}
              loading="lazy"
              className="aspect-[4/5] h-full w-full object-cover sepia-[0.35]"
            />
            <figcaption className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-text-faint">
              {m.memoryLabel}
            </figcaption>
          </figure>
          <figure className="overflow-hidden rounded-card border border-border">
            <img
              src="/quake-2.jpg"
              alt={m.nowAlt}
              loading="lazy"
              className="aspect-[4/5] h-full w-full object-cover"
            />
            <figcaption className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-text-faint">
              {m.nowLabel}
            </figcaption>
          </figure>
        </div>
        <p className="mt-10 text-center font-display text-[34px] font-medium leading-[1.1] tracking-[-0.02em] text-text md:text-6xl">
          {m.showUp}
        </p>
      </section>
    );
  }

  return (
    <section aria-label={`${m.memoryLabel} → ${m.nowLabel}`}>
      {/* Tall wrapper gives the crossfade room; the page scrolls normally,
          only the frame holds still for a breath (PART 87: no hijacking). */}
      <div ref={wrapRef} className="relative h-[170vh]">
        <div className="sticky top-0 flex h-[100dvh] items-center justify-center overflow-hidden">
          <div className="relative h-full w-full">
            {/* MEMORY — quiet, sepia, slightly faded */}
            <img
              src="/memory-table.jpg"
              alt={m.memoryAlt}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover sepia-[0.35] brightness-[0.94]"
            />
            {/* NOW — real field image from Colombia */}
            <motion.img
              src="/quake-2.jpg"
              alt={m.nowAlt}
              loading="lazy"
              style={{ opacity: nowOpacity }}
              className="absolute inset-0 h-full w-full object-cover"
            />
            {/* quiet captions — labels, not explanation */}
            <motion.span
              style={{ opacity: memoryLabelOpacity }}
              className="absolute left-5 top-24 rounded-full bg-black/45 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#F7F5F0] backdrop-blur-sm md:left-8"
            >
              {m.memoryLabel}
            </motion.span>
            <motion.span
              style={{ opacity: nowLabelOpacity }}
              className="absolute left-5 top-24 rounded-full bg-black/45 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#F7F5F0] backdrop-blur-sm md:left-8"
            >
              {m.nowLabel}
            </motion.span>
          </div>
        </div>
      </div>

      {/* The landing — below the image, never bleeding over it (PART 29) */}
      <motion.p
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ amount: 0.6, once: true }}
        transition={{ duration: 0.6, ease: EASE }}
        className="mx-auto max-w-container px-5 py-16 text-center font-display text-[36px] font-medium leading-[1.08] tracking-[-0.02em] text-text md:py-24 md:text-6xl"
      >
        {m.showUp}
      </motion.p>
    </section>
  );
}
