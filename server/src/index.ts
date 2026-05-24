import express from 'express'
import cors from 'cors'
import { db, getScriptsDir } from './db'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import { authMiddleware } from './middleware/auth'
import scriptsRouter from './routes/scripts'
import templatesRouter from './routes/templates'
import './db/seed'

const app = express()
const PORT = parseInt(process.env.PORT || '3400', 10)

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/scripts', authMiddleware, scriptsRouter)
app.use('/api/templates', authMiddleware, templatesRouter)

app.use((_req, res) => {
  res.status(404).json({ error: { message: 'Not found', code: 'NOT_FOUND' } })
})

export function startServer(): void {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Marketplace server running on http://0.0.0.0:${PORT}`)
  })
}

startServer()
