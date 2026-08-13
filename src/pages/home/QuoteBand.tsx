/**
 * Home Section 6 — Pull quote band (home.md §Section 6).
 * Full-bleed surface band, Fraunces italic quote with word-group fade-up,
 * logo mark drawn in (stroke-dashoffset), attribution after.
 */
import { motion, useReducedMotion } from 'framer-motion';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const QUOTE =
  "For the first time, I didn't wonder what happened to my donation. I watched it happen.";

// Words grouped 8 at a time (home.md animation spec).
function groupWords(text: string, size = 8): string[][] {
  const words = text.split(' ');
  const groups: string[][] = [];
  for (let i = 0; i < words.length; i += size) groups.push(words.slice(i, i + size));
  return groups;
}

export default function QuoteBand() {
  const reduceMotion = useReducedMotion();
  const groups = groupWords(QUOTE);

  return (
    <section className="border-y border-border bg-surface py-20 md:py-28">
      <div className="mx-auto flex max-w-[680px] flex-col items-center px-5 text-center md:px-8">
        {/* Logo mark, stroke draw-in */}
        <motion.svg
          viewBox="0 0 64 64"
          className="h-10 w-10 opacity-40"
          fill="none"
          aria-hidden
          initial="hidden"
          whileInView="show"
          viewport={{ amount: 0.5, once: true }}
        >
          {[
            'M22 36 L32 16 L42 36',
            'M28.5 27 L32 20.5 L35.5 27',
            'M12 38 C12 50 21 58 32 58 C43 58 52 50 52 38',
            'M12 38 L7 32',
            'M52 38 L57 32',
          ].map((d, i) => (
            <motion.path
              key={i}
              d={d}
              stroke="var(--amber)"
              strokeWidth={4}
              strokeLinecap="round"
              strokeLinejoin="round"
              variants={{
                hidden: { pathLength: 0 },
                show: {
                  pathLength: 1,
                  transition: { duration: reduceMotion ? 0 : 1, ease: 'easeOut', delay: i * 0.08 },
                },
              }}
            />
          ))}
        </motion.svg>

        <blockquote className="mt-8 font-display text-[28px] font-medium italic leading-[1.3] tracking-[-0.01em] text-text md:text-4xl">
          {groups.map((group, gi) => (
            <span key={gi} className="inline">
              {group.map((word, wi) => (
                <motion.span
                  key={wi}
                  className="inline-block"
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ amount: 0.3, once: true }}
                  transition={{
                    delay: reduceMotion ? 0 : gi * 0.24 + wi * 0.04,
                    duration: reduceMotion ? 0 : 0.45,
                    ease: EASE,
                  }}
                >
                  {word}
                  {wi < group.length - 1 ? ' ' : ''}
                </motion.span>
              ))}
              {gi < groups.length - 1 ? ' ' : ''}
            </span>
          ))}
        </blockquote>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ amount: 0.3, once: true }}
          transition={{ delay: reduceMotion ? 0 : 0.9, duration: reduceMotion ? 0 : 0.3, ease: EASE }}
          className="mt-6 text-[13px] font-medium tracking-[0.01em] text-text-muted"
        >
          — Maria G., donor since 2024
        </motion.p>
      </div>
    </section>
  );
}
