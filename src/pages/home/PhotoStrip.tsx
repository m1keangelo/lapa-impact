/**
 * Home — PHOTO STRIP. The second "banner": a full-bleed band of
 * documentary photos with ONE short line. No headline, no buttons,
 * no competing typography — deliberately subordinate to the main
 * hero. It sits between Cómo funciona (ivory) and the dark needs
 * section, carrying the eye from "how it works" back to reality.
 * DARK = truth/reality (color system rule).
 */
import { m, useReducedMotion } from 'framer-motion';
import { useLanguage } from '@/i18n/LanguageContext';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const PHOTOS = [
  { src: '/quake-3.jpg', altEs: 'Escombros tras el terremoto en el Chocó', altEn: 'Rubble after the Chocó earthquake' },
  { src: '/quake-1.jpg', altEs: 'Ayuda llegando a una familia', altEn: 'Aid reaching a family' },
  { src: '/quake-6.jpg', altEs: 'Agua potable para una comunidad', altEn: 'Clean water for a community' },
  { src: '/quake-4.jpg', altEs: 'Un bebé en un albergue temporal', altEn: 'A baby in a temporary shelter' },
];

export default function PhotoStrip() {
  const { t, lang } = useLanguage();
  const reduceMotion = useReducedMotion();

  return (
    <section aria-label={t.home.photoBand.aria} className="bg-[#14100C] py-20 md:py-28">
      <div className="mx-auto w-full max-w-container px-5 md:px-8">
        <m.p
          initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: reduceMotion ? 0 : 0.6, ease: EASE }}
          className="mx-auto max-w-[26ch] text-center font-sans font-bold leading-[1.25] tracking-[-0.01em] text-[#F5F1E8]"
          style={{ fontSize: 'clamp(22px, 2.6vw, 34px)' }}
        >
          {t.home.photoBand.line}
        </m.p>
      </div>

      {/* Full-bleed band — one row on desktop, 2×2 on mobile. Photos are
          graded darker so the band reads as one cinematic strip, not a
          gallery. */}
      <div className="mt-10 grid grid-cols-2 md:mt-14 md:grid-cols-4">
        {PHOTOS.map((p, i) => (
          <m.div
            key={p.src}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: reduceMotion ? 0 : 0.7, delay: reduceMotion ? 0 : i * 0.1, ease: EASE }}
            className="aspect-[4/3] overflow-hidden"
          >
            <img
              src={p.src}
              alt={lang === 'es' ? p.altEs : p.altEn}
              loading="lazy"
              className="h-full w-full object-cover brightness-[0.82] contrast-[1.05] saturate-[0.9]"
            />
          </m.div>
        ))}
      </div>
    </section>
  );
}
