import { Router, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { db, stmts } from '../db'

const router = Router()

function rowToTemplate(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    name: row.name as string,
    type: row.type as string,
    version: row.version as string,
    description: row.description as string,
    schema: JSON.parse((row.schema as string) || '{}'),
    checksum: row.checksum as string,
    downloads: row.downloads as number,
    updatedAt: row.updated_at as string,
  }
}

router.get('/', (_req: Request, res: Response) => {
  const rows = stmts.templateGetAll.all() as Record<string, unknown>[]
  const items = rows.map(rowToTemplate)
  res.json({ data: { items, total: items.length } })
})

router.get('/:id', (req: Request, res: Response) => {
  const row = stmts.templateGetById.get(req.params.id) as Record<string, unknown> | undefined
  if (!row) {
    res.status(404).json({ error: { message: 'Template not found', code: 'NOT_FOUND' } })
    return
  }
  res.json({ data: rowToTemplate(row) })
})

router.post('/', (req: Request, res: Response) => {
  const { name, type, version, description, schema } = req.body
  if (!name || !type) {
    res.status(400).json({ error: { message: 'name and type are required', code: 'VALIDATION_ERROR' } })
    return
  }

  const id = uuidv4()
  const now = new Date().toISOString()
  const schemaJson = typeof schema === 'string' ? schema : JSON.stringify(schema || {})

  stmts.templateInsert.run(
    id, name, type, version || '1.0.0', description || '', schemaJson, '', 0, now, now
  )

  const row = stmts.templateGetById.get(id) as Record<string, unknown>
  res.status(201).json({ data: rowToTemplate(row) })
})

router.put('/:id', (req: Request, res: Response) => {
  const existing = stmts.templateGetById.get(req.params.id) as Record<string, unknown> | undefined
  if (!existing) {
    res.status(404).json({ error: { message: 'Template not found', code: 'NOT_FOUND' } })
    return
  }

  const { name, type, version, description, schema } = req.body
  const now = new Date().toISOString()
  const schemaJson = typeof schema === 'string' ? schema : JSON.stringify(schema || existing.schema)

  stmts.templateUpdate.run(
    name || existing.name,
    type || existing.type,
    version || existing.version,
    description !== undefined ? description : existing.description,
    schemaJson,
    existing.checksum,
    now,
    req.params.id
  )

  const row = stmts.templateGetById.get(req.params.id) as Record<string, unknown>
  res.json({ data: rowToTemplate(row) })
})

router.delete('/:id', (req: Request, res: Response) => {
  const existing = stmts.templateGetById.get(req.params.id) as Record<string, unknown> | undefined
  if (!existing) {
    res.status(404).json({ error: { message: 'Template not found', code: 'NOT_FOUND' } })
    return
  }

  stmts.templateDelete.run(req.params.id)
  res.json({ data: { deleted: true } })
})

export default router
