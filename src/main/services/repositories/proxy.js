import { v4 as uuidv4 } from 'uuid'
import { BaseRepository } from './base'
export class ProxyRepository extends BaseRepository {
  constructor(db) {
    super(db)
    this.prepareStatements()
  }
  prepareStatements() {
    this.setStmt(
      'proxy.insert',
      this.db.prepare(
        'INSERT INTO proxies (id, protocol, host, port, username, password, status, labels, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      )
    )
    this.setStmt('proxy.getById', this.db.prepare('SELECT * FROM proxies WHERE id = ?'))
    this.setStmt(
      'proxy.update',
      this.db.prepare(
        'UPDATE proxies SET protocol=?, host=?, port=?, username=?, password=?, status=?, labels=? WHERE id=?'
      )
    )
    this.setStmt('proxy.delete', this.db.prepare('DELETE FROM proxies WHERE id = ?'))
    this.setStmt('proxy.count', this.db.prepare('SELECT COUNT(*) as cnt FROM proxies'))
    this.setStmt(
      'proxy.countByProtocol',
      this.db.prepare('SELECT protocol, COUNT(*) as cnt FROM proxies GROUP BY protocol')
    )
    this.setStmt(
      'proxy.countByStatus',
      this.db.prepare('SELECT status, COUNT(*) as cnt FROM proxies GROUP BY status')
    )
  }
  rowToProxy(row) {
    return {
      id: row.id,
      protocol: row.protocol,
      host: row.host,
      port: row.port,
      username: row.username,
      password: row.password,
      status: row.status,
      labels: this.fromJsonArray(row.labels),
      createdAt: row.created_at
    }
  }
  count() {
    return this.stmt('proxy.count').get().cnt
  }
  countByProtocol() {
    const rows = this.stmt('proxy.countByProtocol').all()
    const result = {}
    for (const row of rows) {
      result[row.protocol] = row.cnt
    }
    return result
  }
  countByStatus() {
    const rows = this.stmt('proxy.countByStatus').all()
    const result = {}
    for (const row of rows) {
      result[row.status] = row.cnt
    }
    return result
  }
  createProxy(data) {
    const id = uuidv4()
    const createdAt = this.nowISO()
    this.stmt('proxy.insert').run(
      id,
      data.protocol,
      data.host,
      data.port,
      data.username ?? null,
      data.password ?? null,
      data.status,
      this.toJson(data.labels),
      createdAt
    )
    return this.getProxy(id)
  }
  getProxy(id) {
    const row = this.stmt('proxy.getById').get(id)
    return row ? this.rowToProxy(row) : null
  }
  listProxies(page = 1, pageSize = 20, search) {
    if (search) {
      const countStmt = this.db.prepare(
        'SELECT COUNT(*) as cnt FROM proxies WHERE host LIKE ? OR protocol LIKE ?'
      )
      const listStmt = this.db.prepare(
        'SELECT * FROM proxies WHERE host LIKE ? OR protocol LIKE ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
      )
      return this.paginate(countStmt, listStmt, page, pageSize, (r) => this.rowToProxy(r), [
        `%${search}%`,
        `%${search}%`
      ])
    }
    const countStmt = this.stmt('proxy.count')
    const listStmt = this.db.prepare(
      'SELECT * FROM proxies ORDER BY created_at DESC LIMIT ? OFFSET ?'
    )
    return this.paginate(countStmt, listStmt, page, pageSize, (r) => this.rowToProxy(r))
  }
  updateProxy(id, data) {
    const existing = this.getProxy(id)
    if (!existing) return null
    const updated = { ...existing, ...data }
    this.stmt('proxy.update').run(
      updated.protocol,
      updated.host,
      updated.port,
      updated.username ?? null,
      updated.password ?? null,
      updated.status,
      this.toJson(updated.labels),
      id
    )
    return this.getProxy(id)
  }
  deleteProxy(id) {
    const result = this.stmt('proxy.delete').run(id)
    return result.changes > 0
  }
  batchCreateProxies(items) {
    const insert = this.stmt('proxy.insert')
    const transaction = this.db.transaction((data) => {
      let count = 0
      for (const item of data) {
        const id = uuidv4()
        const createdAt = this.nowISO()
        insert.run(
          id,
          item.protocol,
          item.host,
          item.port,
          item.username ?? null,
          item.password ?? null,
          item.status,
          this.toJson(item.labels),
          createdAt
        )
        count++
      }
      return count
    })
    return transaction(items)
  }
}
