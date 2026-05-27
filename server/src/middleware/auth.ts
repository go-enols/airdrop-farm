import { Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { stmts } from '../db'
import { AuthenticatedRequest, AuthenticatedUser, UserRecord } from '../types'

const JWT_SECRET = process.env.JWT_SECRET || 'airdrop-farm-jwt-secret-dev'
const API_KEY = process.env.MARKETPLACE_API_KEY || 'airdrop-farm-dev-key'

// Extract user from JWT or API key
export function extractUser(req: AuthenticatedRequest): AuthenticatedUser | null {
  const auth = req.headers.authorization
  if (!auth) return null

  // Try API key first (Bearer <token>)
  if (auth.startsWith('Bearer ')) {
    const token = auth.slice(7)

    // Try JWT first
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; username: string; role: string }
      return {
        id: decoded.userId,
        username: decoded.username,
        displayName: decoded.username,
        role: decoded.role as 'admin' | 'developer' | 'user'
      }
    } catch {
      // Not a JWT, try API key lookup
      const user = stmts.userGetByApiKey.get(token) as UserRecord | undefined
      if (user) {
        return {
          id: user.id,
          username: user.username,
          displayName: user.display_name,
          role: user.role
        }
      }

      // Fallback: check against legacy env-var API key (backward compat)
      if (token === API_KEY) {
        return {
          id: 'legacy-admin',
          username: 'admin',
          displayName: 'Legacy Admin',
          role: 'admin'
        }
      }
    }
  }

  return null
}

// Auth middleware — attaches user to request for write operations
export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  // GET requests are always public
  if (req.method === 'GET') {
    // Still extract user if available (for ?all=true admin queries)
    req.user = extractUser(req) || undefined
    next()
    return
  }

  const user = extractUser(req)
  if (!user) {
    res.status(401).json({ error: { message: 'Missing or invalid Authorization header', code: 'UNAUTHORIZED' } })
    return
  }

  req.user = user
  next()
}

// Role check middleware factory
export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: { message: 'Authentication required', code: 'UNAUTHORIZED' } })
      return
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: { message: `Role ${roles.join(' or ')} required`, code: 'FORBIDDEN' } })
      return
    }
    next()
  }
}
