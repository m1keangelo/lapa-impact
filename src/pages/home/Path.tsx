/**
 * Home — "YOUR HELP HAS A PATH." (final master PART 36–38).
 *
 * The real process, five public steps: YOU GIVE → YOUR PAYMENT CLEARS →
 * WE GROUP CLEARED FUNDS → HELP GOES OUT → YOU SEE IT. A thin vertical
 * journey line with numbered nodes — words carry the meaning, numbers
 * keep it honest. Visual weight follows the doc: 01 strong, 02 quiet,
 * 03 operational (+ "More help. Less waste."), 04 strong, 05 strongest.
 */
import { motion } from 'framer-motion';
import { useLanguage } from '@/i18n/LanguageContext';
import { cn } from '@/lib/utils';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

/** PART 38 — visual weight per step. */
const WEIGHT = ['strong', 'quiet', 'operational', 'strong', 'strongest'] as const;

export default function Path() {
  const { t } = useLanguage();
  const steps = t.home.path.steps;

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
          className="mt-3 font-display text-[30px] font-medium leading-[1.15] tracking-[-0.01em] text-text md:text-[38px]"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.8 }}
          transition={{ duration: 0.45, ease: EASE, delay: 0.06 }}
        >
          {t.home.path.title}
        </motion.h2>

        {/* The thin journey line: numbered nodes, words carry the meaning. */}
        <div className="relative mt-12 max-w-[640px]">
          <span
            aria-hidden
            className="absolute bottom-6 left-[21px] top-6 w-px bg-border-strong"
          />
          <ol className="flex flex-col gap-9">
            {steps.map((s, i) => {
              const weight = WEIGHT[i] ?? 'operational';
              return (
                <motion.li
                  key={s.title}
                  className="relative flex items-start gap-5"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.6 }}
                  transition={{ duration: 0.5, ease: EASE, delay: i * 0.08 }}
                >
                  {/* numbered node */}
                  <span
                    className={cn(
                      'relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border bg-surface font-mono text-[13px] font-semibold',
                      weight === 'strongest'
                        ? 'border-amber/60 text-amber'
                        : 'border-border text-text-muted',
                    )}
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="pt-1.5">
                    <h3
                      className={cn(
                        'font-display font-medium tracking-[0.01em]',
                        weight === 'quiet'
                          ? 'text-[17px] text-text-muted'
                          : weight === 'operational'
                            ? 'text-[19px] text-text'
                            : weight === 'strongest'
                              ? 'text-[21px] text-amber md:text-[22px]'
                              : 'text-[20px] text-text md:text-[21px]',
                      )}
                    >
                      {s.title}
                    </h3>
                    <p className="mt-1.5 max-w-[52ch] text-[15px] leading-[1.6] text-text-muted">
                      {s.body}
                    </p>
                    {i === 2 ? (
                      <p className="mt-2.5 inline-flex rounded-full border border-amber/50 bg-amber-glow px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-amber">
                        {t.home.path.lessWaste}
                      </p>
                    ) : null}
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
