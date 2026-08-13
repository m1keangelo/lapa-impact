/**
 * Section 1 — Health row: 4 mini stat chips (mono, surface, radius 10px)
 * fed by stats/global via useGlobalStats. Chips flash their variant color
 * whenever a live push (or a local save) bumps the revision — implemented
 * as a keyed overlay that remounts and fades out (no state, no effect).
 */
import { motion } from 'framer-motion';
import { useGlobalStats } from '@/hooks/useGlobalStats';
import { formatCount, formatMoneyShort } from '@/lib/format';
import { cn } from '@/lib/utils';

interface Chip {
  label: string;
  value: string;
  colorClass: string;
  flashClass: string;
}

export default function HealthChips({ saveTick }: { saveTick: number }) {
  const { stats, revision } = useGlobalStats();
  const flashKey = revision + saveTick;

  const balance = stats.totalIn - stats.totalOut;
  const chips: Chip[] = [
    {
      label: 'in',
      value: formatMoneyShort(stats.totalIn),
      colorClass: 'text-amber',
      flashClass: 'bg-amber/25',
    },
    {
      label: 'out',
      value: formatMoneyShort(stats.totalOut),
      colorClass: 'text-terra',
      flashClass: 'bg-terra/25',
    },
    {
      label: 'families',
      value: formatCount(stats.familiesHelped),
      colorClass: 'text-sage',
      flashClass: 'bg-sage/25',
    },
    {
      label: 'balance',
      value: formatMoneyShort(balance),
      colorClass: 'text-text',
      flashClass: 'bg-text/15',
    },
  ];

  return (
    <div className="mt-6 grid grid-cols-2 gap-2 min-[480px]:grid-cols-4">
      {chips.map((c) => (
        <div
          key={c.label}
          className="relative flex items-baseline justify-between gap-2 overflow-hidden rounded-[10px] border border-border bg-surface px-3.5 py-2.5"
        >
          {/* Flash overlay: remounts on every revision/save tick, then fades */}
          {flashKey > 0 && (
            <motion.span
              key={flashKey}
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className={cn('pointer-events-none absolute inset-0', c.flashClass)}
              aria-hidden
            />
          )}
          <span
            className={cn('font-mono text-[15px] font-medium', c.colorClass)}
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {c.value}
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
            {c.label}
          </span>
        </div>
      ))}
    </div>
  );
}
