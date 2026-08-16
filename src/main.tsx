import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { domAnimation, LazyMotion, MotionConfig } from 'framer-motion'
import './index.css'
import App from './App.tsx'
import { bootstrapTheme } from './hooks/useTheme'
import { LanguageProvider } from './i18n/LanguageContext'

// Apply persisted theme before first paint; no StrictMode (react-dev.md).
bootstrapTheme()

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <LanguageProvider>
      {/* TYPOGRAPHIC MOTION ONLY §11 — when the OS asks for reduced
          motion, every framer-motion transform/layout animation jumps
          straight to its final state: text stays immediately visible. */}
      <MotionConfig reducedMotion="user">
        {/* PERFORMANCE §44 — LazyMotion loads only the DOM animation
            feature set instead of framer-motion's full bundle. */}
        <LazyMotion features={domAnimation}>
          <App />
        </LazyMotion>
      </MotionConfig>
    </LanguageProvider>
  </BrowserRouter>,
)
