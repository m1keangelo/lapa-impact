/**
 * Finance console — MONEY IN (spec §10). Live, read-only list of donations
 * as they arrive, so the finance user always knows what's available before
 * recording money out.
 */
import { useEffect, useState } from 'react';
import {
  collection,
  limit as fbLimit,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import { HandCoins } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { db } from '@/lib/firebase';
import { formatMoney, formatShortDate, privacyName, toMillis } from '@/lib/format';
import type { Donation } from '@/lib/types';

export default function MoneyInList() {
  const { t, lang } = useLanguage();
  const [items, setItems] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }
    const q = query(collection(db, 'donations'), orderBy('timestamp', 'desc'), fbLimit(15));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Donation));
        setLoading(false);
      },
      (err) => {
        console.warn('[MoneyInList] listener failed:', err);
        setLoading(false);
      },
    );
    return unsub;
  }, []);

  return (
    <section className="rounded-card border border-border bg-surface p-5 md:p-6">
      <h2 className="flex items-center gap-2 font-display text-[19px] font-medium text-text">
        <HandCoins className="h-4 w-4 text-amber" /> {t.ops.finance.inTitle}
      </h2>
      <p className="mt-1 text-[12px] font-medium text-text-faint">{t.ops.finance.inSub}</p>
      <div className="mt-4 flex flex-col divide-y divide-border">
        {loading ? (
          <div className="space-y-2 py-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-9 animate-pulse rounded bg-surface-2" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="py-4 text-[13px] font-medium text-text-faint">{t.ops.finance.empty}</p>
        ) : (
          items.map((d) => (
            <div key={d.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-[14px] font-medium text-text">
                  {privacyName(d.donorName, lang)}
                </p>
                <p className="text-[12px] text-text-faint">
                  {formatShortDate(toMillis(d.timestamp), lang)}
                </p>
              </div>
              <span
                className="font-mono text-[14px] font-semibold text-text"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {formatMoney(d.amount)}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
