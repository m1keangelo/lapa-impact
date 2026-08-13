/**
 * Feed sidebar (feed.md §4) — desktop only. "This week" totals with 7-day
 * sparklines (path draws on scroll into view), top supporters (privacy
 * names only), and the transparency note. Data comes from the loaded
 * public feed collections — all privacy-safe.
 */
import { useMemo, useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { formatCount, formatMoney, privacyName, toMillis } from '@/lib/format';
import type { Donation, ImpactUpdate, Transfer } from '@/lib/types';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const DAY = 24 * 60 * 60 * 1000;

/** 7 day-buckets (oldest → newest) summed by a value selector. */
function weekBuckets<T>(items: T[], ts: (t: T) => number, value: (t: T) => number): number[] {
  const buckets = new Array<number>(7).fill(0);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const start = todayStart.getTime() - 6 * DAY;
  for (const item of items) {
    const t = ts(item);
    if (t < start) continue;
    const idx = Math.min(6, Math.floor((t - start) / DAY));
    buckets[idx] += value(item);
  }
  return buckets;
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduceMotion = useReducedMotion();
  if (data.length < 2) return null;

  const w = 96;
  const h = 28;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const points = data.map(
    (v, i) =>
      [((i / (data.length - 1)) * w).toFixed(1), (h - 3 - ((v - min) / span) * (h - 6)).toFixed(1)] as const,
  );
  const d = `M ${points.map((p) => p.join(',')).join(' L ')}`;

  return (
    <svg ref={ref} width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0" aria-hidden>
      <motion.path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        initial={{ pathLength: reduceMotion ? 1 : 0 }}
        animate={inView ? { pathLength: 1 } : {}}
        transition={{ duration: 0.9, ease: EASE }}
      />
    </svg>
  );
}

interface FeedSidebarProps {
  donations: Donation[];
  transfers: Transfer[];
  updates: ImpactUpdate[];
  totalEntries: number;
}

export default function FeedSidebar({ donations, transfers, updates }: FeedSidebarProps) {
  const week = useMemo(() => {
    const gifts = weekBuckets(donations, (d) => toMillis(d.timestamp), (d) => d.amount);
    const out = weekBuckets(transfers, (t) => toMillis(t.timestamp), (t) => t.amount);
    const families = weekBuckets(
      updates,
      (u) => toMillis(u.timestamp),
      (u) => {
        const f = u.metrics?.families;
        return typeof f === 'number' ? f : Number(f) || 0;
      },
    );
    return {
      gifts,
      out,
      families,
      giftsTotal: gifts.reduce((a, b) => a + b, 0),
      outTotal: out.reduce((a, b) => a + b, 0),
      familiesTotal: families.reduce((a, b) => a + b, 0),
    };
  }, [donations, transfers, updates]);

  const topSupporters = useMemo(() => {
    const byDonor = new Map<string, number>();
    for (const d of donations) {
      const name = privacyName(d.donorName);
      byDonor.set(name, (byDonor.get(name) ?? 0) + d.amount);
    }
    return [...byDonor.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [donations]);

  const rows = [
    { label: 'Gifts in', value: formatMoney(week.giftsTotal), data: week.gifts, color: 'var(--amber)' },
    { label: 'Transferred', value: formatMoney(week.outTotal), data: week.out, color: 'var(--terra)' },
    { label: 'Families', value: formatCount(week.familiesTotal), data: week.families, color: 'var(--sage)' },
  ];

  return (
    <aside className="sticky top-[140px] hidden w-[300px] shrink-0 flex-col gap-4 lg:flex">
      {/* This week */}
      <motion.section
        className="rounded-card border border-border bg-surface p-5"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5, ease: EASE }}
        aria-label="This week"
      >
        <p className="eyebrow">This week</p>
        <div className="mt-4 space-y-4">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-faint">
                  {r.label}
                </p>
                <p
                  className="mt-0.5 font-mono text-[15px] font-medium text-text"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {r.value}
                </p>
              </div>
              <Sparkline data={r.data} color={r.color} />
            </div>
          ))}
        </div>
      </motion.section>

      {/* Top supporters */}
      <motion.section
        className="rounded-card border border-border bg-surface p-5"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5, ease: EASE, delay: 0.12 }}
        aria-label="Top supporters"
      >
        <p className="eyebrow">Top supporters</p>
        {topSupporters.length > 0 ? (
          <ol className="mt-4 space-y-3">
            {topSupporters.map(([name, amount], i) => (
              <li key={name} className="flex items-baseline gap-3">
                <span
                  className="font-mono text-[12px] font-medium text-amber"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-text">{name}</span>
                <span
                  className="font-mono text-[13px] font-medium text-text-muted"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {formatMoney(amount)}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-4 text-[13px] text-text-muted">No gifts recorded yet.</p>
        )}
        <p className="mt-4 border-t border-border pt-3 text-[12px] font-medium tracking-[0.01em] text-text-muted">
          Thank you.
        </p>
      </motion.section>

      {/* Transparency note */}
      <motion.section
        className="rounded-card border border-border bg-surface-2 p-5"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5, ease: EASE, delay: 0.24 }}
      >
        <p className="text-[12px] font-medium leading-[1.5] tracking-[0.01em] text-text-muted">
          This ledger is public by design. Amounts are exact; identities are
          partial. Questions? Contact the mission.
        </p>
      </motion.section>
    </aside>
  );
}
