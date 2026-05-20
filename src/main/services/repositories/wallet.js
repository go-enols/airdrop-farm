import { v4 as uuidv4 } from 'uuid'
import { BaseRepository } from './base'
export class WalletRepository extends BaseRepository {
  constructor(db) {
    super(db)
    this.prepareStatements()
  }
  prepareStatements() {
    this.setStmt(
      'wallet.insert',
      this.db.prepare(
        'INSERT INTO wallets (id, address, private_key, mnemonic, wallet_type, labels, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
    )
    this.setStmt('wallet.getById', this.db.prepare('SELECT * FROM wallets WHERE id = ?'))
    this.setStmt('wallet.delete', this.db.prepare('DELETE FROM wallets WHERE id = ?'))
    this.setStmt('wallet.count', this.db.prepare('SELECT COUNT(*) as cnt FROM wallets'))
    this.setStmt(
      'wallet.countByType',
      this.db.prepare('SELECT wallet_type, COUNT(*) as cnt FROM wallets GROUP BY wallet_type')
    )
  }
  rowToWallet(row) {
    return {
      id: row.id,
      address: row.address,
      privateKey: row.private_key,
      mnemonic: row.mnemonic,
      walletType: row.wallet_type,
      labels: this.fromJsonArray(row.labels),
      createdAt: row.created_at
    }
  }
  count() {
    return this.stmt('wallet.count').get().cnt
  }
  countByType() {
    const rows = this.stmt('wallet.countByType').all()
    const result = {}
    for (const row of rows) {
      result[row.wallet_type] = row.cnt
    }
    return result
  }
  createWallet(data) {
    const id = uuidv4()
    const createdAt = this.nowISO()
    this.stmt('wallet.insert').run(
      id,
      data.address,
      data.privateKey ?? null,
      data.mnemonic ?? null,
      data.walletType,
      this.toJson(data.labels),
      createdAt
    )
    return this.getWallet(id)
  }
  getWallet(id) {
    const row = this.stmt('wallet.getById').get(id)
    return row ? this.rowToWallet(row) : null
  }
  listWallets(page = 1, pageSize = 20, search) {
    if (search) {
      const countStmt = this.db.prepare(
        'SELECT COUNT(*) as cnt FROM wallets WHERE address LIKE ? OR wallet_type LIKE ?'
      )
      const listStmt = this.db.prepare(
        'SELECT * FROM wallets WHERE address LIKE ? OR wallet_type LIKE ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
      )
      return this.paginate(countStmt, listStmt, page, pageSize, (r) => this.rowToWallet(r), [
        `%${search}%`,
        `%${search}%`
      ])
    }
    const countStmt = this.stmt('wallet.count')
    const listStmt = this.db.prepare(
      'SELECT * FROM wallets ORDER BY created_at DESC LIMIT ? OFFSET ?'
    )
    return this.paginate(countStmt, listStmt, page, pageSize, (r) => this.rowToWallet(r))
  }
  updateWallet(id, data) {
    const existing = this.getWallet(id)
    if (!existing) return null
    const updated = { ...existing, ...data }
    this.db
      .prepare(
        'UPDATE wallets SET address=?, private_key=?, mnemonic=?, wallet_type=?, labels=? WHERE id=?'
      )
      .run(
        updated.address,
        updated.privateKey ?? null,
        updated.mnemonic ?? null,
        updated.walletType,
        this.toJson(updated.labels),
        id
      )
    return this.getWallet(id)
  }
  deleteWallet(id) {
    const result = this.stmt('wallet.delete').run(id)
    return result.changes > 0
  }
  batchCreateWallets(items) {
    const insert = this.stmt('wallet.insert')
    const transaction = this.db.transaction((data) => {
      let count = 0
      for (const item of data) {
        const id = uuidv4()
        const createdAt = this.nowISO()
        insert.run(
          id,
          item.address,
          item.privateKey ?? null,
          item.mnemonic ?? null,
          item.walletType,
          this.toJson(item.labels),
          createdAt
        )
        count++
      }
      return count
    })
    return transaction(items)
  }
  batchDeleteWallets(ids) {
    const del = this.stmt('wallet.delete')
    const transaction = this.db.transaction((idList) => {
      let count = 0
      for (const id of idList) {
        const result = del.run(id)
        count += result.changes
      }
      return count
    })
    return transaction(ids)
  }
}
