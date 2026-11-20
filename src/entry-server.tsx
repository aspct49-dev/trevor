/*
 * Server entry: renders one page to HTML. Used only at build time by
 * scripts/prerender.mjs, which writes a ready-made HTML file per page so
 * search engines and link previews get the real content without running
 * JavaScript. In the browser, src/main.tsx then hydrates that HTML.
 */
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router'
import App from './App'
import { ToastProvider } from './components/ui'

export function render(url: string) {
  return renderToString(
    <StaticRouter location={url}>
      <ToastProvider>
        <App />
      </ToastProvider>
    </StaticRouter>,
  )
}

// The build script reads the page list and tag builders from here, so it never has to compile TypeScript itself
export { DEFAULT_SITE_URL, PAGES, robots, seoHead, sitemap } from '../shared/seo'
