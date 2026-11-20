import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <App />
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
)
