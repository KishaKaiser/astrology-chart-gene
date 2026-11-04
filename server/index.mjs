import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { resolve, extname, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { openLibrary } from './library.mjs'
import { createOllamaClient } from './ollama.mjs'

const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.ico': 'image/x-icon' }
export async function createAppServer({ dataDir, distDir, allowedHosts = [], ollamaBaseUrl = process.env.OLLAMA_BASE_URL || process.env.OLLAMA_URL || 'http://127.0.0.1:11434', ollamaModel = process.env.OLLAMA_MODEL || 'gemma3:1b' }) {
  const library = await openLibrary(dataDir)
  const root = resolve(distDir)
  const ollama = createOllamaClient({ baseUrl: ollamaBaseUrl, defaultModel: ollamaModel })
  return createServer(async (req, res) => {
    const json = (status, data) => { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(data)) }
    try {
      const host = req.headers.host ?? ''
      const hostname = new URL(`http://${host}`).hostname
      // Limit Host headers to configured names or LAN/loopback addresses.
      if (!allowedHosts.includes(hostname) && !/^(localhost|127\.0\.0\.1|\[::1\]|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)$/.test(hostname)) return json(403, { error: 'Host not allowed' })
      const url = new URL(req.url, `http://${host}`)
      if (url.pathname.startsWith('/api/')) {
        if (req.headers['sec-fetch-site'] === 'cross-site') return json(403, { error: 'Cross-site requests are not allowed' })
        if (req.headers.origin && new URL(req.headers.origin).host !== host) return json(403, { error: 'Origin not allowed' })
        if (url.pathname === '/api/library' && req.method === 'GET') return json(200, { values: library.read() })
        if (url.pathname === '/api/ollama/models' && req.method === 'GET') return json(200, await ollama.models())
        const chat = url.pathname === '/api/ollama/chat'
        if ((!chat && url.pathname !== '/api/library/changes') || req.method !== 'POST') return json(404, { error: 'Not found' })
        if (!req.headers['content-type']?.startsWith('application/json')) return json(415, { error: 'JSON required' })
        const chunks = []
        let size = 0
        for await (const chunk of req) {
          size += chunk.length
          if (chat && size > 256 * 1024) return json(413, { error: 'Ollama prompt exceeds 256 KB.' })
          if (size > 32 * 1024 * 1024) return json(413, { error: 'Library save exceeds 32 MB. Import smaller batches.' })
          chunks.push(chunk)
        }
        const request = JSON.parse(Buffer.concat(chunks).toString('utf8'))
        if (chat) return json(200, await ollama.chat(request))
        return json(200, { values: await library.change(request) })
      }
      if (!['GET', 'HEAD'].includes(req.method)) return json(405, { error: 'Method not allowed' })
      const pathname = decodeURIComponent(url.pathname)
      if (pathname.split(/[\\/]/).some(part => part.startsWith('.'))) return json(404, { error: 'Not found' })
      let path = resolve(root, `.${pathname}`)
      if (path !== root && !path.startsWith(root + sep)) return json(404, { error: 'Not found' })
      try { if (!(await stat(path)).isFile()) path = resolve(root, 'index.html') }
      catch { if (extname(pathname)) return json(404, { error: 'Not found' }); path = resolve(root, 'index.html') }
      const content = await readFile(path)
      res.writeHead(200, { 'Content-Type': types[extname(path)] ?? 'application/octet-stream', 'Cache-Control': extname(path) === '.html' ? 'no-cache' : 'public, max-age=3600', 'X-Content-Type-Options': 'nosniff' })
      res.end(req.method === 'HEAD' ? undefined : content)
    } catch (error) {
      console.error('Home server request failed:', error.message)
      json(error.status ?? (error instanceof SyntaxError ? 400 : 500), { error: error.status ? error.message : error instanceof SyntaxError ? 'Invalid JSON request.' : 'The home server could not complete the request. Check its logs.' })
    }
  })
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const project = fileURLToPath(new URL('../', import.meta.url))
  const server = await createAppServer({
    dataDir: process.env.ASTROLOGY_DATA_DIR || resolve(project, 'storage'),
    distDir: resolve(project, 'dist'),
    allowedHosts: (process.env.ASTROLOGY_ALLOWED_HOSTS || 'astrology.link,www.astrology.link').split(',').map(s => s.trim()),
  })
  server.listen(Number(process.env.PORT || 4173), '0.0.0.0', () => console.log(`Astrology home server listening on port ${process.env.PORT || 4173}`))
}
