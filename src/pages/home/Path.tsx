/**
 * Home — "YOUR MONEY HAS A PATH." (final doc §2/§44).
 *
 * The thin journey line — YOU GIVE → WE ACT → YOU SEE — with small
 * semantic line icons (hand/heart, package, eye). Icons are never larger
 * than the words: visual reinforcement, not decoration. No pinned scroll,
 * no photography — the feed itself carries the proof.
 */
import { motion } from 'framer-motion';
import { Eye, HeartHandshake, Package } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const ICONS = [HeartHandshake, Package, Eye];

export default function Path() {
  const { t } = useLanguage();
  const stages = t.home.path.stages;

  return (
    <section aria-label={t.home.path.aria} className="py-20 md:py-28">
      <div className="mx-auto w-full max-w-container px-5 md:px-8">
        <motion.p
          className="eyebrow flex items-center gap-3"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.8 }}
          transition={{ duration: 0.45, ease: EASE }}
        >
          <span className="inline-block h-px w-4 bg-amber" aria-hidden />
          {t.home.path.eyebrow}
        </motion.p>
        <motion.h2
          className="mt-3 font-display text-[28px] font-medium leading-[1.15] tracking-[-0.01em] text-text md:text-[36px]"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.8 }}
          transition={{ duration: 0.45, ease: EASE, delay: 0.06 }}
        >
          {t.home.path.title}
        </motion.h2>

        {/* The thin journey line: small nodes, words carry the meaning. */}
        <div className="relative mt-12">
          {/* connector line */}
          <span
            aria-hidden
            className="absolute left-[27px] top-6 bottom-6 w-px bg-border-strong md:left-6 md:right-6 md:top-[27px] md:bottom-auto md:h-px md:w-auto"
          />
          <ol className="flex flex-col gap-10 md:grid md:grid-cols-3 md:gap-8">
            {stages.map((s, i) => {
              const Icon = ICONS[i] ?? HeartHandshake;
              return (
                <motion.li
                  key={s.title}
                  className="relative flex items-start gap-5 md:flex-col md:gap-0"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.6 }}
                  transition={{ duration: 0.5, ease: EASE, delay: i * 0.12 }}
                >
                  {/* node */}
                  <span className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-border bg-surface">
                    <Icon className="h-5 w-5 text-amber" strokeWidth={1.5} />
                  </span>
                  <div className="pt-1 md:mt-5 md:pt-0">
                    <h3 className="font-display text-[20px] font-medium tracking-[0.01em] text-text md:text-[22px]">
                      {s.title}
                    </h3>
                    <p className="mt-1.5 max-w-[30ch] text-[15px] leading-[1.55] text-text-muted">
                      {s.body}
                    </p>
                  </div>
                </motion.li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
