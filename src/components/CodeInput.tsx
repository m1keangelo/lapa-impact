/**
 * CodeInput (design.md §7.8, login.md §2) — the signature segmented donor
 * code input. 6 numeric slots driven by a single invisible input so mobile
 * keyboards (numeric keypad) and paste "just work".
 *
 * Behaviors (login.md):
 *  - Active slot: amber border + soft amber glow; filled slots cream text.
 *  - Typing: 100ms pop (scale 1→1.08→1) on the filled slot.
 *  - Paste: ripple fill — each new slot pops 0.9→1, 30ms apart.
 *  - Invalid character: whole field shakes (x ±6px, 250ms).
 *  - status="checking": slots pulse gently; "success": sage borders flash
 *    left→right 50ms apart; "error": danger borders + shake.
 *  - Mount: slots stagger in scale 0.8→1, 40ms apart (400ms base delay).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useAnimationControls, useReducedMotion } from 'framer-motion';
import { useLanguage } from '@/i18n/LanguageContext';
import { DONOR_CODE_LENGTH } from '@/lib/session';
import { cn } from '@/lib/utils';

export type CodeInputStatus = 'idle' | 'checking' | 'success' | 'error';

interface CodeInputProps {
  value: string;
  onChange: (code: string) => void;
  status?: CodeInputStatus;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
  /** fired on Enter once the code is 6 digits */
  onSubmitCode?: (code: string) => void;
}

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const DIGIT_RUN = /[0-9]/g;

interface Pop {
  nonce: number;
  from: number; // first popped slot index (inclusive)
  to: number; // last popped slot index (exclusive)
  typed: boolean; // single char typed vs multi-char paste
}

export default function CodeInput({
  value,
  onChange,
  status = 'idle',
  disabled = false,
  autoFocus = false,
  className,
  onSubmitCode,
}: CodeInputProps) {
  const reduceMotion = useReducedMotion();
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const [pop, setPop] = useState<Pop | null>(null);
  const prevLen = useRef(value.length);
  const shakeControls = useAnimationControls();

  const shake = useCallback(() => {
    if (reduceMotion) return;
    void shakeControls.start({
      x: [0, -6, 6, -6, 6, -6, 0],
      transition: { duration: 0.25, ease: 'easeInOut' },
    });
  }, [shakeControls, reduceMotion]);

  // Per-char pop / paste ripple whenever the value grows (typed, pasted or prefilled).
  useEffect(() => {
    const len = value.length;
    if (len > prevLen.current) {
      setPop({
        nonce: Date.now(),
        from: prevLen.current,
        to: len,
        typed: len - prevLen.current === 1,
      });
    }
    prevLen.current = len;
  }, [value]);

  // Error status flashes danger + shakes the whole field.
  useEffect(() => {
    if (status === 'error') shake();
  }, [status, shake]);

  const handleChange = (raw: string) => {
    const matches = raw.match(DIGIT_RUN) ?? [];
    const next = matches.join('').slice(0, DONOR_CODE_LENGTH);
    // Shake when characters were rejected (non-digits) or the field is full.
    const rejected = matches.length < raw.replace(/\s/g, '').length;
    if (rejected || (next === value && raw !== value)) shake();
    onChange(next);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.length === DONOR_CODE_LENGTH) {
      onSubmitCode?.(value);
    }
  };

  const activeIndex = Math.min(value.length, DONOR_CODE_LENGTH - 1);

  const slots = Array.from({ length: DONOR_CODE_LENGTH }, (_, i) => {
    const char = value[i] ?? '';
    const isActive = focused && i === activeIndex && status === 'idle';
    const popped = pop && i >= pop.from && i < pop.to ? pop : null;

    let borderColor = 'var(--border)';
    let boxShadow: string | undefined;
    if (char) borderColor = 'var(--border-strong)';
    if (isActive) {
      borderColor = 'var(--amber)';
      boxShadow = '0 0 0 3px rgba(232,163,61,0.16)';
    }
    if (status === 'checking') {
      borderColor = 'var(--amber)';
    } else if (status === 'success') {
      borderColor = 'var(--sage)';
      boxShadow = '0 0 0 3px rgba(143,169,124,0.14)';
    } else if (status === 'error') {
      borderColor = 'var(--danger)';
    }

    return (
      <div key={i} className="contents">
        {i === 6 ? <span className="w-3 shrink-0" aria-hidden /> : null}
        {/* Mount stagger wrapper (stays mounted across pops) */}
        <motion.span
          initial={reduceMotion ? false : { opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            delay: reduceMotion ? 0 : 0.4 + i * 0.04,
            duration: reduceMotion ? 0 : 0.4,
            ease: EASE,
          }}
          className="block"
        >
          {/* Pop layer — remounts on each pop to retrigger the keyframe */}
          <motion.span
            key={popped ? `pop-${popped.nonce}-${i}` : 'base'}
            initial={
              popped && !reduceMotion
                ? { scale: popped.typed ? 1.08 : 0.9 }
                : false
            }
            animate={{ scale: 1 }}
            transition={{
              duration: popped?.typed ? 0.1 : 0.18,
              delay:
                popped && !popped.typed ? (i - popped.from) * 0.03 : 0,
              ease: EASE,
            }}
            style={{
              borderColor,
              boxShadow,
              transitionDelay:
                status === 'success' ? `${i * 50}ms` : status === 'error' ? `${i * 20}ms` : '0ms',
            }}
            className={cn(
              'flex h-[42px] w-[30px] items-center justify-center rounded-[10px] border bg-surface-2',
              'font-mono text-lg tracking-[0.08em] transition-colors duration-300',
              'min-[360px]:h-[46px] min-[360px]:w-[34px] md:h-[52px] md:w-[40px]',
              status === 'checking' && 'animate-pulse',
              char ? 'text-text' : 'text-text-faint',
            )}
          >
            {char}
          </motion.span>
        </motion.span>
      </div>
    );
  });

  return (
    <motion.div
      animate={shakeControls}
      className={cn('relative w-fit', className)}
      onClick={() => inputRef.current?.focus()}
    >
      <div
        role="group"
        aria-label={t.login.groupAria}
        className="flex items-center gap-1.5 md:gap-2"
      >
        {slots}
      </div>
      {/* Single invisible driver input covering the slots */}
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={(e) => {
          setFocused(true);
          // Keep the caret pinned to the end so typing always appends.
          e.target.setSelectionRange(value.length, value.length);
        }}
        onBlur={() => setFocused(false)}
        onSelect={(e) => {
          e.currentTarget.setSelectionRange(value.length, value.length);
        }}
        disabled={disabled}
        autoFocus={autoFocus}
        inputMode="numeric"
        autoComplete="one-time-code"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        aria-label={t.login.codeAria}
        style={{ fontSize: 16 }} /* ≥16px prevents iOS focus zoom */
        className="absolute inset-0 h-full w-full cursor-text opacity-0 disabled:cursor-default"
      />
    </motion.div>
  );
}



