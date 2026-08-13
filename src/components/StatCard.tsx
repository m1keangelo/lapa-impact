/**
 * StatCard (design.md §7.3) — surface card, eyebrow label, big mono number
 * that counts up, optional delta line and a tiny 40px sparkline on desktop.
 * Variants: `in` (amber), `out` (terra), `impact` (sage).
 */
import { useEffect } from 'react';
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from 'framer-motion';
import { formatCount, formatMoney, formatMoneyShort } from '@/lib/format';
import { cn } from '@/lib/utils';

export type StatCardVariant = 'in' | 'out' | 'impact';

const VARIANT_COLOR: Record<StatCardVariant, string> = {
  in: 'var(--amber)',
  out: 'var(--terra)',
  impact: 'var(--sage)',
};

interface StatCardProps {
  label: string;
  /** integer cents when format="money", plain count otherwise */
  value: number;
  variant?: StatCardVariant;
  format?: 'money' | 'count';
  /** hero money stats abbreviate above $1M */
  abbreviate?: boolean;
  /** small context line, e.g. "↑ $240 this week" */
  delta?: string;
  /** sparkline samples (oldest → newest), shown on desktop */
  sparkline?: number[];
  className?: string;
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const w = 40;
  const h = 20;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const points = data
    .map(
      (v, i) =>
        `${((i / (data.length - 1)) * w).toFixed(1)},${(h - 2 - ((v - min) / span) * (h - 4)).toFixed(1)}`,
    )
    .join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="hidden shrink-0 md:block" aria-hidden>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export default function StatCard({
  label,
  value,
  variant = 'in',
  format = 'money',
  abbreviate = false,
  delta,
  sparkline,
  className,
}: StatCardProps) {
  const reduceMotion = useReducedMotion();
  const mv = useMotionValue(reduceMotion ? value : 0);

  useEffect(() => {
    if (reduceMotion) {
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, {
      duration: 1.4,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => controls.stop();
  }, [value, reduceMotion, mv]);

  const text = useTransform(mv, (v) => {
    const rounded = Math.round(v);
    if (format === 'count') return formatCount(rounded);
    return abbreviate ? formatMoneyShort(rounded) : formatMoney(rounded);
  });

  const color = VARIANT_COLOR[variant];

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-card border border-border bg-surface p-5 pt-[22px] transition-all duration-200 ease-calm hover:-translate-y-0.5 hover:border-border-strong md:p-6 md:pt-[26px]',
        className,
      )}
    >
      {/* 3px top accent bar in variant color */}
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{ backgroundColor: color }}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow">{label}</p>
          <motion.p
            className="mt-2 font-mono text-2xl font-medium leading-[1.1] text-text md:text-[28px]"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {text}
          </motion.p>
          {delta ? (
            <p className="mt-2 text-[12px] font-medium tracking-[0.01em] text-sage">{delta}</p>
          ) : null}
        </div>
        {sparkline ? <Sparkline data={sparkline} color={color} /> : null}
      </div>
    </div>
  );
}
