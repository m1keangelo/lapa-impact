/**
 * LanguageContext — ES/EN for the whole app.
 * First visit: detect from navigator.language (`es*` → Spanish, else English).
 * Explicit choices persist in localStorage under `lapa-lang`. The provider
 * also keeps <html lang> in sync.
 */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { en, type Dictionary } from './en';
import { es } from './es';

export type Language = 'en' | 'es';

const STORAGE_KEY = 'lapa-lang';

function detectLanguage(): Language {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'es') return stored;
  } catch {
    /* storage unavailable — fall through to detection */
  }
  // Spanish-first: this is a Colombian mission, so Spanish is the default for
  // every visitor. English remains available via the navbar toggle.
  return 'es';
}

export interface LanguageContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: Dictionary;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(detectLanguage);

  // Keep <html lang> in sync for screen readers / SEO.
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      setLang: (next: Language) => {
        setLangState(next);
        try {
          window.localStorage.setItem(STORAGE_KEY, next);
        } catch {
          /* storage unavailable — session-only language */
        }
      },
      t: lang === 'es' ? es : en,
    }),
    [lang],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
}
