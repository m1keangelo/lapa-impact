import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App.tsx'
import { bootstrapTheme } from './hooks/useTheme'

// Apply persisted theme before first paint; no StrictMode (react-dev.md).
bootstrapTheme()

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
)
