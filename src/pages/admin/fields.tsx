/**
 * Shared form components for the admin workbench tabs: field wrapper,
 * dollar→cents amount field, donor-code field with live lookup status
 * line, and the submit button with save choreography (idle → saving →
 * saved). Non-component helpers live in ./formUtils.
 */
import type { ReactNode } from 'react';
import { CheckCircle2, CircleAlert, Loader2 } from 'lucide-react';
import { formatMoney, privacyName } from '@/lib/format';
import { DONOR_CODE_LENGTH } from '@/lib/session';
import { cn } from '@/lib/utils';
import {
  dollarsToCents,
  inputCls,
  useDonorLookup,
  type DonorLookup,
  type SaveState,
} from './formUtils';

export function Field({
  label,
  children,
  hint,
  className,
}: {
  label: string;
  children: ReactNode;
  hint?: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.12em] text-text-muted">
        {label}
      </label>
      {children}
      {hint ? (
        <p className="mt-1.5 text-[12px] font-medium tracking-[0.01em] text-text-faint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function AmountField({
  value,
  onChange,
  label = 'Amount',
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
}) {
  const cents = dollarsToCents(value);
  return (
    <Field label={label}>
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-mono text-[15px] text-text-muted">
            $
          </span>
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0.00"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={cn(inputCls, 'pl-8 font-mono')}
          />
        </div>
        <span
          className="hidden shrink-0 font-mono text-[12px] text-text-faint min-[480px]:inline"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          → {cents.toLocaleString('en-US')} cents
        </span>
      </div>
    </Field>
  );
}

/** Inline status line under a donor-code input. */
export function DonorLookupLine({ lookup }: { lookup: DonorLookup }) {
  if (lookup.state === 'checking') {
    return (
      <p className="mt-1.5 flex items-center gap-1.5 text-[12px] font-medium text-text-muted">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Looking up code…
      </p>
    );
  }
  if (lookup.state === 'found' && lookup.donor) {
    return (
      <p className="mt-1.5 flex items-center gap-1.5 text-[12px] font-medium text-sage">
        <CheckCircle2 className="h-3.5 w-3.5" />
        {privacyName(lookup.donor.name)} · {formatMoney(lookup.donor.totalGiven)} given to date
      </p>
    );
  }
  if (lookup.state === 'notfound') {
    return (
      <p className="mt-1.5 flex items-center gap-1.5 text-[12px] font-medium text-danger">
        <CircleAlert className="h-3.5 w-3.5" /> No donor with this code yet.
      </p>
    );
  }
  if (lookup.state === 'invalid') {
    return (
      <p className="mt-1.5 flex items-center gap-1.5 text-[12px] font-medium text-danger">
        <CircleAlert className="h-3.5 w-3.5" /> Codes are 12 Base58 characters (no 0, O, I, l).
      </p>
    );
  }
  return null;
}

export function DonorCodeField({
  value,
  onChange,
  label = 'Donor code',
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
}) {
  const lookup = useDonorLookup(value);
  return (
    <Field label={label}>
      <input
        type="text"
        autoComplete="off"
        spellCheck={false}
        maxLength={DONOR_CODE_LENGTH}
        placeholder="12-character code"
        value={value}
        onChange={(e) => onChange(e.target.value.trim())}
        className={cn(inputCls, 'font-mono tracking-[0.08em]')}
      />
      <DonorLookupLine lookup={lookup} />
    </Field>
  );
}

export function SubmitButton({
  state,
  label,
  savedLabel = 'Recorded · live now',
  color = 'amber',
  disabled,
}: {
  state: SaveState;
  label: string;
  savedLabel?: string;
  color?: 'amber' | 'terra' | 'sage';
  disabled?: boolean;
}) {
  const palette = {
    amber: 'bg-amber hover:bg-amber-soft text-[#1A130B]',
    terra: 'bg-terra hover:brightness-110 text-[#1A130B]',
    sage: 'bg-sage hover:brightness-110 text-[#1A130B]',
  }[color];

  return (
    <button
      type="submit"
      disabled={disabled || state !== 'idle'}
      className={cn(
        'flex h-12 w-full items-center justify-center gap-2 rounded-[10px] text-[15px] font-semibold transition-all duration-150 ease-calm active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60',
        state === 'saved' ? 'bg-sage text-[#1A130B]' : palette,
      )}
    >
      {state === 'saving' ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" /> Saving…
        </>
      ) : state === 'saved' ? (
        <>
          <CheckCircle2 className="h-4 w-4" /> {savedLabel}
        </>
      ) : (
        label
      )}
    </button>
  );
}
