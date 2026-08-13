/**
 * Home Section 2 — Trust strip (home.md §Section 2).
 * Four inline facts separated by amber dots that draw in staggered.
 */
import { Fragment } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const FACTS = [
  '100% of donations go to the field',
  'Every transfer has photo proof',
  'Public, real-time ledger',
  'Run by volunteers — $0 overhead claimed here',
];

export default function TrustStrip() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ amount: 0.85, once: true }}
      transition={{ duration: reduceMotion ? 0 : 0.4, ease: EASE }}
      className="border-y border-border py-6"
      aria-label="Why trust this ledger"
    >
      <div className="mx-auto flex w-full max-w-container flex-wrap items-center justify-center gap-x-3 gap-y-2 px-5 md:px-8">
        {FACTS.map((fact, i) => (
          <Fragment key={fact}>
            {i > 0 ? (
              <motion.span
                aria-hidden
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ amount: 0.85, once: true }}
                transition={{
                  delay: reduceMotion ? 0 : i * 0.08,
                  duration: reduceMotion ? 0 : 0.3,
                  ease: EASE,
                }}
                className="hidden h-1 w-1 origin-center rounded-full bg-amber sm:block"
              />
            ) : null}
            <span className="text-[13px] font-medium tracking-[0.01em] text-text-muted">
              {fact}
            </span>
          </Fragment>
        ))}
      </div>
    </motion.section>
  );
}
