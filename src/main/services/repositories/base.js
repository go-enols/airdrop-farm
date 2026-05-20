export class BaseRepository {
  db
  _stmts
  constructor(db) {
    this.db = db
    this._stmts = new Map()
  }
  stmt(name) {
    const s = this._stmts.get(name)
    if (!s) throw new Error(`Prepared statement not found: ${name}`)
    return s
  }
  setStmt(name, stmt) {
    this._stmts.set(name, stmt)
  }
  toJson(val) {
    if (val === undefined || val === null) return null
    return JSON.stringify(val)
  }
  fromJson(val) {
    if (val === null) return null
    try {
      return JSON.parse(val)
    } catch {
      return null
    }
  }
  fromJsonArray(val) {
    if (val === null) return []
    try {
      return JSON.parse(val)
    } catch {
      return []
    }
  }
  nowISO() {
    return new Date().toISOString()
  }
  paginate(countStmt, listStmt, page, pageSize, mapper, searchParams) {
    const total = (searchParams ? countStmt.get(...searchParams) : countStmt.get()).cnt
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const offset = (page - 1) * pageSize
    const rows = searchParams
      ? listStmt.all(...searchParams, pageSize, offset)
      : listStmt.all(pageSize, offset)
    return { items: rows.map(mapper), total, page, pageSize, totalPages }
  }
}
