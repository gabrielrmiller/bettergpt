import { defineConfig, type Plugin, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import type { IncomingMessage, ServerResponse } from 'node:http'

// Use environment variable for base path, default to '/' for Vercel
// Set VITE_GH_PAGES=true for GitHub Pages deployment
const isGitHubPages = process.env.VITE_GH_PAGES === 'true'

function rewriteWhenPage(req: IncomingMessage, res: ServerResponse, next: () => void) {
  if (req.url === '/when' || req.url === '/when/') req.url = '/when.html'
  if (req.url === '/books' || req.url === '/books/') req.url = '/books.html'
  if (req.url === '/mas-i') {
    res.writeHead(308, { Location: '/mas-i/' })
    res.end()
    return
  }
  if (req.url === '/studyfs' || req.url === '/studyfs/') {
    res.writeHead(308, { Location: '/mas-i/studyfs/' })
    res.end()
    return
  }
  if (req.url === '/examfs' || req.url === '/examfs/') {
    res.writeHead(308, { Location: '/mas-i/examfs/' })
    res.end()
    return
  }
  if (req.url === '/mas-i/studyfs') {
    res.writeHead(308, { Location: '/mas-i/studyfs/' })
    res.end()
    return
  }
  if (req.url === '/mas-i/examfs') {
    res.writeHead(308, { Location: '/mas-i/examfs/' })
    res.end()
    return
  }
  next()
}

function whenPage(): Plugin {
  return {
    name: 'when-page',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(rewriteWhenPage)
    },
    configurePreviewServer(server) {
      server.middlewares.use(rewriteWhenPage)
    },
  }
}

function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => {
      if (chunks.length === 0) {
        resolve({})
        return
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))
      } catch (error) {
        reject(error)
      }
    })
    req.on('error', reject)
  })
}

function sendJson(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(payload))
}

function whenApi(): Plugin {
  return {
    name: 'when-api',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        const parsed = new URL(req.url || '/', 'http://localhost')
        const pathname = parsed.pathname
        if (
          pathname !== "/api/availability/poll" &&
          pathname !== "/api/availability/people" &&
          pathname !== "/api/timer/sync" &&
          pathname !== "/api/books/sync"
        ) {
          next()
          return
        }

        try {
          if (pathname === "/api/timer/sync" || pathname === "/api/books/sync") {
            if (req.method !== "POST") {
              res.setHeader("Allow", "POST")
              sendJson(res, 405, { error: "Method not allowed." })
              return
            }
            const body = await readJsonBody(req)
            if (pathname === "/api/books/sync") {
              const { enforceRateLimit, handleBooks } = await import("./api/books/_store.js")
              await enforceRateLimit("local")
              sendJson(res, 200, await handleBooks(body))
              return
            }
            const { enforceRateLimit, handleTimer } = await import("./api/timer/_store.js")
            await enforceRateLimit("local")
            sendJson(res, 200, await handleTimer(body))
            return
          }

          const { deletePerson, getPoll, upsertPerson } = await import("./api/availability/_poll.js")
          if (pathname === '/api/availability/poll' && req.method === 'GET') {
            sendJson(res, 200, await getPoll())
            return
          }
          if (pathname === '/api/availability/people' && req.method === 'POST') {
            const body = await readJsonBody(req)
            sendJson(res, 200, await upsertPerson(body.name, body.days))
            return
          }
          if (pathname === '/api/availability/people' && req.method === 'DELETE') {
            const id = parsed.searchParams.get('id')
            if (!id) {
              sendJson(res, 400, { error: 'Missing person id.' })
              return
            }
            sendJson(res, 200, await deletePerson(id))
            return
          }
          res.setHeader('Allow', pathname === '/api/availability/poll' ? 'GET' : 'POST,DELETE')
          sendJson(res, 405, { error: 'Method not allowed.' })
        } catch (error) {
          const err = error as { status?: number; message?: string }
          sendJson(res, err.status || 500, {
            error: err.message || 'Request failed.',
          })
        }
      })
    },
  }
}

export default defineConfig({
  base: isGitHubPages ? './' : '/',
  plugins: [react(), whenPage(), whenApi()],
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('index.html', import.meta.url)),
        when: fileURLToPath(new URL('when.html', import.meta.url)),
        books: fileURLToPath(new URL('books.html', import.meta.url)),
      },
    },
  },
})
