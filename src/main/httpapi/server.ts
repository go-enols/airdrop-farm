import { createServer, IncomingMessage, ServerResponse } from 'http'
import { executeHandler } from '../ipc'
import { createLogger } from '../utils/logger'

const logger = createLogger('http')

interface HttpRequest {
  channel: string
  args: unknown[]
}

export class HttpApiServer {
  private server: ReturnType<typeof createServer> | null = null
  private actualPort: number | null = null

  constructor(private port = 34116) {}

  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = createServer((req, res) => this.handleRequest(req, res))

      this.server.on('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE' && this.port < 34126) {
          this.port++
          this.server!.close()
          this.server!.listen(this.port, '127.0.0.1')
          return
        }
        logger.error('HTTP server error', { error: err.message })
        reject(err)
      })

      this.server.listen(this.port, '127.0.0.1', () => {
        const addr = this.server!.address()
        this.actualPort = typeof addr === 'object' && addr !== null ? addr.port : this.port
        logger.info('HTTP API server started', { port: this.actualPort })
        resolve()
      })
    })
  }

  stop(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.server) { resolve(); return }
      this.server.close(() => {
        logger.info('HTTP API server stopped')
        resolve()
      })
    })
  }

  getPort(): number {
    return this.actualPort ?? this.port
  }

  getAddress(): string {
    return `http://127.0.0.1:${this.getPort()}`
  }

  private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    res.setHeader('Content-Type', 'application/json')
    // Allow all CORS since this is a local-only 127.0.0.1 fallback server
    // for renderer communication - no external clients can access it
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') {
      res.writeHead(204)
      res.end()
      return
    }

    if (req.method === 'GET' && req.url === '/api/health') {
      res.writeHead(200)
      res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }))
      return
    }

    if (req.method === 'POST' && req.url === '/api/call') {
      try {
        const body = await this.readBody(req)
        const { channel, args = [] } = JSON.parse(body) as HttpRequest

        if (!channel || typeof channel !== 'string') {
          res.writeHead(400)
          res.end(JSON.stringify({ error: { message: 'Missing or invalid channel', code: 'VALIDATION_ERROR' } }))
          return
        }

        const result = await executeHandler(channel, args as unknown[])
        res.writeHead(200)
        res.end(JSON.stringify(result))
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        logger.error('HTTP request error', { error: message })
        res.writeHead(500)
        res.end(JSON.stringify({ error: { message, code: 'INTERNAL_ERROR' } }))
      }
      return
    }

    res.writeHead(404)
    res.end(JSON.stringify({ error: { message: 'Not found', code: 'NOT_FOUND' } }))
  }

  private readBody(req: IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = []
      req.on('data', (chunk) => chunks.push(chunk))
      req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')))
      req.on('error', reject)
    })
  }
}
