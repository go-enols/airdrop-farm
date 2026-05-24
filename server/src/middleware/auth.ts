import { Request, Response, NextFunction } from 'express'

const API_KEY = process.env.MARKETPLACE_API_KEY || 'airdrop-farm-dev-key'

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.method === 'GET') {
    next()
    return
  }

  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) {
    res.status(401).json({ error: { message: 'Missing or invalid Authorization header', code: 'UNAUTHORIZED' } })
    return
  }

  const key = auth.slice(7)
  if (key !== API_KEY) {
    res.status(403).json({ error: { message: 'Invalid API key', code: 'FORBIDDEN' } })
    return
  }

  next()
}
