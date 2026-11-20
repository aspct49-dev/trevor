import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
// Fonts are served by the site itself (no requests to Google Fonts)
import '@fontsource/exo-2/latin-600.css'
import '@fontsource/exo-2/latin-700.css'
import '@fontsource/exo-2/latin-800.css'
import '@fontsource/exo-2/latin-900.css'
import '@fontsource/montserrat/latin-500.css'
import '@fontsource/montserrat/latin-600.css'
import '@fontsource/montserrat/latin-700.css'
import '@fontsource/montserrat/latin-800.css'
import '@fontsource/inter/latin-700.css'
import '@fontsource/rubik/latin-500.css'
import './styles.css'
import App from './App'
import { ToastProvider } from './components/ui'

const root = document.getElementById('root')!
const app = (
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <App />
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>
)

// Built pages arrive already rendered (scripts/prerender.mjs): attach to that HTML.
// The dev server sends an empty page: render from scratch.
if (root.firstElementChild) hydrateRoot(root, app)
else createRoot(root).render(app)
