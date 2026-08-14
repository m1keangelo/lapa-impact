/**
 * LanguageToggle — compact ES | EN pill for the Navbar. Follows the
 * ThemeToggle pattern (border-transparent hover frame, 10px radius); the
 * active segment is highlighted in amber. Announces the current language.
 */
import { useLanguage, type Language } from '@/i18n/LanguageContext';
import { cn } from '@/lib/utils';

interface LanguageToggleProps {
  className?: string;
}

const OPTIONS: { id: Language; short: string }[] = [
  { id: 'es', short: 'ES' },
  { id: 'en', short: 'EN' },
];

export default function LanguageToggle({ className }: LanguageToggleProps) {
  const { lang, setLang, t } = useLanguage();
  const currentName = lang === 'es' ? t.nav.spanish : t.nav.english;

  return (
    <div
      role="group"
      aria-label={t.nav.langAria(currentName)}
      className={cn(
        'inline-flex h-9 items-center gap-0.5 rounded-[10px] border border-transparent p-1 transition-all duration-200 ease-calm hover:border-border hover:bg-surface-2',
        className,
      )}
    >
      {OPTIONS.map((opt) => {
        const active = lang === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            aria-pressed={active}
            onClick={() => setLang(opt.id)}
            className={cn(
              'flex h-7 items-center rounded-[7px] px-2 font-mono text-[11px] font-semibold tracking-[0.08em] transition-all duration-200 ease-calm active:scale-[0.96]',
              active
                ? 'bg-amber text-white'
                : 'text-text-muted hover:text-text',
            )}
          >
            {opt.short}
          </button>
        );
      })}
    </div>
  );
}
