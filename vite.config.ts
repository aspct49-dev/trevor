import { defineConfig, loadEnv } from 'vite'
import type { Connect, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { handleLeaderboardRequest, tokensFromEnv } from './server/stakeLeaderboard.js'
import type { Tokens } from './server/stakeLeaderboard.js'
import { handleKickRequest } from './server/kick.js'

/**
 * Serves /api/leaderboard and /api/kick from `vite` and `vite preview`, mirroring
 * the Vercel Functions in api/. The tokens come from .env and stay in this
 * Node process; only VITE_-prefixed variables ever reach the browser.
 */
function leaderboardApi(tokens: Tokens): Plugin {
  const middleware: Connect.NextHandleFunction = async (req, res, next) => {
    const url = new URL(req.url ?? '/', 'http://localhost')
    if (url.pathname !== '/api/leaderboard' && url.pathname !== '/api/kick') return next()

    const { status, body } =
      url.pathname === '/api/kick' ? await handleKickRequest() : await handleLeaderboardRequest(tokens)
    res.statusCode = status
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    res.end(JSON.stringify(body))
  }

  return {
    name: 'leaderboard-api',
    configureServer: (server) => void server.middlewares.use(middleware),
    configurePreviewServer: (server) => void server.middlewares.use(middleware),
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), leaderboardApi(tokensFromEnv(env))],
  }
})
