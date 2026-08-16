/**
 * Home — Closing (FINAL IDENTITY, red-team check #07 hard gate).
 *
 * The section contains ONLY the two-sentence identity statement:
 *
 *   Nuestras raíces son latinas.
 *   Nuestra misión es humana.
 *
 * No eyebrow, no paragraphs, no flags, no CTA — the typography IS the
 * design (final master §17): large editorial serif, tight optical leading,
 * massive whitespace, weight contrast inside each sentence, and the second
 * sentence set slightly stronger than the first.
 */
import { m, useReducedMotion } from 'framer-motion';
import { useLanguage } from '@/i18n/LanguageContext';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

export default function Closing() {
  const reduceMotion = useReducedMotion();
  const { t } = useLanguage();
  const c = t.home.closing;

  return (
    <section className="mx-auto w-full max-w-container px-5 py-28 md:px-8 md:py-40">
      <div className="mx-auto max-w-[640px] text-center">
        <m.p
          initial={{ opacity: 0, y: reduceMotion ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ amount: 0.45, once: true }}
          transition={{ duration: reduceMotion ? 0 : 0.6, ease: EASE }}
          className="mx-auto max-w-[16ch] font-display leading-[1.08] tracking-[-0.015em] text-text"
          style={{ fontSize: 'clamp(42px, 6vw, 88px)' }}
        >
          <span className="block">
            <span className="font-normal">{c.purposeA1}</span>
            <span className="font-semibold">{c.purposeA2}</span>
          </span>
          {/* Second sentence slightly stronger (final master §17) */}
          <span className="mt-2 block">
            <span className="font-medium">{c.purposeB1}</span>
            <span className="font-bold">{c.purposeB2}</span>
          </span>
        </m.p>
      </div>
    </section>
  );
}
